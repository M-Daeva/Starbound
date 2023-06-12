use cosmwasm_std::{coin, Addr, Coin, Empty, StdResult, Uint128};
use cw_multi_test::{App, AppResponse, ContractWrapper, Executor};

use serde::Serialize;
use strum::IntoEnumIterator;
use strum_macros::{Display, EnumIter, EnumString, IntoStaticStr};

use crate::state::CHAIN_ID_DEV;

const ADMIN_FUNDS_AMOUNT: u128 = 1_000_000_000_000_000_000;

#[derive(Debug, Clone, Copy, Display, EnumString, IntoStaticStr)]
pub enum ProjectAccount {
    #[strum(serialize = "admin")]
    Admin,
    #[strum(serialize = "alice")]
    Alice,
    #[strum(serialize = "bob")]
    Bob,
}

#[derive(Debug, Clone, Copy, Display, EnumString, IntoStaticStr, EnumIter)]
pub enum ProjectCoin {
    #[strum(serialize = "ucrd")]
    Denom,
    #[strum(serialize = "unoria")]
    Noria,
}

#[derive(Debug, Clone, Copy, Display, EnumString, IntoStaticStr, EnumIter)]
pub enum ProjectToken {
    #[strum(serialize = "contract1")]
    Atom,
    #[strum(serialize = "contract2")]
    Luna,
    #[strum(serialize = "contract3")]
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

trait ToProjectAsset {
    fn to_project_asset(&self) -> ProjectAsset;
}

impl ToProjectAsset for ProjectCoin {
    fn to_project_asset(&self) -> ProjectAsset {
        ProjectAsset::Coin(*self)
    }
}

impl ToProjectAsset for ProjectToken {
    fn to_project_asset(&self) -> ProjectAsset {
        ProjectAsset::Token(*self)
    }
}

trait ToTerraswapAssetInfo {
    fn to_terraswap_asset_info(&self) -> terraswap::asset::AssetInfo;
}

impl ToTerraswapAssetInfo for ProjectCoin {
    fn to_terraswap_asset_info(&self) -> terraswap::asset::AssetInfo {
        terraswap::asset::AssetInfo::NativeToken {
            denom: self.to_string(),
        }
    }
}

impl ToTerraswapAssetInfo for ProjectToken {
    fn to_terraswap_asset_info(&self) -> terraswap::asset::AssetInfo {
        terraswap::asset::AssetInfo::Token {
            contract_addr: self.to_string(),
        }
    }
}

impl ToTerraswapAssetInfo for ProjectAsset {
    fn to_terraswap_asset_info(&self) -> terraswap::asset::AssetInfo {
        match self {
            ProjectAsset::Coin(project_coin) => project_coin.to_terraswap_asset_info(),
            ProjectAsset::Token(project_token) => project_token.to_terraswap_asset_info(),
        }
    }
}

pub struct Project {
    app: App,
    app_contract_address: Addr,
    terraswap_factory_address: Addr,
    cw20_base_token_list: Vec<(ProjectToken, Addr)>,
    terraswap_pair_list: Vec<terraswap::asset::PairInfo>,
}

impl Project {
    pub fn new(chain_id_mocked: Option<&str>) -> Self {
        // create app and distribute coins to accounts
        let account_and_funds_amount_list: Vec<(ProjectAccount, u128)> = vec![
            (ProjectAccount::Admin, ADMIN_FUNDS_AMOUNT * 11 / 10),
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
        let terraswap_lp_token_code_id = Self::store_terraswap_lp_token_code(&mut app);
        let terraswap_pair_code_id = Self::store_terraswap_pair_code(&mut app);
        let terraswap_factory_code_id = Self::store_terraswap_factory_code(&mut app);

        // instantiate contracts
        let app_contract_address =
            Self::instantiate_contract(&mut app, app_code_id, "app", &Empty {});

        // DON'T CHANGE TOKEN INIT ORDER AS ITS ADDRESSES ARE HARDCODED IN ProjectToken ENUM
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
            terraswap_lp_token_code_id,
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

        // create pairs
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
        .for_each(|(project_coin_or_token1, project_coin_or_token2)| {
            Self::create_terraswap_pool(
                &mut app,
                &terraswap_factory_address,
                *project_coin_or_token1,
                *project_coin_or_token2,
            );
        });

        // query pairs
        let terraswap_pair_list = Self::query_pairs(&app, &terraswap_factory_address);

        // TODO: write get_pool_and_lp_by_asset_pair()
        let info = Self::get_pair_info_by_asset_pair(
            &terraswap_pair_list,
            ProjectCoin::Noria,
            ProjectCoin::Denom,
        );
        println!("\n{:#?}\n", info);

        // TODO: increase allowance for tokens

        // TODO: provide liquidity for assets
        // contract_addr: "contract11",
        // liquidity_token: "contract12",
        Self::provide_liquidity(
            &mut app,
            &Addr::unchecked("contract11"),
            ProjectCoin::Denom,
            ProjectCoin::Noria,
        );

        Self {
            app,
            app_contract_address,
            terraswap_factory_address,
            cw20_base_token_list,
            terraswap_pair_list,
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

    // Debug and Clone must be implemented on terraswap::token::InstantiateMsg
    fn store_terraswap_lp_token_code(app: &mut App) -> u64 {
        app.store_code(Box::new(ContractWrapper::new(
            terraswap_token::contract::execute,
            terraswap_token::contract::instantiate,
            terraswap_token::contract::query,
        )))
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
        let token_postfix: u8 = project_token
            .to_string()
            .strip_prefix("contract")
            .unwrap()
            .parse()
            .unwrap();

        let symbol = format!("TK{}", "N".repeat(token_postfix as usize)); // max 10 tokens

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
            &format!("toke{}", "n".repeat(token_postfix as usize)),
            &cw20_base::msg::InstantiateMsg {
                name: format!("cw20-base token {}", symbol),
                symbol,
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
        project_coin_or_token1: impl ToTerraswapAssetInfo,
        project_coin_or_token2: impl ToTerraswapAssetInfo,
    ) -> AppResponse {
        app.execute_contract(
            Addr::unchecked(ProjectAccount::Admin.to_string()),
            terraswap_factory_address.to_owned(),
            &terraswap::factory::ExecuteMsg::CreatePair {
                asset_infos: [
                    project_coin_or_token1.to_terraswap_asset_info(),
                    project_coin_or_token2.to_terraswap_asset_info(),
                ],
            },
            &[],
        )
        .unwrap()
    }

    // fn increase_allowance(
    //     app: &mut App,
    //     project_token: ProjectToken,
    //     pool_address: &Addr,
    // ) -> AppResponse {
    //     app.execute_contract(
    //         Addr::unchecked(ProjectAccount::Admin.to_string()),
    //         Addr::unchecked(project_token.to_string()),
    //         &cw20_base::msg::ExecuteMsg::IncreaseAllowance {
    //             spender: pool_address.to_string(),
    //             amount: Uint128::from(ADMIN_FUNDS_AMOUNT),
    //             expires: None,
    //         },
    //         &[],
    //     )
    //     .unwrap()
    // }

    fn provide_liquidity(
        app: &mut App,
        pool_address: &Addr,
        project_coin_or_token1: impl ToProjectAsset,
        project_coin_or_token2: impl ToProjectAsset,
    ) -> AppResponse {
        let asset_list = vec![
            project_coin_or_token1.to_project_asset(),
            project_coin_or_token2.to_project_asset(),
        ];

        let assets = TryInto::<[terraswap::asset::Asset; 2]>::try_into(
            asset_list
                .iter()
                .map(|x| terraswap::asset::Asset {
                    amount: Uint128::from(ADMIN_FUNDS_AMOUNT),
                    info: x.to_owned().to_terraswap_asset_info(),
                })
                .collect::<Vec<terraswap::asset::Asset>>(),
        )
        .unwrap();

        // check if asset is coin and set send_funds
        let mut send_funds: Vec<Coin> = vec![];
        asset_list.iter().for_each(|x| {
            if let ProjectAsset::Coin(project_coin) = x {
                send_funds.push(coin(ADMIN_FUNDS_AMOUNT, project_coin.to_string()));
            }
        });

        app.execute_contract(
            Addr::unchecked(ProjectAccount::Admin.to_string()),
            pool_address.to_owned(),
            &terraswap::pair::ExecuteMsg::ProvideLiquidity {
                assets,
                slippage_tolerance: None,
                receiver: None,
            },
            &send_funds
                .iter()
                .take(2)
                .map(|x| coin(ADMIN_FUNDS_AMOUNT, &x.denom))
                .collect::<Vec<_>>(),
        )
        .unwrap()
    }

    fn query_pairs(app: &App, terraswap_factory_address: &Addr) -> Vec<terraswap::asset::PairInfo> {
        let terraswap::factory::PairsResponse { pairs } = app
            .wrap()
            .query_wasm_smart(
                terraswap_factory_address,
                &terraswap::factory::QueryMsg::Pairs {
                    start_after: None,
                    limit: None,
                },
            )
            .unwrap();

        pairs
    }

    fn get_pair_info_by_asset_pair(
        terraswap_pair_list: &Vec<terraswap::asset::PairInfo>,
        project_coin_or_token1: impl ToProjectAsset + ToString,
        project_coin_or_token2: impl ToProjectAsset + ToString,
    ) -> terraswap::asset::PairInfo {
        terraswap_pair_list
            .iter()
            .find(|x| {
                let asset1 = &x.asset_infos[0];
                let asset2 = &x.asset_infos[1];

                ((asset1.to_string() == project_coin_or_token1.to_string())
                    && (asset2.to_string() == project_coin_or_token2.to_string()))
                    || ((asset1.to_string() == project_coin_or_token2.to_string())
                        && (asset2.to_string() == project_coin_or_token1.to_string()))
            })
            .unwrap()
            .to_owned()
    }

    pub fn query_all_balances(&self, project_account: ProjectAccount) -> Vec<(String, Uint128)> {
        let mut denom_and_amount_list: Vec<(String, Uint128)> = vec![];

        self.app
            .wrap()
            .query_all_balances(project_account.to_string())
            .unwrap()
            .iter()
            .for_each(|x| {
                denom_and_amount_list.push((x.denom.to_owned(), x.amount));
            });

        ProjectToken::iter().for_each(|x| {
            let cw20::BalanceResponse { balance } = self
                .app
                .wrap()
                .query_wasm_smart(
                    Addr::unchecked(x.to_string()),
                    &cw20_base::msg::QueryMsg::Balance {
                        address: project_account.to_string(),
                    },
                )
                .unwrap();

            denom_and_amount_list.push((x.to_string(), balance));
        });

        denom_and_amount_list
    }

    // TODO: use router contract to provide swaps
    pub fn swap(
        &mut self,
        terraswap_pool_address: &impl ToString,
        project_account: ProjectAccount,
        project_asset_in: ProjectAsset,
        _project_asset_out: ProjectAsset,
        amount: impl Into<Uint128>,
    ) -> StdResult<AppResponse> {
        let amount: Uint128 = amount.into();
        let sender = Addr::unchecked(project_account.to_string());
        let contract_addr = Addr::unchecked(terraswap_pool_address.to_string());
        let msg = terraswap::pair::ExecuteMsg::Swap {
            offer_asset: terraswap::asset::Asset {
                amount,
                info: project_asset_in.to_terraswap_asset_info(),
            },
            belief_price: None,
            max_spread: None,
            to: None,
        };

        (match project_asset_in {
            ProjectAsset::Coin(project_coin) => self.app.execute_contract(
                sender,
                contract_addr,
                &msg,
                &[coin(amount.u128(), project_coin.to_string())],
            ),
            _ => self.app.execute_contract(sender, contract_addr, &msg, &[]),
        })
        .map_err(|err| err.downcast().unwrap())
    }
}

#[test]
fn ref_test() {
    let mut project = Project::new(None);

    // query pairs
    let pairs = Project::query_pairs(&project.app, &project.terraswap_factory_address);
    println!("{:#?}", pairs);

    // query lp
    let bal: cw20::BalanceResponse = project
        .app
        .wrap()
        .query_wasm_smart(
            Addr::unchecked("contract12"),
            &cw20_base::msg::QueryMsg::Balance {
                address: ProjectAccount::Admin.to_string(),
            },
        )
        .unwrap();

    println!("{:#?}", bal);

    // query all balances
    let res = project.query_all_balances(ProjectAccount::Alice);
    println!("{:#?}", res);

    // execute swap 500 denom -> noria
    project
        .swap(
            &Addr::unchecked("contract11"),
            ProjectAccount::Alice,
            ProjectAsset::Coin(ProjectCoin::Denom),
            ProjectAsset::Coin(ProjectCoin::Noria),
            500u128,
        )
        .unwrap();

    // query all balances
    let res = project.query_all_balances(ProjectAccount::Alice);
    println!("{:#?}", res);
}
