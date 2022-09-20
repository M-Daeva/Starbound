# script for lauching osmosis local network

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


waitForChainServe() {
  ADDR="osmo1phaxpevm5wecex2jyaqty2a4v02qj7qmlmzk5a"  # validator addr
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

# stop docker container
cd $OSMO_DIR
echo "stopping container..."
docker compose down
# delete docker container
echo "deleting container"
docker rm -f $IMAGE_NAME 2> /dev/null
# build new docker container
echo "starting local network"
docker compose up -d
# move binary to docker container
cd $DIR
docker cp "artifacts/$DIR_NAME_SNAKE.wasm" "$IMAGE_NAME:/$DIR_NAME_SNAKE.wasm"
cd $OSMO_DIR

# wait for chain starting before contract storing
waitForChainServe

# $BINARY query bank balances validator
# $BINARY query bank balances osmo1phaxpevm5wecex2jyaqty2a4v02qj7qmlmzk5a

# add new users
echo "------------------------------------------------------------------------------------"
echo add validator
#satisfy adjust timber high purchase tuition stool faith fine install that you unaware feed domain license impose boss human eager hat rent enjoy dawn

$BINARY keys add validator --recover
# enter seed
# enter password
# enter password again
VALIDATOR_ADDR="osmo1phaxpevm5wecex2jyaqty2a4v02qj7qmlmzk5a"


echo "------------------------------------------------------------------------------------"
echo add alice
#notice oak worry limit wrap speak medal online prefer cluster roof addict wrist behave treat actual wasp year salad speed social layer crew genius

$BINARY keys add alice --recover
# enter seed
# enter password
# enter password again
ALICE_ADDR="osmo1cyyzpxplxdzkeea7kwsydadg87357qnahakaks"

# BOB_SEED=$(osmosisd keys mnemonic)
# echo $BOB_SEED | $BINARY keys add bob --recover
# BOB_ADDR=$($BINARY keys show bob --address)

# send them some coins
echo "------------------------------------------------------------------------------------"
echo send coins from validator to alice
$BINARY tx bank send $VALIDATOR_ADDR $ALICE_ADDR "250000000uosmo" --from $VALIDATOR_ADDR --yes --broadcast-mode block --sign-mode direct --chain-id $CHAIN_ID
# enter password
#$BINARY tx bank send $VALIDATOR_ADDR $BOB_ADDR "250000000uosmo" --from $VALIDATOR_ADDR --yes --broadcast-mode block --sign-mode direct --chain-id $CHAIN_ID

echo "------------------------------------------------------------------------------------"
echo store contract
CONTRACT_CODE=$($BINARY tx wasm store "/$DIR_NAME_SNAKE.wasm" --from alice $TXFLAG --output json | jq -r '.logs[0].events[-1].attributes[0].value')
# enter password
echo contract code is $CONTRACT_CODE
#---------- SMART CONTRACT INTERACTION ------------------------

# instantiate smart contract
echo "------------------------------------------------------------------------------------"
echo init contract
INIT='{}'
$BINARY tx wasm instantiate $CONTRACT_CODE "$INIT" --from "alice" --label "starbound-dev" $TXFLAG --admin $ALICE_ADDR

# get smart contract address
echo "------------------------------------------------------------------------------------"
echo get contract address
CONTRACT_ADDRESS=$($BINARY query wasm list-contract-by-code $CONTRACT_CODE --node $RPC --chain-id $CHAIN_ID --output json | jq -r '.contracts[-1]')

# write data to file
cd $DIR/scripts
ALICE_SEED="notice oak worry limit wrap speak medal online prefer cluster roof addict wrist behave treat actual wasp year salad speed social layer crew genius"
R="{\"ALICE_SEED\":\"$ALICE_SEED\",\"ALICE_ADDR\":\"$ALICE_ADDR\",\"CONTRACT_ADDRESS\":\"$CONTRACT_ADDRESS\",\"CONTRACT_CODE\":\"$CONTRACT_CODE\"}"
echo $R > chain_data.json
cd $DIR