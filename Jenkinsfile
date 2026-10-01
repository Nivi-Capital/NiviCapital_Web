pipeline {

    agent any

    environment {
        IMAGE_NAME     = "nivicap-prod-ui"
        NETWORK_NAME   = "nivi-prod-app-network"
        HOST_PORT      = "8081"
        CONTAINER_PORT = "80"
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

        stage('Verify Docker Network') {
            steps {
                sh '''
                echo "===== Verify Network ====="

                docker network inspect ${NETWORK_NAME} >/dev/null 2>&1 || {
                    echo "Network ${NETWORK_NAME} not found"
                    exit 1
                }

                echo "Network ${NETWORK_NAME} exists"
                '''
            }
        }

        stage('Angular SIT Build Validation') {
            steps {
                sh '''
                echo "===== Install Dependencies ====="
                npm ci

                echo "===== Angular SIT Build ====="
                npx ng build --configuration=sit

                echo "===== Verify SIT API URL ====="
                grep -R "nivicapsit/api" dist/ || true

                echo "===== Verify PROD URL Not Present ====="
                if grep -R "prod-sp1.nivicap.com" dist/ ; then
                    echo "ERROR: Production URL found in SIT build"
                    exit 1
                fi

                echo "SIT Build Validation Successful"
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                echo "===== Building Docker Image ====="

                docker build --no-cache -t ${IMAGE_NAME}:latest .

                docker images | grep ${IMAGE_NAME}
                '''
            }
        }

        stage('Stop Existing UI Containers') {
            steps {
                sh '''
                echo "===== Stop Existing UI Containers ====="

                docker ps \
                  --filter "name=nivicap-prod-ui" \
                  -q | xargs -r docker stop

                sleep 5
                '''
            }
        }

        stage('Deploy UI Container') {
            steps {
                sh '''
                TIMESTAMP=$(date +%Y%m%d%H%M%S)

                CONTAINER_NAME="nivicap-prod-ui-${TIMESTAMP}"

                echo "Deploying: ${CONTAINER_NAME}"

                docker run -d \
                  --name "${CONTAINER_NAME}" \
                  --network "${NETWORK_NAME}" \
                  --restart unless-stopped \
                  -p ${HOST_PORT}:${CONTAINER_PORT} \
                  --label app=nivicap-prod-ui \
                  ${IMAGE_NAME}:latest

                echo "${CONTAINER_NAME}" > container_name.txt

                sleep 10

                docker ps -a | grep "${CONTAINER_NAME}"
                '''
            }
        }

        stage('Container Verification') {
            steps {
                sh '''
                CONTAINER_NAME=$(cat container_name.txt)

                echo "===== Container Status ====="

                docker ps -a | grep "${CONTAINER_NAME}"

                echo "===== Network Details ====="

                docker inspect ${CONTAINER_NAME} \
                --format '{{range $name,$net := .NetworkSettings.Networks}}{{$name}} -> {{$net.IPAddress}}{{println}}{{end}}'
                '''
            }
        }

        stage('UI Health Check') {
            steps {
                sh '''
                echo "===== UI Health Check ====="

                SUCCESS=0

                for i in $(seq 1 20)
                do
                    echo "Attempt $i/20"

                    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${HOST_PORT} || true)

                    echo "HTTP_CODE=${HTTP_CODE}"

                    if [ "${HTTP_CODE}" = "200" ]; then
                        echo "UI Application is Healthy"
                        SUCCESS=1
                        break
                    fi

                    sleep 5
                done

                if [ $SUCCESS -ne 1 ]; then

                    CONTAINER_NAME=$(cat container_name.txt)

                    echo "===== Container Logs ====="
                    docker logs ${CONTAINER_NAME}

                    exit 1
                fi
                '''
            }
        }

        stage('Verify Deployed UI Build') {
            steps {
                sh '''
                CONTAINER_NAME=$(cat container_name.txt)

                echo "===== Verify SIT UI Build ====="

                docker exec ${CONTAINER_NAME} sh -c "
                grep -R 'nivicapsit/api' /usr/share/nginx/html || true
                "

                echo "===== Verify NO Production URL ====="

                docker exec ${CONTAINER_NAME} sh -c "
                grep -R 'prod-sp1.nivicap.com' /usr/share/nginx/html && exit 1 || true
                "
                '''
            }
        }

        stage('Keep Latest 5 UI Containers') {
            steps {
                sh '''
                echo "===== Cleanup Old Containers ====="

                docker ps -a \
                  --filter "name=nivicap-prod-ui-" \
                  --format "{{.Names}}" \
                  | sort -r \
                  | tail -n +6 \
                  | xargs -r docker rm -f
                '''
            }
        }

        stage('Deployment Summary') {
            steps {
                sh '''
                echo "===== Running UI Containers ====="

                docker ps | grep nivicap-prod-ui || true

                echo "===== Docker Network ====="

                docker network inspect ${NETWORK_NAME}

                echo "===== UI Response ====="

                curl -I http://localhost:${HOST_PORT}
                '''
            }
        }
    }

    post {

        success {

            sh '''
            echo "================================"
            echo "UI Deployment Successful"
            echo "================================"

            docker ps | grep nivicap-prod-ui || true
            '''
        }

        failure {

            sh '''
            echo "================================"
            echo "UI Deployment Failed"
            echo "================================"

            if [ -f container_name.txt ]; then

                CONTAINER_NAME=$(cat container_name.txt)

                echo "===== Container Status ====="
                docker ps -a | grep "${CONTAINER_NAME}" || true

                echo "===== Container Logs ====="
                docker logs "${CONTAINER_NAME}" || true

                echo "===== Container Inspect ====="
                docker inspect "${CONTAINER_NAME}" || true
            fi

            echo "===== Port Status ====="
            ss -tulpn | grep ${HOST_PORT} || true
            '''
        }

        always {
            sh '''
            rm -f container_name.txt || true
            '''
        }
    }
}
