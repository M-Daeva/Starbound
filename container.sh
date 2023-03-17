APP_NAME="starbound-client-testnet"
VERSION="1.0.40"
ACCOUNT_NAME="mdaeva"

INTERNAL_PORT=4000
EXTERNAL_PORT=4000

IMAGE_NAME=$APP_NAME
CONTAINER_NAME=$APP_NAME


print() {
    echo "------------------------------------------------------------------------------------"
    echo "$1"
    echo
}

print "Removing container..."
docker rm $CONTAINER_NAME

print "Creating container from image..."
docker run -d --name $CONTAINER_NAME -p $EXTERNAL_PORT:$INTERNAL_PORT "$ACCOUNT_NAME/$IMAGE_NAME:$VERSION" $1

print "The app is running..."
docker stats $CONTAINER_NAME
