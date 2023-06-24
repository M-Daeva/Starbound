use cosmwasm_std::Uint128;

use speculoos::assert_that;

use crate::actions::helpers::math::{
    correct_sum, dec_to_uint128, get_xyk_amount, get_xyk_price, rebalance_controlled,
    rebalance_proportional, str_to_dec, str_vec_to_dec_vec, u128_vec_to_uint128_vec,
    uint128_to_dec, vec_add, vec_div, vec_mul, vec_sub, P12, P24,
};

#[test]
fn vector_addition() {
    let a = &[1, 2, 3];
    let b = &[3, 2, 1];
    let c = &[4, 4, 4];

    let a = &u128_vec_to_uint128_vec(a);
    let b = &u128_vec_to_uint128_vec(b);
    let c = u128_vec_to_uint128_vec(c);

    assert_that(&vec_add(a, b)).is_equal_to(c);
}

#[test]
fn vector_subtraction() {
    let a = &[10, 12, 13];
    let b = &[3, 2, 1];
    let c = &[7, 10, 12];

    let a = &u128_vec_to_uint128_vec(a);
    let b = &u128_vec_to_uint128_vec(b);
    let c = u128_vec_to_uint128_vec(c);

    assert_that(&vec_sub(a, b)).is_equal_to(c);
}

#[test]
fn vector_multiplication() {
    let a = &[3];
    let b = &["9.5"];
    let c = &[28];
    let d = &[29];

    let a = &u128_vec_to_uint128_vec(a);
    let b = &str_vec_to_dec_vec(b);
    let c = u128_vec_to_uint128_vec(c);
    let d = u128_vec_to_uint128_vec(d);

    assert_that(&vec_mul(a, b, true)).is_equal_to(c);
    assert_that(&vec_mul(a, b, false)).is_equal_to(d);
}

#[test]
fn vector_division() {
    let a = &[300];
    let b = &["9.5"];
    let c = &[31];
    let d = &[32];

    let a = &u128_vec_to_uint128_vec(a);
    let b = &str_vec_to_dec_vec(b);
    let c = u128_vec_to_uint128_vec(c);
    let d = u128_vec_to_uint128_vec(d);

    assert_that(&vec_div(a, b, true)).is_equal_to(c);
    assert_that(&vec_div(a, b, false)).is_equal_to(d);
}

#[test]
fn sum_correction() {
    let r = &[100_000_007, 299_999_998, 200_000_000, 0];
    let d: u128 = 600_000_000;
    let xd = &[100_000_007, 299_999_993, 200_000_000, 0];

    let r = &u128_vec_to_uint128_vec(r);
    let d = Uint128::from(d);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&correct_sum(r, d)).is_equal_to(xd);
}

#[test]
fn sum_correction2() {
    let r = &[300_002, 100_000, 300_002, 200_000, 0];
    let d: u128 = 900_000;
    let xd = &[300_000, 100_000, 300_000, 200_000, 0];

    let r = &u128_vec_to_uint128_vec(r);
    let d = Uint128::from(d);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&correct_sum(r, d)).is_equal_to(xd);
}

#[test]
fn sum_correction3() {
    let r = &[300_002, 100_001, 300_002, 200_000, 0];
    let d: u128 = 900_000;
    let xd = &[299_999, 100_001, 300_000, 200_000, 0];

    let r = &u128_vec_to_uint128_vec(r);
    let d = Uint128::from(d);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&correct_sum(r, d)).is_equal_to(xd);
}

#[test]
fn sum_correction4() {
    let r = &[299_998, 99_999, 299_998, 200_000, 0];
    let d: u128 = 900_000;
    let xd = &[300_001, 99_999, 300_000, 200_000, 0];

    let r = &u128_vec_to_uint128_vec(r);
    let d = Uint128::from(d);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&correct_sum(r, d)).is_equal_to(xd);
}

