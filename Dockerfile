FROM rust:1.67.1-slim

WORKDIR /app
COPY run.sh ./
COPY client/dist ./client/dist
COPY client/package*.json client/config.env ./client/
RUN sed -i "s/IS_PRODUCTION=false/IS_PRODUCTION=true/" ./client/config.env
COPY relayer/*.toml relayer/*.json relayer/relayer-mnemonic relayer/add_keys.sh \
     relayer/open_channel.sh relayer/clear_packets.sh ./relayer/

RUN apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update && \
  apt-get install -y curl jq nodejs npm

RUN npm install -g n
RUN n lts

RUN cd ./client && npm install && cd ../

RUN cargo install ibc-relayer-cli --bin hermes --locked
RUN cd ./relayer && ./add_keys.sh && cd ../

EXPOSE 4000

ENTRYPOINT ["./run.sh"]
