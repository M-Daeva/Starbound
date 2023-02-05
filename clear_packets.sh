# script for updating clients and clearing packets

A_CHAIN="osmo-test-4"
B_CHAIN="theta-testnet-001"
C_CHAIN="pulsar-2"

A_PORT="transfer"
B_PORT="transfer"
C_PORT="transfer"

AB_CHANNEL="channel-2347"
BA_CHANNEL="channel-1531"

AC_CHANNEL="channel-2358"
CA_CHANNEL="channel-55"

# AB_CHANNEL="channel-0"
# BA_CHANNEL="channel-141"

# AC_CHANNEL="channel-88"
# CA_CHANNEL="channel-1"

AB_CLIENT="07-tendermint-3612"
AC_CLIENT="07-tendermint-3629"

DIR=$(pwd)
TESTNET_DIR="$DIR/../wba-twt-testnet"
FOLDER="./testnet-osmosis-cosmoshub-secret"
HERMES="hermes --config $FOLDER/config.toml"

SEP="------------------------------------------------------------------------------------"


function count_up {
    # periods in minutes
    local UPDATE_COSMOSHUB_CLIENT_PERIOD=60
    local UPDATE_SECRET_CLIENT_PERIOD=5
    local CLEAR_PACKETS_PERIOD=5

    local count=0

    while true; do
        if [ $((count % ($UPDATE_COSMOSHUB_CLIENT_PERIOD/$CLEAR_PACKETS_PERIOD))) -eq 0 ]; then
            echo "updating cosmoshub client $count..."
            $HERMES update client --host-chain $A_CHAIN --client $AB_CLIENT
        fi

        if [ $((count % ($UPDATE_SECRET_CLIENT_PERIOD/$CLEAR_PACKETS_PERIOD))) -eq 0 ]; then
            echo "updating secret network client $count..."
            $HERMES update client --host-chain $A_CHAIN --client $AC_CLIENT
        fi

        echo "clearing packets $count..."
        $HERMES clear packets --chain $A_CHAIN --channel $AB_CHANNEL --port $A_PORT
        $HERMES clear packets --chain $B_CHAIN --channel $BA_CHANNEL --port $B_PORT
        $HERMES clear packets --chain $A_CHAIN --channel $AC_CHANNEL --port $A_PORT
        $HERMES clear packets --chain $C_CHAIN --channel $CA_CHANNEL --port $C_PORT
        sleep $((CLEAR_PACKETS_PERIOD * 60))
        ((count++))
    done
}


cd $TESTNET_DIR
count_up
cd $DIR