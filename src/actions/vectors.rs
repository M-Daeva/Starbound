use std::ops::Mul;

use cosmwasm_std::{Decimal, Uint128};

use crate::{
    actions::rebalancer::{dec_to_u128, u128_to_dec},
    error::ContractError,
};

pub fn vec_mul(u128_vec: &Vec<u128>, dec_vec: &Vec<Decimal>) -> Vec<u128> {
    let mut temp = Vec::<u128>::new();

    for (i, item) in u128_vec.iter().enumerate() {
        let res = dec_vec[i].mul(u128_to_dec(*item));
        temp.push(dec_to_u128(res));
    }

    temp
}

pub fn vec_div(u128_vec: &Vec<u128>, dec_vec: &Vec<Decimal>) -> Vec<u128> {
    let mut temp = Vec::<u128>::new();

    for (i, item) in u128_vec.iter().enumerate() {
        let res = u128_to_dec(*item).checked_div(dec_vec[i]).unwrap();
        temp.push(dec_to_u128(res));
    }

    temp
}

pub fn vec_mul_by_num(dec_vec: &Vec<Decimal>, num: u128) -> Vec<u128> {
    dec_vec
        .iter()
        .map(|x| dec_to_u128(x.mul(u128_to_dec(num))))
        .collect()
}

// TODO: tests

// #[cfg(test)]
// pub mod test {
//     use super::{str_vec_to_dec_vec, Decimal};
//     use crate::actions::rebalancer::{perm_vec_to_dec_vec, rebalance};

//     #[test]
//     // case 1
//     fn big_payment_and_s2_greater_s1() {
//         let x1 = vec![100_000000, 300_000000, 200_000000];
//         let k2 = str_vec_to_dec_vec(vec!["0.3", "0.2", "0.5"]);
//         //    let k2 = perm_vec_to_dec_vec(vec![300, 200, 500]);
//         let sd = 10000_000000;

//         let xd = vec![3080_000000, 1820_000000, 5100_000000];

//         assert_eq!(rebalance(&x1, &k2, sd).unwrap(), xd);
//     }
// }
