#[cfg(not(feature = "library"))]
use cosmwasm_std::{
    coin, Addr, BankMsg, CosmosMsg, Decimal, DepsMut, Env, IbcMsg, IbcTimeout, IbcTimeoutBlock,
    MessageInfo, Order, Response,
};

use osmosis_std::types::{
    cosmos::base::v1beta1::Coin as PoolCoin,
    osmosis::gamm::v1beta1::{MsgSwapExactAmountIn, SwapAmountInRoute},
};
use std::ops::Mul;

use crate::{
    actions::{
        rebalancer::{dec_to_u128, rebalance_controlled, rebalance_proportional, u128_to_dec},
        vectors::{vec_div, vec_mul},
    },
    error::ContractError,
    state::{Asset, Pool, PoolExtracted, TransferParams, User, UserExtracted, POOLS, STATE, USERS},
};

pub fn deposit(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    user: User,
) -> Result<Response, ContractError> {
    // check funds
    // temporary replacement for tests - there is no USDC so we used EEUR
    let denom_token_in = "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
    let funds_amount = match &info.funds.iter().find(|&x| x.denom == denom_token_in) {
        Some(x) => x.amount.u128(),
        None => {
            return Err(ContractError::FundsAreNotFound {});
        }
    };

    if funds_amount != (user.deposited_on_current_period + user.deposited_on_next_period) {
        return Err(ContractError::FundsAreNotEqual {});
    }

    // check if sum of weights is equal one
    let weight_sum = user
        .asset_list
        .iter()
        .fold(Decimal::zero(), |acc, cur| acc + cur.weight);

    if weight_sum.ne(&Decimal::one()) {
        return Err(ContractError::WeightsAreUnbalanced {});
    }

    // check if asset_list contains unique denoms
    let mut list = user
        .asset_list
        .iter()
        .map(|x| x.asset_denom.clone())
        .collect::<Vec<String>>();

    list.sort();
    list.dedup();

    if list.len() != user.asset_list.len() {
        return Err(ContractError::DuplicatedAssets {});
    }

    // check if user exists or create new
    let mut user_updated = match USERS.load(deps.storage, &info.sender) {
        Ok(x) => x,
        _ => User::default(),
    };

    user_updated.is_controlled_rebalancing = user.is_controlled_rebalancing;
    user_updated.deposited_on_current_period += user.deposited_on_current_period;
    user_updated.deposited_on_next_period += user.deposited_on_next_period;
    user_updated.day_counter = user.day_counter;

    // update asset list
    let mut asset_list_updated = Vec::<Asset>::new();

    for asset in user.asset_list {
        // check if asset exists in pool list
        if POOLS.load(deps.storage, &asset.asset_denom).is_err() {
            return Err(ContractError::AssetIsNotFound {});
        };

        // CAN NOT VALIDATE ADDRESSES FROM OTHER NETWORKS
        // https://testnet.mintscan.io/osmosis-testnet/txs/44709BCDFFAC51C1AB1245FB7AF31D14B3607357E18A57A569BD82E66DB12F06
        // validate wallet address
        //let wallet_address = deps.api.addr_validate(asset.wallet_address.as_str())?;
        let wallet_address = Addr::unchecked(&asset.wallet_address);

        // parse Decimal to ensure proper type convertion
        let weight = asset.weight.to_string().parse::<Decimal>()?;

        // search same denom and address asset
        let asset_updated = match user_updated.asset_list.iter().find(|&x| {
            (x.asset_denom == asset.asset_denom) && (x.wallet_address == asset.wallet_address)
        }) {
            // update weight if it is found
            Some(y) => Asset::new(
                &y.asset_denom,
                &y.wallet_address,
                y.wallet_balance,
                weight,
                y.amount_to_send_until_next_epoch,
            ),
            // add new if it is not found
            None => Asset::new(
                asset.asset_denom.as_str(),
                &wallet_address,
                asset.wallet_balance,
                weight,
                0,
            ),
        };

        asset_list_updated.push(asset_updated);
    }

    user_updated.asset_list = asset_list_updated;

    // update user storage
    USERS.save(deps.storage, &info.sender, &user_updated)?;

    Ok(Response::new().add_attributes(vec![
        ("method", "deposit"),
        ("user_address", info.sender.as_str()),
        (
            "user_deposited_on_current_period",
            &user.deposited_on_current_period.to_string(),
        ),
        (
            "user_deposited_on_next_period",
            &user.deposited_on_next_period.to_string(),
        ),
    ]))
}

