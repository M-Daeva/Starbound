# 1.2 GB
FROM rust:1.67.1-slim

WORKDIR /app
COPY *.toml *.json relayer-mnemonic add_keys.sh clear_packets.sh ./

RUN apt-get update && apt-get -y install jq
RUN cargo install ibc-relayer-cli --bin hermes --locked
RUN ./add_keys.sh
