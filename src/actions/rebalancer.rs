use std::ops::Mul;

use cosmwasm_std::{Decimal, Uint128};

use crate::error::ContractError;

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
pub fn rebalance_controlled(
    x1: &Vec<u128>,
    k2: &Vec<Decimal>,
    d: u128,
) -> Result<Vec<u128>, ContractError> {
    // check if x1 and k2 have same length
    if x1.len() != k2.len() {
        return Err(ContractError::NonEqualVectors {});
    }

    // check if vectors are not empty
    if k2.is_empty() {
        return Err(ContractError::EmptyVector {});
    }

    // get result
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
    Ok(correct_sum(r, dec_to_u128(d)))
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

        assert_eq!(rebalance_controlled(&x1, &k2, sd).unwrap(), xd);
    }

    #[test]
    // controlled mode case 1.2
    fn big_payment_and_s2_greater_s1_noisy() {
        let x1 = vec![100_000049, 300_000007, 200_000011, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 10000_000000;

        let xd = vec![3079_999972, 1820_000007, 5100_000021, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd).unwrap(), xd);
    }

    #[test]
    // controlled mode case 2.1
    fn s2_equal_s1() {
        let x1 = vec![300_000000, 200_000000, 500_000000, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 100_000000;

        let xd = vec![30_000000, 20_000000, 50_000000, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd).unwrap(), xd);
    }

    #[test]
    // controlled mode case 2.2
    fn s2_equal_s1_noisy() {
        let x1 = vec![300_000049, 200_000007, 500_000011, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 100_000000;

        let xd = vec![29_999972, 20_000007, 50_000021, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd).unwrap(), xd);
    }

    #[test]
    // controlled mode case 3.1
    fn small_payment_and_s2_greater_s1() {
        let x1 = vec![100_000000, 300_000000, 200_000000, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5", "0"]);
        let sd = 100_000000;

        let xd = vec![38_888889, 0, 61_111111, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd).unwrap(), xd);
    }

    #[test]
    // controlled mode case 3.2
    fn small_payment_and_s2_greater_s1_noisy() {
        let x1 = vec![115_000012, 35_000007, 0];
        let k2 = str_vec_to_dec_vec(vec!["0.3", "0.7", "0"]);
        let sd = 200000;

        let xd = vec![0, 200000, 0];

        assert_eq!(rebalance_controlled(&x1, &k2, sd).unwrap(), xd);
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
