use cosmwasm_std::{coin, Addr, Coin, Empty, StdResult, Uint128};
use cw_multi_test::{App, AppResponse, ContractWrapper, Executor};

use serde::Serialize;
use strum::IntoEnumIterator;
use strum_macros::{Display, EnumIter, IntoStaticStr};

use crate::state::CHAIN_ID_DEV;

const DEFAULT_FUNDS_AMOUNT: u128 = 1_000;
const INCREASED_FUNDS_AMOUNT: u128 = 1_000_000_000_000_000_000;

const DEFAULT_DECIMALS: u8 = 6;
const INCREASED_DECIMALS: u8 = 18;

#[derive(Debug, Clone, Copy, Display, IntoStaticStr, EnumIter)]
pub enum ProjectAccount {
    #[strum(serialize = "admin")]
    Admin,
    #[strum(serialize = "alice")]
    Alice,
    #[strum(serialize = "bob")]
    Bob,
}

#[derive(Debug, Clone, Copy, Display, IntoStaticStr, EnumIter)]
pub enum ProjectCoin {
    #[strum(serialize = "ucrd")]
    Denom,
    #[strum(serialize = "unoria")]
    Noria,
}

#[derive(Debug, Clone, Copy, Display, IntoStaticStr, EnumIter)]
pub enum ProjectToken {
    #[strum(serialize = "contract1")]
    Atom,
    #[strum(serialize = "contract2")]
    Luna,
    #[strum(serialize = "contract3")]
    Inj,
}
pub trait GetDecimals {
    fn get_decimals(&self) -> u8;
}

impl GetDecimals for ProjectCoin {
    fn get_decimals(&self) -> u8 {
        match self {
            ProjectCoin::Denom => DEFAULT_DECIMALS,
            ProjectCoin::Noria => DEFAULT_DECIMALS,
        }
    }
}

impl GetDecimals for ProjectToken {
    fn get_decimals(&self) -> u8 {
        match self {
            ProjectToken::Atom => DEFAULT_DECIMALS,
            ProjectToken::Luna => DEFAULT_DECIMALS,
            ProjectToken::Inj => INCREASED_DECIMALS,
        }
    }
}

pub trait GetFunds {
    fn get_initial_funds_amount(&self) -> u128;
}

