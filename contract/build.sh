# script for building contract

OPTIMIZER_IMAGE_NAME="cosmwasm/rust-optimizer"
OPTIMIZER_VERSION="0.12.13"

DIR=$(pwd)
DIR_NAME=$(basename `dirname $PWD`)
DIR_NAME_SNAKE=$(echo $DIR_NAME | tr '-' '_')
WASM="artifacts/$DIR_NAME_SNAKE.wasm"

# check if contract is ready to be uploaded to the blockchain
cosmwasm-check --available-capabilities iterator,stargate,osmosis $WASM

# generate schemas
cargo schema

# fix for ts-codegen MissingPointerError
# https://github.com/CosmWasm/ts-codegen/issues/90
rm -rf ./schema/raw

# generate contract-to-client interface
cosmwasm-ts-codegen generate \
  --plugin client \
	--plugin message-composer \
  --schema ./schema \
  --out ../client/src/common/codegen \
  --name $DIR_NAME \
  --no-bundle


# remove other contracts volume cache to prevent unnecessary building
# echo "Removing $OPTIMIZER_IMAGE_NAME:$OPTIMIZER_VERSION..."
# docker rmi "$OPTIMIZER_IMAGE_NAME:$OPTIMIZER_VERSION"

# echo "Removing cache..."
# docker system prune --volumes -f


# build optimized binary
echo "building optimized binary..."
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  "$OPTIMIZER_IMAGE_NAME:$OPTIMIZER_VERSION"

# remove unnecessary wasm files
if [ -d "./artifacts" ]; then
  cd ./artifacts
  rm -rf $(ls -I "$DIR_NAME_SNAKE.wasm")
else
  echo "artifacts folder does not exist"
  exit 1
fi
