# script for running tests on ibc network

PREFIX="osmo"
CHAIN_ID="osmo-testing"
RPC="http://localhost:26657/"
RPC_OSMO="http://localhost:26653/"

# it's relayer seed actually
SEED_ALICE="harsh adult scrub stadium solution impulse company agree tomorrow poem dirt innocent coyote slight nice digital scissors cool pact person item moon double wagon"
ALICE_ADDRESS_WASM="wasm1ll3s59aawh0qydpz2q3xmqf6pwzmj24t8l43cp"
ALICE_ADDRESS_OSMO="osmo1ll3s59aawh0qydpz2q3xmqf6pwzmj24t9ch58c"

SEED_BOB=$(jq -r '.BOB_SEED' ../.test-wallets/test_wallets.json)
BOB_ADDRESS_WASM="wasm1chgwz55h9kepjq0fkj5supl2ta3nwu63mk04cl"
BOB_ADDRESS_OSMO="osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x"

SEED_DAPP=$(jq -r '.JOHN_SEED' ../.test-wallets/test_wallets.json)
DAPP_ADDRESS="osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt"

TXFLAG="--gas-prices 0.1uosmo --gas auto --gas-adjustment 1.3 -y -b block --node $RPC --chain-id $CHAIN_ID"
BINARY="docker exec -i osmosis osmosisd"
BINARY2="docker exec -i wasmd wasmd"
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
$BINARY tx wasm instantiate $CONTRACT_CODE $INIT --from relayer2 --label "starbound-dev" $TXFLAG --admin $DAPP_ADDRESS

# get smart contract address
echo $SEP
echo "getting contract address..."
CONTRACT_ADDRESS=$($BINARY query wasm list-contract-by-code $CONTRACT_CODE --node $RPC --chain-id $CHAIN_ID --output json | jq -r '.contracts[-1]')
echo contract address is $CONTRACT_ADDRESS

# get smart contract port_id
echo $SEP
echo "getting contract port_id..."
$BINARY q wasm contract $CONTRACT_ADDRESS --node $RPC --chain-id $CHAIN_ID

# send some osmo to contract
echo $SEP
echo "sending osmo from relayer to contract..."
echo "enter password (1234567890)"
$BINARY tx bank send $ALICE_ADDRESS_OSMO $CONTRACT_ADDRESS "1000000uosmo" --from relayer2 $TXFLAG
echo "checking contract balances..."
$BINARY query bank balances $CONTRACT_ADDRESS 
# --node $RPC --chain-id $CHAIN_ID

# open ibc channel between 2 networks
cd $TESTNET_DIR
echo $SEP
echo "openning ibc channel..."
hermes --config ./hermes/config.toml create channel --a-chain $A_CHAIN \
  --a-connection $A_CONNECTION --a-port $A_PORT --b-port $B_PORT \
	--order unordered --channel-version "ics20-1"
	
# write data to file
echo $SEP
echo "writing data to file..."
cd $DIR
R="{
\"PREFIX\":\"$PREFIX\",
\"CHAIN_ID\":\"$CHAIN_ID\",
\"RPC\":\"$RPC_OSMO\",
\"CONTRACT_CODE\":\"$CONTRACT_CODE\",
\"CONTRACT_ADDRESS\":\"$CONTRACT_ADDRESS\",
\"SEED_ALICE\":\"$SEED_ALICE\",
\"SEED_BOB\":\"$SEED_BOB\",
\"SEED_DAPP\":\"$SEED_DAPP\"
}"
echo $R > client/src/common/config/ibc-network-config.json

# # try to transfer directly
# echo $SEP
# echo "trying to transfer directly..."
# echo "enter password (1234567890)"
# $BINARY tx ibc-transfer transfer $A_PORT "channel-0" $BOB_ADDRESS_WASM "1uosmo" --from relayer2 $TXFLAG
# echo $SEP
# echo "checking $BOB_ADDRESS_WASM balances..."
# $BINARY2 query bank balances $BOB_ADDRESS_WASM --node $RPC --chain-id $CHAIN_ID

# run contract tests
echo $SEP
echo "testing contract..."
cd $DIR
ts-node ./client/scripts/tests/ibc-network-test.ts
echo $SEP
# clear packets
cd $TESTNET_DIR
hermes --config ./hermes/config.toml clear packets --chain $CHAIN_ID --channel "channel-0" --port $A_PORT &> /dev/null
echo "checking $BOB_ADDRESS_WASM balances..."
$BINARY2 query bank balances $BOB_ADDRESS_WASM --node $RPC --chain-id $CHAIN_ID

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
