# script for storing contract on testnet

PREFIX="osmo"
DENOM="uosmo"
DAEMON="osmosisd"
CHAIN_ID="osmo-test-5"
RPC="https://rpc.osmotest5.osmosis.zone:443"

# osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx
SEED_ALICE=$(jq -r '.ALICE_SEED' ../../../../.test-wallets/test_wallets.json)
# osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x
SEED_BOB=$(jq -r '.BOB_SEED' ../../../../.test-wallets/test_wallets.json)
# osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt
SEED_DAPP=$(jq -r '.JOHN_SEED' ../../../../.test-wallets/test_wallets.json)
DAPP_ADDRESS="osmo18tnvnwkklyv4dyuj8x357n7vray4v4zupj6xjt"

TXFLAG="--gas-prices 0.1$DENOM --gas auto --gas-adjustment 1.3 -y -b block --node $RPC --chain-id $CHAIN_ID"
DIR_NAME=$(echo ${PWD##*/})
DIR_NAME_SNAKE=$(echo $DIR_NAME | tr '-' '_')
WASM="$DIR_NAME_SNAKE.wasm"

# you must manually import all accounts from mnemonic via
# $DAEMON keys add $user --recover
cd ../../artifacts
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
