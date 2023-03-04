#!/bin/bash

cd ./client
node ./dist/backend/services/decrypt-sertificate.js $1
cd ../relayer
./open_channel.sh
cd ../client
npm run start &> /dev/null &
cd ../relayer
./clear_packets.sh
