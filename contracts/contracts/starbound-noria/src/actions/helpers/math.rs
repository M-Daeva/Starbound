use cosmwasm_std::{
    coin, Addr, BankMsg, Coin, CosmosMsg, Decimal, IbcMsg, IbcTimeout, Timestamp, Uint128,
};
use std::ops::{Div, Mul};

use crate::state::{Asset, Ledger, Pool, User, EXCHANGE_DENOM};

pub fn str_to_dec(s: &str) -> Decimal {
    s.to_string().parse::<Decimal>().unwrap()
}

pub fn str_vec_to_dec_vec(str_vec: Vec<&str>) -> Vec<Decimal> {
    str_vec.iter().map(|&x| str_to_dec(x)).collect()
}

pub fn u128_to_dec(num: u128) -> Decimal {
    Decimal::from_ratio(Uint128::new(num), Uint128::one())
}

pub fn dec_to_u128(dec: Decimal) -> u128 {
    dec.ceil().atomics().u128() / 1_000_000_000_000_000_000
}

pub fn uint128_to_dec(num: Uint128) -> Decimal {
    Decimal::from_ratio(num, Uint128::one())
}

pub fn dec_to_uint128(dec: Decimal) -> Uint128 {
    dec.ceil()
        .atomics()
        .div(Uint128::from(1_000_000_000_000_000_000_u128))
}

pub fn u128_vec_to_uint128_vec(u128_vec: Vec<u128>) -> Vec<Uint128> {
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
        let mut res = dec_vec[i].mul(uint128_to_dec(*item));
        res = if is_floored { res.floor() } else { res.ceil() };
        temp.push(dec_to_uint128(res));
    }

    temp
}

