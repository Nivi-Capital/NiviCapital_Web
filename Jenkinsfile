pipeline {
    agent any

    environment {
        IMAGE_NAME     = "nivicap-ui"
        CONTAINER_NAME = "nivicap-ui"

        REMOTE_HOST    = "172.0.1.130"
        REMOTE_USER    = "opc"

        APP_PORT       = "8081"
    }

    stages {

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Workspace Validation') {
            steps {
                sh '''
                    echo "Workspace:"
                    pwd
                    ls -ltr
                '''
            }
        }

        stage('Node Validation') {
            steps {
                sh '''
                    node --version
                    npm --version
                '''
            }
        }

        stage('Build Angular Application') {
            steps {
                sh '''
                    npm ci
                    npm run build --configuration=production
                '''
            }
        }

        stage('Verify Build Output') {
            steps {
                sh '''
                    echo "Angular Build Output"

                    ls -lh dist/
                    ls -lh dist/Nivicapital/
                    ls -lh dist/Nivicapital/browser/
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .
                    docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${IMAGE_NAME}:latest
                """
            }
        }

        stage('Export Docker Image') {
            steps {
                sh """
                    rm -f ${IMAGE_NAME}.tar.gz

                    docker save ${IMAGE_NAME}:${BUILD_NUMBER} | gzip > ${IMAGE_NAME}.tar.gz

                    ls -lh ${IMAGE_NAME}.tar.gz
                """
            }
        }

        stage('Verify Remote Connectivity') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "
                            hostname
                            docker --version
                        "
                    """
                }
            }
        }

        stage('Transfer Image') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        scp -o StrictHostKeyChecking=no \
                        ${IMAGE_NAME}.tar.gz \
                        ${REMOTE_USER}@${REMOTE_HOST}:/tmp/
                    """
                }
            }
        }

        stage('Deploy Container') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "

                            OLD_CONTAINER=\\\$(docker ps -q --filter publish=${APP_PORT})

                            if [ ! -z \\\$OLD_CONTAINER ]; then
                                docker stop \\\$OLD_CONTAINER || true
                                docker rm \\\$OLD_CONTAINER || true
                            fi

                            docker stop ${CONTAINER_NAME} || true
                            docker rm ${CONTAINER_NAME} || true

                            gunzip -c /tmp/${IMAGE_NAME}.tar.gz | docker load

                            docker run -d \
                                --name ${CONTAINER_NAME} \
                                --restart unless-stopped \
                                -p ${APP_PORT}:80 \
                                ${IMAGE_NAME}:${BUILD_NUMBER}

                        "
                    """
                }
            }
        }

        stage('Container Validation') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "

                            docker ps | grep ${CONTAINER_NAME}

                            echo ''
                            echo 'Container Logs'

                            docker logs --tail 50 ${CONTAINER_NAME}

                        "
                    """
                }
            }
        }

        stage('Application Health Check') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "

                            sleep 10

                            curl -I http://127.0.0.1:${APP_PORT}

                        "
                    """
                }
            }
        }

        stage('Docker Cleanup') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "

                            echo 'Removing uploaded package'
                            rm -f /tmp/${IMAGE_NAME}.tar.gz

                            echo 'Keeping latest 5 image versions'

                            docker images ${IMAGE_NAME} \
                            --format '{{.Repository}}:{{.Tag}} {{.CreatedAt}}' \
                            | grep -v latest \
                            | sort -rk2,4 \
                            | tail -n +6 \
                            | awk '{print \\\$1}' \
                            | xargs -r docker rmi

                            docker image prune -f
                            docker container prune -f
                            docker network prune -f

                        "
                    """
                }
            }
        }
    }

    post {

        always {
            echo "========================================"
            echo "UI Deployment Completed"
            echo "========================================"

            sh """
                docker images | grep ${IMAGE_NAME} || true
            """
        }

        success {
            echo '✅ UI Deployment Successful'
        }

        failure {
            echo '❌ UI Deployment Failed'
        }
    }
}
