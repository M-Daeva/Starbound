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


print "Restarting container..."
docker restart $CONTAINER_NAME
