use cosmwasm_std::{
    coin, Addr, BankMsg, Coin, CosmosMsg, Decimal, Decimal256, IbcMsg, IbcTimeout, Timestamp,
    Uint128,
};

use std::{
    ops::{Div, Mul},
    str::FromStr,
};

use crate::state::{Asset, Ledger, User};

pub const P6: u128 = 1_000_000; // 1 asset with 6 decimals
pub const P12: u128 = P6.pow(2); // 1_000_000 of assets with 6 decimals
pub const P18: u128 = P6 * P12; // 1 of asset with 18 decimals
pub const P24: u128 = P12.pow(2); // 1_000_000 of assets with 18 decimals

pub fn str_to_dec(s: &str) -> Decimal {
    Decimal::from_str(s).unwrap()
}

pub fn u128_to_dec<T>(num: T) -> Decimal
where
    Uint128: From<T>,
{
    Decimal::from_ratio(Uint128::from(num), Uint128::one())
}

pub fn dec_to_u128(dec: Decimal) -> u128 {
    dec.to_uint_ceil().u128()
}

pub fn dec_to_uint128(dec: Decimal) -> Uint128 {
    dec.to_uint_ceil()
}

pub fn u128_to_dec256<T>(num: T) -> Decimal256
where
    Uint128: From<T>,
{
    Decimal256::from_ratio(Uint128::from(num), Uint128::one())
}

pub fn dec_to_dec256(dec: Decimal) -> Decimal256 {
    Decimal256::from_str(&dec.to_string()).unwrap()
}

pub fn dec256_to_dec(dec256: Decimal256) -> Decimal {
    str_to_dec(
        &dec256
            .to_string()
            .chars()
            .take(Decimal::DECIMAL_PLACES as usize)
            .collect::<String>(),
    )
}

pub fn dec256_to_u128(dec256: Decimal256) -> u128 {
    Uint128::try_from(dec256.to_uint_ceil()).unwrap().u128()
}

pub fn str_vec_to_dec_vec(str_vec: &[&str]) -> Vec<Decimal> {
    str_vec.iter().map(|&x| str_to_dec(x)).collect()
}

pub fn u128_vec_to_uint128_vec(u128_vec: &[u128]) -> Vec<Uint128> {
    u128_vec
        .iter()
        .map(|&x| Uint128::from(x))
        .collect::<Vec<Uint128>>()
}

pub fn perm_vec_to_dec_vec(perm_vec: Vec<u128>) -> Vec<Decimal> {
    perm_vec
        .iter()
        .map(|&x| Decimal::from_ratio(Uint128::new(x), Uint128::new(1_000)))
        .collect()
}

// mul vector by vector and rounds values down or up depending on is_floored
pub fn vec_mul(uint128_vec: &[Uint128], dec_vec: &[Decimal], is_floored: bool) -> Vec<Uint128> {
    let mut temp = Vec::<Uint128>::new();

    for (i, item) in uint128_vec.iter().enumerate() {
        let mut res = dec_vec[i].mul(u128_to_dec(*item));
        res = if is_floored { res.floor() } else { res.ceil() };
        temp.push(dec_to_uint128(res));
    }

    temp
}

// div vector by vector and rounds values down or up depending on is_floored
pub fn vec_div(uint128_vec: &[Uint128], dec_vec: &[Decimal], is_floored: bool) -> Vec<Uint128> {
    let mut temp = Vec::<Uint128>::new();

    for (i, item) in uint128_vec.iter().enumerate() {
        let mut res = u128_to_dec(*item).div(dec_vec[i]);
        res = if is_floored { res.floor() } else { res.ceil() };
        temp.push(dec_to_uint128(res));
    }

    temp
}

pub fn vec_add(a: &[Uint128], b: &[Uint128]) -> Vec<Uint128> {
    let mut temp = Vec::<Uint128>::new();

    for (i, item) in a.iter().enumerate() {
        let res = *item + b[i];
        temp.push(res);
    }

    temp
}

pub fn vec_sub(a: &[Uint128], b: &[Uint128]) -> Vec<Uint128> {
    let mut temp = Vec::<Uint128>::new();

    for (i, item) in a.iter().enumerate() {
        let res = *item - b[i];
        temp.push(res);
    }

    temp
}

