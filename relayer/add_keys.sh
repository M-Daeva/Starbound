#!/bin/bash

# Allows starting hermes from root dir of the project
# cd "$(dirname "$0")"
FOLDER="$(dirname "$0")"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -c|--config) config="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# Verify we got the docker, either wasmd or osmosis
if [ -z "$config" ]; then config="config.toml"; fi

HERMES="hermes --config $FOLDER/$config"

# First, lets make sure our chains are running and are healthy.
# Exit if theres an error.
{ 
    set -e 
    $HERMES health-check || echo "Chains are not healthy! don't forget to run them"
    $HERMES config validate || echo "Something is wrong with the config!"
}

# Then we need to create the keys for our chains, please note that the key-names ARE IMPORTANT!
# Because in hermes config, we set who is the payer wallet by the name of the key.

# Create key in hermes for theta-testnet-001 chain with the name relayer1
$HERMES keys add --chain theta-testnet-001 --key-name relayer1 --mnemonic-file $FOLDER/relayer-mnemonic || true

# Create key in hermes for osmo-test-4 chain with the name relayer2
$HERMES keys add --chain osmo-test-4 --key-name relayer2 --mnemonic-file $FOLDER/relayer-mnemonic || true
