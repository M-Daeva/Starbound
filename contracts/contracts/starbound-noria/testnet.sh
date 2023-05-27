# script for storing contract on testnet

PREFIX="noria"
DENOM="ucrd"
DAEMON="noriad"
CHAIN_ID="oasis-3"
RPC="https://archive-rpc.noria.nextnet.zone:443"

TEST_WALLETS="../../../../.test-wallets/test_wallets.json"
# noria1ll3s59aawh0qydpz2q3xmqf6pwzmj24tv3vrc0
SEED_ALICE=$(jq -r '.ALICE_SEED' $TEST_WALLETS)
# noria1chgwz55h9kepjq0fkj5supl2ta3nwu63sck8c3
SEED_BOB=$(jq -r '.BOB_SEED' $TEST_WALLETS)
# noria18tnvnwkklyv4dyuj8x357n7vray4v4zugmp3du
SEED_DAPP=$(jq -r '.JOHN_SEED' $TEST_WALLETS)
DAPP_ADDRESS="noria18tnvnwkklyv4dyuj8x357n7vray4v4zugmp3du"

TXFLAG="--gas-prices 0.0025$DENOM --gas auto --gas-adjustment 1.3 -y --node $RPC --chain-id $CHAIN_ID"
DIR_NAME=$(echo ${PWD##*/})
DIR_NAME_SNAKE=$(echo $DIR_NAME | tr '-' '_')
WASM="$DIR_NAME_SNAKE.wasm"

# to import accounts from mnemonic use
# $DAEMON keys add $user --recover
cd ../../artifacts
yes 12345678 | $DAEMON tx wasm store $WASM --from dapp $TXFLAG
exit 1
CONTRACT_CODE=$(yes 12345678 | $DAEMON tx wasm store $WASM --from dapp $TXFLAG --output json | jq -r '.logs[0].events[-1].attributes[1].value')
echo contract code is $CONTRACT_CODE

# instantiate smart contract
INIT='{}'
yes 12345678 | $DAEMON tx wasm instantiate $CONTRACT_CODE "$INIT" --from "dapp" --label "starbound-dev" $TXFLAG --admin $DAPP_ADDRESS

# get smart contract address
CONTRACT_ADDRESS=$($DAEMON query wasm list-contract-by-code $CONTRACT_CODE --node $RPC --chain-id $CHAIN_ID --output json | jq -r '.contracts[-1]')

# write data to file
R="{
\"PREFIX\":\"$PREFIX\",
\"CHAIN_ID\":\"$CHAIN_ID\",
\"RPC\":\"$RPC\",
\"CONTRACT_CODE\":\"$CONTRACT_CODE\",
\"CONTRACT_ADDRESS\":\"$CONTRACT_ADDRESS\",
\"SEED_ALICE\":\"$SEED_ALICE\",
\"SEED_BOB\":\"$SEED_BOB\",
\"SEED_DAPP\":\"$SEED_DAPP\"
}"
echo $R > "../../client/src/common/config/${DAEMON::-1}-testnet-config.json"