pub fn withdraw(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    amount: u128,
) -> Result<Response, ContractError> {
    // check funds
    // temporary replacement for tests - there is no USDC so we used EEUR
    let denom_token_out = "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";

    let mut user = match USERS.load(deps.storage, &info.sender) {
        Ok(user) => user,
        _ => {
            return Err(ContractError::UserIsNotFound {});
        }
    };

    // check withdraw amount
    if amount > user.deposited_on_next_period + user.deposited_on_current_period {
        return Err(ContractError::WithdrawAmountIsExceeded {});
    }

    // subtract from deposited_on_next_period first
    if amount > user.deposited_on_next_period {
        user.deposited_on_current_period -= amount - user.deposited_on_next_period;
        user.deposited_on_next_period = 0;
    } else {
        user.deposited_on_next_period -= amount;
    }

    let msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: info.sender.to_string(),
        amount: vec![coin(amount, denom_token_out)],
    });

    USERS.save(deps.storage, &info.sender, &user)?;

    Ok(Response::new().add_message(msg).add_attributes(vec![
        ("method", "withdraw"),
        ("user_address", info.sender.as_str()),
        (
            "user_deposited_on_current_period",
            &user.deposited_on_current_period.to_string(),
        ),
        (
            "user_deposited_on_next_period",
            &user.deposited_on_next_period.to_string(),
        ),
    ]))
}

pub fn update_scheduler(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    address: String,
) -> Result<Response, ContractError> {
    let mut state = STATE.load(deps.storage)?;

    if info.sender != state.admin {
        return Err(ContractError::Unauthorized {});
    }

    state.scheduler = deps.api.addr_validate(&address)?;

    STATE.save(deps.storage, &state)?;

    Ok(Response::new().add_attributes(vec![
        ("method", "update_scheduler"),
        ("scheduler", &address),
    ]))
}

pub fn update_pools_and_users(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    pools: Vec<PoolExtracted>,
    users: Vec<UserExtracted>,
) -> Result<Response, ContractError> {
    // check if sender is scheduler
    let state = STATE.load(deps.storage)?;

    if info.sender != state.admin || info.sender != state.scheduler {
        return Err(ContractError::Unauthorized {});
    }

    // 1) update pools info
    for pool_received in pools {
        // parse Decimal to ensure proper type convertion
        let price = pool_received.price.to_string().parse::<Decimal>()?;

        if POOLS
            .save(
                deps.storage,
                &pool_received.denom,
                &Pool {
                    id: pool_received.id,
                    price,
                    channel_id: pool_received.channel_id,
                    port_id: pool_received.port_id,
                    symbol: pool_received.symbol,
                },
            )
            .is_err()
        {
            return Err(ContractError::PoolIsNotUpdated {});
        };
    }

    // 2) update users info
    for user_received in users {
        // validate address
        let osmo_address_received = deps.api.addr_validate(&user_received.osmo_address)?;

        // get user from storage by address
        let mut user = match USERS.load(deps.storage, &osmo_address_received) {
            Ok(x) => x,
            _ => {
                return Err(ContractError::UserIsNotFound {});
            }
        };

        // update user assets
        let mut asset_list_updated = Vec::<Asset>::new();

        for asset in user.asset_list {
            // search same denom and address asset_received
            let asset_received = match user_received.asset_list.iter().find(|&x| {
                (x.asset_denom == asset.asset_denom) && (x.wallet_address == asset.wallet_address)
            }) {
                Some(y) => y,
                None => {
                    return Err(ContractError::AssetIsNotFound {});
                }
            };

            let asset_updated = Asset::new(
                &asset.asset_denom,
                &asset.wallet_address,
                asset_received.wallet_balance,
                asset.weight,
                asset.amount_to_send_until_next_epoch,
            );

            asset_list_updated.push(asset_updated);
        }

        user.asset_list = asset_list_updated;

        USERS.save(deps.storage, &osmo_address_received, &user)?;
    }

    Ok(Response::new().add_attributes(vec![("method", "update_pools_and_users")]))
}