impl GetFunds for ProjectAccount {
    fn get_initial_funds_amount(&self) -> u128 {
        match self {
            ProjectAccount::Admin => INCREASED_FUNDS_AMOUNT,
            ProjectAccount::Alice => DEFAULT_FUNDS_AMOUNT,
            ProjectAccount::Bob => DEFAULT_FUNDS_AMOUNT,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub enum ProjectAsset {
    Coin(ProjectCoin),
    Token(ProjectToken),
}

#[derive(Debug, Clone, Copy, EnumIter)]
pub enum ProjectPair {
    AtomLuna,
    DenomInj,
    DenomLuna,
    DenomNoria,
}

pub trait ToAddress {
    fn to_address(&self) -> Addr;
}

impl ToAddress for ProjectAccount {
    fn to_address(&self) -> Addr {
        Addr::unchecked(self.to_string())
    }
}

impl ToAddress for ProjectToken {
    fn to_address(&self) -> Addr {
        Addr::unchecked(self.to_string())
    }
}

impl ToString for ProjectAsset {
    fn to_string(&self) -> String {
        match self {
            ProjectAsset::Coin(coin) => coin.to_string(),
            ProjectAsset::Token(token) => token.to_string(),
        }
    }
}

pub trait ToProjectAsset {
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

pub trait ToTerraswapAssetInfo {
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

pub trait SplitPair {
    fn split_pair(&self) -> (ProjectAsset, ProjectAsset);
}

impl SplitPair for ProjectPair {
    fn split_pair(&self) -> (ProjectAsset, ProjectAsset) {
        match self {
            ProjectPair::AtomLuna => (
                ProjectToken::Atom.to_project_asset(),
                ProjectToken::Luna.to_project_asset(),
            ),
            ProjectPair::DenomInj => (
                ProjectCoin::Denom.to_project_asset(),
                ProjectToken::Inj.to_project_asset(),
            ),
            ProjectPair::DenomLuna => (
                ProjectCoin::Denom.to_project_asset(),
                ProjectToken::Luna.to_project_asset(),
            ),
            ProjectPair::DenomNoria => (
                ProjectCoin::Denom.to_project_asset(),
                ProjectCoin::Noria.to_project_asset(),
            ),
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
        let mut app = Self::create_app_with_balances();

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
        let cw20_base_token_list: Vec<(ProjectToken, Addr)> = ProjectToken::iter()
            .map(|project_token| {
                (
                    project_token,
                    Self::create_cw20_base_token(&mut app, cw20_base_code_id, project_token),
                )
            })
            .collect();
        println!("{:#?}", cw20_base_token_list);

        let terraswap_factory_address = Self::create_terraswap_factory(
            &mut app,
            terraswap_factory_code_id,
            terraswap_pair_code_id,
            terraswap_lp_token_code_id,
        );

        // register coins at factory
        ProjectCoin::iter().for_each(|project_coin| {
            Self::register_coin(&mut app, &terraswap_factory_address, project_coin);
        });

        // create pairs
        ProjectPair::iter().for_each(|project_pair| {
            Self::create_terraswap_pool(&mut app, &terraswap_factory_address, project_pair);
        });

        // query pairs
        let terraswap_pair_list = Self::query_pairs(&app, &terraswap_factory_address);

        let pair_info =
            Self::get_pair_info_by_asset_pair(&terraswap_pair_list, ProjectPair::DenomNoria);
        println!("\n{:#?}\n", pair_info);

        // TODO: increase allowance for tokens
        // ProjectToken::iter().for_each(|x| {
        //     let res = Self::increase_allowance(&mut app, &terraswap_pair_list, x);
        //     println!("\n{:#?}\n", res);
        // });

        // TODO: provide liquidity for all pairs
        // ProjectPair::iter().for_each(|project_pair| {
        //     Self::provide_liquidity(&mut app, &terraswap_pair_list, project_pair);
        // });
        Self::provide_liquidity(&mut app, &terraswap_pair_list, ProjectPair::DenomNoria);

        Self {
            app,
            app_contract_address,
            terraswap_factory_address,
            cw20_base_token_list,
            terraswap_pair_list,
        }
    }

    fn create_app_with_balances() -> App {
        App::new(|router, _api, storage| {
            ProjectAccount::iter().for_each(|project_account| {
                let funds: Vec<Coin> = ProjectCoin::iter()
                    .map(|project_coin| {
                        coin(
                            project_account.get_initial_funds_amount(),
                            project_coin.to_string(),
                        )
                    })
                    .collect();

                router
                    .bank
                    .init_balance(storage, &project_account.to_address(), funds)
                    .unwrap();
            });
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
            ProjectAccount::Admin.to_address(),
            init_msg,
            &[],
            label,
            Some(ProjectAccount::Admin.to_string()),
        )
        .unwrap()
    }

    fn create_cw20_base_token(app: &mut App, code_id: u64, project_token: ProjectToken) -> Addr {
        let token_postfix: u8 = project_token
            .to_string()
            .strip_prefix("contract")
            .unwrap()
            .parse()
            .unwrap();

        let symbol = format!("TK{}", "N".repeat(token_postfix as usize)); // max 10 tokens

        let initial_balances: Vec<cw20::Cw20Coin> = ProjectAccount::iter()
            .map(|project_account| cw20::Cw20Coin {
                address: project_account.to_string(),
                amount: Uint128::from(project_account.get_initial_funds_amount()),
            })
            .collect();

        Self::instantiate_contract(
            app,
            code_id,
            &format!("toke{}", "n".repeat(token_postfix as usize)),
            &cw20_base::msg::InstantiateMsg {
                name: format!("cw20-base token {}", symbol),
                symbol,
                decimals: project_token.get_decimals(),
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
        terraswap_lp_token_code_id: u64,
    ) -> Addr {
        Self::instantiate_contract(
            app,
            terraswap_factory_code_id,
            "factory",
            &terraswap::factory::InstantiateMsg {
                pair_code_id: terraswap_pair_code_id,
                token_code_id: terraswap_lp_token_code_id,
            },
        )
    }

    fn register_coin(
        app: &mut App,
        terraswap_factory_address: &Addr,
        project_coin: ProjectCoin,
    ) -> AppResponse {
        app.execute_contract(
            ProjectAccount::Admin.to_address(),
            terraswap_factory_address.to_owned(),
            &terraswap::factory::ExecuteMsg::AddNativeTokenDecimals {
                denom: project_coin.to_string(),
                decimals: project_coin.get_decimals(),
            },
            &[coin(1, project_coin.to_string())],
        )
        .unwrap()
    }

    fn create_terraswap_pool(
        app: &mut App,
        terraswap_factory_address: &Addr,
        project_pair: ProjectPair,
    ) -> AppResponse {
        let (project_asset1, project_asset2) = project_pair.split_pair();

        app.execute_contract(
            ProjectAccount::Admin.to_address(),
            terraswap_factory_address.to_owned(),
            &terraswap::factory::ExecuteMsg::CreatePair {
                asset_infos: [
                    project_asset1.to_terraswap_asset_info(),
                    project_asset2.to_terraswap_asset_info(),
                ],
            },
            &[],
        )
        .unwrap()
    }

    fn increase_allowance(
        app: &mut App,
        terraswap_pair_list: &Vec<terraswap::asset::PairInfo>,
        project_token: ProjectToken,
    ) -> AppResponse {
        let terraswap::asset::PairInfo { contract_addr, .. } = terraswap_pair_list
            .iter()
            .find(|x| {
                let asset1 = &x.asset_infos[0];
                let asset2 = &x.asset_infos[1];

                (asset1.to_string() == project_token.to_string())
                    || (asset2.to_string() == project_token.to_string())
            })
            .unwrap()
            .to_owned();

        app.execute_contract(
            ProjectAccount::Admin.to_address(),
            project_token.to_address(),
            &cw20_base::msg::ExecuteMsg::IncreaseAllowance {
                spender: contract_addr.to_string(),
                amount: Uint128::from(INCREASED_FUNDS_AMOUNT),
                expires: None,
            },
            &[],
        )
        .unwrap()
    }

    fn provide_liquidity(
        app: &mut App,
        terraswap_pair_list: &Vec<terraswap::asset::PairInfo>,
        project_pair: ProjectPair,
    ) -> AppResponse {
        const PROVIDED_PER_ASSET_FUNDS_AMOUNT: u128 = INCREASED_FUNDS_AMOUNT / 10;

        let terraswap::asset::PairInfo { contract_addr, .. } =
            Self::get_pair_info_by_asset_pair(terraswap_pair_list, project_pair);

        let (project_asset1, project_asset2) = project_pair.split_pair();
        let asset_list = vec![project_asset1, project_asset2];

        let assets = TryInto::<[terraswap::asset::Asset; 2]>::try_into(
            asset_list
                .iter()
                .map(|x| terraswap::asset::Asset {
                    amount: Uint128::from(PROVIDED_PER_ASSET_FUNDS_AMOUNT),
                    info: x.to_owned().to_terraswap_asset_info(),
                })
                .collect::<Vec<terraswap::asset::Asset>>(),
        )
        .unwrap();

        // check if asset is coin and set send_funds
        let mut send_funds: Vec<Coin> = vec![];
        asset_list.iter().for_each(|x| {
            if let ProjectAsset::Coin(project_coin) = x {
                send_funds.push(coin(
                    PROVIDED_PER_ASSET_FUNDS_AMOUNT,
                    project_coin.to_string(),
                ));
            }
        });

        app.execute_contract(
            ProjectAccount::Admin.to_address(),
            Addr::unchecked(contract_addr),
            &terraswap::pair::ExecuteMsg::ProvideLiquidity {
                assets,
                slippage_tolerance: None,
                receiver: None,
            },
            &send_funds
                .iter()
                .take(2)
                .map(|x| coin(PROVIDED_PER_ASSET_FUNDS_AMOUNT, &x.denom))
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
        project_pair: ProjectPair,
    ) -> terraswap::asset::PairInfo {
        let (project_asset1, project_asset2) = project_pair.split_pair();

        terraswap_pair_list
            .iter()
            .find(|x| {
                let asset1 = &x.asset_infos[0];
                let asset2 = &x.asset_infos[1];

                ((asset1.to_string() == project_asset1.to_string())
                    && (asset2.to_string() == project_asset2.to_string()))
                    || ((asset1.to_string() == project_asset2.to_string())
                        && (asset2.to_string() == project_asset1.to_string()))
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
                    x.to_address(),
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
    pub fn swap<T1, T2>(
        &mut self,
        terraswap_pair_list: &Vec<terraswap::asset::PairInfo>,
        project_coin_or_token_in: T1,
        project_coin_or_token_out: T2,
        project_account: ProjectAccount,
        amount: impl Into<Uint128>,
    ) -> StdResult<AppResponse>
    where
        T1: ToTerraswapAssetInfo + ToProjectAsset + ToString + Clone,
        T2: ToTerraswapAssetInfo + ToProjectAsset + ToString + Clone,
    {
        let terraswap::asset::PairInfo { contract_addr, .. } = terraswap_pair_list
            .iter()
            .find(|x| {
                let asset1 = &x.asset_infos[0];
                let asset2 = &x.asset_infos[1];

                ((asset1.to_string() == project_coin_or_token_in.to_string())
                    && (asset2.to_string() == project_coin_or_token_out.to_string()))
                    || ((asset1.to_string() == project_coin_or_token_out.to_string())
                        && (asset2.to_string() == project_coin_or_token_in.to_string()))
            })
            .unwrap()
            .to_owned();

        let amount: Uint128 = amount.into();
        let sender = project_account.to_address();
        let contract_addr = Addr::unchecked(contract_addr.to_string());
        let msg = terraswap::pair::ExecuteMsg::Swap {
            offer_asset: terraswap::asset::Asset {
                amount,
                info: project_coin_or_token_in.to_terraswap_asset_info(),
            },
            belief_price: None,
            max_spread: None,
            to: None,
        };

        (match &project_coin_or_token_in.to_project_asset() {
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
            &pairs,
            ProjectCoin::Denom,
            ProjectCoin::Noria,
            ProjectAccount::Alice,
            500u128,
        )
        .unwrap();

    // query all balances
    let res = project.query_all_balances(ProjectAccount::Alice);
    println!("{:#?}", res);

    // // query allowances
    // let allowances: cw20::AllAllowancesResponse = project
    //     .app
    //     .wrap()
    //     .query_wasm_smart(
    //         Addr::unchecked("contract1"),
    //         &cw20_base::msg::QueryMsg::AllAllowances {
    //             owner: ProjectAccount::Admin.to_string(),
    //             start_after: None,
    //             limit: None,
    //         },
    //     )
    //     .unwrap();
    // println!("{:#?}", allowances);

    // // increase allowance
    // // it works for contract12 - lp token
    // // and doesn't work for contract1 - cw20-base
    // let res = project
    //     .app
    //     .execute_contract(
    //         ProjectAccount::Admin.to_address(),
    //         Addr::unchecked("contract1".to_string()),
    //         &cw20_base::msg::ExecuteMsg::IncreaseAllowance {
    //             spender: ProjectAccount::Alice.to_string(),
    //             amount: Uint128::from(10u128),
    //             expires: None,
    //         },
    //         &[],
    //     )
    //     .unwrap();
    // println!("{:#?}", res);
}
