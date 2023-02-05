# script for running relayer between testnets

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

A_RPC="https://rpc-test.osmosis.zone:443"
B_RPC="https://rpc.sentry-02.theta-testnet.polypore.xyz:443"
C_RPC="https://rpc.testnet.secretsaturn.net:443"

RELAYER_ADDRESS_A="osmo1ej0m5yaspmmt73825d32hmjtwyn0lm8nmk9ct6"
BOB_ADDRESS_B="cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35"
BOB_ADDRESS_C="secret1chgwz55h9kepjq0fkj5supl2ta3nwu63n02fvg"

TXFLAG="--gas-prices 0.1uosmo --gas auto --gas-adjustment 1.3 -y -b block --node $A_RPC --chain-id $A_CHAIN"

DIR=$(pwd)
TESTNET_DIR="$DIR/../wba-twt-testnet"
FOLDER="./testnet-osmosis-cosmoshub-secret"
HERMES="hermes --config $FOLDER/config.toml"

SEP="------------------------------------------------------------------------------------"


cd $TESTNET_DIR

# transfer from osmosis to cosmos hub
echo $SEP
echo "transfer from osmosis to cosmos hub..."
echo "enter password (12345678)"
osmosisd tx ibc-transfer transfer $A_PORT $AB_CHANNEL $BOB_ADDRESS_B "1uosmo" --from relayer2 $TXFLAG

# transfer from osmosis to secret network
echo $SEP
echo "transfer from osmosis to secret network..."
echo "enter password (12345678)"
osmosisd tx ibc-transfer transfer $A_PORT $AC_CHANNEL $BOB_ADDRESS_C "1uosmo" --from relayer2 $TXFLAG

# # clear packets
# echo $SEP
# echo "clearing packets..."
# $HERMES clear packets --chain $A_CHAIN --channel $AB_CHANNEL --port $A_PORT
# $HERMES clear packets --chain $B_CHAIN --channel $BA_CHANNEL --port $B_PORT
# $HERMES clear packets --chain $A_CHAIN --channel $AC_CHANNEL --port $A_PORT
# $HERMES clear packets --chain $C_CHAIN --channel $CA_CHANNEL --port $C_PORT

# checking balances
# echo $SEP
# echo "checking $BOB_ADDRESS_B balances..."
# gaiad q bank balances $BOB_ADDRESS_B --node $B_RPC --chain-id $B_CHAIN
# echo $SEP
# echo "checking $BOB_ADDRESS_C balances..."
# secretcli q bank balances $BOB_ADDRESS_C --node $C_RPC --chain-id $C_CHAIN

cd $DIR