use cosmwasm_std::{
    coin,
    testing::{mock_dependencies, mock_env, mock_info, MockApi, MockQuerier, MockStorage},
    Addr, Attribute, Coin, Decimal, Empty, Env, MessageInfo, OwnedDeps, Response, StdError,
    StdResult, Uint128,
};
use cw_multi_test::{App, AppResponse, ContractWrapper, Executor};

use serde::Serialize;
use strum_macros::{Display, EnumString, IntoStaticStr};

use crate::{
    actions::helpers::math::{str_to_dec, u128_to_dec},
    error::ContractError,
    messages::{execute::ExecuteMsg, instantiate::InstantiateMsg, query::QueryMsg},
    state::{Asset, User, CHAIN_ID_DEV},
};

#[derive(Debug, Clone, Copy, Display, EnumString, IntoStaticStr)]
pub enum ProjectAccount {
    #[strum(serialize = "noria18tnvnwkklyv4dyuj8x357n7vray4v4zugmp3du")]
    Admin,
    #[strum(serialize = "noria1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyhd7uh3")]
    Alice,
    #[strum(serialize = "noria1chgwz55h9kepjq0fkj5supl2ta3nwu63sck8c3")]
    Bob,
}

#[derive(Debug, Clone, Copy, Display, EnumString, IntoStaticStr)]
pub enum ProjectCoin {
    #[strum(serialize = "ucrd")]
    Denom,
    #[strum(serialize = "unoria")]
    Noria,
}

#[derive(Debug, Clone, Copy, Display, EnumString, IntoStaticStr)]
pub enum ProjectToken {
    #[strum(serialize = "ATOM")]
    Atom,
    #[strum(serialize = "LUNA")]
    Luna,
    #[strum(serialize = "INJ")]
    Inj,
}

#[derive(Debug, Clone, Copy)]
pub enum ProjectAsset {
    Coin(ProjectCoin),
    Token(ProjectToken),
}

impl AsRef<str> for ProjectAsset {
    fn as_ref(&self) -> &str {
        match self {
            ProjectAsset::Coin(coin) => coin.into(),
            ProjectAsset::Token(token) => token.into(),
        }
    }
}

pub struct Project {
    app: App,
    app_contract_address: Addr,
    terraswap_factory_address: Addr,
    cw20_base_token_list: Vec<(ProjectToken, Addr)>,
}

impl Project {
    pub fn new(chain_id_mocked: Option<&str>) -> Self {
        // create app and distribute coins to accounts
        let account_and_funds_amount_list: Vec<(ProjectAccount, u128)> = vec![
            (ProjectAccount::Admin, 1_100_000),
            (ProjectAccount::Alice, 1_100),
            (ProjectAccount::Bob, 1_100),
        ];

        let mut app = Self::create_app_with_balances(&account_and_funds_amount_list);

        // set specific chain_id to prevent execution of mocked actions on real networks
        let chain_id = chain_id_mocked.unwrap_or(CHAIN_ID_DEV);
        app.update_block(|block| block.chain_id = String::from(chain_id));

        // register contracts code
        let app_code_id = Self::store_app_code(&mut app);
        let cw20_base_code_id = Self::store_cw20_base_code(&mut app);
        let terraswap_pair_code_id = Self::store_terraswap_pair_code(&mut app);
        let terraswap_factory_code_id = Self::store_terraswap_factory_code(&mut app);

        // instantiate contracts
        let app_contract_address =
            Self::instantiate_contract(&mut app, app_code_id, "app", &Empty {});

        let cw20_base_token_list: Vec<(ProjectToken, Addr)> = vec![
            (ProjectToken::Atom, 6u8),
            (ProjectToken::Luna, 6u8),
            (ProjectToken::Inj, 18u8),
        ]
        .iter()
        .map(|(project_token, decimals)| {
            (
                *project_token,
                Self::create_cw20_base_token(
                    &mut app,
                    cw20_base_code_id,
                    *project_token,
                    *decimals,
                    &account_and_funds_amount_list,
                ),
            )
        })
        .collect();

        let terraswap_factory_address = Self::create_terraswap_factory(
            &mut app,
            terraswap_factory_code_id,
            terraswap_pair_code_id,
            cw20_base_code_id,
        );

        // register coins at factory
        vec![(ProjectCoin::Denom, 6u8), (ProjectCoin::Noria, 6u8)]
            .iter()
            .for_each(|(project_coin, decimals)| {
                Self::register_coin(
                    &mut app,
                    &terraswap_factory_address,
                    *project_coin,
                    *decimals,
                );
            });

        // create pools
        vec![
            (
                ProjectAsset::Token(ProjectToken::Atom),
                ProjectAsset::Token(ProjectToken::Luna),
            ),
            (
                ProjectAsset::Coin(ProjectCoin::Denom),
                ProjectAsset::Token(ProjectToken::Inj),
            ),
            (
                ProjectAsset::Coin(ProjectCoin::Denom),
                ProjectAsset::Token(ProjectToken::Luna),
            ),
            (
                ProjectAsset::Coin(ProjectCoin::Denom),
                ProjectAsset::Coin(ProjectCoin::Noria),
            ),
        ]
        .iter()
        .for_each(|project_asset_pair| {
            Self::create_terraswap_pool(
                &mut app,
                &terraswap_factory_address,
                *project_asset_pair,
                &cw20_base_token_list,
            );
        });

        Self {
            app,
            app_contract_address,
            terraswap_factory_address,
            cw20_base_token_list,
        }
    }

