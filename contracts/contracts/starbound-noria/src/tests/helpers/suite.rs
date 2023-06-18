use cosmwasm_std::{coin, to_binary, Addr, Binary, Coin, StdResult, Uint128};
use cw_multi_test::{App, AppResponse, ContractWrapper, Executor};

use anyhow::Error;
use serde::Serialize;
use strum::IntoEnumIterator;
use strum_macros::{Display, EnumIter, IntoStaticStr};

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

impl ProjectAccount {
    fn get_initial_funds_amount(&self) -> u128 {
        match self {
            ProjectAccount::Admin => INCREASED_FUNDS_AMOUNT,
            ProjectAccount::Alice => DEFAULT_FUNDS_AMOUNT,
            ProjectAccount::Bob => DEFAULT_FUNDS_AMOUNT,
        }
    }
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
    #[strum(serialize = "contract0")]
    Atom,
    #[strum(serialize = "contract1")]
    Luna,
    #[strum(serialize = "contract2")]
    Inj,
}
trait GetDecimals {
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

#[derive(Debug, Clone, Copy, Display)]
pub enum ProjectAsset {
    Coin(ProjectCoin),
    Token(ProjectToken),
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

#[derive(Debug, Clone, Copy, EnumIter)]
pub enum ProjectPair {
    AtomLuna,
    DenomInj,
    DenomLuna,
    DenomNoria,
}

impl ProjectPair {
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

#[derive(Debug)]
pub enum WrappedResponse {
    Execute(Result<AppResponse, Error>),
    Query(StdResult<Binary>),
}

pub trait WrapIntoResponse {
    fn wrap(self) -> WrappedResponse;
}

impl WrapIntoResponse for Result<AppResponse, Error> {
    fn wrap(self) -> WrappedResponse {
        WrappedResponse::Execute(self)
    }
}

impl WrapIntoResponse for StdResult<Binary> {
    fn wrap(self) -> WrappedResponse {
        WrappedResponse::Query(self)
    }
}

pub struct Project {
    pub app: App,
    pub logs: WrappedResponse,
    app_contract_address: Addr,
    terraswap_factory_address: Addr,
    terraswap_router_address: Addr,
    terraswap_pair_list: Vec<terraswap::asset::PairInfo>,
}

impl Project {
    pub fn create_project_with_balances() -> Self {
        Self {
            app: Self::create_app_with_balances(),
            logs: WrappedResponse::Execute(Ok(AppResponse::default())),
            app_contract_address: Addr::unchecked(""),
            terraswap_factory_address: Addr::unchecked(""),
            terraswap_router_address: Addr::unchecked(""),
            terraswap_pair_list: vec![],
        }
    }

    pub fn new(chain_id_mocked: Option<&str>) -> Self {
        // create app and distribute coins to accounts
        let mut project = Self::create_project_with_balances();

        // set specific chain_id to prevent execution of mocked actions on real networks
        let chain_id = chain_id_mocked.unwrap_or(crate::state::CHAIN_ID_DEV);
        project
            .app
            .update_block(|block| block.chain_id = String::from(chain_id));

        // register contracts code
        let app_code_id = project.store_app_code();
        let cw20_base_code_id = project.store_cw20_base_code();
        let terraswap_lp_token_code_id = project.store_terraswap_lp_token_code();
        let terraswap_pair_code_id = project.store_terraswap_pair_code();
        let terraswap_factory_code_id = project.store_terraswap_factory_code();
        let terraswap_router_code_id = project.store_terraswap_router_code();

        // DON'T CHANGE TOKEN INIT ORDER AS ITS ADDRESSES ARE HARDCODED IN ProjectToken ENUM
        for project_token in ProjectToken::iter() {
            project.create_cw20_base_token(cw20_base_code_id, project_token);
        }

        let terraswap_factory_address = project.create_terraswap_factory(
            terraswap_factory_code_id,
            terraswap_pair_code_id,
            terraswap_lp_token_code_id,
        );

        let terraswap_router_address =
            project.create_terraswap_router(terraswap_router_code_id, &terraswap_factory_address);

        // register coins at factory
        for project_coin in ProjectCoin::iter() {
            project.register_coin(&terraswap_factory_address, project_coin);
        }

        // create pairs
        for project_pair in ProjectPair::iter() {
            project.create_terraswap_pool(&terraswap_factory_address, project_pair);
        }

        // query pairs
        let terraswap_pair_list = project.query_pairs(&terraswap_factory_address);

        // increase allowance for tokens
        for pair_info in &terraswap_pair_list {
            for project_token in ProjectToken::iter() {
                if pair_info
                    .asset_infos
                    .contains(&project_token.to_terraswap_asset_info())
                {
                    project.increase_allowance(
                        ProjectAccount::Admin,
                        ProjectAccount::Admin.get_initial_funds_amount(),
                        project_token,
                        &pair_info.contract_addr,
                    );
                }
            }
        }

        // instantiate app contract
        let app_contract_address = project.instantiate_contract(
            app_code_id,
            "app",
            &crate::messages::instantiate::InstantiateMsg {
                terraswap_factory: terraswap_factory_address.to_string(),
            },
        );

        project = Self {
            app_contract_address,
            terraswap_factory_address,
            terraswap_router_address,
            terraswap_pair_list,
            ..project
        };

        // provide liquidity for all pairs
        for project_pair in ProjectPair::iter() {
            project.provide_liquidity(project_pair);
        }

        project
    }

