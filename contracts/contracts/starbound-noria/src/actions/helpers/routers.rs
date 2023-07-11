use cosmwasm_std::{
    coin, to_binary, Addr, BankMsg, Coin, CosmosMsg, Decimal, StdResult, Uint128, WasmMsg,
};

use crate::{
    actions::helpers::math::{dec_to_uint128, u128_to_dec},
    error::ContractError,
    state::{Asset, Ledger, User},
};

pub enum SwapMsg {
    Router(terraswap::router::ExecuteMsg),
    Token(cw20_base::msg::ExecuteMsg),
}

// (A,C) -> [(A,B), (B,C)]
pub fn get_swap_routes(
    pairs: &Vec<terraswap::asset::PairInfo>, // pairs from factory
    asset_in: terraswap::asset::AssetInfo,
    asset_out: terraswap::asset::AssetInfo,
) -> Result<Vec<(terraswap::asset::AssetInfo, terraswap::asset::AssetInfo)>, ContractError> {
    let mut routes: Vec<(terraswap::asset::AssetInfo, terraswap::asset::AssetInfo)> = vec![];

    for pair in pairs {
        let terraswap::asset::PairInfo { asset_infos, .. } = pair;

        if asset_infos.contains(&asset_in) && asset_infos.contains(&asset_out) {
            routes.push((asset_in, asset_out));
            break;
        }

        if asset_infos.contains(&asset_in) {
            let intermediate_asset = asset_infos
                .iter()
                .find(|x| !x.equal(&asset_in))
                .ok_or(ContractError::ItermediateAssetIsNotFound {})?;

            if pairs.iter().any(|pair| {
                pair.asset_infos.contains(intermediate_asset)
                    && pair.asset_infos.contains(&asset_out)
            }) {
                routes = vec![
                    (asset_in, intermediate_asset.to_owned()),
                    (intermediate_asset.to_owned(), asset_out),
                ];
                break;
            }
        }

        if asset_infos.contains(&asset_out) {
            let intermediate_asset = asset_infos
                .iter()
                .find(|x| !x.equal(&asset_out))
                .ok_or(ContractError::ItermediateAssetIsNotFound {})?;

            if pairs.iter().any(|pair| {
                pair.asset_infos.contains(&asset_in)
                    && pair.asset_infos.contains(intermediate_asset)
            }) {
                routes = vec![
                    (asset_in, intermediate_asset.to_owned()),
                    (intermediate_asset.to_owned(), asset_out),
                ];
                break;
            }
        }
    }

    if routes.is_empty() {
        Err(ContractError::EmptyRoutes {})?;
    }

    Ok(routes)
}

pub fn get_swap_with_terraswap_router_config(
    router_address: &Addr,
    pairs: &Vec<terraswap::asset::PairInfo>, // pairs from factory
    asset_in: terraswap::asset::AssetInfo,
    asset_out: terraswap::asset::AssetInfo,
    amount: Uint128,
) -> Result<(String, SwapMsg, Option<Vec<Coin>>), ContractError> {
    let routes = get_swap_routes(pairs, asset_in, asset_out)?;

    let swap_operations = routes
        .iter()
        .cloned()
        .map(
            |(offer_asset_info, ask_asset_info)| terraswap::router::SwapOperation::TerraSwap {
                offer_asset_info,
                ask_asset_info,
            },
        )
        .collect::<Vec<terraswap::router::SwapOperation>>();

    let hook_msg = terraswap::router::ExecuteMsg::ExecuteSwapOperations {
        operations: swap_operations.to_owned(),
        minimum_receive: None,
        to: None,
    };

    let (contract_addr, msg, funds) = match &swap_operations[0] {
        terraswap::router::SwapOperation::TerraSwap {
            offer_asset_info: terraswap::asset::AssetInfo::NativeToken { denom },
            ..
        } => (
            router_address.to_string(),
            SwapMsg::Router(hook_msg),
            Some(vec![coin(amount.u128(), denom)]),
        ),
        terraswap::router::SwapOperation::TerraSwap {
            offer_asset_info: terraswap::asset::AssetInfo::Token { contract_addr },
            ..
        } => (
            contract_addr.to_string(),
            SwapMsg::Token(cw20_base::msg::ExecuteMsg::Send {
                contract: router_address.to_string(),
                amount,
                msg: to_binary(&hook_msg)?,
            }),
            None,
        ),
    };

    Ok((contract_addr, msg, funds))
}

#[allow(clippy::type_complexity)]
pub fn transfer_router(
    users_with_addresses: &[(Addr, User)],
    contract_balances: Vec<(terraswap::asset::AssetInfo, Uint128)>,
    ledger: Ledger,
) -> StdResult<(Vec<(Addr, User)>, Vec<CosmosMsg>)> {
    // get vector of ratios to correct amount_to_transfer due to difference between
    // contract balances and calculated values
    let asset_amount_correction_vector = ledger
        .global_denom_list
        .iter()
        .enumerate()
        .map(|(i, denom)| {
            let asset_amount = contract_balances
                .iter()
                .find(|(asset_info, _amount)| asset_info.equal(denom))
                .map_or(Decimal::zero(), |(_, amount)| u128_to_dec(*amount));

            asset_amount
                .checked_div(u128_to_dec(ledger.global_delta_balance_list[i]))
                .map_or(Decimal::zero(), |y| y)
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
                .position(|x| x.equal(&asset.info))
            {
                let amount_to_transfer = dec_to_uint128(
                    (u128_to_dec(asset.amount_to_transfer) * asset_amount_correction_vector[index])
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

                match asset.info.clone() {
                    terraswap::asset::AssetInfo::NativeToken { denom } => {
                        let bank_msg = CosmosMsg::Bank(BankMsg::Send {
                            to_address: addr.to_string(),
                            amount: vec![coin(amount_to_transfer.u128(), denom)],
                        });

                        msg_list.push(bank_msg);
                    }
                    terraswap::asset::AssetInfo::Token { contract_addr } => {
                        let cw20_msg = cw20_base::msg::ExecuteMsg::Transfer {
                            recipient: addr.to_string(),
                            amount: amount_to_transfer,
                        };

                        let wasm_msg = CosmosMsg::Wasm(WasmMsg::Execute {
                            contract_addr,
                            msg: to_binary(&cw20_msg)?,
                            funds: vec![],
                        });

                        msg_list.push(wasm_msg);
                    }
                }
            };
        }

        users_with_addresses_updated.push((addr, User { asset_list, ..user }));
    }

    Ok((users_with_addresses_updated, msg_list))
}