#[test]
// controlled mode case 1.1
fn big_payment_and_s2_greater_s1() {
    let x1 = &[100_000_000, 300_000_000, 200_000_000, 0];
    let k2 = &["0.3", "0.2", "0.5", "0"];
    let sd: u128 = 10_000_000_000;
    let xd = &[3_080_000_000, 1_820_000_000, 5_100_000_000, 0];

    let x1 = u128_vec_to_uint128_vec(x1);
    let k2 = str_vec_to_dec_vec(k2);
    let sd = Uint128::from(sd);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&rebalance_controlled(&x1, &k2, sd)).is_equal_to(xd);
}

#[test]
// controlled mode case 1.2
fn big_payment_and_s2_greater_s1_noisy() {
    let x1 = &[100_000_049, 300_000_007, 200_000_011, 0];
    let k2 = &["0.3", "0.2", "0.5", "0"];
    let sd: u128 = 10_000_000_000;
    let xd = &[3_079_999_972, 1_820_000_007, 5_100_000_021, 0];

    let x1 = u128_vec_to_uint128_vec(x1);
    let k2 = str_vec_to_dec_vec(k2);
    let sd = Uint128::from(sd);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&rebalance_controlled(&x1, &k2, sd)).is_equal_to(xd);
}

#[test]
// controlled mode case 2.1
fn s2_equal_s1() {
    let x1 = &[300_000_000, 200_000_000, 500_000_000, 0];
    let k2 = &["0.3", "0.2", "0.5", "0"];
    let sd: u128 = 100_000_000;
    let xd = &[30_000_000, 20_000_000, 50_000_000, 0];

    let x1 = u128_vec_to_uint128_vec(x1);
    let k2 = str_vec_to_dec_vec(k2);
    let sd = Uint128::from(sd);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&rebalance_controlled(&x1, &k2, sd)).is_equal_to(xd);
}

#[test]
// controlled mode case 2.2
fn s2_equal_s1_noisy() {
    let x1 = &[300_000_049, 200_000_007, 500_000_011, 0];
    let k2 = &["0.3", "0.2", "0.5", "0"];
    let sd: u128 = 100_000_000;
    let xd = &[29_999_972, 20_000_007, 50_000_021, 0];

    let x1 = u128_vec_to_uint128_vec(x1);
    let k2 = str_vec_to_dec_vec(k2);
    let sd = Uint128::from(sd);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&rebalance_controlled(&x1, &k2, sd)).is_equal_to(xd);
}

#[test]
// controlled mode case 3.1
fn small_payment_and_s2_greater_s1() {
    let x1 = &[100_000_000, 300_000_000, 200_000_000, 0];
    let k2 = &["0.3", "0.2", "0.5", "0"];
    let sd: u128 = 100_000_000;
    let xd = &[38_888_889, 0, 61_111_111, 0];

    let x1 = u128_vec_to_uint128_vec(x1);
    let k2 = str_vec_to_dec_vec(k2);
    let sd = Uint128::from(sd);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&rebalance_controlled(&x1, &k2, sd)).is_equal_to(xd);
}

#[test]
// controlled mode case 3.2
fn small_payment_and_s2_greater_s1_noisy() {
    let x1 = &[115_000_012, 35_000_007, 0];
    let k2 = &["0.3", "0.7", "0"];
    let sd: u128 = 200_000;
    let xd = &[0, 200_000, 0];

    let x1 = u128_vec_to_uint128_vec(x1);
    let k2 = str_vec_to_dec_vec(k2);
    let sd = Uint128::from(sd);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&rebalance_controlled(&x1, &k2, sd)).is_equal_to(xd);
}

#[test]
// proportional mode case 1.1
fn proportional() {
    let k2 = &["0.3", "0.2", "0.5", "0"];
    let sd: u128 = 100_000_000;
    let xd = &[30_000_000, 20_000_000, 50_000_000, 0];

    let k2 = str_vec_to_dec_vec(k2);
    let sd = Uint128::from(sd);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&rebalance_proportional(&k2, sd)).is_equal_to(xd);
}

