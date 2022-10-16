use std::ops::Mul;

use cosmwasm_std::Decimal;

use crate::actions::rebalancer::{dec_to_u128, u128_to_dec};

pub fn vec_mul(u128_vec: &[u128], dec_vec: &[Decimal]) -> Vec<u128> {
    let mut temp = Vec::<u128>::new();

    for (i, item) in u128_vec.iter().enumerate() {
        let res = dec_vec[i].mul(u128_to_dec(*item));
        temp.push(dec_to_u128(res));
    }

    temp
}

pub fn vec_div(u128_vec: &[u128], dec_vec: &[Decimal]) -> Vec<u128> {
    let mut temp = Vec::<u128>::new();

    for (i, item) in u128_vec.iter().enumerate() {
        let res = u128_to_dec(*item).checked_div(dec_vec[i]).unwrap();
        temp.push(dec_to_u128(res));
    }

    temp
}

pub fn vec_mul_by_num(dec_vec: &[Decimal], num: u128) -> Vec<u128> {
    dec_vec
        .iter()
        .map(|x| dec_to_u128(x.mul(u128_to_dec(num))))
        .collect()
}
