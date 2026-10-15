pipeline {
    agent any

    environment {
        IMAGE_NAME = "nivicap-ui"
    }

    stages {

        stage('Install') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Angular') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:latest .'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                docker stop ${IMAGE_NAME} || true
                docker rm ${IMAGE_NAME} || true

                docker run -d \
                  --name ${IMAGE_NAME} \
                  --restart unless-stopped \
                  -p 8081:80 \
                  ${IMAGE_NAME}:latest
                '''
            }
        }
    }
}
