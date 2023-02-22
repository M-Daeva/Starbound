# script for updating clients and clearing packets

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
BA_CHANNEL=$(jq -r '.b_channel_id' $res_ab_json)

AC_CHANNEL=$(jq -r '.a_channel_id' $res_ac_json)
CA_CHANNEL=$(jq -r '.b_channel_id' $res_ac_json)

AB_CLIENT=$(jq -r '.a_client_id' $res_ab_json)
AC_CLIENT=$(jq -r '.a_client_id' $res_ac_json)

HERMES="hermes --config config.toml"

SEP="------------------------------------------------------------------------------------"


# periods in minutes
UPDATE_COSMOSHUB_CLIENT_PERIOD=60
UPDATE_SECRET_CLIENT_PERIOD=5
CLEAR_PACKETS_PERIOD=5

count=0

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
    echo "$A_CHAIN -> $B_CHAIN"
    $HERMES clear packets --chain $A_CHAIN --channel $AB_CHANNEL --port $A_PORT
    echo "$B_CHAIN -> $A_CHAIN"
    $HERMES clear packets --chain $B_CHAIN --channel $BA_CHANNEL --port $B_PORT
    echo "$A_CHAIN -> $C_CHAIN"
    $HERMES clear packets --chain $A_CHAIN --channel $AC_CHANNEL --port $A_PORT
    echo "$C_CHAIN -> $A_CHAIN"
    $HERMES clear packets --chain $C_CHAIN --channel $CA_CHANNEL --port $C_PORT
    echo "DONE!"
    echo
    sleep $((CLEAR_PACKETS_PERIOD * 60))
    ((count++)) # TODO: replace increment
done