pub fn swap(deps: DepsMut, env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    let state = STATE.load(deps.storage)?;

    if info.sender != state.admin || info.sender != state.scheduler {
        return Err(ContractError::Unauthorized {});
    }

    // 3) calculate payments
    let global_vec_len = POOLS
        .range(deps.storage, None, None, Order::Ascending)
        .count();

    // global_delta_balance_list - vector of global asset to buy
    let mut global_delta_balance_list: Vec<u128> = vec![0; global_vec_len];

    // global_delta_cost_list- vector of global payments in $ to buy assets
    let mut global_delta_cost_list: Vec<u128> = vec![0; global_vec_len];

    // for sorting purposes
    let mut global_denom_list = Vec::<String>::new();

    // global_price_list - vector of global asset prices sorted by denom (ascending order)
    let global_price_list: Vec<Decimal> = POOLS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| {
            let (denom, pool) = x.unwrap();
            global_denom_list.push(denom);
            pool.price
        })
        .collect();

    let mut user_list_updated = Vec::<(Addr, User)>::new();

    USERS
        .range(deps.storage, None, None, Order::Ascending)
        .for_each(|x| {
            let (osmo_address, user) = x.unwrap();

            // user_payment - funds to buy coins
            let mut user_payment = if user.day_counter == 0 {
                0
            } else {
                user.deposited_on_current_period / user.day_counter
            };

            // query user from storage and update parameters
            let mut user_updated = USERS.load(deps.storage, &osmo_address).unwrap();

            if user.day_counter != 0 {
                user_updated.day_counter -= 1;
                if user_updated.deposited_on_current_period < user_payment {
                    user_payment = user_updated.deposited_on_current_period;
                }
                user_updated.deposited_on_current_period -= user_payment;
            } else {
                user_updated.day_counter = 30;
                user_updated.deposited_on_current_period = user.deposited_on_next_period;
                user_updated.deposited_on_next_period = 0;
            }

            // user_weights - vector of target asset ratios
            let mut user_weights = Vec::<Decimal>::new();

            // user_balances - vector of user asset balances
            let mut user_balances = Vec::<u128>::new();

            // user_prices - vector of user asset prices
            let mut user_prices = Vec::<Decimal>::new();

            for user_asset in &user.asset_list {
                let pool = POOLS.load(deps.storage, &user_asset.asset_denom).unwrap();

                user_weights.push(user_asset.weight);
                user_balances.push(user_asset.wallet_balance);
                user_prices.push(pool.price);
            }

            // user_costs - vector of user asset costs in $
            let user_costs = vec_mul(&user_balances, &user_prices);

            // user_delta_costs - vector of user payments in $ to buy assets
            let user_delta_costs = if user.is_controlled_rebalancing {
                rebalance_controlled(&user_costs, &user_weights, user_payment).unwrap()
            } else {
                rebalance_proportional(&user_weights, user_payment)
            };

            // user_delta_costs - vector of user assets to buy
            let user_delta_balances = vec_div(&user_delta_costs, &user_prices);

            // update user data about assets that will be bought
            for (i, &item) in user_delta_balances.iter().enumerate() {
                user_updated.asset_list[i].amount_to_send_until_next_epoch = item;
            }

            // save updated user in separate vector
            // to prevent iterated vector mutation or storage moving
            user_list_updated.push((osmo_address, user_updated.clone()));

            // fill global_delta_balance_list
            for (i, global_denom) in global_denom_list.clone().iter().enumerate() {
                let balance_by_denom = match &user_updated
                    .asset_list
                    .iter()
                    .find(|x| &x.asset_denom == global_denom)
                {
                    Some(y) => y.amount_to_send_until_next_epoch,
                    None => 0,
                };
                global_delta_balance_list[i] += balance_by_denom;

                // fill global_delta_cost_list
                for (j, user_asset) in user.asset_list.iter().enumerate() {
                    if &user_asset.asset_denom == global_denom {
                        global_delta_cost_list[i] += user_delta_costs[j];
                    }
                }
            }
        });

    let mut msg_list = Vec::<CosmosMsg>::new();

    // TODO: replace eeur with usdc on mainnet
    let denom_token_in = "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";

    for (i, global_denom) in global_denom_list.iter().enumerate() {
        // skip eeur
        if global_denom == denom_token_in {
            continue;
        }

        let token_out_min_amount = String::from("1");
        let amount = global_delta_cost_list[i];

        // skip if no funds
        if amount == 0 {
            continue;
        }

        let pool = POOLS.load(deps.storage, global_denom)?;

        // swap eeur to osmo anyway
        let mut routes: Vec<SwapAmountInRoute> = vec![SwapAmountInRoute {
            pool_id: 481,
            token_out_denom: "uosmo".to_string(),
        }];

        // if other asset is needed add extra route
        if global_denom != "uosmo" {
            routes.push(SwapAmountInRoute {
                pool_id: pool.id.try_into().unwrap(),
                token_out_denom: global_denom.to_string(),
            });
        }

        let msg = MsgSwapExactAmountIn {
            sender: env.contract.address.to_string(),
            routes,
            token_in: Some(PoolCoin {
                amount: amount.to_string(),
                denom: denom_token_in.to_string(),
            }),
            token_out_min_amount,
        };

        msg_list.push(msg.into());
    }

    // update user list storage
    for (address, user_updated) in user_list_updated {
        USERS.save(deps.storage, &address, &user_updated)?;
    }

    // update bank
    STATE.update(deps.storage, |mut x| -> Result<_, ContractError> {
        x.global_delta_balance_list = global_delta_balance_list;
        x.global_delta_cost_list = global_delta_cost_list;
        x.global_denom_list = global_denom_list;
        x.global_price_list = global_price_list;
        Ok(x)
    })?;

    Ok(Response::new()
        .add_messages(msg_list)
        .add_attributes(vec![("method", "swap")]))
}

