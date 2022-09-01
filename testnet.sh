# script for connecting to juno testnet

CHAIN_ID="uni-3"
RPC="https://rpc.uni.junomint.com:443"
TXFLAG="--gas-prices 0.1ujunox --gas auto --gas-adjustment 1.3 -y -b block --node $RPC --chain-id $CHAIN_ID"
DIR=$(pwd)
DIR_NAME=$(basename "$PWD")
DIR_NAME_SNAKE=$(echo $DIR_NAME | tr '-' '_')
WASM="artifacts/$DIR_NAME_SNAKE.wasm"
ALICE_ADDRESS="juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg"

# build optimized binary if it doesn't exist
if [ ! -f "$WASM" ]; then
  echo "building optimized binary..."
  docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.12.6
fi

# you must manually import all accounts from mnemonic via
# junod keys add $user --recover
# check your .juno folder for account records
CONTRACT_CODE=$(junod tx wasm store $WASM --from alice $TXFLAG --output json | jq -r '.logs[0].events[-1].attributes[0].value')
echo contract code is $CONTRACT_CODE

#---------- SMART CONTRACT INTERACTION ------------------------

# instantiate smart contract
INIT='{"count":42}'
junod tx wasm instantiate $CONTRACT_CODE "$INIT" --from "alice" --label "my first contract" $TXFLAG --admin $ALICE_ADDRESS

# get smart contract address
CONTRACT_ADDRESS=$(junod query wasm list-contract-by-code $CONTRACT_CODE --node $RPC --chain-id $CHAIN_ID --output json | jq -r '.contracts[-1]')

# write data to file
cd $DIR/scripts
R="{\"CONTRACT_CODE_TEST\":\"$CONTRACT_CODE\",\"CONTRACT_ADDRESS_TEST\":\"$CONTRACT_ADDRESS\"}"
echo $R > contract_data.json
cd $DIR
