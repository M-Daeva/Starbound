## Creating a new repo from template

```sh
cargo generate --git https://github.com/M-Daeva/cw-boilerplate.git --name PROJECT_NAME
```

## Updating permissions, installing modules, copying wallets

```sh
cd scripts
npm run init
```

## Linting project

```sh
cargo lint
```

## Generating schemas

```sh
cargo schema
```

## Building optimized binary and store to testnet

```sh
./testnet.sh
```