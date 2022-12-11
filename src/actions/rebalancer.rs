use std::ops::{Div, Mul, Sub};

use cosmwasm_std::{Addr, Decimal, Uint128};

use crate::state::{Ledger, Pool, User};

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

pub fn perm_vec_to_dec_vec(perm_vec: Vec<u128>) -> Vec<Decimal> {
    perm_vec
        .iter()
        .map(|&x| Decimal::from_ratio(Uint128::new(x), Uint128::new(1_000)))
        .collect()
}

// calculation error correction
// replace max(r) with sum(r) - sum(r w/o max(r))
fn correct_sum(r: Vec<u128>, d: u128) -> Vec<u128> {
    let r_max = *r.iter().max().unwrap();
    let r_sum_wo_max_item = r.iter().filter(|&&r_item| r_item != r_max).sum::<u128>();
    let r_corrected = r
        .iter()
        .map(|&r_item| {
            if r_item == r_max {
                d - r_sum_wo_max_item
            } else {
                r_item
            }
        })
        .collect();
    r_corrected
}

/// x1 - vector of current asset costs \
/// k2 - vector of target asset ratios \
/// d - funds to buy coins \
/// r - vector of coins to buy costs
pub fn rebalance_controlled(x1: &[u128], k2: &[Decimal], d: u128) -> Vec<u128> {
    let mut r = Vec::<u128>::new();
    let d = u128_to_dec(d);
    let s1 = u128_to_dec(x1.iter().sum::<u128>());

    // we need to find minimal s2 where s2 = x1/k2 and s2 >= s1
    let mut s2 = Decimal::zero();

    for (i, &k2_item) in k2.iter().enumerate() {
        // skip division by zero
        if !k2_item.is_zero() {
            let s2_item = u128_to_dec(x1[i]) / k2_item;
            // always update initial value of s2 if s2_item >= s1
            if s2_item.ge(&s1) && (s2.is_zero() || (!s2.is_zero() && s2_item < s2)) {
                s2 = s2_item;
            }
        }
    }

    let ds = s2 - s1;

    if d > ds && !ds.is_zero() {
        // case 1: if d > s2 - s1 && s2 > s1 then r = (s1 + d) * k2 - x1
        for (i, &k2_item) in k2.iter().enumerate() {
            let x1_item = u128_to_dec(x1[i]);

            r.push(dec_to_u128((s1 + d) * k2_item - x1_item));
        }
    } else if ds.is_zero() {
        // case 2: else if s2 == s1 then r = d * k2
        r = k2.iter().map(|&k2_item| dec_to_u128(d * k2_item)).collect();
    } else {
        // case 3: else r = (s2 * k2 - x1) * d / (s2 - s1)
        for (i, &k2_item) in k2.iter().enumerate() {
            let x1_item = u128_to_dec(x1[i]);

            // preventing calculation error with ceil
            r.push(dec_to_u128(
                ((s2 * k2_item).ceil() - x1_item) * d / (s2 - s1),
            ));
        }
    }

    // rounding error correction
    correct_sum(r, dec_to_u128(d))
}

/// k2 - vector of target asset ratios \
/// d - funds to buy coins \
/// r - vector of coins to buy costs
pub fn rebalance_proportional(k2: &[Decimal], d: u128) -> Vec<u128> {
    let r = k2
        .iter()
        .map(|k2_item| dec_to_u128(k2_item.mul(u128_to_dec(d))))
        .collect();

    // rounding error correction
    correct_sum(r, d)
}