#[test]
// proportional mode case 1.2
fn proportional_noisy() {
    let k2 = &["0.3", "0.2", "0.5", "0"];
    let sd: u128 = 100_000_011;
    let xd = &[30_000_004, 20_000_003, 50_000_004, 0];

    let k2 = str_vec_to_dec_vec(k2);
    let sd = Uint128::from(sd);
    let xd = u128_vec_to_uint128_vec(xd);

    assert_that(&rebalance_proportional(&k2, sd)).is_equal_to(xd);
}

// // TODO: add tests for bank transfer
// #[test]
// fn get_transfer_messages() {
//     let asset_list_alice = vec![
//         Asset::new(
//             DENOM_ATOM,
//             &Addr::unchecked(ADDR_ALICE_ATOM),
//             Uint128::zero(),
//             str_to_dec("0.5"),
//             Uint128::from(125_u128),
//         ),
//         Asset::new(
//             DENOM_JUNO,
//             &Addr::unchecked(ADDR_ALICE_JUNO),
//             Uint128::zero(),
//             str_to_dec("0.5"),
//             Uint128::from(625_u128),
//         ),
//     ];

//     let user_alice = User::new(
//         &asset_list_alice,
//         Uint128::from(3_u128),
//         Uint128::from(7500_u128),
//         IS_REBALANCING_USED,
//     );

//     let users_with_addresses: Vec<(Addr, User)> =
//         vec![(Addr::unchecked(ADDR_ALICE_OSMO), user_alice)];

//     let contract_balances = vec![
//         Coin {
//             denom: DENOM_ATOM.to_string(),
//             amount: Uint128::from(122_u128),
//         },
//         Coin {
//             denom: DENOM_JUNO.to_string(),
//             amount: Uint128::from(609_u128),
//         },
//         Coin {
//             denom: DENOM_EEUR.to_string(),
//             amount: Uint128::from(7500_u128),
//         },
//     ];
//     let ledger: Ledger = Ledger {
//         global_delta_balance_list: vec![
//             Uint128::from(125_u128),
//             Uint128::from(625_u128),
//             Uint128::from(0_u128),
//         ],
//         global_delta_cost_list: vec![
//             Uint128::from(1250_u128),
//             Uint128::from(1250_u128),
//             Uint128::from(0_u128),
//         ],
//         global_denom_list: vec![
//             DENOM_ATOM.to_string(),
//             DENOM_JUNO.to_string(),
//             DENOM_EEUR.to_string(),
//         ],
//         global_price_list: vec![str_to_dec("10"), str_to_dec("2"), str_to_dec("1")],
//     };

//     let fee_default = str_to_dec("0.01");
//     let fee_native = str_to_dec("0.02");
//     let dapp_address_and_denom_list: Vec<(Addr, String)> = vec![
//         (Addr::unchecked(ADDR_BOB_ATOM), DENOM_ATOM.to_string()),
//         (Addr::unchecked(ADDR_BOB_JUNO), DENOM_JUNO.to_string()),
//         (Addr::unchecked(ADDR_BOB_STARS), DENOM_STARS.to_string()),
//         (Addr::unchecked(ADDR_BOB_OSMO), DENOM_EEUR.to_string()),
//     ];

//     let pools_with_denoms: Vec<(String, Pool)> = vec![
//         // ATOM / OSMO
//         (
//             DENOM_ATOM.to_string(),
//             Pool::new(
//                 Uint128::one(),
//                 str_to_dec("9.5"),
//                 "channel-1110",
//                 "transfer",
//                 "uatom",
//             ),
//         ),
//         // JUNO / OSMO
//         (
//             DENOM_JUNO.to_string(),
//             Pool::new(
//                 Uint128::from(497_u128),
//                 str_to_dec("1.5"),
//                 "channel-1110",
//                 "transfer",
//                 "ujuno",
//             ),
//         ),
//         // STARS / OSMO
//         (
//             DENOM_STARS.to_string(),
//             Pool::new(
//                 Uint128::from(604_u128),
//                 str_to_dec("0.03"),
//                 "channel-",
//                 "transfer",
//                 "ustars",
//             ),
//         ),
//         // SCRT / OSMO
//         (
//             DENOM_SCRT.to_string(),
//             Pool::new(
//                 Uint128::from(584_u128),
//                 str_to_dec("0.7"),
//                 "channel-",
//                 "transfer",
//                 "uscrt",
//             ),
//         ),
//     ];

