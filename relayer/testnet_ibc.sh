# script for transfering tokens between testnets

# load parameters from files created by 'open_channel.sh'
res_ab_json="ibc-config-ab.json"
res_ac_json="ibc-config-ac.json"

A_CHAIN=$(jq -r '.a_chain_id' $res_ab_json)
B_CHAIN=$(jq -r '.b_chain_id' $res_ab_json)
C_CHAIN=$(jq -r '.b_chain_id' $res_ac_json)

A_PORT=$(jq -r '.a_port_id' $res_ab_json)
B_PORT=$(jq -r '.b_port_id' $res_ab_json)
C_PORT=$(jq -r '.b_port_id' $res_ac_json)

AB_CHANNEL=$(jq -r '.a_channel_id' $res_ab_json)
AC_CHANNEL=$(jq -r '.a_channel_id' $res_ac_json)

A_RPC="https://rpc-test.osmosis.zone:443"
B_RPC="https://rpc.sentry-02.theta-testnet.polypore.xyz:443"
C_RPC="https://rpc.testnet.secretsaturn.net:443"

RELAYER_ADDRESS_A="osmo1ej0m5yaspmmt73825d32hmjtwyn0lm8nmk9ct6"
BOB_ADDRESS_B="cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35"
BOB_ADDRESS_C="secret1chgwz55h9kepjq0fkj5supl2ta3nwu63n02fvg"

TXFLAG="--gas-prices 0.1uosmo --gas auto --gas-adjustment 1.3 -y -b block --node $A_RPC --chain-id $A_CHAIN"

HERMES="hermes --config config.toml"

SEP="------------------------------------------------------------------------------------"


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

# # checking balances
# echo $SEP
# echo "checking $BOB_ADDRESS_B balances..."
# gaiad q bank balances $BOB_ADDRESS_B --node $B_RPC --chain-id $B_CHAIN
# echo $SEP
# echo "checking $BOB_ADDRESS_C balances..."
# secretcli q bank balances $BOB_ADDRESS_C --node $C_RPC --chain-id $C_CHAIN

