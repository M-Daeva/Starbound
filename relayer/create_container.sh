APP_NAME="starbound-relayer"
ENV_FILE="config.env"
INTERNAL_PORT=3000
EXTERNAL_PORT=3000

APP_LABEL="$APP_NAME-app"
IMAGE_NAME="$APP_NAME-image"
CONTAINER_NAME="$APP_NAME-container"
APP_COMMAND="npm run start"
EXECUTE="docker exec $CONTAINER_NAME"

print() {
    echo "------------------------------------------------------------------------------------"
    echo "$1"
    echo
}


print "Creating image from file..."
docker build -t $IMAGE_NAME . --label=$APP_LABEL

print "Creating container from image..."
docker run -it --name $CONTAINER_NAME -p $EXTERNAL_PORT:$INTERNAL_PORT \
  --label=$APP_LABEL $IMAGE_NAME sh -c "./clear_packets.sh"
