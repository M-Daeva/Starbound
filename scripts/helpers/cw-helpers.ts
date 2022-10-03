import { coin } from "@cosmjs/stargate";
import { DENOMS, AssetSymbol } from "../osmo-pools";
import { l } from "../utils";
import { ClientStruct, getCwClient, getAddrByPrefix, fee } from "../clients";

async function getCwHelpers(
  clientStruct: ClientStruct,
  contractAddress: string
): Promise<{
  owner: string;
  _cwGetBankBalance: () => Promise<void>;
  _cwDeposit: (tokenAmount: number) => Promise<void>;
  _cwTransfer: (tokenAmount: number) => Promise<void>;
  _cwSwap: () => Promise<any>;
}> {
  const { client, owner } = await getCwClient(clientStruct);

  async function _cwGetBankBalance() {
    let res = await client.queryContractSmart(contractAddress, {
      get_bank_balance: {},
    });
    l("\n", res, "\n");
  }

  async function _cwSwap() {
    const res = await client.execute(
      owner,
      contractAddress,
      {
        swap_tokens: {},
      },
      fee
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function _cwTransfer(tokenAmount: number) {
    const receiver = getAddrByPrefix(owner, "wasm");

    l({ sender: owner, receiver });

    const tokenSymbol: AssetSymbol = "OSMO";

    const res = await client.execute(
      owner,
      contractAddress,
      {
        transfer: {
          receiver_addr: receiver,
          channel_id: "channel-0",
          token_amount: `${tokenAmount}`,
          token_symbol: tokenSymbol,
        },
      },
      fee
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  async function _cwDeposit(tokenAmount: number) {
    const res = await client.execute(
      owner,
      contractAddress,
      { deposit: {} },
      fee,
      "",
      [coin(tokenAmount, DENOMS.OSMO)]
    );
    l({ attributes: res.logs[0].events[2].attributes }, "\n");
  }

  return { owner, _cwGetBankBalance, _cwDeposit, _cwTransfer, _cwSwap };
}

export { getCwHelpers };
