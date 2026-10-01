pipeline {
    agent any

    environment {
        IMAGE_NAME = "nivicap-prod-ui"
        IMAGE_TAG = "latest"

        REMOTE_HOST = "172.0.1.130"
        REMOTE_USER = "opc"

        NETWORK_NAME = "nivi-prod-app-network"

        CONTAINER_NAME = "nivi-prod-ui"
        HOST_PORT = "8081"
        CONTAINER_PORT = "80"

        SSH_CREDENTIAL = "Prod-deployment"
    }

    stages {

        stage('Workspace Validation') {
            steps {
                sh '''
                    echo "===== Workspace ====="
                    pwd
                    ls -ltr
                '''
            }
        }

        stage('Verify Remote Connectivity') {
            steps {
                sshagent(credentials: ["${SSH_CREDENTIAL}"]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "
                            hostname
                            whoami
                        "
                    '''
                }
            }
        }

        stage('Verify Docker Network') {
            steps {
                sshagent(credentials: ["${SSH_CREDENTIAL}"]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "
                            docker network inspect ${NETWORK_NAME} >/dev/null 2>&1 || \
                            docker network create ${NETWORK_NAME}
                        "
                    '''
                }
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
                    npm run build
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build \
                        -t ${IMAGE_NAME}:${IMAGE_TAG} .
                '''
            }
        }

        stage('Export Docker Image') {
            steps {
                sh '''
                    docker save \
                    -o ${IMAGE_NAME}.tar \
                    ${IMAGE_NAME}:${IMAGE_TAG}

                    ls -lh ${IMAGE_NAME}.tar
                '''
            }
        }

        stage('Transfer Image') {
            steps {
                sshagent(credentials: ["${SSH_CREDENTIAL}"]) {
                    sh '''
                        scp -o StrictHostKeyChecking=no \
                        ${IMAGE_NAME}.tar \
                        ${REMOTE_USER}@${REMOTE_HOST}:/tmp/
                    '''
                }
            }
        }

        stage('Deploy Container') {
            steps {
                sshagent(credentials: ["${SSH_CREDENTIAL}"]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "
                            
                            docker load -i /tmp/${IMAGE_NAME}.tar

                            docker rm -f ${CONTAINER_NAME} || true

                            docker run -d \
                                --name ${CONTAINER_NAME} \
                                --restart unless-stopped \
                                --network ${NETWORK_NAME} \
                                -p ${HOST_PORT}:${CONTAINER_PORT} \
                                ${IMAGE_NAME}:${IMAGE_TAG}

                            sleep 10

                            docker ps | grep ${CONTAINER_NAME}
                        "
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                sshagent(credentials: ["${SSH_CREDENTIAL}"]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "
                            docker ps | grep ${CONTAINER_NAME}
                        "
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'UI deployment completed successfully.'
        }

        failure {
            echo 'UI deployment failed.'
        }

        always {
            cleanWs()
        }
    }
}
