# script for running ibc transfer test

DIR=$(pwd)
TESTNET_DIR="$DIR/../wba-twt-testnet"
SEP="------------------------------------------------------------------------------------"

A_CHAIN="osmo-testing"
A_CONNECTION="connection-0"
A_PORT="transfer"
B_PORT="transfer"

clear

# run local osmo and wasm networks
echo $SEP
echo "starting local networks..."
cd $TESTNET_DIR
./ci-scripts/osmosis/start.sh &> /dev/null &
./ci-scripts/wasmd/start.sh &> /dev/null &
sleep 10

# start hermes relayer
echo $SEP
echo "starting hermes..."
./hermes/start.sh &> /dev/null &
sleep 15

# open ibc channel
echo $SEP
echo "openning ibc channel..."
hermes --config ./hermes/config.toml create channel --a-chain $A_CHAIN \
  --a-connection $A_CONNECTION --a-port $A_PORT --b-port $B_PORT

# execute ibc transfer
echo $SEP
echo "executing ibc transfer..."
cd $DIR/scripts
npm run test-ibc

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



