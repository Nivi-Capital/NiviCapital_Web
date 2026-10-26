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
                    ls -lh dist/
                    ls -lh dist/Nivicapital/
                    ls -lh dist/Nivicapital/browser/
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
                    rm -f ${IMAGE_NAME}.tar.gz

                    docker save ${IMAGE_NAME}:latest | gzip > ${IMAGE_NAME}.tar.gz

                    ls -lh ${IMAGE_NAME}.tar.gz
                '''
            }
        }

        stage('Verify Remote Connectivity') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '
                            hostname
                            docker --version
                        '
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

                            TS=\\\$(date +%Y%m%d%H%M%S)

                            if docker ps -a --format '{{.Names}}' | grep -q '^${CONTAINER_NAME}\$'; then
                                docker stop ${CONTAINER_NAME} || true
                                docker rename ${CONTAINER_NAME} ${CONTAINER_NAME}-\\\$TS
                            fi

                            gunzip -c /tmp/${IMAGE_NAME}.tar.gz | docker load

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
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '

                            docker ps | grep ${CONTAINER_NAME}

                            echo ""
                            echo "Available Rollback Containers"

                            docker ps -a | grep ${CONTAINER_NAME} || true

                        '
                    """
                }
            }
        }

        stage('Application Health Check') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '

                            sleep 10

                            curl -I http://127.0.0.1:${APP_PORT}

                        '
                    """
                }
            }
        }

        stage('Docker Cleanup') {
            steps {
                sshagent(['Prod-deployment']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "

                            rm -f /tmp/${IMAGE_NAME}.tar.gz

                            echo 'Keeping latest 5 containers'

                            docker ps -aq --filter 'name=${CONTAINER_NAME}' | while read id
                            do
                                echo \\\$(docker inspect -f '{{.Created}}' \\\$id) \\\$id
                            done | sort -r | tail -n +6 | awk '{print \\\$2}' | xargs -r docker rm -f

                            docker image prune -f
                            docker container prune -f
                            docker network prune -f

                            echo 'Remaining Containers'

                            docker ps -a | grep ${CONTAINER_NAME} || true

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
        }

        success {
            echo "✅ UI Deployment Successful"
        }

        failure {
            echo "❌ UI Deployment Failed"
        }
    }
}
