# script for opening ibc channels between testnets A-B, A-C
# and storing its chain_id, client_id, channel_id

A_CHAIN="osmo-test-4"
B_CHAIN="theta-testnet-001"
C_CHAIN="pulsar-2"

A_PORT="transfer"
B_PORT="transfer"
C_PORT="transfer"

HERMES="hermes --config config.toml"


string_to_json() {
  local a_chain_id=$(echo "$1" | grep -oP 'a_side.*?id: "\K[^"]+')
  local a_client_id=$(echo "$1" | grep -oP 'a_side.*?ClientId\( "\K[^"]+')
  local a_channel_id=$(echo "$1" | grep -oP 'a_side.*?ChannelId\( "\K[^"]+')
  local a_port_id=$(echo "$1" | grep -oP 'a_side.*?PortId\( "\K[^"]+')

  local b_chain_id=$(echo "$1" | grep -oP 'b_side.*?id: "\K[^"]+')
  local b_client_id=$(echo "$1" | grep -oP 'b_side.*?ClientId\( "\K[^"]+')
  local b_channel_id=$(echo "$1" | grep -oP 'b_side.*?ChannelId\( "\K[^"]+')
  local b_port_id=$(echo "$1" | grep -oP 'b_side.*?PortId\( "\K[^"]+')

  local res="{ 
  \"a_chain_id\": \"$a_chain_id\",
  \"a_client_id\": \"$a_client_id\",
  \"a_channel_id\": \"$a_channel_id\",
  \"a_port_id\": \"$a_port_id\",
  \"b_chain_id\": \"$b_chain_id\",
  \"b_client_id\": \"$b_client_id\",
  \"b_channel_id\": \"$b_channel_id\",
  \"b_port_id\": \"$b_port_id\"
  }"

  echo $res
}


# addresses must contain some funds!

# open channel A-B
res_ab=$($HERMES create channel --a-chain $A_CHAIN --b-chain $B_CHAIN \
  --a-port $A_PORT --b-port $B_PORT \
  --order unordered --channel-version "ics20-1" \
  --new-client-connection --yes)

# it doesn't work without w/r .txt
echo $res_ab > "ibc-config-ab.txt"
res_ab=$(< "ibc-config-ab.txt")
res_ab_json=$(string_to_json "$res_ab")
echo $res_ab_json > "ibc-config-ab.json"
if [ -d "../client/src/common/config" ]; then
  echo $res_ab_json > "../client/src/common/config/ibc-config-ab.json"
fi
echo $res_ab_json > "../client/dist/common/config/ibc-config-ab.json"
rm -rf "ibc-config-ab.txt"

# open channel A-C
res_ac=$($HERMES create channel --a-chain $A_CHAIN --b-chain $C_CHAIN \
  --a-port $A_PORT --b-port $C_PORT \
  --order unordered --channel-version "ics20-1" \
  --new-client-connection --yes)

echo $res_ac > "ibc-config-ac.txt"
res_ac=$(< "ibc-config-ac.txt")
res_ac_json=$(string_to_json "$res_ac")
echo $res_ac_json > "ibc-config-ac.json"
if [ -d "../client/src/common/config" ]; then
  echo $res_ac_json > "../client/src/common/config/ibc-config-ac.json"
fi
echo $res_ac_json > "../client/dist/common/config/ibc-config-ac.json"
rm -rf "ibc-config-ac.txt"
