cd ./relayer
./open_channel.sh
cd ../client
npm run start &> /dev/null &
cd ../relayer
./clear_packets.sh
