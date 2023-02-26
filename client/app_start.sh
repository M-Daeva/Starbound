APP_NAME="starbound-client-mainnet"
VERSION="1.0.0"
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


clear

print "Creating image from file..."
docker build -t "$IMAGE_NAME:$VERSION" .

docker images

docker tag $IMAGE_NAME "$ACCOUNT_NAME/$IMAGE_NAME:$VERSION"
docker push "$ACCOUNT_NAME/$IMAGE_NAME:$VERSION"

# print "Creating container from image..."
# docker run -d --name $CONTAINER_NAME -p $EXTERNAL_PORT:$INTERNAL_PORT $IMAGE_NAME 

# print "The app is running..."



