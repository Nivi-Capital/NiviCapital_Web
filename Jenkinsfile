pipeline {
    agent any

    environment {
        APP_SERVER     = "opc@172.0.1.130"
        IMAGE_NAME     = "nivicap-ui"
        CONTAINER_NAME = "nivicap-ui"
        APP_PORT       = "8081"
    }

    stages {

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Node Validation') {
            steps {
                sh '''
                    node --version
                    npm --version
                    docker --version
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
                    ls -ltr dist/Nivicapital/browser
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build -t nivicap-ui:latest .
                '''
            }
        }

        stage('Export Docker Image') {
            steps {
                sh '''
                    rm -f nivicap-ui.tar

                    docker save nivicap-ui:latest \
                    -o nivicap-ui.tar

                    ls -lh nivicap-ui.tar
                '''
            }
        }

        stage('Verify Remote Connectivity') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} "
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
                    sh '''
                        scp -o StrictHostKeyChecking=no \
                        nivicap-ui.tar \
                        opc@172.0.1.130:/tmp/
                    '''
                }
            }
        }

        stage('Deploy Container') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} "

                            docker load -i /tmp/nivicap-ui.tar

                            docker stop ${CONTAINER_NAME} || true
                            docker rm ${CONTAINER_NAME} || true

                            docker run -d \
                                --name ${CONTAINER_NAME} \
                                --restart unless-stopped \
                                -p ${APP_PORT}:80 \
                                ${IMAGE_NAME}:latest

                        "
                    """
                }
            }
        }

        stage('Container Validation') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} "

                            docker ps | grep ${CONTAINER_NAME}

                        "
                    """
                }
            }
        }

        stage('Application Health Check') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} "

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
                        ssh -o StrictHostKeyChecking=no ${APP_SERVER} "

                            rm -f /tmp/nivicap-ui.tar

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

        success {
            echo 'UI Deployment Successful'
        }

        failure {
            echo 'UI Deployment Failed'
        }

        always {
            echo 'Pipeline Finished'
        }
    }
}
