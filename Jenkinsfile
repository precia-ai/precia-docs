pipeline {
    agent any

    options {
        disableConcurrentBuilds()
    }

    triggers {
        pollSCM('H H * * *')
    }

    environment {
        IMAGE_NAME = 'harbor.precia.site/precia/precia-docs'
        HARBOR_CREDS = credentials('harbor-registry')
        DOCKER_CONFIG = "${WORKSPACE}/.docker-jenkins"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Image') {
            steps {
                script {
                    def isMain = env.GIT_BRANCH == 'origin/main'
                    def tag = isMain ? 'latest' : 'dev'
                    env.IMAGE_TAG = "${env.IMAGE_NAME}:${tag}"
                    env.IMAGE_BUILD = "${env.IMAGE_NAME}:${tag}-${env.BUILD_NUMBER}"
                }
                sh '''
                    mkdir -p "$DOCKER_CONFIG"
                    echo "$HARBOR_CREDS_PSW" | docker login harbor.precia.site -u "$HARBOR_CREDS_USR" --password-stdin
                    DOCKER_BUILDKIT=1 docker build \
                        -t "$IMAGE_TAG" -t "$IMAGE_BUILD" -f Dockerfile .
                    docker push "$IMAGE_TAG"
                    docker push "$IMAGE_BUILD"
                '''
            }
        }

        stage('Deploy to DEV') {
            when { expression { env.GIT_BRANCH == 'origin/dev' } }
            steps {
                sshPublisher(publishers: [
                    sshPublisherDesc(
                        configName: 'workstation-1',
                        transfers: [
                            sshTransfer(
                                sourceFiles: '',
                                execCommand: """
                                    set -e
                                    cd /srv/precia/apps/precia-docs
                                    sed -i "s|^\\( *image: \\).*|\\1${env.IMAGE_TAG}|" docker-compose.yml
                                    docker compose pull
                                    docker compose up -d --force-recreate
                                    docker images --format "{{.Repository}}:{{.Tag}}" | grep "^${env.IMAGE_NAME}:" | grep -vE ":(dev|latest)\$" | xargs -r docker rmi || true
                                """
                            )
                        ]
                    )
                ])
            }
        }

        stage('Deploy to PROD') {
            when { expression { env.GIT_BRANCH == 'origin/main' } }
            steps {
                sshPublisher(publishers: [
                    sshPublisherDesc(
                        configName: 'workstation-2',
                        transfers: [
                            sshTransfer(
                                sourceFiles: '',
                                execCommand: """
                                    set -e
                                    cd /srv/precia/apps/precia-prod/docs
                                    sed -i "s|^\\( *image: \\).*|\\1${env.IMAGE_TAG}|" docker-compose.yml
                                    docker compose pull
                                    docker compose up -d --force-recreate
                                    docker images --format "{{.Repository}}:{{.Tag}}" | grep "^${env.IMAGE_NAME}:" | grep -vE ":(dev|latest)\$" | xargs -r docker rmi || true
                                """
                            )
                        ]
                    )
                ])
            }
        }
    }

    post {
        always {
            sh 'docker logout harbor.precia.site || true'
            sh 'rm -rf "$DOCKER_CONFIG" || true'
        }
    }
}
