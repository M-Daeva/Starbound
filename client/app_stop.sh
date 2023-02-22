APP_NAME="starbound-client"

APP_LABEL="$APP_NAME-app"
IMAGE_NAME="$APP_NAME-image"
CONTAINER_NAME="$APP_NAME-container"

print() {
    echo "------------------------------------------------------------------------------------"
    echo "$1"
    echo
}


clear

print "Stopping container..."
docker stop $CONTAINER_NAME

print "Removing container..."
docker rm $CONTAINER_NAME

print "Removing image..."
docker rmi $IMAGE_NAME

print "Removing specified images and containers..."
docker system prune -f --filter "label=$APP_LABEL"