/// pools_with_denoms - POOLS.range().map().collect() \
/// users_with_addresses - USERS.range().map().collect()
pub fn get_ledger(
    pools_with_denoms: Vec<(String, Pool)>,
    users_with_addresses: Vec<(Addr, User)>,
) -> Ledger {
    let global_vec_len = pools_with_denoms.len();

    // for sorting purposes
    let mut global_denom_list: Vec<String> = vec![];

    // global_price_list - vector of global asset prices sorted by denom (ascending order)
    let mut global_price_list: Vec<Decimal> = vec![];

    // global_delta_balance_list - vector of global assets to buy
    let mut global_delta_balance_list: Vec<Uint128> = vec![Uint128::zero(); global_vec_len];

    // global_delta_cost_list - vector of global payments in $ to buy assets
    let mut global_delta_cost_list: Vec<Uint128> = vec![Uint128::zero(); global_vec_len];

    for (denom, pool) in pools_with_denoms {
        global_denom_list.push(denom);
        global_price_list.push(pool.price);
    }

    for (osmo_address, mut user) in users_with_addresses {
        // calculate daily payment

        // skip if user is out of money or investment period is ended
        let daily_payment = match user.deposited.checked_div(user.day_counter) {
            Ok(x) => x.clamp(Uint128::zero(), user.deposited),
            _ => Uint128::zero(),
        };

        // we can get (deposited/day_counter == 0) && (deposited != 0) &&
        // (day_counter != 0) so day_counter must be decremented anyway
        if user.day_counter > Uint128::zero() {
            user.day_counter -= Uint128::one();
        }

        if daily_payment.is_zero() {
            continue;
        }

        user.deposited -= daily_payment;

        // get asset vectors

        // TODO: use Uint128 modification of rebalance functions
        // user_weights - vector of target asset ratios
        let mut user_weights: Vec<Decimal> = vec![Decimal::zero(); global_vec_len];

        // user_balances - vector of user asset balances
        let mut user_balances: Vec<u128> = vec![0_u128; global_vec_len];

        // // user_prices - vector of user asset prices
        // let mut user_prices: Vec<Decimal> = vec![Decimal::zero(); global_vec_len];

        for (i, denom) in global_denom_list.iter().enumerate() {
            match user.asset_list.iter().find(|x| &x.asset_denom == denom) {
                Some(asset_by_denom) => {
                    user_weights[i] = asset_by_denom.weight;
                    user_balances[i] = asset_by_denom.wallet_balance.u128();
                }
                _ => {
                    user_weights[i] = Decimal::zero();
                    user_balances[i] = 0;
                }
            };
        }
    }

    Ledger {
        global_denom_list,
        global_price_list,
        global_delta_balance_list,
        global_delta_cost_list,
    }
}

#[cfg(test)]
pub mod test {
    use super::{correct_sum, rebalance_controlled, rebalance_proportional, str_vec_to_dec_vec};

    #[test]
    fn sum_correction() {
        let r = vec![100_000007, 299_999998, 200_000000, 0];
        let d = 600_000000;

        let xd = vec![100_000007, 299_999993, 200_000000, 0];

        assert_eq!(correct_sum(r, d), xd);
    }

    #[test]
    // controlled mode case 1.1
    fn big_payment_and_s2_greater_s1() {
        let x1 = vec![100_000000, 300_000000, 200_000000, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 10000_000000;

        let xd = vec![3080_000000, 1820_000000, 5100_000000, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // controlled mode case 1.2
    fn big_payment_and_s2_greater_s1_noisy() {
        let x1 = vec![100_000049, 300_000007, 200_000011, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 10000_000000;

        let xd = vec![3079_999972, 1820_000007, 5100_000021, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // controlled mode case 2.1
    fn s2_equal_s1() {
        let x1 = vec![300_000000, 200_000000, 500_000000, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 100_000000;

        let xd = vec![30_000000, 20_000000, 50_000000, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // controlled mode case 2.2
    fn s2_equal_s1_noisy() {
        let x1 = vec![300_000049, 200_000007, 500_000011, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 100_000000;

        let xd = vec![29_999972, 20_000007, 50_000021, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // controlled mode case 3.1
    fn small_payment_and_s2_greater_s1() {
        let x1 = vec![100_000000, 300_000000, 200_000000, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 100_000000;

        let xd = vec![38_888889, 0, 61_111111, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // controlled mode case 3.2
    fn small_payment_and_s2_greater_s1_noisy() {
        let x1 = vec![115_000012, 35_000007, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.7", "0"]);
        let sd = 200000;

        let xd = vec![0, 200000, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd), xd);
    }

    #[test]
    // proportional mode case 1.1
    fn proportional() {
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 100_000000;

        let xd = vec![30_000000, 20_000000, 50_000000, 0];

        assert_eq!(rebalance_proportional(&k2, sd), xd);
    }

    #[test]
    // proportional mode case 1.2
    fn proportional_noisy() {
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 100_000011;

        let xd = vec![30_000004, 20_000003, 50_000004, 0];

        assert_eq!(rebalance_proportional(&k2, sd), xd);
    }
}