//     transfer_router(
//         &pools_with_denoms,
//         &users_with_addresses,
//         contract_balances,
//         ledger,
//         fee_default,
//         fee_native,
//         dapp_address_and_denom_list,
//         DENOM_EEUR,
//         Timestamp::default(),
//     );
// }

// #[test]
// fn calc_ledger() {
//     let deposited_alice = Uint128::from(1_035_u128);
//     let down_counter_alice = Uint128::from(5_u128);

//     let asset_list_alice = vec![
//         Asset::new(
//             DENOM_ATOM,
//             &Addr::unchecked(ADDR_ALICE_ATOM),
//             Uint128::zero(),
//             str_to_dec("0.7"),
//             Uint128::zero(),
//         ),
//         Asset::new(
//             DENOM_JUNO,
//             &Addr::unchecked(ADDR_ALICE_JUNO),
//             Uint128::zero(),
//             str_to_dec("0.3"),
//             Uint128::zero(),
//         ),
//     ];

//     let user_alice = User::new(
//         &asset_list_alice,
//         down_counter_alice,
//         deposited_alice,
//         !IS_REBALANCING_USED,
//     );

//     let deposited_bob = Uint128::from(4_130_u128);
//     let down_counter_bob = Uint128::from(10_u128);

//     let asset_list_bob = vec![
//         Asset::new(
//             DENOM_ATOM,
//             &Addr::unchecked(ADDR_BOB_ATOM),
//             Uint128::zero(),
//             str_to_dec("0.4"),
//             Uint128::zero(),
//         ),
//         Asset::new(
//             DENOM_STARS,
//             &Addr::unchecked(ADDR_BOB_STARS),
//             Uint128::zero(),
//             str_to_dec("0.6"),
//             Uint128::zero(),
//         ),
//     ];

//     let user_bob = User::new(
//         &asset_list_bob,
//         down_counter_bob,
//         deposited_bob,
//         !IS_REBALANCING_USED,
//     );

//     let users_with_addresses: Vec<(Addr, User)> = vec![
//         (Addr::unchecked(ADDR_ALICE_OSMO), user_alice),
//         (Addr::unchecked(ADDR_BOB_OSMO), user_bob),
//     ];

//     let pools_with_denoms: Vec<(String, Pool)> = vec![
//         // ATOM / OSMO
//         (
//             DENOM_ATOM.to_string(),
//             Pool::new(
//                 Uint128::one(),
//                 str_to_dec("9.5"),
//                 "channel-1110",
//                 "transfer",
//                 "uatom",
//             ),
//         ),
//         // JUNO / OSMO
//         (
//             DENOM_JUNO.to_string(),
//             Pool::new(
//                 Uint128::from(497_u128),
//                 str_to_dec("1.5"),
//                 "channel-1110",
//                 "transfer",
//                 "ujuno",
//             ),
//         ),
//         // STARS / OSMO
//         (
//             DENOM_STARS.to_string(),
//             Pool::new(
//                 Uint128::from(604_u128),
//                 str_to_dec("0.03"),
//                 "channel-",
//                 "transfer",
//                 "ustars",
//             ),
//         ),
//         // SCRT / OSMO
//         (
//             DENOM_SCRT.to_string(),
//             Pool::new(
//                 Uint128::from(584_u128),
//                 str_to_dec("0.7"),
//                 "channel-",
//                 "transfer",
//                 "uscrt",
//             ),
//         ),
//     ];

//     let mut deposited_pre: Vec<Uint128> = vec![deposited_alice, deposited_bob];
//     let mut deposited_diff: Vec<Uint128> = vec![];
//     let mut user_daily_payment_right: Vec<Uint128> = vec![];
//     let mut user_with_addr_list: Vec<(Addr, User)> = users_with_addresses;