    fn create_app_with_balances(
        account_and_funds_amount_list: &Vec<(ProjectAccount, u128)>,
    ) -> App {
        App::new(|router, _api, storage| {
            for (project_account, funds_amount) in account_and_funds_amount_list {
                router
                    .bank
                    .init_balance(
                        storage,
                        &Addr::unchecked(project_account.to_string()),
                        vec![
                            coin(funds_amount.to_owned(), ProjectCoin::Denom.to_string()),
                            coin(funds_amount.to_owned(), ProjectCoin::Noria.to_string()),
                        ],
                    )
                    .unwrap();
            }
        })
    }

    fn store_app_code(app: &mut App) -> u64 {
        app.store_code(Box::new(ContractWrapper::new(
            crate::contract::execute,
            crate::contract::instantiate,
            crate::contract::query,
        )))
    }

    fn store_cw20_base_code(app: &mut App) -> u64 {
        app.store_code(Box::new(ContractWrapper::new(
            cw20_base::contract::instantiate,
            cw20_base::contract::instantiate,
            cw20_base::contract::query,
        )))
    }

    fn store_terraswap_pair_code(app: &mut App) -> u64 {
        app.store_code(Box::new(
            ContractWrapper::new(
                terraswap_pair::contract::execute,
                terraswap_pair::contract::instantiate,
                terraswap_pair::contract::query,
            )
            .with_reply(terraswap_pair::contract::reply),
        ))
    }

    fn store_terraswap_factory_code(app: &mut App) -> u64 {
        app.store_code(Box::new(
            ContractWrapper::new(
                terraswap_factory::contract::execute,
                terraswap_factory::contract::instantiate,
                terraswap_factory::contract::query,
            )
            .with_reply(terraswap_factory::contract::reply),
        ))
    }

    fn instantiate_contract(
        app: &mut App,
        code_id: u64,
        label: &str,
        init_msg: &impl Serialize,
    ) -> Addr {
        app.instantiate_contract(
            code_id,
            Addr::unchecked(ProjectAccount::Admin.to_string()),
            init_msg,
            &[],
            label,
            Some(ProjectAccount::Admin.to_string()),
        )
        .unwrap()
    }

