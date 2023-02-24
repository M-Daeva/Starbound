APP_NAME="starbound-client"
INTERNAL_PORT=4000
EXTERNAL_PORT=4000

IMAGE_NAME="$APP_NAME-image"
CONTAINER_NAME="$APP_NAME-container"

print() {
    echo "------------------------------------------------------------------------------------"
    echo "$1"
    echo
}


clear

print "Creating image from file..."
docker build -t $IMAGE_NAME .

print "Creating container from image..."
docker run -d --name $CONTAINER_NAME -p $EXTERNAL_PORT:$INTERNAL_PORT $IMAGE_NAME 

print "The app is running..."
