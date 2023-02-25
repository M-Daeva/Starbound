APP_NAME="starbound-client-mainnet"
VERSION="1.0.0"

IMAGE_NAME=$APP_NAME
CONTAINER_NAME=$APP_NAME

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
docker rmi "$IMAGE_NAME:$VERSION"

print "Removing all images and containers..."
docker system prune -f