/// transforms r = [a + e1, b + e2] -> [a, b], where sum([a, b]) == d, e1/d -> 0, e2/d -> 0 \
/// increasing/decreasing maximums of r
pub fn correct_sum(r: &[Uint128], d: Uint128) -> Vec<Uint128> {
    let r_sum = r.iter().sum::<Uint128>();
    if r_sum == d {
        return r.to_vec();
    }

    let r_max = *r.iter().max().unwrap();
    let r_max_amount = r.iter().filter(|x| x == &r_max).count();

    let r_is_greater = r_sum > d;
    let mut offset = if r_is_greater { r_sum - d } else { d - r_sum };
    let mut offset_list: Vec<Uint128> = vec![Uint128::zero(); r_max_amount];
    let mut i = 0;
    while !offset.is_zero() {
        offset_list[i] += Uint128::one();
        i = if i < r_max_amount - 1 { i + 1 } else { 0 };
        offset -= Uint128::one();
    }
    let mut j = 0;

    r.iter()
        .map(|&x| {
            if x == r_max {
                let offset = offset_list[j];
                j += 1;
                if r_is_greater {
                    x - offset
                } else {
                    x + offset
                }
            } else {
                x
            }
        })
        .collect::<Vec<Uint128>>()
}

/// x1 - vector of current asset costs \
/// k2 - vector of target asset ratios \
/// d - funds to buy coins \
/// r - vector of coins to buy costs
pub fn rebalance_controlled(x1: &[Uint128], k2: &[Decimal], d: Uint128) -> Vec<Uint128> {
    let mut r: Vec<Uint128> = vec![];
    let d = u128_to_dec(d);
    let s1 = u128_to_dec(x1.iter().sum::<Uint128>());

    // we need to find minimal s2 where s2 = x1/k2 and s2 >= s1
    let mut s2 = Decimal::zero();

    for (i, &k2_item) in k2.iter().enumerate() {
        // skip division by zero
        if !k2_item.is_zero() {
            let s2_item = u128_to_dec(x1[i]) / k2_item;
            // always update initial value of s2 if s2_item >= s1
            if s2_item >= s1 && (s2.is_zero() || (!s2.is_zero() && s2_item < s2)) {
                s2 = s2_item;
            }
        }
    }

    let ds = s2 - s1;

    if d > ds && !ds.is_zero() {
        // case 1: if d > s2 - s1 && s2 > s1 then r = (s1 + d) * k2 - x1
        for (i, &k2_item) in k2.iter().enumerate() {
            let x1_item = u128_to_dec(x1[i]);

            r.push(dec_to_uint128((s1 + d) * k2_item - x1_item));
        }
    } else if ds.is_zero() {
        // case 2: else if s2 == s1 then r = d * k2
        r = k2
            .iter()
            .map(|&k2_item| dec_to_uint128(d * k2_item))
            .collect();
    } else {
        // case 3: else r = (s2 * k2 - x1) * d / (s2 - s1)
        for (i, &k2_item) in k2.iter().enumerate() {
            let x1_item = u128_to_dec(x1[i]);

            // preventing calculation error with ceil
            r.push(dec_to_uint128(
                ((s2 * k2_item).ceil() - x1_item) * d / (s2 - s1),
            ));
        }
    }

    // rounding error correction
    correct_sum(&r, dec_to_uint128(d))
}

/// k2 - vector of target asset ratios \
/// d - funds to buy coins \
/// r - vector of coins to buy costs
pub fn rebalance_proportional(k2: &[Decimal], d: Uint128) -> Vec<Uint128> {
    let r: Vec<Uint128> = k2
        .iter()
        .map(|k2_item| dec_to_uint128(k2_item.mul(u128_to_dec(d))))
        .collect();

    // rounding error correction
    correct_sum(&r, d)
}

