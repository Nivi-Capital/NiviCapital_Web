pipeline {
    agent any

    environment {
        IMAGE_NAME = "nivicap-ui"
        REMOTE_HOST = "172.0.1.130"
        REMOTE_USER = "opc"
        CONTAINER_NAME = "nivicap-ui"
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

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build Angular Application') {
            steps {
                sh '''
                    npm run build --configuration=sit
                '''
            }
        }

        stage('Verify Build Output') {
            steps {
                sh '''
                    ls -lh dist/Nivicapital/browser
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build -t ${IMAGE_NAME}:latest .
                '''
            }
        }

        stage('Export Docker Image') {
            steps {
                sh '''
                    docker save ${IMAGE_NAME}:latest | gzip > ${IMAGE_NAME}.tar.gz
                    ls -lh ${IMAGE_NAME}.tar.gz
                '''
            }
        }

        stage('Verify Remote Connectivity') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "hostname"
                    '''
                }
            }
        }

        stage('Verify Docker Network') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "
                        docker network ls
                        "
                    '''
                }
            }
        }

        stage('Transfer Image') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh '''
                        scp -o StrictHostKeyChecking=no \
                        ${IMAGE_NAME}.tar.gz \
                        ${REMOTE_USER}@${REMOTE_HOST}:/tmp/
                    '''
                }
            }
        }

        stage('Deploy Container') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '

                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true

                    docker load < /tmp/${IMAGE_NAME}.tar.gz

                    docker run -d \
                      --name ${CONTAINER_NAME} \
                      --restart unless-stopped \
                      -p 8081:80 \
                      ${IMAGE_NAME}:latest

                    '
                    '''
                }
            }
        }

        stage('Container Validation') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '
                        docker ps | grep ${CONTAINER_NAME}
                    '
                    '''
                }
            }
        }

        stage('Application Health Check') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '

                    echo "Waiting for UI startup..."
                    sleep 10

                    curl -I http://127.0.0.1:8081

                    '
                    '''
                }
            }
        }
    }

    post {

        always {
            echo "========================================"
            echo "Pipeline Finished"
            echo "========================================"

            sh '''
                docker images | grep ${IMAGE_NAME} || true
            '''
        }

        success {
            echo "UI Deployment completed successfully"
        }

        failure {
            echo "UI Deployment failed"
        }
    }
}
