CHAIN_ID_2="osmo-test-4"
# RPC_2="https://testnet-rpc.osmosis.zone:443"
RPC_2="https://osmosis-testnet-rpc.allthatnode.com:26657"

junod q ibc channel channels --node $RPC_2 --chain-id $CHAIN_ID_2 --output json