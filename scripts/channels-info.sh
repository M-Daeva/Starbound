# script for connecting to juno testnet

CHAIN_ID="uni-3"
RPC="https://rpc.uni.junomint.com:443"

CHAIN_ID_2="osmo-test-4"
# RPC_2="https://testnet-rpc.osmosis.zone:443"
RPC_2="https://osmosis-testnet-rpc.allthatnode.com:26657"

TXFLAG="--gas-prices 0.1ujunox --gas auto --gas-adjustment 1.3 -y -b block --node $RPC --chain-id $CHAIN_ID"
DIR=$(pwd)
DIR_NAME=$(basename "$PWD")
DIR_NAME_SNAKE=$(echo $DIR_NAME | tr '-' '_')
WASM="artifacts/$DIR_NAME_SNAKE.wasm"
ALICE_ADDRESS="juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg"

junod q ibc channel channels --node $RPC_2 --chain-id $CHAIN_ID_2 --output json

