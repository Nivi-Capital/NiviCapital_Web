pipeline {
    agent any

    options {
        timestamps()
    }

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
                sh 'npm install'
            }
        }

        stage('Angular Production Build') {
            steps {
                sh 'npm run build -- --configuration production'
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

                            echo "===== Docker Networks ====="
                            docker network ls

                            docker network inspect nivi-prod-app-network >/dev/null

                            echo "Docker network validated"

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
ssh -o StrictHostKeyChecking=no ${APP_SERVER} <<EOF

set -e

echo "===== Loading Docker Image ====="

docker load -i /tmp/${IMAGE_NAME}.tar

echo "===== Creating Rollback Backup ====="

BACKUP_CONTAINER="${CONTAINER_NAME}-\$(date +%Y%m%d%H%M%S)"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}\$"
then
    docker stop ${CONTAINER_NAME} || true
    docker rename ${CONTAINER_NAME} \$BACKUP_CONTAINER

    echo "Backup Created: \$BACKUP_CONTAINER"
fi

echo "===== Removing Failed Container ====="

docker rm -f ${CONTAINER_NAME} 2>/dev/null || true

echo "===== Freeing Port ${UI_PORT} ====="

PORT_CONTAINER=\$(docker ps \
    --filter publish=${UI_PORT} \
    --format '{{.Names}}' | head -1)

if [ -n "\$PORT_CONTAINER" ]
then
    echo "Stopping container using port ${UI_PORT}: \$PORT_CONTAINER"
    docker stop \$PORT_CONTAINER || true
fi

echo "===== Starting UI Container ====="

docker run -d \
    --name ${CONTAINER_NAME} \
    --network nivi-prod-app-network \
    --restart unless-stopped \
    -p ${UI_PORT}:80 \
    ${IMAGE_NAME}:latest

SUCCESS=0

echo "===== Waiting For UI ====="

for i in \$(seq 1 30)
do
    HTTP_STATUS=\$(curl -k -s -o /dev/null -w "%{http_code}" ${HEALTH_URL})

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

echo "===== Cleaning Old Backup Containers ====="

docker ps -a \
--format "{{.Names}}" | \
grep "^${CONTAINER_NAME}-" | \
sort -r | \
tail -n +5 | \
xargs -r docker rm -f

echo "===== Deployment Successful ====="

docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

EOF
"""
                }
            }
        }

        stage('Container Validation') {
            steps {
                sshagent(['Prod-deployment']) {
 
