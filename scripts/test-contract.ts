import { getAddrByPrefix, SigningCosmWasmClient } from "./osmo-signer";
import { coin } from "@cosmjs/stargate";
import { DENOMS, AssetSymbol } from "./osmo-pools";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { l, PREFIX, fee, SEP } from "./helpers";
import { CONTRACT_ADDRESS_TEST as CONTRACT } from "./contract_data.json";

interface ClientStruct {
  RPC: string;
  seed: string;
}

async function init(clientStruct: ClientStruct) {
  const { RPC, seed } = clientStruct;

  const signer = await DirectSecp256k1HdWallet.fromMnemonic(seed, {
    prefix: PREFIX,
  });

  const sender = (await signer.getAccounts())[0].address;

  const client = await SigningCosmWasmClient.connectWithSigner(RPC, signer);

  async function getBankBalance() {
    let res = await client.queryContractSmart(CONTRACT, {
      get_bank_balance: {},
    });
    l("\n", res, "\n");
  }

  async function swap() {
    const res = await client.execute(
      sender,
      CONTRACT,
      {
        swap_tokens: {},
      },
      fee
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function transfer(tokenAmount: number) {
    const receiver = getAddrByPrefix(sender, "wasm");

    l({ sender, receiver });

    const tokenSymbol: AssetSymbol = "OSMO";

    const res = await client.execute(
      sender,
      CONTRACT,
      {
        transfer: {
          receiver_addr: receiver,
          channel_id: "channel-0",
          token_amount: tokenAmount,
          token_symbol: tokenSymbol,
        },
      },
      fee
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function deposit(tokenAmount: number) {
    const res = await client.execute(
      sender,
      CONTRACT,
      { deposit: {} },
      fee,
      "",
      [coin(tokenAmount, DENOMS.OSMO)]
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  return { getBankBalance, deposit, transfer, swap };
}

async function main() {
  const { getBankBalance, deposit, transfer, swap } = await init({
    RPC: "http://localhost:26653/",
    seed: "harsh adult scrub stadium solution impulse company agree tomorrow poem dirt innocent coyote slight nice digital scissors cool pact person item moon double wagon",
  });

  await getBankBalance();

  try {
    l(SEP, "depositing...");
    await deposit(10_000);
    await getBankBalance();
  } catch (error) {
    l(error, "\n");
  }

  try {
    l(SEP, "sending ibc transfer...");
    await transfer(1_000);
    await getBankBalance();
  } catch (error) {
    l(error, "\n");
  }

  try {
    l(SEP, "executing swap...");
    await swap();
    await getBankBalance();
  } catch (error) {
    l(error, "\n");
  }
}

main();
