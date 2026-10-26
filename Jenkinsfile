def pipelineStart = System.currentTimeMillis()

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

        APP_SERVER = 'opc@172.0.1.130'

        IMAGE_NAME = 'nivicap-ui'
        CONTAINER_NAME = 'nivicap-ui'
        APP_PORT = '8081'
    }

    stages {

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

        stage('Checkout SCM') {
            steps {
                script {
                    runTimed('Checkout SCM') {
                        checkout scm
                    }
                }
            }
        }

        stage('Node Validation') {
            steps {
                script {
                    runTimed('Node Validation') {
                        sh '''
                            node --version
                            npm --version
                            docker --version
                        '''
                    }
                }
            }
        }

        stage('Build Angular Application') {
            steps {
                script {
                    runTimed('Build Angular Application') {
                        sh '''
                            npm ci

                            npm run build --configuration=production

                            echo "Generated Files"

                            ls -ltr dist/Nivicapital/browser
                        '''
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
                              -t nivicap-ui:latest .
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
                            rm -f nivicap-ui.tar

                            docker save \
                              nivicap-ui:latest \
                              -o nivicap-ui.tar

                            ls -lh nivicap-ui.tar
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

                                docker network ls

                                docker network inspect bridge >/dev/null

                                echo "Docker network validation successful"

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

                            sh '''
                                scp -o StrictHostKeyChecking=no \
                                nivicap-ui.tar \
                                opc@172.0.1.130:/tmp/
                            '''
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

echo "===== Loading Image ====="

docker load -i /tmp/nivicap-ui.tar

TIMESTAMP=\$(date +%Y%m%d%H%M%S)

if docker ps -a --format '{{.Names}}' | grep -q '^nivicap-ui$'
then
    docker stop nivicap-ui || true

    docker rename \
      nivicap-ui \
      nivicap-ui-\${TIMESTAMP}
fi

echo "===== Starting Container ====="

docker run -d \
  --name nivicap-ui \
  --restart unless-stopped \
  -p 8081:80 \
  nivicap-ui:latest

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

                                echo "===== Running Container ====="

                                docker ps | grep nivicap-ui

                                echo "===== Available Rollback Containers ====="

                                docker ps -a | grep nivicap-ui || true

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
ssh -o StrictHostKeyChecking=no ${APP_SERVER} <<'EOF'

SUCCESS=0

for i in \$(seq 1 30)
do

    echo "Health check attempt \$i"

    if curl -s -o /dev/null -I \
      http://127.0.0.1:8081
    then
        SUCCESS=1
        break
    fi

    sleep 10

done

docker logs --tail 50 nivicap-ui

if [ "\$SUCCESS" -ne 1 ]
then
    echo "Health check failed"
    exit 1
fi

EOF
"""
                        }
                    }
                }
            }
        }

        stage('Docker Cleanup') {
            steps {
                script {
                    runTimed('Docker Cleanup') {

                        sshagent(['Prod-deployment']) {

                            sh """
ssh -o StrictHostKeyChecking=no ${APP_SERVER} <<'EOF'

rm -f /tmp/nivicap-ui.tar

echo "===== Keep Latest 5 Containers ====="

docker ps -aq --filter "name=nivicap-ui" | while read id
do
   echo "\$(docker inspect -f '{{.Created}}' \$id) \$id"
done \
| sort -r \
| tail -n +6 \
| awk '{print \$2}' \
| xargs -r docker rm -f

docker image prune -f
docker network prune -f

echo "===== Remaining Containers ====="

docker ps -a | grep nivicap-ui || true

EOF
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

            sshagent(['Prod-deployment']) {

                sh """
                    ssh -o StrictHostKeyChecking=no ${APP_SERVER} '

                    docker ps -a | grep nivicap-ui || true

                    docker logs nivicap-ui --tail 200 || true

                    '
                """
            }
        }

        always {

            script {

                long totalDuration =
                    (System.currentTimeMillis() - pipelineStart) / 1000

                echo "========================================"
                echo "TOTAL PIPELINE TIME : ${totalDuration} seconds"
                echo "========================================"
            }

            echo 'Pipeline finished'
        }
    }
}
