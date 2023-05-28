DIR_NAME=$(echo ${PWD##*/})

ts-node ../../../client/src/backend/services/store-contract.ts $DIR_NAME
