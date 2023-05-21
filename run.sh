#!/bin/bash

cd ./relayer
./open_channel.sh
./clear_packets.sh &> /dev/null &
cd ../client
npm run start
