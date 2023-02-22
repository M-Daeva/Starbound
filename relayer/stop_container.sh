APP_NAME="starbound-relayer"

APP_LABEL="$APP_NAME-app"
IMAGE_NAME="$APP_NAME-image"
CONTAINER_NAME="$APP_NAME-container"

print() {
    echo "------------------------------------------------------------------------------------"
    echo "$1"
    echo
}


print "Stopping container..."
docker stop $CONTAINER_NAME
