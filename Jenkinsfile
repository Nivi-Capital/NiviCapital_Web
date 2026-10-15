pipeline {
    agent any

    environment {
        IMAGE_NAME = "nivicap-ui"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Angular') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Verify Build') {
            steps {
                sh 'ls -lh dist/nivicapital/browser'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                docker build -t ${IMAGE_NAME}:latest .
                '''
            }
        }

        stage('Stop Old Container') {
            steps {
                sh '''
                docker stop ${IMAGE_NAME} || true
                docker rm ${IMAGE_NAME} || true
                '''
            }
        }

        stage('Run New Container') {
            steps {
                sh '''
                docker run -d \
                    --name ${IMAGE_NAME} \
                    --restart unless-stopped \
                    -p 8081:80 \
                    ${IMAGE_NAME}:latest
                '''
            }
        }
    }

    post {
        always {
            sh 'docker ps -a'
        }
    }
}