// div vector by vector and rounds values down or up depending on is_floored
pub fn vec_div(uint128_vec: &[Uint128], dec_vec: &[Decimal], is_floored: bool) -> Vec<Uint128> {
    let mut temp = Vec::<Uint128>::new();

    for (i, item) in uint128_vec.iter().enumerate() {
        let mut res = uint128_to_dec(*item).div(dec_vec[i]);
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
fn correct_sum(r: Vec<Uint128>, d: Uint128) -> Vec<Uint128> {
    let r_sum = r.iter().sum::<Uint128>();
    if r_sum == d {
        return r;
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
    let d = uint128_to_dec(d);
    let s1 = uint128_to_dec(x1.iter().sum::<Uint128>());

    // we need to find minimal s2 where s2 = x1/k2 and s2 >= s1
    let mut s2 = Decimal::zero();

    for (i, &k2_item) in k2.iter().enumerate() {
        // skip division by zero
        if !k2_item.is_zero() {
            let s2_item = uint128_to_dec(x1[i]) / k2_item;
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
            let x1_item = uint128_to_dec(x1[i]);

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
            let x1_item = uint128_to_dec(x1[i]);

            // preventing calculation error with ceil
            r.push(dec_to_uint128(
                ((s2 * k2_item).ceil() - x1_item) * d / (s2 - s1),
            ));
        }
    }

    // rounding error correction
    correct_sum(r, dec_to_uint128(d))
}

/// k2 - vector of target asset ratios \
/// d - funds to buy coins \
/// r - vector of coins to buy costs
pub fn rebalance_proportional(k2: &[Decimal], d: Uint128) -> Vec<Uint128> {
    let r = k2
        .iter()
        .map(|k2_item| dec_to_uint128(k2_item.mul(uint128_to_dec(d))))
        .collect();

    // rounding error correction
    correct_sum(r, d)
}

/// pools_with_denoms - POOLS.range().map().collect() \
/// users_with_addresses - USERS.range().map().collect()
pub fn get_ledger(
    pools_with_denoms: &Vec<(String, Pool)>,
    users_with_addresses: &Vec<(Addr, User)>,
) -> (Ledger, Vec<(Addr, User)>) {
    let global_vec_len = pools_with_denoms.len();

    // for sorting
    let mut global_denom_list: Vec<String> = vec![];

    // global_price_list - vector of global asset prices sorted by denom (ascending order)
    let mut global_price_list: Vec<Decimal> = vec![];

    // global_delta_balance_list - vector of global assets to buy
    let mut global_delta_balance_list: Vec<Uint128> = vec![Uint128::zero(); global_vec_len];

    // global_delta_cost_list - vector of global payments in $ to buy assets
    let mut global_delta_cost_list: Vec<Uint128> = vec![Uint128::zero(); global_vec_len];

    // 1) iterate over pools and fill global_denom_list and global_price_list
    for (denom, pool) in pools_with_denoms {
        global_denom_list.push(denom.to_owned());
        global_price_list.push(pool.price);
    }

    let mut users_with_addresses_updated: Vec<(Addr, User)> = vec![];

    let mut daily_payment_sum = Uint128::zero();

    for (native_address, user) in users_with_addresses {
        // 2) calculate daily payment, update day_counter and deposited

        // skip if user is out of money or investment period is ended
        let mut daily_payment = match user.deposited.checked_div(user.day_counter) {
            Ok(x) => x.clamp(Uint128::zero(), user.deposited),
            _ => Uint128::zero(),
        };

        // we can get (deposited/day_counter == 0) && (deposited != 0) &&
        // (day_counter != 0) so day_counter must be decremented anyway
        let day_counter = user.day_counter
            - if user.day_counter > Uint128::zero() {
                Uint128::one()
            } else {
                Uint128::zero()
            };

        if daily_payment.is_zero() {
            users_with_addresses_updated.push((
                native_address.to_owned(),
                User {
                    day_counter,
                    ..user.to_owned()
                },
            ));

            continue;
        }

        // user_weights - vector of target asset ratios
        let mut user_weights: Vec<Decimal> = vec![Decimal::zero(); global_vec_len];

        // user_balances - vector of user asset balances
        let mut user_balances: Vec<Uint128> = vec![Uint128::zero(); global_vec_len];

        // 3) iterate over user assets and fill user_weights and user_balances
        for (i, denom) in global_denom_list.iter().enumerate() {
            if let Some(asset_by_denom) = user.asset_list.iter().find(|x| &x.denom == denom) {
                user_weights[i] = asset_by_denom.weight;
                user_balances[i] = asset_by_denom.wallet_balance;
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

        let deposited = user.deposited - daily_payment;

        // update user assets amount to buy data (amount_to_transfer)
        let mut asset_list_updated: Vec<Asset> = vec![];
        for asset in &user.asset_list {
            let some_index = global_denom_list.iter().position(|x| x == &asset.denom);

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
                    (uint128_to_dec(amount_to_transfer) * global_price_list[index]).ceil(),
                );
            }
        }

        users_with_addresses_updated.push((
            native_address.to_owned(),
            User {
                day_counter,
                deposited,
                asset_list: asset_list_updated,
                ..*user
            },
        ));
    }

    // 8) clamping sum of assets costs by daily_payment_sum
    if global_delta_cost_list.iter().sum::<Uint128>() > daily_payment_sum {
        global_delta_cost_list = correct_sum(global_delta_cost_list, daily_payment_sum);
    }

    let ledger = Ledger {
        global_denom_list,
        global_price_list,
        global_delta_balance_list,
        global_delta_cost_list,
    };

    (ledger, users_with_addresses_updated)
}

#[allow(clippy::too_many_arguments)]
pub fn transfer_router(
    pools_with_denoms: &[(String, Pool)],
    users_with_addresses: &[(Addr, User)],
    contract_balances: Vec<Coin>,
    ledger: Ledger,
    fee_default: Decimal,
    fee_native: Decimal,
    dapp_address_and_denom_list: Vec<(Addr, String)>,
    stablecoin_denom: &str,
    timestamp: Timestamp,
) -> (Vec<(Addr, User)>, Vec<CosmosMsg>) {
    let mut fee_list: Vec<Uint128> = vec![Uint128::zero(); ledger.global_denom_list.len()];

    // get vector of ratios to correct amount_to_transfer due to difference between
    // contract balances and calculated values
    let asset_amount_correction_vector = ledger
        .global_denom_list
        .iter()
        .enumerate()
        .map(|(i, denom)| {
            let asset_amount = match contract_balances.iter().find(|x| &x.denom == denom) {
                Some(y) => {
                    let fee_multiplier = if y.denom == EXCHANGE_DENOM {
                        fee_native
                    } else {
                        fee_default
                    };
                    let amount = uint128_to_dec(y.amount);
                    let fee = (amount * fee_multiplier).ceil();
                    fee_list[i] = dec_to_uint128(fee);
                    amount - fee
                }
                _ => Decimal::zero(),
            };

            match asset_amount.checked_div(uint128_to_dec(ledger.global_delta_balance_list[i])) {
                Ok(y) => y,
                _ => Decimal::zero(),
            }
        })
        .collect::<Vec<Decimal>>();

    let mut users_with_addresses_updated: Vec<(Addr, User)> = vec![];
    let mut msg_list: Vec<CosmosMsg> = vec![];

    for (addr, user) in users_with_addresses.iter().cloned() {
        let mut asset_list: Vec<Asset> = vec![];

        for asset in &user.asset_list {
            if let Some(index) = ledger
                .global_denom_list
                .iter()
                .position(|x| x == &asset.denom)
            {
                let amount_to_transfer = dec_to_uint128(
                    (uint128_to_dec(asset.amount_to_transfer)
                        * asset_amount_correction_vector[index])
                        .floor(),
                );

                // reset amount_to_transfer
                asset_list.push(Asset {
                    amount_to_transfer: Uint128::zero(),
                    ..asset.to_owned()
                });

                // don't create message with zero balance
                if amount_to_transfer.is_zero() {
                    continue;
                }

                if asset.denom == EXCHANGE_DENOM {
                    let bank_msg = CosmosMsg::Bank(BankMsg::Send {
                        to_address: asset.wallet_address.to_string(),
                        amount: vec![coin(amount_to_transfer.u128(), &asset.denom)],
                    });

                    msg_list.push(bank_msg);
                } else if let Some((_denom, pool)) = pools_with_denoms
                    .iter()
                    .find(|(denom, _pool)| denom == &asset.denom)
                {
                    let ibc_msg = CosmosMsg::Ibc(IbcMsg::Transfer {
                        channel_id: pool.channel_id.to_owned(),
                        to_address: asset.wallet_address.to_string(),
                        amount: coin(amount_to_transfer.u128(), &asset.denom),
                        timeout: IbcTimeout::with_timestamp(timestamp),
                    });

                    msg_list.push(ibc_msg);
                };
            };
        }

        users_with_addresses_updated.push((addr, User { asset_list, ..user }));
    }

    for (i, fee) in fee_list.iter().enumerate() {
        // don't create message with zero balance
        if fee.is_zero() {
            continue;
        }

        let fee_denom = &ledger.global_denom_list[i];

        // don't create message with stablecoin
        if fee_denom == stablecoin_denom {
            continue;
        }

        if let Some((addr, denom)) = dapp_address_and_denom_list
            .iter()
            .find(|(_addr, denom)| denom == fee_denom)
        {
            if denom == EXCHANGE_DENOM {
                let bank_msg = CosmosMsg::Bank(BankMsg::Send {
                    to_address: addr.to_string(),
                    amount: vec![coin(fee.u128(), fee_denom)],
                });

                msg_list.push(bank_msg);
            } else if let Some((_denom, pool)) = pools_with_denoms
                .iter()
                .find(|(denom, _pool)| denom == fee_denom)
            {
                let ibc_msg = CosmosMsg::Ibc(IbcMsg::Transfer {
                    channel_id: pool.channel_id.to_owned(),
                    to_address: addr.to_string(),
                    amount: coin(fee.u128(), fee_denom),
                    timeout: IbcTimeout::with_timestamp(timestamp),
                });

                msg_list.push(ibc_msg);
            };
        };
    }

    // println!(
    //     "asset_amount_correction_vector {:#?}",
    //     asset_amount_correction_vector
    // );

    println!("fee_list {:#?}", fee_list);

    // println!(
    //     "users_with_addresses_updated {:#?}",
    //     users_with_addresses_updated
    // );

    println!("msg_list {:#?}", msg_list);

    (users_with_addresses_updated, msg_list)
}

#[cfg(test)]
pub mod test {

    use crate::tests::helpers::{
        ADDR_ALICE_ATOM, ADDR_ALICE_JUNO, ADDR_ALICE_OSMO, ADDR_BOB_ATOM, ADDR_BOB_JUNO,
        ADDR_BOB_OSMO, ADDR_BOB_STARS, DENOM_ATOM, DENOM_EEUR, DENOM_JUNO, DENOM_SCRT, DENOM_STARS,
        IS_REBALANCING_USED,
    };

    use super::{
        correct_sum, dec_to_uint128, get_ledger, rebalance_controlled, rebalance_proportional,
        str_to_dec, str_vec_to_dec_vec, transfer_router, u128_vec_to_uint128_vec, uint128_to_dec,
        vec_add, vec_div, vec_mul, vec_sub, Addr, Asset, Coin, Ledger, Pool, Timestamp, Uint128,
        User,
    };

    // TODO: add tests for bank transfer
    #[test]
    fn get_transfer_messages() {
        let asset_list_alice = vec![
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_ALICE_ATOM),
                Uint128::zero(),
                str_to_dec("0.5"),
                Uint128::from(125_u128),
            ),
            Asset::new(
                DENOM_JUNO,
                &Addr::unchecked(ADDR_ALICE_JUNO),
                Uint128::zero(),
                str_to_dec("0.5"),
                Uint128::from(625_u128),
            ),
        ];

        let user_alice = User::new(
            &asset_list_alice,
            Uint128::from(3_u128),
            Uint128::from(7500_u128),
            IS_REBALANCING_USED,
        );

        let users_with_addresses: Vec<(Addr, User)> =
            vec![(Addr::unchecked(ADDR_ALICE_OSMO), user_alice)];

        let contract_balances = vec![
            Coin {
                denom: DENOM_ATOM.to_string(),
                amount: Uint128::from(122_u128),
            },
            Coin {
                denom: DENOM_JUNO.to_string(),
                amount: Uint128::from(609_u128),
            },
            Coin {
                denom: DENOM_EEUR.to_string(),
                amount: Uint128::from(7500_u128),
            },
        ];
        let ledger: Ledger = Ledger {
            global_delta_balance_list: vec![
                Uint128::from(125_u128),
                Uint128::from(625_u128),
                Uint128::from(0_u128),
            ],
            global_delta_cost_list: vec![
                Uint128::from(1250_u128),
                Uint128::from(1250_u128),
                Uint128::from(0_u128),
            ],
            global_denom_list: vec![
                DENOM_ATOM.to_string(),
                DENOM_JUNO.to_string(),
                DENOM_EEUR.to_string(),
            ],
            global_price_list: vec![str_to_dec("10"), str_to_dec("2"), str_to_dec("1")],
        };

        let fee_default = str_to_dec("0.01");
        let fee_native = str_to_dec("0.02");
        let dapp_address_and_denom_list: Vec<(Addr, String)> = vec![
            (Addr::unchecked(ADDR_BOB_ATOM), DENOM_ATOM.to_string()),
            (Addr::unchecked(ADDR_BOB_JUNO), DENOM_JUNO.to_string()),
            (Addr::unchecked(ADDR_BOB_STARS), DENOM_STARS.to_string()),
            (Addr::unchecked(ADDR_BOB_OSMO), DENOM_EEUR.to_string()),
        ];

        let pools_with_denoms: Vec<(String, Pool)> = vec![
            // ATOM / OSMO
            (
                DENOM_ATOM.to_string(),
                Pool::new(
                    Uint128::one(),
                    str_to_dec("9.5"),
                    "channel-1110",
                    "transfer",
                    "uatom",
                ),
            ),
            // JUNO / OSMO
            (
                DENOM_JUNO.to_string(),
                Pool::new(
                    Uint128::from(497_u128),
                    str_to_dec("1.5"),
                    "channel-1110",
                    "transfer",
                    "ujuno",
                ),
            ),
            // STARS / OSMO
            (
                DENOM_STARS.to_string(),
                Pool::new(
                    Uint128::from(604_u128),
                    str_to_dec("0.03"),
                    "channel-",
                    "transfer",
                    "ustars",
                ),
            ),
            // SCRT / OSMO
            (
                DENOM_SCRT.to_string(),
                Pool::new(
                    Uint128::from(584_u128),
                    str_to_dec("0.7"),
                    "channel-",
                    "transfer",
                    "uscrt",
                ),
            ),
        ];

        transfer_router(
            &pools_with_denoms,
            &users_with_addresses,
            contract_balances,
            ledger,
            fee_default,
            fee_native,
            dapp_address_and_denom_list,
            DENOM_EEUR,
            Timestamp::default(),
        );
    }

    #[test]
    fn vector_addition() {
        let a = u128_vec_to_uint128_vec(vec![1, 2, 3]);
        let b = u128_vec_to_uint128_vec(vec![3, 2, 1]);
        let c = u128_vec_to_uint128_vec(vec![4, 4, 4]);

        assert_eq!(vec_add(&a, &b), c);
    }

    #[test]
    fn vector_subtraction() {
        let a = u128_vec_to_uint128_vec(vec![10, 12, 13]);
        let b = u128_vec_to_uint128_vec(vec![3, 2, 1]);
        let c = u128_vec_to_uint128_vec(vec![7, 10, 12]);

        assert_eq!(vec_sub(&a, &b), c);
    }

    #[test]
    fn vector_division() {
        let a = u128_vec_to_uint128_vec(vec![300]);
        let b = str_vec_to_dec_vec(vec!["9.5"]);
        let c = u128_vec_to_uint128_vec(vec![31]);
        let d = u128_vec_to_uint128_vec(vec![32]);

        assert_eq!(vec_div(&a, &b, true), c);
        assert_eq!(vec_div(&a, &b, false), d);
    }

    #[test]
    fn vector_multiplication() {
        let a = u128_vec_to_uint128_vec(vec![3]);
        let b = str_vec_to_dec_vec(vec!["9.5"]);
        let c = u128_vec_to_uint128_vec(vec![28]);
        let d = u128_vec_to_uint128_vec(vec![29]);

        assert_eq!(vec_mul(&a, &b, true), c);
        assert_eq!(vec_mul(&a, &b, false), d);
    }

    #[test]
    fn sum_correction() {
        let r = u128_vec_to_uint128_vec(vec![100_000_007, 299_999_998, 200_000_000, 0]);
        let d: Uint128 = Uint128::from(600_000_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![100_000_007, 299_999_993, 200_000_000, 0]);

        assert_eq!(correct_sum(r, d), xd);
    }

    #[test]
    fn sum_correction2() {
        let r = u128_vec_to_uint128_vec(vec![300_002, 100_000, 300_002, 200_000, 0]);
        let d: Uint128 = Uint128::from(900_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![300_000, 100_000, 300_000, 200_000, 0]);

        assert_eq!(correct_sum(r, d), xd);
    }

    #[test]
    fn sum_correction3() {
        let r = u128_vec_to_uint128_vec(vec![300_002, 100_001, 300_002, 200_000, 0]);
        let d: Uint128 = Uint128::from(900_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![299_999, 100_001, 300_000, 200_000, 0]);

        assert_eq!(correct_sum(r, d), xd);
    }

    #[test]
    fn sum_correction4() {
        let r = u128_vec_to_uint128_vec(vec![299_998, 99_999, 299_998, 200_000, 0]);
        let d: Uint128 = Uint128::from(900_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![300_001, 99_999, 300_000, 200_000, 0]);

        assert_eq!(correct_sum(r, d), xd);
    }

    #[test]
    // controlled mode case 1.1
    fn big_payment_and_s2_greater_s1() {
        let x1 = u128_vec_to_uint128_vec(vec![100_000_000, 300_000_000, 200_000_000, 0]);
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = Uint128::from(10_000_000_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![3_080_000_000, 1_820_000_000, 5_100_000_000, 0]);

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // controlled mode case 1.2
    fn big_payment_and_s2_greater_s1_noisy() {
        let x1 = u128_vec_to_uint128_vec(vec![100_000_049, 300_000_007, 200_000_011, 0]);
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = Uint128::from(10_000_000_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![3_079_999_972, 1_820_000_007, 5_100_000_021, 0]);

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // controlled mode case 2.1
    fn s2_equal_s1() {
        let x1 = u128_vec_to_uint128_vec(vec![300_000_000, 200_000_000, 500_000_000, 0]);
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = Uint128::from(100_000_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![30_000_000, 20_000_000, 50_000_000, 0]);

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // controlled mode case 2.2
    fn s2_equal_s1_noisy() {
        let x1 = u128_vec_to_uint128_vec(vec![300_000_049, 200_000_007, 500_000_011, 0]);
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = Uint128::from(100_000_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![29_999_972, 20_000_007, 50_000_021, 0]);

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // controlled mode case 3.1
    fn small_payment_and_s2_greater_s1() {
        let x1 = u128_vec_to_uint128_vec(vec![100_000_000, 300_000_000, 200_000_000, 0]);
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = Uint128::from(100_000_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![38_888_889, 0, 61_111_111, 0]);

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // controlled mode case 3.2
    fn small_payment_and_s2_greater_s1_noisy() {
        let x1 = u128_vec_to_uint128_vec(vec![115_000_012, 35_000_007, 0]);
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.7", "0"]);
        let sd = Uint128::from(200_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![0, 200_000, 0]);

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // proportional mode case 1.1
    fn proportional() {
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = Uint128::from(100_000_000_u128);

        let xd = u128_vec_to_uint128_vec(vec![30_000_000, 20_000_000, 50_000_000, 0]);

        assert_eq!(rebalance_proportional(&k2, sd), xd);
    }

    #[test]
    // proportional mode case 1.2
    fn proportional_noisy() {
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = Uint128::from(100_000_011_u128);

        let xd = u128_vec_to_uint128_vec(vec![30_000_004, 20_000_003, 50_000_004, 0]);

        assert_eq!(rebalance_proportional(&k2, sd), xd);
    }

    #[test]
    fn calc_ledger() {
        let deposited_alice = Uint128::from(1_035_u128);
        let day_counter_alice = Uint128::from(5_u128);

        let asset_list_alice = vec![
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_ALICE_ATOM),
                Uint128::zero(),
                str_to_dec("0.7"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_JUNO,
                &Addr::unchecked(ADDR_ALICE_JUNO),
                Uint128::zero(),
                str_to_dec("0.3"),
                Uint128::zero(),
            ),
        ];

        let user_alice = User::new(
            &asset_list_alice,
            day_counter_alice,
            deposited_alice,
            !IS_REBALANCING_USED,
        );

        let deposited_bob = Uint128::from(4_130_u128);
        let day_counter_bob = Uint128::from(10_u128);

        let asset_list_bob = vec![
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_BOB_ATOM),
                Uint128::zero(),
                str_to_dec("0.4"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_STARS,
                &Addr::unchecked(ADDR_BOB_STARS),
                Uint128::zero(),
                str_to_dec("0.6"),
                Uint128::zero(),
            ),
        ];

        let user_bob = User::new(
            &asset_list_bob,
            day_counter_bob,
            deposited_bob,
            !IS_REBALANCING_USED,
        );

        let users_with_addresses: Vec<(Addr, User)> = vec![
            (Addr::unchecked(ADDR_ALICE_OSMO), user_alice),
            (Addr::unchecked(ADDR_BOB_OSMO), user_bob),
        ];

        let pools_with_denoms: Vec<(String, Pool)> = vec![
            // ATOM / OSMO
            (
                DENOM_ATOM.to_string(),
                Pool::new(
                    Uint128::one(),
                    str_to_dec("9.5"),
                    "channel-1110",
                    "transfer",
                    "uatom",
                ),
            ),
            // JUNO / OSMO
            (
                DENOM_JUNO.to_string(),
                Pool::new(
                    Uint128::from(497_u128),
                    str_to_dec("1.5"),
                    "channel-1110",
                    "transfer",
                    "ujuno",
                ),
            ),
            // STARS / OSMO
            (
                DENOM_STARS.to_string(),
                Pool::new(
                    Uint128::from(604_u128),
                    str_to_dec("0.03"),
                    "channel-",
                    "transfer",
                    "ustars",
                ),
            ),
            // SCRT / OSMO
            (
                DENOM_SCRT.to_string(),
                Pool::new(
                    Uint128::from(584_u128),
                    str_to_dec("0.7"),
                    "channel-",
                    "transfer",
                    "uscrt",
                ),
            ),
        ];

        let mut deposited_pre: Vec<Uint128> = vec![deposited_alice, deposited_bob];
        let mut deposited_diff: Vec<Uint128> = vec![];
        let mut user_daily_payment_right: Vec<Uint128> = vec![];
        let mut user_with_addr_list: Vec<(Addr, User)> = users_with_addresses;

        for _i in 0..=(day_counter_bob).u128() {
            let (ledger, user_with_addr) = get_ledger(&pools_with_denoms, &user_with_addr_list);
            user_with_addr_list = vec![];

            let mut global_delta_balance_list_left: Vec<Uint128> =
                vec![Uint128::zero(); ledger.global_denom_list.len()];
            let mut global_delta_cost_list_left: Vec<Uint128> =
                vec![Uint128::zero(); ledger.global_denom_list.len()];

            for (addr, user) in user_with_addr {
                let mut user_daily_payment_right_item: Uint128 = Uint128::zero();
                let mut asset_list_updated: Vec<Asset> = vec![];

                for asset in user.asset_list {
                    let index = ledger
                        .global_denom_list
                        .iter()
                        .position(|x| x == &asset.denom)
                        .unwrap();

                    let price = ledger.global_price_list[index];
                    let amount = asset.amount_to_transfer;
                    let daily_payment = dec_to_uint128((uint128_to_dec(amount) * price).ceil());
                    user_daily_payment_right_item += daily_payment;

                    global_delta_balance_list_left[index] += amount;

                    global_delta_cost_list_left[index] += daily_payment;

                    asset_list_updated.push(Asset {
                        amount_to_transfer: Uint128::zero(), // it is sent via ibc
                        ..asset
                    });
                }

                user_daily_payment_right.push(user_daily_payment_right_item);
                deposited_diff.push(user.deposited);
                user_with_addr_list.push((
                    addr,
                    User {
                        asset_list: asset_list_updated,
                        ..user
                    },
                ));
            }

            let user_daily_payment_left = vec_sub(&deposited_pre, &deposited_diff);
            deposited_pre = deposited_diff;
            deposited_diff = vec![];

            // 1) user_daily_payment == sum(user_asset_amount * price)
            assert_eq!(user_daily_payment_left, user_daily_payment_right);
            user_daily_payment_right = vec![];

            // 2) sum(user_asset) == global_delta_balance_list
            assert_eq!(
                global_delta_balance_list_left,
                ledger.global_delta_balance_list
            );

            // 3) sum(user_asset * price) ==  global_delta_cost_list
            assert_eq!(global_delta_cost_list_left, ledger.global_delta_cost_list);
        }
    }
}
