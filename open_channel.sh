# script for opening ibc channels between testnets A-B, A-C

A_CHAIN="osmo-test-4"
B_CHAIN="theta-testnet-001"
C_CHAIN="pulsar-2"

A_PORT="transfer"
B_PORT="transfer"
C_PORT="transfer"

AB_CHANNEL="channel-2347"
BA_CHANNEL="channel-1531"

AC_CHANNEL="channel-2351"
CA_CHANNEL="channel-52"

A_RPC="https://rpc-test.osmosis.zone:443"
B_RPC="https://rpc.sentry-02.theta-testnet.polypore.xyz:443"
C_RPC="https://rpc.testnet.secretsaturn.net:443"

RELAYER_ADDRESS_A="osmo1ej0m5yaspmmt73825d32hmjtwyn0lm8nmk9ct6"
BOB_ADDRESS_B="cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35"
BOB_ADDRESS_C="secret1chgwz55h9kepjq0fkj5supl2ta3nwu63n02fvg"

DIR=$(pwd)
TESTNET_DIR="$DIR/../wba-twt-testnet"
FOLDER="./testnet-osmosis-cosmoshub-secret"
HERMES="hermes --config $FOLDER/config.toml"


cd $TESTNET_DIR

# restore keys if it's needed
# $FOLDER/start.sh

# adresses must contain some funds!

# open channel A-B
# $HERMES create channel --a-chain $A_CHAIN --b-chain $B_CHAIN \
#   --a-port $A_PORT --b-port $B_PORT \
#   --order unordered --channel-version "ics20-1" \
#   --new-client-connection --yes

# open channel A-C
# $HERMES create channel --a-chain $A_CHAIN --b-chain $C_CHAIN \
#   --a-port $A_PORT --b-port $C_PORT \
#   --order unordered --channel-version "ics20-1" \
#   --new-client-connection --yes