/// pools_with_denoms - POOLS.range().map().collect() \
/// users_with_addresses - USERS.range().map().collect()
pub fn get_ledger(
    asset_data_list: &Vec<(terraswap::asset::AssetInfo, Decimal, u8)>, // list of (asset_info, price, decimals)
    users_with_addresses: &Vec<(Addr, User)>,
    balances_with_addresses: &Vec<(Addr, Vec<(terraswap::asset::AssetInfo, Uint128)>)>,
) -> (Ledger, Vec<(Addr, User)>) {
    let global_vec_len = asset_data_list.len();

    // for sorting
    let mut global_denom_list: Vec<terraswap::asset::AssetInfo> = vec![];

    // global_price_list - vector of global asset prices sorted by denom (ascending order)
    let mut global_price_list: Vec<Decimal> = vec![];

    let mut global_decimals_list: Vec<u8> = vec![];

    // global_delta_balance_list - vector of global assets to buy
    let mut global_delta_balance_list: Vec<Uint128> = vec![Uint128::zero(); global_vec_len];

    // global_delta_cost_list - vector of global payments in $ to buy assets
    let mut global_delta_cost_list: Vec<Uint128> = vec![Uint128::zero(); global_vec_len];

    // 1) iterate over pools and fill global_denom_list and global_price_list
    for (asset_info, price, decimals) in asset_data_list {
        global_denom_list.push(asset_info.clone());
        global_price_list.push(*price);
        global_decimals_list.push(*decimals);
    }

    let mut users_with_addresses_updated: Vec<(Addr, User)> = vec![];

    let mut daily_payment_sum = Uint128::zero();

    for (native_address, user) in users_with_addresses {
        // 2) calculate daily payment, update down_counter and deposited

        // skip if user is out of money or investment period is ended
        let mut daily_payment = user
            .stable_balance
            .checked_div(user.down_counter)
            .map_or(Uint128::zero(), |x| {
                x.clamp(Uint128::zero(), user.stable_balance)
            });

        // we can get (deposited/down_counter == 0) && (deposited != 0) &&
        // (down_counter != 0) so down_counter must be decremented anyway
        let down_counter = user.down_counter
            - if user.down_counter > Uint128::zero() {
                Uint128::one()
            } else {
                Uint128::zero()
            };

        if daily_payment.is_zero() {
            users_with_addresses_updated.push((
                native_address.to_owned(),
                User {
                    down_counter,
                    ..user.to_owned()
                },
            ));

            continue;
        }

        // user_weights - vector of target asset ratios
        let mut user_weights: Vec<Decimal> = vec![Decimal::zero(); global_vec_len];

        // user_balances - vector of user asset balances
        let mut user_balances: Vec<Uint128> = vec![Uint128::zero(); global_vec_len];

        // TODO: refactor
        // 3) iterate over user assets and fill user_weights and user_balances
        for (i, denom) in global_denom_list.iter().enumerate() {
            if let Some(asset_by_denom) = user.asset_list.iter().find(|x| x.info.equal(&denom)) {
                if let Some((_, current_user_balances)) = balances_with_addresses
                    .iter()
                    .find(|(current_address, _)| current_address == native_address)
                {
                    if let Some((_, asset_balance_by_denom)) = current_user_balances
                        .iter()
                        .find(|(current_asset_info, _)| current_asset_info.equal(&denom))
                    {
                        user_weights[i] = asset_by_denom.weight;
                        user_balances[i] = *asset_balance_by_denom;
                    }
                }
            };
        }

        // 4) calculate user_costs based on balances and prices
        // user_costs - vector of user asset costs in $
        let user_costs = vec_mul(&user_balances, &global_price_list, true);

        // 5) calculate user_delta_costs using one of two rebalance functions
        // user_delta_costs - vector of user payments in $ to buy assets
        let user_delta_costs = if user.is_rebalancing_used {
            rebalance_controlled(&user_costs, &user_weights, daily_payment)
        } else {
            rebalance_proportional(&user_weights, daily_payment)
        };

        // 6) calcuclate user_delta_balances using prices and fill amount_to_transfer
        // user_delta_costs - vector of user assets to buy
        let user_delta_balances = vec_div(&user_delta_costs, &global_price_list, true);

        // update daily_payment considering unused funds
        daily_payment = vec_mul(&user_delta_balances, &global_price_list, false)
            .iter()
            .sum::<Uint128>();

        daily_payment_sum += daily_payment;

        let stable_balance = user.stable_balance - daily_payment;

        // update user assets amount to buy data (amount_to_transfer)
        let mut asset_list_updated: Vec<Asset> = vec![];
        for asset in &user.asset_list {
            let some_index = global_denom_list.iter().position(|x| x.equal(&asset.info));

            if let Some(index) = some_index {
                let amount_to_transfer = asset.amount_to_transfer + user_delta_balances[index];

                let asset_updated = Asset {
                    amount_to_transfer,
                    ..asset.to_owned()
                };
                asset_list_updated.push(asset_updated);

                // 7) fill global_delta_balance_list and global_delta_cost_list
                global_delta_balance_list[index] += amount_to_transfer;
                global_delta_cost_list[index] += dec_to_uint128(
                    (u128_to_dec(amount_to_transfer) * global_price_list[index]).ceil(),
                );
            }
        }

        users_with_addresses_updated.push((
            native_address.to_owned(),
            User {
                down_counter,
                stable_balance,
                asset_list: asset_list_updated,
                ..*user
            },
        ));
    }

    // 8) clamping sum of assets costs by daily_payment_sum
    if global_delta_cost_list.iter().sum::<Uint128>() > daily_payment_sum {
        global_delta_cost_list = correct_sum(&global_delta_cost_list, daily_payment_sum);
    }

    let ledger = Ledger {
        global_denom_list,
        global_price_list,
        global_delta_balance_list,
        global_delta_cost_list,
    };

    (ledger, users_with_addresses_updated)
}

