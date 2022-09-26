DIR=$(pwd)
TESTNET_DIR="$DIR/../wba-twt-testnet"

SEP="------------------------------------------------------------------------------------"

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