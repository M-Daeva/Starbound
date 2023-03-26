APP_NAME="starbound-client-testnet"
VERSION="1.0.48"
ACCOUNT_NAME="mdaeva"

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

print "Removing images..."
docker rmi "$IMAGE_NAME:$VERSION"
docker rmi "$ACCOUNT_NAME/$IMAGE_NAME:$VERSION"

print "Removing all images and containers..."
docker system prune -f