// #[allow(clippy::too_many_arguments)]
// pub fn transfer_router(
//     pools_with_denoms: &[(String, Pool)],
//     users_with_addresses: &[(Addr, User)],
//     contract_balances: Vec<Coin>,
//     ledger: Ledger,
//     fee_default: Decimal,
//     fee_native: Decimal,
//     dapp_address_and_denom_list: Vec<(Addr, String)>,
//     stablecoin_denom: &str,
//     timestamp: Timestamp,
// ) -> (Vec<(Addr, User)>, Vec<CosmosMsg>) {
//     let mut fee_list: Vec<Uint128> = vec![Uint128::zero(); ledger.global_denom_list.len()];

//     // get vector of ratios to correct amount_to_transfer due to difference between
//     // contract balances and calculated values
//     let asset_amount_correction_vector = ledger
//         .global_denom_list
//         .iter()
//         .enumerate()
//         .map(|(i, denom)| {
//             let asset_amount =
//                 contract_balances
//                     .iter()
//                     .find(|x| &x.denom == denom)
//                     .map_or(Decimal::zero(), |y| {
//                         let fee_multiplier = if y.denom == EXCHANGE_DENOM {
//                             fee_native
//                         } else {
//                             fee_default
//                         };
//                         let amount = u128_to_dec(y.amount);
//                         let fee = (amount * fee_multiplier).ceil();
//                         fee_list[i] = dec_to_uint128(fee);
//                         amount - fee
//                     });

//             asset_amount
//                 .checked_div(u128_to_dec(ledger.global_delta_balance_list[i]))
//                 .map_or(Decimal::zero(), |y| y)
//         })
//         .collect::<Vec<Decimal>>();

//     let mut users_with_addresses_updated: Vec<(Addr, User)> = vec![];
//     let mut msg_list: Vec<CosmosMsg> = vec![];

//     for (addr, user) in users_with_addresses.iter().cloned() {
//         let mut asset_list: Vec<Asset> = vec![];

//         for asset in &user.asset_list {
//             if let Some(index) = ledger
//                 .global_denom_list
//                 .iter()
//                 .position(|x| x == &asset.denom)
//             {
//                 let amount_to_transfer = dec_to_uint128(
//                     (u128_to_dec(asset.amount_to_transfer)
//                         * asset_amount_correction_vector[index])
//                         .floor(),
//                 );

//                 // reset amount_to_transfer
//                 asset_list.push(Asset {
//                     amount_to_transfer: Uint128::zero(),
//                     ..asset.to_owned()
//                 });

//                 // don't create message with zero balance
//                 if amount_to_transfer.is_zero() {
//                     continue;
//                 }

//                 if asset.denom == EXCHANGE_DENOM {
//                     let bank_msg = CosmosMsg::Bank(BankMsg::Send {
//                         to_address: asset.wallet_address.to_string(),
//                         amount: vec![coin(amount_to_transfer.u128(), &asset.denom)],
//                     });