//     for _i in 0..=(down_counter_bob).u128() {
//         let (ledger, user_with_addr) = get_ledger(&pools_with_denoms, &user_with_addr_list);
//         user_with_addr_list = vec![];

//         let mut global_delta_balance_list_left: Vec<Uint128> =
//             vec![Uint128::zero(); ledger.global_denom_list.len()];
//         let mut global_delta_cost_list_left: Vec<Uint128> =
//             vec![Uint128::zero(); ledger.global_denom_list.len()];

//         for (addr, user) in user_with_addr {
//             let mut user_daily_payment_right_item: Uint128 = Uint128::zero();
//             let mut asset_list_updated: Vec<Asset> = vec![];

//             for asset in user.asset_list {
//                 let index = ledger
//                     .global_denom_list
//                     .iter()
//                     .position(|x| x == &asset.denom)
//                     .unwrap();

//                 let price = ledger.global_price_list[index];
//                 let amount = asset.amount_to_transfer;
//                 let daily_payment = dec_to_uint128((uint128_to_dec(amount) * price).ceil());
//                 user_daily_payment_right_item += daily_payment;

//                 global_delta_balance_list_left[index] += amount;

//                 global_delta_cost_list_left[index] += daily_payment;

//                 asset_list_updated.push(Asset {
//                     amount_to_transfer: Uint128::zero(), // it is sent via ibc
//                     ..asset
//                 });
//             }

//             user_daily_payment_right.push(user_daily_payment_right_item);
//             deposited_diff.push(user.deposited);
//             user_with_addr_list.push((
//                 addr,
//                 User {
//                     asset_list: asset_list_updated,
//                     ..user
//                 },
//             ));
//         }

//         let user_daily_payment_left = vec_sub(&deposited_pre, &deposited_diff);
//         deposited_pre = deposited_diff;
//         deposited_diff = vec![];

//         // 1) user_daily_payment == sum(user_asset_amount * price)
//         assert_eq!(user_daily_payment_left, user_daily_payment_right);
//         user_daily_payment_right = vec![];

//         // 2) sum(user_asset) == global_delta_balance_list
//         assert_eq!(
//             global_delta_balance_list_left,
//             ledger.global_delta_balance_list
//         );

//         // 3) sum(user_asset * price) ==  global_delta_cost_list
//         assert_eq!(global_delta_cost_list_left, ledger.global_delta_cost_list);
//     }
// }

#[test]
fn xyk_amounts() {
    assert_that(&get_xyk_amount(P12, 6, 6, str_to_dec("1"), str_to_dec("1"))).is_equal_to(P12);

    assert_that(&get_xyk_amount(P12, 6, 6, str_to_dec("1"), str_to_dec("2"))).is_equal_to(P12 / 2);

    assert_that(&get_xyk_amount(P12, 6, 6, str_to_dec("2"), str_to_dec("1"))).is_equal_to(P12 * 2);

    assert_that(&get_xyk_amount(
        P12,
        6,
        18,
        str_to_dec("1"),
        str_to_dec("1"),
    ))
    .is_equal_to(P24);

    assert_that(&get_xyk_amount(
        P24,
        18,
        6,
        str_to_dec("1"),
        str_to_dec("1"),
    ))
    .is_equal_to(P12);
}

#[test]
fn xyk_prices() {
    assert_that(&get_xyk_price(str_to_dec("1"), 6, 6, P12, P12)).is_equal_to(str_to_dec("1"));

    assert_that(&get_xyk_price(str_to_dec("1"), 6, 6, P12 * 2, P12)).is_equal_to(str_to_dec("2"));

    assert_that(&get_xyk_price(str_to_dec("1"), 6, 6, P12 / 2, P12)).is_equal_to(str_to_dec("0.5"));

    assert_that(&get_xyk_price(str_to_dec("1"), 18, 6, P24, P12)).is_equal_to(str_to_dec("1"));

    assert_that(&get_xyk_price(str_to_dec("1"), 6, 18, P12, P24)).is_equal_to(str_to_dec("1"));
}
