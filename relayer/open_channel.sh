# script for opening ibc channels between testnets A-B, A-C
# and storing its chain_id, client_id, channel_id

A_CHAIN="osmo-test-4"
B_CHAIN="theta-testnet-001"
C_CHAIN="pulsar-2"

A_PORT="transfer"
B_PORT="transfer"
C_PORT="transfer"

HERMES="hermes --config config.toml"

res_ab_json_path="ibc-config-ab.json"
res_ac_json_path="ibc-config-ac.json"


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

ab() {
  # open channel A-B
  res_ab=$($HERMES create channel --a-chain $A_CHAIN --b-chain $B_CHAIN \
    --a-port $A_PORT --b-port $B_PORT \
    --order unordered --channel-version "ics20-1" \
    --new-client-connection --yes)

  # it doesn't work without w/r .txt
  echo $res_ab > "ibc-config-ab.txt"
  res_ab=$(< "ibc-config-ab.txt")
  res_ab_json=$(string_to_json "$res_ab")
  echo $res_ab_json > $res_ab_json_path

  if [ -d "../client/src/common/config" ]; then
    echo $res_ab_json > "../client/src/common/config/ibc-config-ab.json"
  fi
  echo $res_ab_json > "../client/dist/common/config/ibc-config-ab.json"
  rm -rf "ibc-config-ab.txt"
}

ac() {
  # open channel A-C
  res_ac=$($HERMES create channel --a-chain $A_CHAIN --b-chain $C_CHAIN \
    --a-port $A_PORT --b-port $C_PORT \
    --order unordered --channel-version "ics20-1" \
    --new-client-connection --yes)

  echo $res_ac > "ibc-config-ac.txt"
  res_ac=$(< "ibc-config-ac.txt")
  res_ac_json=$(string_to_json "$res_ac")
  echo $res_ac_json > $res_ac_json_path

  if [ -d "../client/src/common/config" ]; then
    echo $res_ac_json > "../client/src/common/config/ibc-config-ac.json"
  fi
  echo $res_ac_json > "../client/dist/common/config/ibc-config-ac.json"
  rm -rf "ibc-config-ac.txt"
}


# addresses must contain some funds!

ab
A_CHAIN_TEMP=$(jq -r '.a_chain_id' $res_ab_json_path)
B_CHAIN_TEMP=$(jq -r '.b_chain_id' $res_ab_json_path)
A_CHAIN_TEMP="$(sed -e 's/^[ \t]*//' -e 's/\ *$//g'<<<"${A_CHAIN_TEMP}")"
B_CHAIN_TEMP="$(sed -e 's/^[ \t]*//' -e 's/\ *$//g'<<<"${B_CHAIN_TEMP}")"
echo "A_CHAIN is '$A_CHAIN_TEMP' and B_CHAIN is '$B_CHAIN_TEMP'"

while [[ -z $A_CHAIN_TEMP || -z $B_CHAIN_TEMP ]]; do
  echo "A or B is empty. Opening channels again..."
  ab
  A_CHAIN_TEMP=$(jq -r '.a_chain_id' $res_ab_json_path)
  B_CHAIN_TEMP=$(jq -r '.b_chain_id' $res_ab_json_path)
  A_CHAIN_TEMP="$(sed -e 's/^[ \t]*//' -e 's/\ *$//g'<<<"${A_CHAIN_TEMP}")"
  B_CHAIN_TEMP="$(sed -e 's/^[ \t]*//' -e 's/\ *$//g'<<<"${B_CHAIN_TEMP}")"
  echo "A_CHAIN is '$A_CHAIN_TEMP' and B_CHAIN is '$B_CHAIN_TEMP'"
done

ac
A_CHAIN_TEMP=$(jq -r '.a_chain_id' $res_ac_json_path)
C_CHAIN_TEMP=$(jq -r '.b_chain_id' $res_ac_json_path)
A_CHAIN_TEMP="$(sed -e 's/^[ \t]*//' -e 's/\ *$//g'<<<"${A_CHAIN_TEMP}")"
C_CHAIN_TEMP="$(sed -e 's/^[ \t]*//' -e 's/\ *$//g'<<<"${C_CHAIN_TEMP}")"
echo "A_CHAIN is '$A_CHAIN_TEMP' and C_CHAIN is '$C_CHAIN_TEMP'"

while [[ -z $A_CHAIN_TEMP || -z $C_CHAIN_TEMP ]]; do
  echo "A or C is empty. Opening channels again..."
  ac
  A_CHAIN_TEMP=$(jq -r '.a_chain_id' $res_ac_json_path)
  C_CHAIN_TEMP=$(jq -r '.b_chain_id' $res_ac_json_path)
  A_CHAIN_TEMP="$(sed -e 's/^[ \t]*//' -e 's/\ *$//g'<<<"${A_CHAIN_TEMP}")"
  C_CHAIN_TEMP="$(sed -e 's/^[ \t]*//' -e 's/\ *$//g'<<<"${C_CHAIN_TEMP}")"
  echo "A_CHAIN is '$A_CHAIN_TEMP' and C_CHAIN is '$C_CHAIN_TEMP'"
done