//                     msg_list.push(bank_msg);
//                 } else if let Some((_denom, pool)) = pools_with_denoms
//                     .iter()
//                     .find(|(denom, _pool)| denom == &asset.denom)
//                 {
//                     let ibc_msg = CosmosMsg::Ibc(IbcMsg::Transfer {
//                         channel_id: pool.channel_id.to_owned(),
//                         to_address: asset.wallet_address.to_string(),
//                         amount: coin(amount_to_transfer.u128(), &asset.denom),
//                         timeout: IbcTimeout::with_timestamp(timestamp),
//                     });

//                     msg_list.push(ibc_msg);
//                 };
//             };
//         }

//         users_with_addresses_updated.push((addr, User { asset_list, ..user }));
//     }

//     for (i, fee) in fee_list.iter().enumerate() {
//         // don't create message with zero balance
//         if fee.is_zero() {
//             continue;
//         }

//         let fee_denom = &ledger.global_denom_list[i];

//         // don't create message with stablecoin
//         if fee_denom == stablecoin_denom {
//             continue;
//         }

//         if let Some((addr, denom)) = dapp_address_and_denom_list
//             .iter()
//             .find(|(_addr, denom)| denom == fee_denom)
//         {
//             if denom == EXCHANGE_DENOM {
//                 let bank_msg = CosmosMsg::Bank(BankMsg::Send {
//                     to_address: addr.to_string(),
//                     amount: vec![coin(fee.u128(), fee_denom)],
//                 });

//                 msg_list.push(bank_msg);
//             } else if let Some((_denom, pool)) = pools_with_denoms
//                 .iter()
//                 .find(|(denom, _pool)| denom == fee_denom)
//             {
//                 let ibc_msg = CosmosMsg::Ibc(IbcMsg::Transfer {
//                     channel_id: pool.channel_id.to_owned(),
//                     to_address: addr.to_string(),
//                     amount: coin(fee.u128(), fee_denom),
//                     timeout: IbcTimeout::with_timestamp(timestamp),
//                 });

//                 msg_list.push(ibc_msg);
//             };
//         };
//     }

//     // println!(
//     //     "asset_amount_correction_vector {:#?}",
//     //     asset_amount_correction_vector
//     // );

//     println!("fee_list {:#?}", fee_list);

//     // println!(
//     //     "users_with_addresses_updated {:#?}",
//     //     users_with_addresses_updated
//     // );

//     println!("msg_list {:#?}", msg_list);

//     (users_with_addresses_updated, msg_list)
// }

/// returns a2 = a1 * 10^(d2 - d1) * p1 / p2, \
/// where a - amount, d - decimals, p - price
pub fn get_xyk_amount(a1: u128, d1: u8, d2: u8, p1: Decimal, p2: Decimal) -> u128 {
    let amount1 = u128_to_dec256(a1);
    let price1 = dec_to_dec256(p1);
    let price2 = dec_to_dec256(p2);

    if d2 >= d1 {
        let power = u128_to_dec256(10u128.pow((d2 - d1).into()));
        dec256_to_u128((price1 / price2) * amount1 * power)
    } else {
        let power = u128_to_dec256(10u128.pow((d1 - d2).into()));
        dec256_to_u128((price1 / price2) * amount1 / power)
    }
}

/// returns p2 = p1 * 10^(d2 - d1) * a1 / a2, \
/// where a - amount, d - decimals, p - price
pub fn get_xyk_price<T>(p1: Decimal, d1: u8, d2: u8, a1: T, a2: T) -> Decimal
where
    Uint128: From<T>,
{
    let price1 = dec_to_dec256(p1);
    let amount1 = u128_to_dec256(a1);
    let amount2 = u128_to_dec256(a2);

    if d2 >= d1 {
        let power = u128_to_dec256::<u128>(10u128.pow((d2 - d1).into()));
        dec256_to_dec((amount1 / amount2) * price1 * power)
    } else {
        let power = u128_to_dec256::<u128>(10u128.pow((d1 - d2).into()));
        dec256_to_dec((amount1 / amount2) * price1 / power)
    }
}
