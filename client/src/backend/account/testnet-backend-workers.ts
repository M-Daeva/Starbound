import { coin } from "@cosmjs/stargate";
import { getSigner } from "./signer";
import {
  Request,
  l,
  specifyTimeout as _specifyTimeout,
} from "../../common/utils";
import { getGasPriceFromChainRegistryItem } from "../../common/account/clients";
import {
  getCwExecHelpers,
  getCwQueryHelpers,
} from "../../common/account/cw-helpers";
import { getSgExecHelpers } from "../../common/account/sg-helpers";
import { _transformGrantList, getPoolList as _getPoolList } from "../helpers";
import {
  QueryPoolsAndUsersResponse,
  UserExtracted,
  PoolExtracted,
} from "../../common/codegen/StarboundOsmosis.types";
import {
  DelegationStruct,
  ChainRegistryStorage,
  BalancesResponse,
  UpdateConfigStruct,
} from "../../common/interfaces";
import {
  CONTRACT_ADDRESS,
  PREFIX,
  RPC,
} from "../../common/config/osmosis-testnet-config.json";

const req = new Request();

async function init(seed?: string) {
  const dappCwQueryHelpers = await getCwQueryHelpers(CONTRACT_ADDRESS, RPC);
  if (!dappCwQueryHelpers) return;

  const {
    cwQueryPoolsAndUsers: _cwQueryPoolsAndUsers,
    cwQueryUser: _cwQueryUser,
    cwQueryConfig: _cwQueryConfig,
  } = dappCwQueryHelpers;

  async function sgGetPoolList() {
    let pools = await _getPoolList();
    l({ pools });
  }

  async function cwQueryPoolsAndUsers() {
    try {
      return await _cwQueryPoolsAndUsers();
    } catch (error) {
      l(error, "\n");
      let empty: QueryPoolsAndUsersResponse = { pools: [], users: [] };
      return empty;
    }
  }

  async function cwQueryUser(addr: string) {
    try {
      await _cwQueryUser(addr);
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwQueryConfig() {
    try {
      return await _cwQueryConfig();
    } catch (error) {
      l(error, "\n");
    }
  }

  if (!seed) {
    return {
      sgGetPoolList,
      cwQueryPoolsAndUsers,
      cwQueryUser,
      cwQueryConfig,
    };
  }

  const { signer, owner } = await getSigner(RPC, PREFIX, seed);

  // dapp cosmwasm helpers
  const dappCwExecHelpers = await getCwExecHelpers(
    CONTRACT_ADDRESS,
    RPC,
    owner,
    signer
  );
  if (!dappCwExecHelpers) return;

  const {
    cwSwap: _cwSwap,
    cwUpdatePoolsAndUsers: _cwUpdatePoolsAndUsers,
    cwTransfer: _cwTransfer,
    cwUpdateConfig: _cwUpdateConfig,
  } = dappCwExecHelpers;

  // dapp stargate helpers
  const dappSgExecHelpers = await getSgExecHelpers(RPC, owner, signer);
  if (!dappSgExecHelpers) return;

  const { sgSend: _sgSend } = dappSgExecHelpers;

  async function sgDelegateFromAll(
    denomGranterValoperList: [string, [string, string][]][],
    chainRegistryResponse: ChainRegistryStorage | undefined,
    chainType: "main" | "test",
    threshold: number = 10_000
  ) {
    if (!chainRegistryResponse) return;

    for (let [denom, granterValoperList] of denomGranterValoperList) {
      if (denom === "ujuno" && chainType === "test") denom = "ujunox";

      const chain = chainRegistryResponse.find(
        (item) => item.denomNative === denom
      );
      if (!chain) continue;

      let rest: string | undefined;
      let rpc: string | undefined;

      if (chainType === "main" && chain.main) {
        rest = chain.main?.apis?.rest?.[0]?.address;
        rpc = chain.main?.apis?.rpc?.[0]?.address;
      }
      if (chainType === "test" && chain.test) {
        rest = chain.test?.apis?.rest?.[0]?.address;
        rpc = chain.test?.apis?.rpc?.[0]?.address;
      }
      if (!rest || !rpc) continue;

      const gasPrice = getGasPriceFromChainRegistryItem(chain, chainType);

      const { signer, owner } = await getSigner(
        rpc,
        chain.prefix,
        seed as string
      );
      const dappSgExecHelpers = await getSgExecHelpers(rpc, owner, signer);
      if (!dappSgExecHelpers) return;

      const { sgDelegateFromList: _sgDelegateFromList } = dappSgExecHelpers;

      let delegationStructList: DelegationStruct[] = [];

      for (let [granter, valoper] of granterValoperList) {
        const urlHolded = `${rest}/cosmos/bank/v1beta1/balances/${granter}`;

        try {
          const balHolded: BalancesResponse = await _specifyTimeout(
            req.get(urlHolded),
            10_000
          );
          const balance = balHolded.balances.find(
            (item) => item.denom === denom
          );
          const amount = +(balance?.amount || "0");

          // skip delegation if amount <= threshold
          //if (amount <= threshold) return;

          const delegationStruct: DelegationStruct = {
            targetAddr: granter,
            //tokenAmount: amount - threshold,
            tokenAmount: 1,
            tokenDenom: denom,
            validatorAddr: valoper,
          };

          delegationStructList.push(delegationStruct);
        } catch (error) {
          l(error);
        }
      }

      try {
        const tx = await _specifyTimeout(
          _sgDelegateFromList(delegationStructList, gasPrice),
          10_000
        );

        l(tx);
      } catch (error) {
        l(error);
      }
    }
  }

  async function cwUpdatePoolsAndUsers(
    pools: PoolExtracted[],
    users: UserExtracted[],
    gasPrice: string
  ) {
    l("cwUpdatePoolsAndUsers");
    try {
      const res = await _cwUpdatePoolsAndUsers(pools, users, gasPrice);
      l(res.rawLog);
    } catch (error) {
      l(error);
    }
  }

  async function cwSwap(gasPrice: string) {
    l("cwSwap");
    try {
      await _cwSwap(gasPrice);
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwTransfer(gasPrice: string) {
    l("cwTransfer");
    try {
      await _cwTransfer(gasPrice);
    } catch (error) {
      l(error, "\n");
    }
  }

  async function sgSend() {
    try {
      const tx = await _sgSend(CONTRACT_ADDRESS, coin(500, "uosmo"));
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwUpdateConfig(
    updateConfigStruct: UpdateConfigStruct,
    gasPrice: string
  ) {
    try {
      return await _cwUpdateConfig(updateConfigStruct, gasPrice);
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    owner,

    cwSwap,
    sgGetPoolList,
    cwQueryPoolsAndUsers,
    cwQueryUser,
    cwTransfer,
    cwUpdatePoolsAndUsers,
    sgSend,
    sgDelegateFromAll,
    cwQueryConfig,
    cwUpdateConfig,
  };
}

export { init };