    pub fn get_app_contract_address(&self) -> Addr {
        self.app_contract_address.clone()
    }

    pub fn get_terraswap_factory_address(&self) -> Addr {
        self.terraswap_factory_address.clone()
    }

    fn create_app_with_balances() -> App {
        App::new(|router, _api, storage| {
            for project_account in ProjectAccount::iter() {
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
            }
        })
    }

    fn store_app_code(&mut self) -> u64 {
        self.app.store_code(Box::new(ContractWrapper::new(
            crate::contract::execute,
            crate::contract::instantiate,
            crate::contract::query,
        )))
    }

    fn store_cw20_base_code(&mut self) -> u64 {
        self.app.store_code(Box::new(ContractWrapper::new(
            cw20_base::contract::execute,
            cw20_base::contract::instantiate,
            cw20_base::contract::query,
        )))
    }

    fn store_terraswap_pair_code(&mut self) -> u64 {
        self.app.store_code(Box::new(
            ContractWrapper::new(
                terraswap_pair::contract::execute,
                terraswap_pair::contract::instantiate,
                terraswap_pair::contract::query,
            )
            .with_reply(terraswap_pair::contract::reply),
        ))
    }

    // Debug and Clone must be implemented on terraswap::token::InstantiateMsg
    fn store_terraswap_lp_token_code(&mut self) -> u64 {
        self.app.store_code(Box::new(ContractWrapper::new(
            terraswap_token::contract::execute,
            terraswap_token::contract::instantiate,
            terraswap_token::contract::query,
        )))
    }

    fn store_terraswap_factory_code(&mut self) -> u64 {
        self.app.store_code(Box::new(
            ContractWrapper::new(
                terraswap_factory::contract::execute,
                terraswap_factory::contract::instantiate,
                terraswap_factory::contract::query,
            )
            .with_reply(terraswap_factory::contract::reply),
        ))
    }

    fn store_terraswap_router_code(&mut self) -> u64 {
        self.app.store_code(Box::new(ContractWrapper::new(
            terraswap_router::contract::execute,
            terraswap_router::contract::instantiate,
            terraswap_router::contract::query,
        )))
    }

    fn instantiate_contract(
        &mut self,
        code_id: u64,
        label: &str,
        init_msg: &impl Serialize,
    ) -> Addr {
        self.app
            .instantiate_contract(
                code_id,
                ProjectAccount::Admin.to_address(),
                init_msg,
                &[],
                label,
                Some(ProjectAccount::Admin.to_string()),
            )
            .unwrap()
    }

