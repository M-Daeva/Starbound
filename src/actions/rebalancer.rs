use cosmwasm_std::{Decimal, Uint128};

use crate::error::ContractError;

fn u128_to_dec(num: u128) -> Decimal {
    Decimal::from_ratio(Uint128::new(num), Uint128::one())
}

fn dec_to_u128(dec: Decimal) -> u128 {
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

/// x1 - vector of current asset prices \
/// k2 - vector of target asset ratios multiplied by 1000 (permille) \
/// d - funds to buy coins \
/// r - vector of coins to buy costs
pub fn rebalance(x1: &Vec<u128>, k2: &Vec<Decimal>, d: u128) -> Result<Vec<u128>, ContractError> {
    // check if x1 and k2 have same length
    if x1.len() != k2.len() {
        return Err(ContractError::NonEqualVectors {});
    }

    // check if vectors are not empty
    if k2.is_empty() {
        return Err(ContractError::EmptyVector {});
    }

    // get min ratio that not equal zero (1)
    let mut k2_min = Decimal::one();

    for &k2_item in k2 {
        if !k2_item.is_zero() && k2_item < k2_min {
            k2_min = k2_item;
        }
    }

    // get max x1 for given ratios (2)
    let mut x1_max = 0;

    for (i, &k2_item) in k2.iter().enumerate() {
        if k2_item == k2_min {
            let x1_item = x1[i];

            if x1_item > x1_max {
                x1_max = x1_item;
            }
        }
    }

    // get result (3)
    let mut r = Vec::<u128>::new();
    let d = u128_to_dec(d);
    let s1 = u128_to_dec(x1.iter().sum::<u128>());
    let s2 = u128_to_dec(x1_max) / k2_min;
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

            r.push(dec_to_u128((s2 * k2_item - x1_item) * d / (s2 - s1)));
        }
    }

    // rounding error correction
    Ok(correct_sum(r, dec_to_u128(d)))
}

#[cfg(test)]
pub mod test {
    use crate::actions::rebalancer::{perm_vec_to_dec_vec, rebalance};

    #[test]
    // case 1
    fn big_payment_and_s2_greater_s1() {
        let x1 = vec![100_000000, 300_000000, 200_000000];
        let k2 = perm_vec_to_dec_vec(vec![300, 200, 500]);
        let sd = 10000_000000;

        let xd = vec![3080_000000, 1820_000000, 5100_000000];

        assert_eq!(rebalance(&x1, &k2, sd).unwrap(), xd);
    }

    #[test]
    // case 2
    fn s2_equal_s1() {
        let x1 = vec![300_000000, 200_000000, 500_000000];
        let k2 = perm_vec_to_dec_vec(vec![300, 200, 500]);
        let sd = 100_000000;

        let xd = vec![30_000000, 20_000000, 50_000000];

        assert_eq!(rebalance(&x1, &k2, sd).unwrap(), xd);
    }

    #[test]
    // case 3
    fn small_payment_and_s2_greater_s1() {
        let x1 = vec![100_000000, 300_000000, 200_000000];
        let k2 = perm_vec_to_dec_vec(vec![300, 200, 500]);
        let sd = 100_000000;

        let xd = vec![38_888889, 0, 61_111111];

        assert_eq!(rebalance(&x1, &k2, sd).unwrap(), xd);
    }
}
