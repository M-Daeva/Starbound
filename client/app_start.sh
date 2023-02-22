APP_NAME="starbound-client"
ENV_FILE="config.env"
INTERNAL_PORT=4000
EXTERNAL_PORT=4000

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


clear

print "Creating image from file..."
docker build -t $IMAGE_NAME . --label=$APP_LABEL

print "Creating container from image..."
docker run -d --name $CONTAINER_NAME -p $EXTERNAL_PORT:$INTERNAL_PORT --env-file=$ENV_FILE \
  --label=$APP_LABEL $IMAGE_NAME 

print "Running app in container..."
$EXECUTE $APP_COMMAND &> /dev/null &

print "The app is running..."
