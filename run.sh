#!/bin/bash

cd ./relayer
./open_channel.sh
./clear_packets.sh &> /dev/null &
cd ../client
npm run start

# cd ./relayer
# ./open_channel.sh
# cd ../client
# npm run start &> /dev/null &
# cd ../relayer
# ./clear_packets.sh
