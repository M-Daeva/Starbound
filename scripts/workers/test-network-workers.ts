import { l, SEP } from "../utils";
import { ClientStruct } from "../clients";
import { getCwHelpers } from "../helpers/cw-helpers";
import { DENOMS } from "../osmo-pools";
import { getSgHelpers, DelegationStruct } from "../helpers/sg-helpers";
import {
  CONTRACT_ADDRESS,
  PREFIX,
  RPC,
  SEED_ALICE,
  SEED_DAPP,
} from "../config/test-network-config.json";

const aliceClientStruct: ClientStruct = {
  prefix: PREFIX,
  RPC,
  seed: SEED_ALICE,
};
const dappClientStruct: ClientStruct = { prefix: PREFIX, RPC, seed: SEED_DAPP };

async function init() {
  const { owner: aliceAddr, _cwDeposit } = await getCwHelpers(
    aliceClientStruct,
    CONTRACT_ADDRESS
  );

  const { owner: dappAddr, _cwSwap } = await getCwHelpers(
    dappClientStruct,
    CONTRACT_ADDRESS
  );

  const { _sgGrantStakeAuth } = await getSgHelpers(aliceClientStruct);

  const { _sgDelegateFrom, _sgGetTokenBalances } = await getSgHelpers(
    dappClientStruct
  );

  async function _queryBalance() {
    let balances = await _sgGetTokenBalances(CONTRACT_ADDRESS);
    l({ contract: balances });
  }

  async function cwDeposit() {
    l(SEP, "depositing...");
    try {
      await _cwDeposit(10_000);
      await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  const grantStakeStruct: DelegationStruct = {
    targetAddr: dappAddr,
    tokenAmount: 5_000,
    tokenDenom: DENOMS.OSMO,
    validatorAddr: "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96",
  };

  async function sgGrantStakeAuth() {
    l(SEP, "granting staking permission...");
    try {
      const tx = await _sgGrantStakeAuth(grantStakeStruct);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  async function cwSwap() {
    l(SEP, "executing swap...");
    try {
      await _cwSwap();
      await _queryBalance();
    } catch (error) {
      l(error, "\n");
    }
  }

  const stakeFromStruct: DelegationStruct = {
    targetAddr: aliceAddr,
    tokenAmount: 1_000,
    tokenDenom: DENOMS.OSMO,
    validatorAddr: "osmovaloper1c584m4lq25h83yp6ag8hh4htjr92d954kphp96",
  };

  async function sgDelegateFrom() {
    l(SEP, "delegating from...");
    try {
      const tx = await _sgDelegateFrom(stakeFromStruct);
      l(tx, "\n");
    } catch (error) {
      l(error, "\n");
    }
  }

  return {
    _queryBalance,
    cwDeposit,
    sgGrantStakeAuth,
    cwSwap,
    sgDelegateFrom,
  };
}

export { init };
