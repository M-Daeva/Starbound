# script for running osmosis localnet
# TODO: update paths

CHAIN_ID="localosmosis"
RPC="http://localhost:26657/"
TXFLAG="--gas-prices 0.1uosmo --gas auto --gas-adjustment 1.3 -y -b block --node $RPC --chain-id $CHAIN_ID"
BINARY="docker exec -i localosmosis-osmosisd-1 osmosisd"
DIR=$(pwd)
OSMO_DIR="$DIR/../LocalOsmosis"
DIR_NAME=$(basename "$PWD")
IMAGE_NAME="localosmosis-osmosisd-1" # osmosisd-1
DIR_NAME_SNAKE=$(echo $DIR_NAME | tr '-' '_')
WASM="artifacts/$DIR_NAME_SNAKE.wasm"
CONTRACT=starbound-dev
PROPOSAL=1
VALIDATOR_ADDR="osmo1phaxpevm5wecex2jyaqty2a4v02qj7qmlmzk5a"
TEST="--keyring-backend test"

waitForChainServe() {
  ADDR=$VALIDATOR_ADDR  # validator addr
  TRIES=0
  echo Waiting for chain serve
  $BINARY query account $ADDR 2> /dev/null
  RESULT=$(echo $?)
  while [ $RESULT = 1 ]
  do
    ((TRIES=$TRIES+1))
    echo -ne "not ready, waiting 1 sec x$TRIES\r"
    sleep 1
    $BINARY query account $ADDR 2> /dev/null
    RESULT=$(echo $?)
  done
  echo
  echo Ready!
}

# build optimized binary if it doesn't exist
if [ ! -f "$WASM" ]; then
  echo "building optimized binary..."
  docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.12.6
fi

# reset LocalOsmosis
echo "reset chain"
sudo rm -rf $OSMO_DIR
cd ..
git clone https://github.com/osmosis-labs/LocalOsmosis.git
cd $DIR

# stop docker container
cd $OSMO_DIR
echo "stopping container..."
docker compose down
# delete docker container
echo "deleting container"
docker rm -f $IMAGE_NAME 
# delete image
echo "deleting image"
docker image rm -f osmolabs/osmosis
docker image rm -f osmolabs/osmosis:10.0.1

# build new docker container
echo "starting local network"
docker compose up -d
# move binary to docker container
cd $DIR
docker cp "artifacts/$DIR_NAME_SNAKE.wasm" "$IMAGE_NAME:/$DIR_NAME_SNAKE.wasm"
cd $OSMO_DIR

# wait for chain starting before contract storing
waitForChainServe

# add new users
echo "------------------------------------------------------------------------------------"
echo add validator
VAL_SEED="satisfy adjust timber high purchase tuition stool faith fine install that you unaware feed domain license impose boss human eager hat rent enjoy dawn"
echo $VAL_SEED | $BINARY keys add validator --recover $TEST

echo "------------------------------------------------------------------------------------"
echo submit proposal
$BINARY tx gov submit-proposal wasm-store "/$DIR_NAME_SNAKE.wasm" --title "Add $CONTRACT" \
  --description "Let's upload $CONTRACT contract" --run-as $VALIDATOR_ADDR \
  --from validator --chain-id $CHAIN_ID -y -b block \
  --gas 9000000 --gas-prices 0.025uosmo $TEST
  
echo "------------------------------------------------------------------------------------"
echo deposit on proposal
$BINARY tx gov deposit $PROPOSAL 10000000uosmo --from validator \
  --chain-id $CHAIN_ID -y -b block --gas 6000000 --gas-prices 0.025uosmo $TEST

echo "------------------------------------------------------------------------------------"
echo vote on proposal
$BINARY tx gov vote $PROPOSAL yes --from validator \
  --chain-id $CHAIN_ID -y -b block --gas 600000 --gas-prices 0.025uosmo $TEST

echo "------------------------------------------------------------------------------------"
echo waiting for storing the code
sleep 60

echo "------------------------------------------------------------------------------------"
echo query proposal
$BINARY query gov proposal $PROPOSAL

echo "------------------------------------------------------------------------------------"
echo check results
$BINARY query wasm list-code
CONTRACT_CODE=1
echo contract code is $CONTRACT_CODE

#---------- SMART CONTRACT INTERACTION ------------------------

# instantiate smart contract
echo "------------------------------------------------------------------------------------"
echo init contract
INIT='{}'
$BINARY tx wasm instantiate $CONTRACT_CODE $INIT --from validator --label "starbound-dev" $TXFLAG --admin $VALIDATOR_ADDR  $TEST

# get smart contract address
echo "------------------------------------------------------------------------------------"
echo get contract address
CONTRACT_ADDRESS=$($BINARY query wasm list-contract-by-code $CONTRACT_CODE --node $RPC --chain-id $CHAIN_ID --output json | jq -r '.contracts[-1]')
echo contract address is $CONTRACT_ADDRESS

# write data to file
cd $DIR/scripts
ALICE_ADDR="osmo1cyyzpxplxdzkeea7kwsydadg87357qnahakaks"
ALICE_SEED="notice oak worry limit wrap speak medal online prefer cluster roof addict wrist behave treat actual wasp year salad speed social layer crew genius"
R="{\"ALICE_SEED\":\"$ALICE_SEED\",\"ALICE_ADDR\":\"$ALICE_ADDR\",\"CONTRACT_ADDRESS\":\"$CONTRACT_ADDRESS\",\"CONTRACT_CODE\":\"$CONTRACT_CODE\"}"
echo $R > chain_data.json
cd $DIR

cd $DIR/scripts
npm run start
cd $DIR
cd $OSMO_DIR
echo "stopping container..."
docker compose down