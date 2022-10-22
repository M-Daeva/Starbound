# script for running tests on ibc network

PREFIX="osmo"
CHAIN_ID="osmo-test-4"
RPC="https://osmosis-testnet-rpc.allthatnode.com:26657"

# it's relayer seed actually
SEED_ALICE="harsh adult scrub stadium solution impulse company agree tomorrow poem dirt innocent coyote slight nice digital scissors cool pact person item moon double wagon"
ALICE_ADDRESS_WASM="wasm1ll3s59aawh0qydpz2q3xmqf6pwzmj24t8l43cp"
ALICE_ADDRESS_OSMO="osmo1ll3s59aawh0qydpz2q3xmqf6pwzmj24t9ch58c"

SEED_BOB=$(jq -r '.BOB_SEED' ../.test-wallets/test_wallets.json)
BOB_ADDRESS_WASM="juno1xjeu7n97xs0pv7lxcedat00d6vgyr9m54vefn2"
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

A_CHAIN="osmo-test-4"
A_CONNECTION="connection-0"
A_PORT="transfer"
B_PORT="transfer"
CHANNEL="channel-0"

SEP="------------------------------------------------------------------------------------"

clear

# start hermes relayer
cd $TESTNET_DIR
echo $SEP
echo "starting hermes..."
# ./hermes2/start.sh &> /dev/null &
# sleep 20
./hermes2/start.sh

# stop hermes
echo $SEP
echo "stopping hermes..."
kill $(pgrep hermes)



# # open ibc channel between 2 networks
# cd $TESTNET_DIR
# echo $SEP
# echo "openning ibc channel..."
# hermes --config ./hermes2/config.toml create channel --a-chain $A_CHAIN \
#   --a-connection $A_CONNECTION --a-port $A_PORT --b-port $B_PORT \
# 	--order unordered --channel-version "ics20-1"
	
# # try to transfer directly
# echo $SEP
# echo "trying to transfer directly..."
# echo "enter password (1234567890)"
# osmosisd tx ibc-transfer transfer $A_PORT $CHANNEL $BOB_ADDRESS_WASM "1uosmo" --from relayer2 $TXFLAG
# echo $SEP
# echo "checking $BOB_ADDRESS_WASM balances..."
# # clear packets
# cd $TESTNET_DIR
# hermes --config ./hermes2/config.toml clear packets --chain $CHAIN_ID --channel $CHANNEL --port $A_PORT &> /dev/null
# echo "checking $BOB_ADDRESS_WASM balances..."
# junod q bank balances $BOB_ADDRESS_WASM --node $RPC --chain-id $CHAIN_ID

# # # run contract tests
# # echo $SEP
# # echo "testing contract..."
# # cd $DIR/scripts
# # ts-node ./tests/ibc-network-test.ts
# # echo $SEP
# # # clear packets
# # cd $TESTNET_DIR
# # hermes --config ./hermes2/config.toml clear packets --chain $CHAIN_ID --channel $CHANNEL --port $A_PORT &> /dev/null
# # echo "checking $BOB_ADDRESS_WASM balances..."
# # junod q bank balances $BOB_ADDRESS_WASM --node $RPC --chain-id $CHAIN_ID

# # stop hermes
# echo $SEP
# echo "stopping hermes..."
# cd $TESTNET_DIR
# kill $(pgrep hermes)