    fn create_cw20_base_token(
        app: &mut App,
        code_id: u64,
        project_token: ProjectToken,
        decimals: u8,
        account_and_funds_amount_list: &Vec<(ProjectAccount, u128)>,
    ) -> Addr {
        let symbol: &str = project_token.into();

        let initial_balances: Vec<cw20::Cw20Coin> = account_and_funds_amount_list
            .iter()
            .map(|(project_account, funds_amount)| cw20::Cw20Coin {
                address: project_account.to_string(),
                amount: Uint128::from(funds_amount.to_owned()),
            })
            .collect();

        Self::instantiate_contract(
            app,
            code_id,
            &symbol.to_lowercase(),
            &cw20_base::msg::InstantiateMsg {
                name: format!("cw20-base token {}", symbol),
                symbol: symbol.to_string(),
                decimals,
                initial_balances,
                mint: None,
                marketing: None,
            },
        )
    }

    fn create_terraswap_factory(
        app: &mut App,
        terraswap_factory_code_id: u64,
        terraswap_pair_code_id: u64,
        cw20_base_code_id: u64,
    ) -> Addr {
        Self::instantiate_contract(
            app,
            terraswap_factory_code_id,
            "factory",
            &terraswap::factory::InstantiateMsg {
                pair_code_id: terraswap_pair_code_id,
                token_code_id: cw20_base_code_id,
            },
        )
    }

    fn register_coin(
        app: &mut App,
        terraswap_factory_address: &Addr,
        project_coin: ProjectCoin,
        decimals: u8,
    ) -> AppResponse {
        app.execute_contract(
            Addr::unchecked(ProjectAccount::Admin.to_string()),
            terraswap_factory_address.to_owned(),
            &terraswap::factory::ExecuteMsg::AddNativeTokenDecimals {
                denom: project_coin.to_string(),
                decimals,
            },
            &[coin(1, project_coin.to_string())],
        )
        .unwrap()
    }

    fn create_terraswap_pool(
        app: &mut App,
        terraswap_factory_address: &Addr,
        project_asset_pair: (ProjectAsset, ProjectAsset),
        cw20_base_token_list: &Vec<(ProjectToken, Addr)>,
    ) -> AppResponse {
        let asset_infos = [
            Self::project_asset_to_terraswap_asset_info(project_asset_pair.0, cw20_base_token_list),
            Self::project_asset_to_terraswap_asset_info(project_asset_pair.1, cw20_base_token_list),
        ];

        app.execute_contract(
            Addr::unchecked(ProjectAccount::Admin.to_string()),
            terraswap_factory_address.to_owned(),
            &terraswap::factory::ExecuteMsg::CreatePair {
                asset_infos: asset_infos.clone(),
            },
            &[],
        )
        .unwrap()
    }

    fn get_cw20_base_token_address(
        cw20_base_token_list: &Vec<(ProjectToken, Addr)>,
        project_token: ProjectToken,
    ) -> Addr {
        let (_token, address) = cw20_base_token_list
            .iter()
            .find(|(token, _address)| token.to_string() == project_token.to_string())
            .unwrap();

        address.to_owned()
    }

    fn project_asset_to_terraswap_asset_info(
        project_asset: ProjectAsset,
        cw20_base_token_list: &Vec<(ProjectToken, Addr)>,
    ) -> terraswap::asset::AssetInfo {
        let asset1 = match project_asset {
            ProjectAsset::Coin(project_coin) => terraswap::asset::AssetInfo::NativeToken {
                denom: project_coin.to_string(),
            },
            ProjectAsset::Token(project_token) => terraswap::asset::AssetInfo::Token {
                contract_addr: Self::get_cw20_base_token_address(
                    cw20_base_token_list,
                    project_token,
                )
                .to_string(),
            },
        };

        asset1
    }
}

#[test]
fn ref_test() {
    let project = Project::new(None);

    // query pairs
    let terraswap::factory::PairsResponse { pairs } = project
        .app
        .wrap()
        .query_wasm_smart(
            project.terraswap_factory_address,
            &terraswap::factory::QueryMsg::Pairs {
                start_after: None,
                limit: None,
            },
        )
        .unwrap();

    println!("{:#?}", pairs);
}
