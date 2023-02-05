# script for opening ibc channels between testnets A-B, A-C

A_CHAIN="osmo-test-4"
B_CHAIN="theta-testnet-001"
C_CHAIN="pulsar-2"

A_PORT="transfer"
B_PORT="transfer"
C_PORT="transfer"

DIR=$(pwd)
TESTNET_DIR="$DIR/../wba-twt-testnet"
FOLDER="./testnet-osmosis-cosmoshub-secret"
HERMES="hermes --config $FOLDER/config.toml"


cd $TESTNET_DIR

# restore keys if it's needed
# $FOLDER/start.sh # osmosis - cosmos hub
# $FOLDER/start2.sh # osmosis - secret network

# addresses must contain some funds!

# open channel A-B
# $HERMES create channel --a-chain $A_CHAIN --b-chain $B_CHAIN \
#   --a-port $A_PORT --b-port $B_PORT \
#   --order unordered --channel-version "ics20-1" \
#   --new-client-connection --yes

# open channel A-C
$HERMES create channel --a-chain $A_CHAIN --b-chain $C_CHAIN \
  --a-port $A_PORT --b-port $C_PORT \
  --order unordered --channel-version "ics20-1" \
  --new-client-connection --yes

cd $DIR