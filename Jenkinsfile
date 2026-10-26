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
        APP_SERVER     = 'opc@172.0.1.130'
        IMAGE_NAME     = 'nivicap-ui'
        CONTAINER_NAME = 'nivicap-ui'
        APP_PORT       = '8081'
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

                            echo "===== Build Output ====="
                            ls -lrt dist/Nivicapital/browser
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
                            docker build -t nivicap-ui:latest .
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
                                    docker --version
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
                                ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                                    set -e

                                    docker load -i /tmp/nivicap-ui.tar

                                    TS=\\$(date +%Y%m%d%H%M%S)

                                    if docker ps -a --format "{{.Names}}" | grep -q "^nivicap-ui\\$"; then
                                        docker stop nivicap-ui || true
                                        docker rename nivicap-ui nivicap-ui-\\$TS
                                    fi

                                    docker run -d \
                                      --name nivicap-ui \
                                      --restart unless-stopped \
                                      -p 8081:80 \
                                      nivicap-ui:latest
                                '
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

                                    echo "===== Rollback Containers ====="
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
                                ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                                    SUCCESS=0

                                    for i in 1 2 3 4 5 6 7 8 9 10
                                    do
                                        if curl -s -I http://127.0.0.1:8081 >/dev/null
                                        then
                                            SUCCESS=1
                                            break
                                        fi

                                        sleep 5
                                    done

                                    docker logs --tail 50 nivicap-ui

                                    if [ "\\$SUCCESS" -ne 1 ]
                                    then
                                        exit 1
                                    fi
                                '
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
                                ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                                    rm -f /tmp/nivicap-ui.tar

                                    COUNT=0

                                    for C in \$(docker ps -a --filter "name=nivicap-ui" --format "{{.ID}}" | tail -r)
                                    do
                                        COUNT=\$((COUNT+1))

                                        if [ \$COUNT -gt 5 ]
                                        then
                                            docker rm -f \$C || true
                                        fi
                                    done

                                    docker image prune -f
                                    docker network prune -f

                                    echo "===== Remaining Containers ====="

                                    docker ps -a | grep nivicap-ui || true
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
            echo '✅ UI Deployment completed successfully'
        }

        failure {

            echo '❌ UI Deployment failed'

            sshagent(['Prod-deployment']) {
                sh """
                    ssh -o StrictHostKeyChecking=no ${APP_SERVER} '
                        docker ps -a | grep nivicap-ui || true

                        echo "===== Logs ====="

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

            echo 'Pipeline Finished'
        }
    }
}
