# script for running relayer between testnets

A_CHAIN="osmo-test-4"
B_CHAIN="theta-testnet-001"
A_PORT="transfer"
B_PORT="transfer"
A_CHANNEL="channel-2347"
B_CHANNEL="channel-1531"
A_RPC="https://rpc-test.osmosis.zone:443"
B_RPC="https://rpc.sentry-02.theta-testnet.polypore.xyz:443"

RELAYER_ADDRESS_OSMO="osmo1ej0m5yaspmmt73825d32hmjtwyn0lm8nmk9ct6"
BOB_ADDRESS_COSMOSHUB="cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35"

TXFLAG="--gas-prices 0.1uosmo --gas auto --gas-adjustment 1.3 -y -b block --node $A_RPC --chain-id $A_CHAIN"

DIR=$(pwd)
TESTNET_DIR="$DIR/../wba-twt-testnet"
FOLDER="./testnet-osmosis-cosmoshub-secret"
HERMES="hermes --config $FOLDER/config.toml"

function count_down {
    local delay=$1
    while [ $delay -gt 0 ]; do
        echo -ne "$delay\r"
        sleep 1
        ((delay--))
    done
    echo
}

clear

cd $TESTNET_DIR
# start hermes relayer
kill $(pgrep hermes)
echo "starting hermes..."

# $HERMES create channel --a-chain $A_CHAIN --b-chain $B_CHAIN \
#   --a-port $A_PORT --b-port $B_PORT \
#   --order unordered --channel-version "ics20-1" \
#   --new-client-connection --yes

# $FOLDER/start.sh &> /dev/null &
# count_down 180

# try to transfer directly
echo "trying to transfer directly..."
echo "enter password (12345678)"
osmosisd tx ibc-transfer transfer $A_PORT $A_CHANNEL $BOB_ADDRESS_COSMOSHUB "1uosmo" --from relayer2 $TXFLAG
# clear packets
$HERMES clear packets --chain $A_CHAIN --channel $A_CHANNEL --port $A_PORT &> /dev/null
$HERMES clear packets --chain $B_CHAIN --channel $B_CHANNEL --port $B_PORT &> /dev/null
echo "checking $BOB_ADDRESS_COSMOSHUB balances..."
gaiad q bank balances $BOB_ADDRESS_COSMOSHUB --node $B_RPC --chain-id $B_CHAIN

# stop hermes
echo "stopping hermes..."
kill $(pgrep hermes)
