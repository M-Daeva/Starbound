APP_NAME="starbound-client-testnet"
VERSION="1.0.48"
ACCOUNT_NAME="mdaeva"

INTERNAL_PORT=4000
EXTERNAL_PORT=4000

IMAGE_NAME=$APP_NAME
CONTAINER_NAME=$APP_NAME

DOCKER_PASSWORD=$(jq -r '.password' ../.test-wallets/docker.json)


print() {
    echo "------------------------------------------------------------------------------------"
    echo "$1"
    echo
}


clear

docker login -u $ACCOUNT_NAME -p $DOCKER_PASSWORD docker.io

print "Creating image from file..."
docker build -t "$IMAGE_NAME:$VERSION" .

docker tag "$IMAGE_NAME:$VERSION" "$ACCOUNT_NAME/$IMAGE_NAME:$VERSION"
docker push "$ACCOUNT_NAME/$IMAGE_NAME:$VERSION"

# print "Creating container from image..."
# docker run -d --name $CONTAINER_NAME -p $EXTERNAL_PORT:$INTERNAL_PORT $IMAGE_NAME 

# print "The app is running..."