    fn create_cw20_base_token(&mut self, code_id: u64, project_token: ProjectToken) -> Addr {
        let token_postfix: u8 = project_token
            .to_string()
            .strip_prefix("contract")
            .unwrap()
            .parse()
            .unwrap();

        let symbol = format!("TKN{}", "N".repeat(token_postfix as usize)); // max 10 tokens

        let initial_balances: Vec<cw20::Cw20Coin> = ProjectAccount::iter()
            .map(|project_account| cw20::Cw20Coin {
                address: project_account.to_string(),
                amount: Uint128::from(project_account.get_initial_funds_amount()),
            })
            .collect();

        self.instantiate_contract(
            code_id,
            &format!("token{}", "n".repeat(token_postfix as usize)),
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
        &mut self,
        terraswap_factory_code_id: u64,
        terraswap_pair_code_id: u64,
        terraswap_lp_token_code_id: u64,
    ) -> Addr {
        self.instantiate_contract(
            terraswap_factory_code_id,
            "factory",
            &terraswap::factory::InstantiateMsg {
                pair_code_id: terraswap_pair_code_id,
                token_code_id: terraswap_lp_token_code_id,
            },
        )
    }

    fn create_terraswap_router(
        &mut self,
        terraswap_router_code_id: u64,
        terraswap_factory_address: &Addr,
    ) -> Addr {
        self.instantiate_contract(
            terraswap_router_code_id,
            "router",
            &terraswap::router::InstantiateMsg {
                terraswap_factory: terraswap_factory_address.to_string(),
            },
        )
    }

    fn register_coin(
        &mut self,
        terraswap_factory_address: &Addr,
        project_coin: ProjectCoin,
    ) -> AppResponse {
        self.app
            .execute_contract(
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
        &mut self,
        terraswap_factory_address: &Addr,
        project_pair: ProjectPair,
    ) -> AppResponse {
        let (project_asset1, project_asset2) = project_pair.split_pair();

        self.app
            .execute_contract(
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

    fn increase_allowance<T>(
        &mut self,
        owner: ProjectAccount,
        amount: T,
        token: ProjectToken,
        spender: impl ToString,
    ) -> AppResponse
    where
        Uint128: From<T>,
    {
        self.app
            .execute_contract(
                owner.to_address(),
                token.to_address(),
                &cw20_base::msg::ExecuteMsg::IncreaseAllowance {
                    spender: spender.to_string(),
                    amount: Uint128::from(amount),
                    expires: None,
                },
                &[],
            )
            .unwrap()
    }

    fn provide_liquidity(&mut self, project_pair: ProjectPair) -> AppResponse {
        const PROVIDED_PER_ASSET_FUNDS_AMOUNT: u128 = INCREASED_FUNDS_AMOUNT / 10;

        let terraswap::asset::PairInfo { contract_addr, .. } =
            self.get_pair_info_by_asset_pair(project_pair);

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

        for asset in asset_list.iter() {
            if let ProjectAsset::Coin(project_coin) = asset {
                send_funds.push(coin(
                    PROVIDED_PER_ASSET_FUNDS_AMOUNT,
                    project_coin.to_string(),
                ));
            }
        }

        self.app
            .execute_contract(
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

    fn query_pairs(&self, terraswap_factory_address: &Addr) -> Vec<terraswap::asset::PairInfo> {
        let terraswap::factory::PairsResponse { pairs } = self
            .app
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

    pub fn get_pair_info_by_asset_pair(
        &self,
        project_pair: ProjectPair,
    ) -> terraswap::asset::PairInfo {
        let (project_asset1, project_asset2) = project_pair.split_pair();

        self.terraswap_pair_list
            .iter()
            .find(|x| {
                x.asset_infos
                    .contains(&project_asset1.to_terraswap_asset_info())
                    && x.asset_infos
                        .contains(&project_asset2.to_terraswap_asset_info())
            })
            .unwrap()
            .to_owned()
    }
}

pub trait Testable {
    fn get_terraswap_router_address(&self) -> Addr;

    fn get_terraswap_pair_list(&self) -> Vec<terraswap::asset::PairInfo>;

    fn query_allowances(
        &self,
        owner: ProjectAccount,
        token: ProjectToken,
    ) -> cw20::AllAllowancesResponse;

    fn query_all_balances(&self, project_account: ProjectAccount) -> Vec<(String, Uint128)>;

    fn swap_with_pair<T1, T2>(
        &mut self,
        sender: ProjectAccount,
        amount: impl Into<Uint128>,
        project_coin_or_token_in: T1,
        project_coin_or_token_out: T2,
    ) -> StdResult<AppResponse>
    where
        T1: ToTerraswapAssetInfo + ToProjectAsset + ToString + Clone,
        T2: ToTerraswapAssetInfo + ToProjectAsset + ToString + Clone;

    fn swap_with_router(
        &mut self,
        sender: ProjectAccount,
        amount: impl Into<Uint128>,
        swap_operations: &[terraswap::router::SwapOperation],
    ) -> StdResult<AppResponse>;
}

impl Testable for Project {
    fn get_terraswap_router_address(&self) -> Addr {
        self.terraswap_router_address.clone()
    }

    fn get_terraswap_pair_list(&self) -> Vec<terraswap::asset::PairInfo> {
        self.terraswap_pair_list.clone()
    }

    fn query_allowances(
        &self,
        owner: ProjectAccount,
        token: ProjectToken,
    ) -> cw20::AllAllowancesResponse {
        self.app
            .wrap()
            .query_wasm_smart(
                token.to_address(),
                &cw20_base::msg::QueryMsg::AllAllowances {
                    owner: owner.to_string(),
                    start_after: None,
                    limit: None,
                },
            )
            .unwrap()
    }

    fn query_all_balances(&self, project_account: ProjectAccount) -> Vec<(String, Uint128)> {
        let mut denom_and_amount_list: Vec<(String, Uint128)> = vec![];

        // query project_coins
        self.app
            .wrap()
            .query_all_balances(project_account.to_string())
            .unwrap()
            .iter()
            .for_each(|x| denom_and_amount_list.push((x.denom.to_owned(), x.amount)));

        // query project_tokens
        for project_token in ProjectToken::iter() {
            let cw20::BalanceResponse { balance } = self
                .app
                .wrap()
                .query_wasm_smart(
                    project_token.to_address(),
                    &cw20_base::msg::QueryMsg::Balance {
                        address: project_account.to_string(),
                    },
                )
                .unwrap();

            denom_and_amount_list.push((project_token.to_string(), balance));
        }

        // query lp tokens
        for pair_info in Self::get_terraswap_pair_list(self) {
            let cw20::BalanceResponse { balance } = self
                .app
                .wrap()
                .query_wasm_smart(
                    Addr::unchecked(&pair_info.liquidity_token),
                    &cw20_base::msg::QueryMsg::Balance {
                        address: project_account.to_string(),
                    },
                )
                .unwrap();

            denom_and_amount_list.push((pair_info.liquidity_token, balance));
        }

        // remove empty balances
        denom_and_amount_list
            .into_iter()
            .filter(|(_, amount)| !amount.is_zero())
            .collect()
    }

    fn swap_with_pair<T1, T2>(
        &mut self,
        sender: ProjectAccount,
        amount: impl Into<Uint128>,
        project_coin_or_token_in: T1,
        project_coin_or_token_out: T2,
    ) -> StdResult<AppResponse>
    where
        T1: ToTerraswapAssetInfo + ToProjectAsset + ToString + Clone,
        T2: ToTerraswapAssetInfo + ToProjectAsset + ToString + Clone,
    {
        let terraswap::asset::PairInfo { contract_addr, .. } = Self::get_terraswap_pair_list(self)
            .into_iter()
            .find(|x| {
                x.asset_infos
                    .contains(&project_coin_or_token_in.to_terraswap_asset_info())
                    && x.asset_infos
                        .contains(&project_coin_or_token_out.to_terraswap_asset_info())
            })
            .unwrap();

        let amount: Uint128 = amount.into();
        let sender = sender.to_address();
        let contract_addr = Addr::unchecked(contract_addr);
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
            ProjectAsset::Token(project_token) => self.app.execute_contract(
                sender,
                project_token.to_address(),
                &cw20_base::msg::ExecuteMsg::Send {
                    contract: contract_addr.to_string(),
                    amount,
                    msg: to_binary(&msg)?,
                },
                &[],
            ),
        })
        .map_err(|err| err.downcast().unwrap())
    }

    // TODO: implement custom router to swap both in sequence and parallel and use different amounts
    fn swap_with_router(
        &mut self,
        sender: ProjectAccount,
        amount: impl Into<Uint128>,
        swap_operations: &[terraswap::router::SwapOperation],
    ) -> StdResult<AppResponse> {
        let amount: Uint128 = amount.into();
        let sender = sender.to_address();
        let router_address = Self::get_terraswap_router_address(self);
        let hook_msg = terraswap::router::ExecuteMsg::ExecuteSwapOperations {
            operations: swap_operations.to_owned(),
            minimum_receive: None,
            to: None,
        };

        enum WrappedMsg {
            Router(terraswap::router::ExecuteMsg),
            Token(cw20_base::msg::ExecuteMsg),
        }

        let (contract_addr, msg, funds) = match &swap_operations[0] {
            terraswap::router::SwapOperation::TerraSwap {
                offer_asset_info: terraswap::asset::AssetInfo::NativeToken { denom },
                ..
            } => (
                router_address,
                WrappedMsg::Router(hook_msg),
                Some(vec![coin(amount.u128(), denom)]),
            ),
            terraswap::router::SwapOperation::TerraSwap {
                offer_asset_info: terraswap::asset::AssetInfo::Token { contract_addr },
                ..
            } => (
                Addr::unchecked(contract_addr),
                WrappedMsg::Token(cw20_base::msg::ExecuteMsg::Send {
                    contract: router_address.to_string(),
                    amount,
                    msg: to_binary(&hook_msg)?,
                }),
                None,
            ),
        };

        match (msg, funds) {
            (WrappedMsg::Router(msg), Some(funds)) => {
                self.app
                    .execute_contract(sender, contract_addr, &msg, &funds)
            }
            (WrappedMsg::Token(msg), None) => {
                self.app.execute_contract(sender, contract_addr, &msg, &[])
            }
            _ => unreachable!(),
        }
        .map_err(|err| err.downcast().unwrap())
    }
}
