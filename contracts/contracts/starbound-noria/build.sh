# script for building contract

DIR_NAME=$(echo ${PWD##*/})
DIR_NAME_SNAKE=$(echo $DIR_NAME | tr '-' '_')
WASM="$DIR_NAME_SNAKE.wasm"
CODEGEN_PATH="../../../client/src/common/codegen"


# generate schema
cargo schema

# fix for ts-codegen MissingPointerError
# https://github.com/CosmWasm/ts-codegen/issues/90
rm -rf ./schema/raw

# generate contract-to-client interface
cosmwasm-ts-codegen generate \
  --plugin client \
	--plugin message-composer \
  --schema ./schema \
  --out $CODEGEN_PATH \
  --name $DIR_NAME \
  --no-bundle

# TODO: remove when https://github.com/CosmWasm/ts-codegen/pull/109 will be merged
# temporary fix to not use `cosmwasm` module
for file in "../../../client/src/common/codegen/"*
do
  if [ -f "$file" ]
  then
    sed -i 's/import { MsgExecuteContractEncodeObject } from "cosmwasm";/import { MsgExecuteContractEncodeObject } from "@cosmjs\/cosmwasm-stargate";/g' "$file"
  fi
done

# build optimized binary
cd ../..
cargo cw-optimizoor

# rename wasm files
cd artifacts
for file in *-*\.wasm; do
    prefix=${file%-*}
    mv "$file" "$prefix.wasm"
done

# check if contract is ready to be uploaded to the blockchain
if [ -e $WASM ]; then
    cosmwasm-check --available-capabilities iterator,stargate,staking $WASM
fi
