pipeline {
    agent any

    environment {

        APP_SERVER = 'opc@172.0.1.130'

        IMAGE_NAME = 'nivicap-prod-ui'
        CONTAINER_NAME = 'ui-prod-app'

        UI_PORT = '8081'
        HEALTH_URL = 'https://localhost'

    }

    stages {

        stage('Workspace Validation') {
            steps {
                sh '''
                    echo "===== Workspace Validation ====="
                    pwd
                    ls -la
                '''
            }
        }

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Node Validation') {
            steps {
                sh '''
                    echo "===== Node Version ====="
                    node -v

                    echo "===== NPM Version ====="
                    npm -v

                    echo "===== Docker Version ====="
                    docker --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    npm install
                '''
            }
        }

        stage('Angular Production Build') {
            steps {
                sh '''
                    npm run build -- --configuration production
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build \
                    -t ${IMAGE_NAME}:latest .
                '''
            }
        }

        stage('Export Docker Image') {
            steps {
                sh '''
                    rm -f ${IMAGE_NAME}.tar

                    docker save \
                    ${IMAGE_NAME}:latest \
                    -o ${IMAGE_NAME}.tar

                    ls -lh ${IMAGE_NAME}.tar
                '''
            }
        }

        stage('Verify Remote Connectivity') {
            steps {
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

        stage('Verify Docker Network') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                            docker network ls
                            docker network inspect bridge >/dev/null
                            echo Docker network validated
                        '
                    """
                }
            }
        }

        stage('Transfer Image') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh '''
                        scp -o StrictHostKeyChecking=no \
                        ${IMAGE_NAME}.tar \
                        opc@172.0.1.130:/tmp/
                    '''
                }
            }
        }

        stage('Deploy Container') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
ssh -o StrictHostKeyChecking=no ${APP_SERVER} <<'EOF'

set -e

echo "===== Loading Docker Image ====="

docker load -i /tmp/${IMAGE_NAME}.tar

echo "===== Creating Rollback Backup ====="

BACKUP_CONTAINER="${CONTAINER_NAME}-\$(date +%Y%m%d%H%M%S)"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}\$"
then
    docker rename ${CONTAINER_NAME} \$BACKUP_CONTAINER

    docker stop \$BACKUP_CONTAINER || true

    echo "Backup Created: \$BACKUP_CONTAINER"
fi

echo "===== Starting UI Container ====="

docker run -d \
  --name ${CONTAINER_NAME} \
  --restart unless-stopped \
  -p ${UI_PORT}:80 \
  ${IMAGE_NAME}:latest

SUCCESS=0

echo "===== Waiting For UI ====="

for i in \$(seq 1 30)
do
    echo "Health check attempt \$i"

    if curl -sk ${HEALTH_URL} >/dev/null
    then
        SUCCESS=1
        echo "UI Health Check Passed"
        break
    fi

    sleep 10
done

if [ "\$SUCCESS" -ne 1 ]
then

    echo "===== HEALTH CHECK FAILED ====="

    docker logs --tail 200 ${CONTAINER_NAME} || true

    docker stop ${CONTAINER_NAME} || true
    docker rm ${CONTAINER_NAME} || true

    PREVIOUS_BACKUP=\$(docker ps -a \
      --format "{{.Names}}" | \
      grep "^${CONTAINER_NAME}-" | \
      sort -r | \
      head -1)

    if [ -n "\$PREVIOUS_BACKUP" ]
    then
        echo "===== STARTING ROLLBACK ====="

        docker start "\$PREVIOUS_BACKUP"

        docker rename "\$PREVIOUS_BACKUP" "${CONTAINER_NAME}"

        echo "Rollback completed successfully"
    fi

    exit 1
fi

echo "===== Cleanup Old Backup Containers ====="

docker ps -a \
--format "{{.Names}}" | \
grep "^${CONTAINER_NAME}-" | \
sort -r | \
tail -n +5 | \
xargs -r docker rm -f

echo "===== Deployment Successful ====="

docker ps -a | grep ${CONTAINER_NAME}

EOF
"""
                }
            }
        }

        stage('Container Validation') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} '

                        echo "===== Container Status ====="
                        docker ps -a | grep ${CONTAINER_NAME}

                        echo "===== Port Validation ====="
                        docker ps | grep ${UI_PORT}

                        '
                    """
                }
            }
        }

        stage('Application Health Check') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} '

                        echo "===== Health Check ====="
                        curl -sk ${HEALTH_URL}

                        '
                    """
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

            sshagent(['Prod-deployment']) {
                sh """
                    ssh -o StrictHostKeyChecking=no ${APP_SERVER} '

                    echo "===== Container Status ====="
                    docker ps -a | grep ${CONTAINER_NAME} || true

                    echo "===== Last 200 Log Lines ====="
                    docker logs ${CONTAINER_NAME} --tail 200 || true

                    '
                """
            }
        }

        always {
            echo 'Pipeline finished'
        }
    }
}
