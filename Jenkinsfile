def runTimed(String stageName, Closure body) {
    long start = System.currentTimeMillis()

    echo "========================================"
    echo "STARTING : ${stageName}"
    echo "TIME     : ${new Date()}"
    echo "========================================"

    body()

    long duration = (System.currentTimeMillis() - start) / 1000

    echo "========================================"
    echo "COMPLETED: ${stageName}"
    echo "DURATION : ${duration} seconds"
    echo "========================================"
}

pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        PIPELINE_START = "${System.currentTimeMillis()}"

        APP_SERVER = 'opc@172.0.1.130'

        IMAGE_NAME = 'nivicap-prod-ui'
        CONTAINER_NAME = 'ui-prod-app'

        UI_PORT = '8081'
        HEALTH_URL = 'https://localhost'
    }

    stages {

        stage('Checkout SCM') {
            steps {
                script {
                    runTimed('Checkout SCM') {
                        checkout scm
                    }
                }
            }
        }

        stage('Workspace Validation') {
            steps {
                script {
                    runTimed('Workspace Validation') {
                        sh '''
                            pwd
                            ls -la
                        '''
                    }
                }
            }
        }

        stage('Node Validation') {
            steps {
                script {
                    runTimed('Node Validation') {
                        sh '''
                            node -v
                            npm -v
                            docker --version
                        '''
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    runTimed('Install Dependencies') {
                        sh 'npm install'
                    }
                }
            }
        }

        stage('Angular Production Build') {
            steps {
                script {
                    runTimed('Angular Production Build') {
                        sh 'npm run build -- --configuration production'
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    runTimed('Build Docker Image') {
                        sh '''
                            docker build \
                              -t ${IMAGE_NAME}:latest .
                        '''
                    }
                }
            }
        }

        stage('Export Docker Image') {
            steps {
                script {
                    runTimed('Export Docker Image') {
                        sh '''
                            rm -f ${IMAGE_NAME}.tar

                            docker save \
                              ${IMAGE_NAME}:latest \
                              -o ${IMAGE_NAME}.tar

                            ls -lh ${IMAGE_NAME}.tar
                        '''
                    }
                }
            }
        }

        stage('Verify Remote Connectivity') {
            steps {
                script {
                    runTimed('Verify Remote Connectivity') {
                        sshagent(['Prod-deployment']) {
                            sh """
                                ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                                    hostname
                                    date
                                '
                            """
                        }
                    }
                }
            }
        }

        stage('Verify Docker Network') {
            steps {
                script {
                    runTimed('Verify Docker Network') {
                        sshagent(['Prod-deployment']) {
                            sh """
                                ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                                    docker network inspect nivi-prod-app-network >/dev/null
                                    echo "Docker network validated"
                                '
                            """
                        }
                    }
                }
            }
        }

        stage('Transfer Image') {
            steps {
                script {
                    runTimed('Transfer Image') {
                        sshagent(['Prod-deployment']) {
                            sh """
                                scp -o StrictHostKeyChecking=no \
                                ${IMAGE_NAME}.tar \
                                ${APP_SERVER}:/tmp/
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    runTimed('Deploy Container') {

                        sshagent(['Prod-deployment']) {

                            sh """
ssh -o StrictHostKeyChecking=no ${APP_SERVER} <<'EOF'

set -e

IMAGE_NAME="nivicap-prod-ui"
CONTAINER_NAME="ui-prod-app"
UI_PORT="8081"
HEALTH_URL="https://localhost"

echo "===== Loading Docker Image ====="

docker load -i /tmp/\${IMAGE_NAME}.tar

echo "===== Creating Rollback Backup ====="

if docker inspect \${CONTAINER_NAME} >/dev/null 2>&1
then
    BACKUP_CONTAINER="\${CONTAINER_NAME}-\$(date +%Y%m%d%H%M%S)"

    echo "Backup Container: \$BACKUP_CONTAINER"

    docker stop \${CONTAINER_NAME} || true

    docker rename \
        \${CONTAINER_NAME} \
        \$BACKUP_CONTAINER

    echo "Backup Created Successfully"
fi

docker rm -f \${CONTAINER_NAME} 2>/dev/null || true

PORT_CONTAINER=\$(docker ps \
    --filter publish=\${UI_PORT} \
    --format '{{.Names}}' | head -1)

if [ -n "\$PORT_CONTAINER" ]
then
    docker stop "\$PORT_CONTAINER" || true
fi

echo "===== Starting UI Container ====="

docker run -d \
    --name \${CONTAINER_NAME} \
    --network nivi-prod-app-network \
    --restart unless-stopped \
    -p \${UI_PORT}:80 \
    \${IMAGE_NAME}:latest

SUCCESS=0

for i in \$(seq 1 30)
do
    HTTP_STATUS=\$(curl -k -s -o /dev/null \
    -w "%{http_code}" \
    \${HEALTH_URL})

    echo "Attempt \$i - HTTP Status: \$HTTP_STATUS"

    if [ "\$HTTP_STATUS" = "200" ]
    then
        SUCCESS=1
        break
    fi

    sleep 10
done

if [ "\$SUCCESS" -ne 1 ]
then

    echo "===== HEALTH CHECK FAILED ====="

    docker logs --tail 200 \${CONTAINER_NAME} || true

    docker stop \${CONTAINER_NAME} || true
    docker rm \${CONTAINER_NAME} || true

    PREVIOUS_BACKUP=\$(docker ps -a \
        --format "{{.Names}}" | \
        grep "^ui-prod-app-" | \
        sort -r | \
        head -1)

    if [ -n "\$PREVIOUS_BACKUP" ]
    then
        docker start "\$PREVIOUS_BACKUP"

        docker rename \
            "\$PREVIOUS_BACKUP" \
            "ui-prod-app"
    fi

    exit 1
fi

echo "===== Cleaning Old Backups ====="

docker ps -a \
--format "{{.Names}}" | \
grep "^ui-prod-app-" | \
sort -r | \
tail -n +5 | \
xargs -r docker rm -f

echo "===== Deployment Successful ====="

docker ps --format "table {{.Names}}\\t{{.Image}}\\t{{.Status}}"

EOF
"""
                        }
                    }
                }
            }
        }

        stage('Container Validation') {
            steps {
                script {
                    runTimed('Container Validation') {
                        sshagent(['Prod-deployment']) {
                            sh """
                                ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                                    docker ps -a | grep ${CONTAINER_NAME}
                                '
                            """
                        }
                    }
                }
            }
        }

        stage('Application Health Check') {
            steps {
                script {
                    runTimed('Application Health Check') {

                        sshagent(['Prod-deployment']) {

                            sh """
                                ssh -o StrictHostKeyChecking=no ${APP_SERVER} '

                                HTTP_STATUS=\$(curl -k -s -o /dev/null \
                                -w "%{http_code}" \
                                ${HEALTH_URL})

                                echo "HTTP Status: \$HTTP_STATUS"

                                test "\$HTTP_STATUS" = "200"

                                '
                            """
                        }
                    }
                }
            }
        }

        stage('Deployed Applications') {
            steps {
                script {
                    runTimed('Deployed Applications') {

                        sshagent(['Prod-deployment']) {

                            sh """
                                ssh -o StrictHostKeyChecking=no ${APP_SERVER} '

                                echo "======================================"
                                echo "DEPLOYED APPLICATIONS"
                                echo "======================================"

                                docker ps --format \
                                "table {{.Names}}\t{{.Image}}\t{{.Status}}" | \
                                grep -E "nivi-prod-app|ui-prod-app|NAMES"

                                '
                            """
                        }
                    }
                }
            }
        }
    }

    post {

        success {
            echo 'UI Deployment completed successfully'
        }

        failure {
            echo 'UI Deployment failed'
        }

        always {

            script {
                long totalDuration =
                    (System.currentTimeMillis() -
                    env.PIPELINE_START.toLong()) / 1000

                echo "========================================"
                echo "TOTAL PIPELINE TIME : ${totalDuration} seconds"
                echo "========================================"
            }

            echo 'Pipeline finished'
        }
    }
}