pub fn transfer(deps: DepsMut, env: Env, info: MessageInfo) -> Result<Response, ContractError> {
    let state = STATE.load(deps.storage)?;

    if info.sender != state.admin || info.sender != state.scheduler {
        return Err(ContractError::Unauthorized {});
    }

    // get contract balances
    let mut contract_balances = deps.querier.query_all_balances(env.contract.address)?;
    let state = STATE.load(deps.storage)?;
    let global_vec_len = state.global_denom_list.len();

    // vector of coins amount on contract address for all denoms
    let mut contract_assets: Vec<u128> = vec![0; global_vec_len];

    // vector of coins planned to send on all users adresses for all denoms
    let mut users_assets: Vec<u128> = vec![0; global_vec_len];

    // vector of correction ratios for users coins planned to send
    let mut correction_ratios: Vec<Decimal> = vec![];

    let mut user_list_updated: Vec<(Addr, User)> = USERS
        .range(deps.storage, None, None, Order::Ascending)
        .map(|x| x.unwrap())
        .collect();

    // update contract_assets
    for (i, global_denom) in state.global_denom_list.iter().enumerate() {
        let balance_by_denom = match &contract_balances.iter().find(|x| &x.denom == global_denom) {
            Some(y) => y.amount.u128(),
            None => 0,
        };
        contract_assets[i] = balance_by_denom;

        // update users_assets
        user_list_updated.iter().for_each(|(_osmo_address, user)| {
            for user_asset in &user.asset_list {
                if &user_asset.asset_denom == global_denom {
                    users_assets[i] += user_asset.amount_to_send_until_next_epoch;
                }
            }
        });
    }

    // fill correction_ratios
    for (i, item) in contract_assets.iter().enumerate() {
        let res = if *item == 0 || users_assets[i] == 0 {
            Decimal::zero()
        } else {
            u128_to_dec(*item)
                .checked_div(u128_to_dec(users_assets[i]))
                .unwrap()
        };
        correction_ratios.push(res);
    }

    let mut msg_list = Vec::<CosmosMsg>::new();

    // correct users coins planned to send
    user_list_updated = user_list_updated
        .iter()
        .map(|(osmo_address, user)| {
            let mut user_updated = user.clone();
            let mut asset_list_updated = Vec::<Asset>::new();

            for user_asset in &user.asset_list {
                let index = state
                    .global_denom_list
                    .iter()
                    .position(|x| x == &user_asset.asset_denom)
                    .unwrap();

                let ratio = correction_ratios[index];
                let amount = u128_to_dec(user_asset.amount_to_send_until_next_epoch);
                let mut amount_to_send_until_next_epoch = dec_to_u128(amount.mul(ratio));

                // correct sendable funds
                contract_balances = contract_balances
                    .iter()
                    .map(|x| {
                        if x.denom == user_asset.asset_denom {
                            if amount_to_send_until_next_epoch > x.amount.u128() {
                                amount_to_send_until_next_epoch = x.amount.u128();

                                coin(0, x.denom.clone())
                            } else {
                                coin(
                                    x.amount.u128() - amount_to_send_until_next_epoch,
                                    x.denom.clone(),
                                )
                            }
                        } else {
                            x.to_owned()
                        }
                    })
                    .collect();

                // skip if no funds
                if amount_to_send_until_next_epoch != 0 {
                    // execute ibc transfer
                    let block = IbcTimeoutBlock {
                        revision: 5,
                        height: 2000000,
                    };
                    let pool = POOLS.load(deps.storage, &user_asset.asset_denom).unwrap();

                    let msg = CosmosMsg::Ibc(IbcMsg::Transfer {
                        channel_id: pool.channel_id,
                        to_address: user_asset.wallet_address.to_string(),
                        amount: coin(amount_to_send_until_next_epoch, &user_asset.asset_denom),
                        timeout: IbcTimeout::with_block(block),
                    });

                    msg_list.push(msg);
                }

                // fill asset_list_updated
                let mut asset_updated = user_asset.clone();

                asset_updated.amount_to_send_until_next_epoch = 0;
                asset_list_updated.push(asset_updated);
            }
            user_updated.asset_list = asset_list_updated;

            (osmo_address.to_owned(), user_updated)
        })
        .collect();

    // update user list
    for (address, user_updated) in user_list_updated {
        USERS.save(deps.storage, &address, &user_updated)?;
    }

    // update bank
    STATE.update(deps.storage, |mut x| -> Result<_, ContractError> {
        x.global_delta_balance_list = vec![];
        x.global_delta_cost_list = vec![];
        Ok(x)
    })?;

    Ok(Response::new()
        .add_messages(msg_list)
        .add_attributes(vec![("method", "transfer")]))
}

// function for debugging ibc transfers
// single and multiple message options provided
pub fn multi_transfer(
    _deps: DepsMut,
    env: Env,
    _info: MessageInfo,
    params: Vec<TransferParams>,
) -> Result<Response, ContractError> {
    let length = &params.len();

    match length {
        1 => {
            let param = &params[0];

            let msg = CosmosMsg::Ibc(IbcMsg::Transfer {
                channel_id: param.channel_id.clone(),
                to_address: param.to.clone(),
                amount: coin(param.amount, param.denom.clone()),
                timeout: env.block.time.plus_seconds(300).into(),
            });

            Ok(Response::new()
                .add_message(msg)
                .add_attributes(vec![("method", "multi_transfer")]))
        }
        _ => {
            let mut msg_list = Vec::<CosmosMsg>::new();

            for param in params {
                let msg = IbcMsg::Transfer {
                    channel_id: param.channel_id,
                    to_address: param.to,
                    amount: coin(param.amount, param.denom),
                    timeout: env.block.time.plus_seconds(300).into(),
                };

                msg_list.push(msg.into());
            }

            Ok(Response::new()
                .add_messages(msg_list)
                .add_attributes(vec![("method", "multi_transfer")]))
        }
    }
}
