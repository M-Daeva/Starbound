# script for running integration tests

CHAIN_ID="osmo-testing"
RPC="http://localhost:26657/"
TXFLAG="--gas-prices 0.1uosmo --gas auto --gas-adjustment 1.3 -y -b block --node $RPC --chain-id $CHAIN_ID"
BINARY="docker exec -i osmosis osmosisd"
DIR=$(pwd)
TESTNET_DIR="$DIR/../wba-twt-testnet"
DIR_NAME=$(basename "$PWD")
DIR_NAME_SNAKE=$(echo $DIR_NAME | tr '-' '_')
WASM="artifacts/$DIR_NAME_SNAKE.wasm"
IMAGE_NAME="osmosis"

A_CHAIN="osmo-testing"
A_CONNECTION="connection-0"
A_PORT="transfer"
B_PORT="transfer"

SEP="------------------------------------------------------------------------------------"

clear

# run local osmo and wasm networks
echo $SEP
echo "starting local networks..."
cd $TESTNET_DIR
./ci-scripts/osmosis/start.sh &> /dev/null &
./ci-scripts/wasmd/start.sh &> /dev/null &
sleep 15

# start hermes relayer
echo $SEP
echo "starting hermes..."
./hermes/start.sh &> /dev/null &
sleep 20

# open ibc channel
echo $SEP
echo "openning ibc channel..."
hermes --config ./hermes/config.toml create channel --a-chain $A_CHAIN \
  --a-connection $A_CONNECTION --a-port $A_PORT --b-port $B_PORT

# run chain tests
echo $SEP
echo "testing chain..."
cd $DIR/scripts
npm run test-chain

# move binary to docker container
echo $SEP
echo "moving binary to docker container..."
cd $DIR
docker cp "artifacts/$DIR_NAME_SNAKE.wasm" "$IMAGE_NAME:/$DIR_NAME_SNAKE.wasm"

# store the contract
echo $SEP
echo "storing contract..."
echo "enter password (1234567890)"
CONTRACT_CODE=$($BINARY tx wasm store "/$DIR_NAME_SNAKE.wasm" --from relayer2 $TXFLAG --output json | jq -r '.logs[0].events[-1].attributes[0].value')
echo contract code is $CONTRACT_CODE

#---------- SMART CONTRACT INTERACTION ------------------------

# instantiate the contract
echo $SEP
echo "instantiating contract..."
echo "enter password (1234567890)"
INIT='{}'
$BINARY tx wasm instantiate $CONTRACT_CODE $INIT --from relayer2 --label "starbound-dev" $TXFLAG --no-admin

# get smart contract address
echo $SEP
echo "getting contract address..."
CONTRACT_ADDRESS=$($BINARY query wasm list-contract-by-code $CONTRACT_CODE --node $RPC --chain-id $CHAIN_ID --output json | jq -r '.contracts[-1]')
echo contract address is $CONTRACT_ADDRESS

# write data to file
echo $SEP
echo "writing data to file..."
cd $DIR/scripts
R="{\"CONTRACT_CODE_TEST\":\"$CONTRACT_CODE\",\"CONTRACT_ADDRESS_TEST\":\"$CONTRACT_ADDRESS\"}"
echo $R > contract_data.json
cd $DIR

# run contract tests
echo $SEP
echo "testing contract..."
cd $DIR/scripts
npm run test-contract
# docker exec -i wasmd wasmd query bank balances wasm1ll3s59aawh0qydpz2q3xmqf6pwzmj24t8l43cp

# stop hermes
echo $SEP
echo "stopping hermes..."
cd $TESTNET_DIR
kill $(pgrep hermes)

# stop local osmo and wasm networks
echo $SEP
echo "stopping local networks..."
./ci-scripts/osmosis/stop.sh
./ci-scripts/wasmd/stop.sh
