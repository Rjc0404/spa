pipeline {
    agent any

    environment {
        IMAGE_NAME = "spa"
        CONTAINER_NAME = "spa"
        HOST_PORT = "3002"
    }

    stages {
        stage('拉取代码') {
            steps {
                checkout scm
            }
        }
        stage('构建 Docker 镜像') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} ."
            }
        }
        stage('部署新容器') {
            steps {
                sh """
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true
                    docker run -d --name ${CONTAINER_NAME} --restart=always -p 127.0.0.1:${HOST_PORT}:80 ${IMAGE_NAME}:${BUILD_NUMBER}
                """
            }
        }
        stage('清理旧镜像') {
            steps {
                sh "docker image prune -f"
            }
        }
    }
}