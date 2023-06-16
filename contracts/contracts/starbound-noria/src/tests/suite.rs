use cosmwasm_std::{coin, to_binary, Addr, Coin, Empty, StdResult, Storage, Uint128};
use cw_multi_test::{AddressGenerator, App, AppResponse, ContractWrapper, Executor};

use anyhow::Error;
use bech32::{ToBase32, Variant};
use rand::{rngs::StdRng, Rng, SeedableRng};
use serde::Serialize;
use strum::IntoEnumIterator;
use strum_macros::{Display, EnumIter, IntoStaticStr};

use crate::{state::CHAIN_ID_DEV, tests::builders::DepositBuilder};

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
    pub app: App,
    pub logs: Result<AppResponse, Error>,
    app_contract_address: Addr,
    terraswap_factory_address: Addr,
    terraswap_router_address: Addr,
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
        let terraswap_router_code_id = Self::store_terraswap_router_code(&mut app);

        // instantiate contracts
        let app_contract_address =
            Self::instantiate_contract(&mut app, app_code_id, "app", &Empty {});

        // DON'T CHANGE TOKEN INIT ORDER AS ITS ADDRESSES ARE HARDCODED IN ProjectToken ENUM
        for project_token in ProjectToken::iter() {
            Self::create_cw20_base_token(&mut app, cw20_base_code_id, project_token);
        }

        let terraswap_factory_address = Self::create_terraswap_factory(
            &mut app,
            terraswap_factory_code_id,
            terraswap_pair_code_id,
            terraswap_lp_token_code_id,
        );

        let terraswap_router_address = Self::create_terraswap_router(
            &mut app,
            terraswap_router_code_id,
            &terraswap_factory_address,
        );

        // register coins at factory
        for project_coin in ProjectCoin::iter() {
            Self::register_coin(&mut app, &terraswap_factory_address, project_coin);
        }

        // create pairs
        for project_pair in ProjectPair::iter() {
            Self::create_terraswap_pool(&mut app, &terraswap_factory_address, project_pair);
        }

        // query pairs
        let terraswap_pair_list = Self::query_pairs(&app, &terraswap_factory_address);

        // increase allowance for tokens
        for pair_info in &terraswap_pair_list {
            for project_token in ProjectToken::iter() {
                if pair_info
                    .asset_infos
                    .contains(&project_token.to_terraswap_asset_info())
                {
                    Self::increase_allowance(
                        &mut app,
                        ProjectAccount::Admin,
                        ProjectAccount::Admin.get_initial_funds_amount(),
                        project_token,
                        pair_info.contract_addr.clone(),
                    );
                }
            }
        }

        // provide liquidity for all pairs
        for project_pair in ProjectPair::iter() {
            Self::provide_liquidity(&mut app, &terraswap_pair_list, project_pair);
        }

        Self {
            app,
            logs: Ok(AppResponse::default()),
            app_contract_address,
            terraswap_factory_address,
            terraswap_router_address,
            terraswap_pair_list,
        }
    }

    pub fn get_app_contract_address(&self) -> Addr {
        self.app_contract_address.clone()
    }

    pub fn get_terraswap_factory_address(&self) -> Addr {
        self.terraswap_factory_address.clone()
    }

    pub fn get_terraswap_router_address(&self) -> Addr {
        self.terraswap_router_address.clone()
    }

    pub fn get_terraswap_pair_list(&self) -> Vec<terraswap::asset::PairInfo> {
        self.terraswap_pair_list.clone()
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

    fn store_app_code(app: &mut App) -> u64 {
        app.store_code(Box::new(ContractWrapper::new(
            crate::contract::execute,
            crate::contract::instantiate,
            crate::contract::query,
        )))
    }

    fn store_cw20_base_code(app: &mut App) -> u64 {
        app.store_code(Box::new(ContractWrapper::new(
            cw20_base::contract::execute,
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

    fn store_terraswap_router_code(app: &mut App) -> u64 {
        app.store_code(Box::new(ContractWrapper::new(
            terraswap_router::contract::execute,
            terraswap_router::contract::instantiate,
            terraswap_router::contract::query,
        )))
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

    fn create_terraswap_router(
        app: &mut App,
        terraswap_router_code_id: u64,
        terraswap_factory_address: &Addr,
    ) -> Addr {
        Self::instantiate_contract(
            app,
            terraswap_router_code_id,
            "router",
            &terraswap::router::InstantiateMsg {
                terraswap_factory: terraswap_factory_address.to_string(),
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

    fn increase_allowance<T>(
        app: &mut App,
        owner: ProjectAccount,
        amount: T,
        token: ProjectToken,
        spender: impl ToString,
    ) -> AppResponse
    where
        Uint128: From<T>,
    {
        app.execute_contract(
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

    pub fn query_allowances(
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

        for asset in asset_list.iter() {
            if let ProjectAsset::Coin(project_coin) = asset {
                send_funds.push(coin(
                    PROVIDED_PER_ASSET_FUNDS_AMOUNT,
                    project_coin.to_string(),
                ));
            }
        }

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

    pub fn get_pair_info_by_asset_pair(
        terraswap_pair_list: &Vec<terraswap::asset::PairInfo>,
        project_pair: ProjectPair,
    ) -> terraswap::asset::PairInfo {
        let (project_asset1, project_asset2) = project_pair.split_pair();

        terraswap_pair_list
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

    pub fn query_all_balances(&self, project_account: ProjectAccount) -> Vec<(String, Uint128)> {
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
        for pair_info in Self::get_terraswap_pair_list(&self) {
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

    pub fn swap_with_pair<T1, T2>(
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
        let terraswap::asset::PairInfo { contract_addr, .. } = Self::get_terraswap_pair_list(&self)
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
    pub fn swap_with_router(
        &mut self,
        sender: ProjectAccount,
        amount: impl Into<Uint128>,
        swap_operations: &Vec<terraswap::router::SwapOperation>,
    ) -> StdResult<AppResponse> {
        let amount: Uint128 = amount.into();
        let sender = sender.to_address();
        let router_address = Self::get_terraswap_router_address(&self);
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

    fn check_logs(&self) {
        self.logs.as_ref().unwrap(); // check errors
    }

    pub fn prepare_deposit_by(&mut self, project_account: ProjectAccount) -> DepositBuilder {
        self.check_logs();
        DepositBuilder::new(project_account)
    }

    pub fn display_logs(&mut self) -> &mut Self {
        self.check_logs();
        println!("\n{:#?}\n", &self.logs);
        self
    }

    pub fn assert_error(&mut self, submsg: &str) -> &mut Self {
        let err = self.logs.as_ref().unwrap_err();

        let context = format!("{}", err);
        let source = err.source().unwrap().to_string();
        let info = format!("{}\n{}", context, source);
        speculoos::assert_that(&info).matches(|x| x.contains(submsg));

        self.logs = Ok(AppResponse::default()); // clear logs after reading error
        self
    }
}

pub fn create_address_generator(prefix: impl ToString) -> impl FnMut() -> Addr {
    let mut cnt = 0;

    move || {
        let mut rng = StdRng::seed_from_u64(cnt);
        cnt += 1;

        let bytes: [u8; 20] = rng.gen();
        let address =
            bech32::encode(&prefix.to_string(), bytes.to_base32(), Variant::Bech32).unwrap();

        Addr::unchecked(address)
    }
}
