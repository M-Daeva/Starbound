use cosmwasm_std::{coin, from_binary, to_binary, Addr, Coin, Decimal, Uint128};
use cw_multi_test::{AppResponse, Executor};

use strum::IntoEnumIterator;

use crate::{
    actions::{helpers::math::str_to_dec, instantiate::FEE_RATE},
    messages::{
        execute::ExecuteMsg,
        query::{AccountBalance, AssetData, QueryMsg},
    },
    state::{Asset, Config, User, CHAIN_ID_DEV},
    tests::helpers::suite::{
        GetDecimals, GetPrice, Project, ProjectAccount, ProjectCoin, ProjectToken, ToAddress,
        ToProjectAsset, ToTerraswapAssetInfo, WrapIntoResponse, WrappedResponse,
    },
};

/// vector must be greater or equal subvector
fn check_if_vector_contains_subvector<T>(vec: &[T], subvec: &[T]) -> bool
where
    T: PartialEq,
{
    subvec.iter().all(|subvec_item| vec.contains(subvec_item))
}

fn compare_vectors_ignoring_order<T>(vec1: &[T], vec2: &[T]) -> bool
where
    T: PartialEq,
{
    check_if_vector_contains_subvector(vec1, vec2) && vec1.len() == vec2.len()
}

trait Loggable {
    fn check_logs(&self);
    fn save_logs_and_return<T: WrapIntoResponse>(&mut self, result: T) -> &mut Self;
}

impl Loggable for Project {
    // check errors
    fn check_logs(&self) {
        match &self.logs {
            WrappedResponse::Execute(execute_response) => {
                execute_response.as_ref().unwrap();
            }
            WrappedResponse::Query(query_response) => {
                query_response.as_ref().unwrap();
            }
        };
    }

    fn save_logs_and_return<T: WrapIntoResponse>(&mut self, result: T) -> &mut Self {
        self.logs = result.wrap();
        self
    }
}

pub trait Builderable {
    fn display_logs(&mut self) -> &mut Self;
    fn assert_error(&mut self, submsg: impl ToString) -> &mut Self;

    fn prepare_deposit_by(&mut self, project_account: ProjectAccount) -> DepositBuilder;
    fn prepare_withdraw_by(&mut self, project_account: ProjectAccount) -> WithdrawBuilder;
    fn prepare_update_config_by(&mut self, project_account: ProjectAccount) -> UpdateConfigBuilder;
    fn prepare_swap_by(&mut self, project_account: ProjectAccount) -> SwapBuilder;
    fn prepare_transfer_by(&mut self, project_account: ProjectAccount) -> TransferBuilder;

    fn query_users(&mut self, address_list: &[ProjectAccount]) -> &mut Self;
    fn assert_user(&mut self, address_and_user: (Addr, User)) -> &mut Self;

    fn query_config(&mut self) -> &mut Self;
    fn assert_config(&mut self, config: Config) -> &mut Self;

    fn query_assets_in_pools(&mut self) -> &mut Self;
    fn assert_assets_in_pools(&mut self) -> &mut Self;

    fn query_balances(&mut self, address_list: &[ProjectAccount]) -> &mut Self;
    // asserts [a,b,c] == [a,b,c]
    fn assert_balance(&mut self, account_balance: AccountBalance) -> &mut Self;
    // asserts [a,b,c] includes [a,b]
    fn assert_partial_balance(&mut self, account_balance: AccountBalance) -> &mut Self;
}

impl Builderable for Project {
    fn display_logs(&mut self) -> &mut Self {
        self.check_logs();
        println!("\n{:#?}\n", &self.logs);
        self
    }

    fn assert_error(&mut self, submsg: impl ToString) -> &mut Self {
        let info = match &self.logs {
            WrappedResponse::Execute(execute_response) => {
                let err = execute_response.as_ref().unwrap_err();
                let context = format!("{}", err);
                let source = err.source().unwrap().to_string();
                format!("{}\n{}", context, source)
            }
            WrappedResponse::Query(query_response) => {
                let err = query_response.as_ref().unwrap_err();
                format!("{}", err)
            }
        };

        speculoos::assert_that(&info).matches(|x| x.contains(&submsg.to_string()));

        self.save_logs_and_return(Ok(AppResponse::default())) // clear logs after reading error
    }

    fn prepare_deposit_by(&mut self, project_account: ProjectAccount) -> DepositBuilder {
        self.check_logs();
        DepositBuilder::prepare(project_account)
    }

    fn prepare_withdraw_by(&mut self, project_account: ProjectAccount) -> WithdrawBuilder {
        self.check_logs();
        WithdrawBuilder::prepare(project_account)
    }

    fn prepare_update_config_by(&mut self, project_account: ProjectAccount) -> UpdateConfigBuilder {
        self.check_logs();
        UpdateConfigBuilder::prepare(project_account)
    }

    fn prepare_swap_by(&mut self, project_account: ProjectAccount) -> SwapBuilder {
        self.check_logs();
        SwapBuilder::prepare(project_account)
    }

    fn prepare_transfer_by(&mut self, project_account: ProjectAccount) -> TransferBuilder {
        self.check_logs();
        TransferBuilder::prepare(project_account)
    }

    #[track_caller]
    fn query_users(&mut self, address_list: &[ProjectAccount]) -> &mut Self {
        self.check_logs();

        let address_list: Vec<String> = address_list.iter().map(|x| x.to_string()).collect();

        let response = self.app.wrap().query_wasm_smart::<Vec<(Addr, User)>>(
            self.get_app_contract_address(),
            &QueryMsg::QueryUsers { address_list },
        );

        let result = response.map(|x| to_binary(&x)).unwrap();

        self.save_logs_and_return(result)
    }

    fn assert_user(&mut self, address_and_user: (Addr, User)) -> &mut Self {
        if let WrappedResponse::Query(query_response) = &self.logs {
            let users: Vec<(Addr, User)> = from_binary(query_response.as_ref().unwrap()).unwrap();

            speculoos::assert_that(&users).matches(|address_and_user_list| {
                address_and_user_list
                    .iter()
                    .any(|(current_address, current_user)| {
                        let (address, user) = &address_and_user;
                        current_address == address && current_user == user
                    })
            });
        }

        self
    }

    #[track_caller]
    fn query_config(&mut self) -> &mut Self {
        self.check_logs();

        let response = self
            .app
            .wrap()
            .query_wasm_smart::<Config>(self.get_app_contract_address(), &QueryMsg::QueryConfig {});

        let result = response.map(|x| to_binary(&x)).unwrap();

        self.save_logs_and_return(result)
    }

    fn assert_config(&mut self, config: Config) -> &mut Self {
        if let WrappedResponse::Query(query_response) = &self.logs {
            let received_config: Config = from_binary(query_response.as_ref().unwrap()).unwrap();

            speculoos::assert_that(&received_config).is_equal_to(config);
        }

        self
    }

    #[track_caller]
    fn query_assets_in_pools(&mut self) -> &mut Self {
        self.check_logs();

        let response = self.app.wrap().query_wasm_smart::<Vec<AssetData>>(
            self.get_app_contract_address(),
            &crate::messages::query::QueryMsg::QueryAssetsInPools {},
        );

        let result = response.map(|x| to_binary(&x)).unwrap();

        self.save_logs_and_return(result)
    }

    fn assert_assets_in_pools(&mut self) -> &mut Self {
        if let WrappedResponse::Query(query_response) = &self.logs {
            let received_assets_in_pools: Vec<AssetData> =
                from_binary(query_response.as_ref().unwrap()).unwrap();

            let mut assets: Vec<AssetData> = vec![];

            for project_coin in ProjectCoin::iter() {
                assets.push((
                    project_coin.to_terraswap_asset_info(),
                    project_coin.get_price(),
                    project_coin.get_decimals(),
                ));
            }

            for project_token in ProjectToken::iter() {
                assets.push((
                    project_token.to_terraswap_asset_info(),
                    project_token.get_price(),
                    project_token.get_decimals(),
                ));
            }

            speculoos::assert_that(&received_assets_in_pools).matches(|received_assets_in_pools| {
                compare_vectors_ignoring_order(received_assets_in_pools, &assets)
            });
        }

        self
    }

    #[track_caller]
    fn query_balances(&mut self, address_list: &[ProjectAccount]) -> &mut Self {
        self.check_logs();

        let address_list: Vec<String> = address_list.iter().map(|x| x.to_string()).collect();

        let response = self.app.wrap().query_wasm_smart::<Vec<AccountBalance>>(
            self.get_app_contract_address(),
            &QueryMsg::QueryBalances { address_list },
        );

        let result = response.map(|x| to_binary(&x)).unwrap();

        self.save_logs_and_return(result)
    }

    fn assert_balance(&mut self, account_balance: AccountBalance) -> &mut Self {
        if let WrappedResponse::Query(query_response) = &self.logs {
            let balances_res: Vec<AccountBalance> =
                from_binary(query_response.as_ref().unwrap()).unwrap();

            let (address, balances) = account_balance;

            speculoos::assert_that(&balances_res).matches(|address_and_balance_list| {
                address_and_balance_list
                    .iter()
                    .find(|(current_address, _)| current_address == address)
                    .map_or(false, |(_, current_balances)| {
                        compare_vectors_ignoring_order(current_balances, &balances)
                    })
            });
        }

        self
    }

    fn assert_partial_balance(&mut self, account_balance: AccountBalance) -> &mut Self {
        if let WrappedResponse::Query(query_response) = &self.logs {
            let balances_res: Vec<AccountBalance> =
                from_binary(query_response.as_ref().unwrap()).unwrap();

            let (address, balances) = account_balance;

            speculoos::assert_that(&balances_res).matches(|address_and_balance_list| {
                address_and_balance_list
                    .iter()
                    .find(|(current_address, _)| current_address == address)
                    .map_or(false, |(_, current_balances)| {
                        check_if_vector_contains_subvector(current_balances, &balances)
                    })
            });
        }

        self
    }
}

#[derive(Debug, Clone)]
pub struct DepositBuilder {
    sender: Addr,
    asset_list: Option<Vec<(String, Decimal)>>,
    is_rebalancing_used: Option<bool>,
    down_counter: Option<Uint128>,
    funds: Vec<Coin>,
}

impl DepositBuilder {
    fn prepare(project_account: ProjectAccount) -> Self {
        Self {
            sender: project_account.to_address(),
            asset_list: None,
            down_counter: None,
            is_rebalancing_used: None,
            funds: vec![],
        }
    }

    #[track_caller]
    pub fn execute_and_switch_to<'a>(&self, project: &'a mut Project) -> &'a mut Project {
        let DepositBuilder {
            sender,
            asset_list,
            is_rebalancing_used,
            down_counter,
            funds,
        } = self.to_owned();

        let result = project.app.execute_contract(
            sender,
            project.get_app_contract_address(),
            &ExecuteMsg::Deposit {
                asset_list,
                is_rebalancing_used,
                down_counter,
            },
            &funds,
        );

        project.save_logs_and_return(result)
    }
}

pub trait BuilderableDeposit {
    fn with_asset(&mut self, asset: impl ToString, weight: &str) -> Self;
    fn with_rebalancing(&mut self, is_rebalancing_used: bool) -> Self;
    fn with_down_counter(&mut self, down_counter: u128) -> Self;
    fn with_funds(&mut self, amount: u128, denom: impl ToProjectAsset + ToString) -> Self;
}

impl BuilderableDeposit for DepositBuilder {
    fn with_asset(&mut self, asset: impl ToString, weight: &str) -> Self {
        let mut asset_list = self.asset_list.clone().unwrap_or(vec![]);
        asset_list.push((asset.to_string(), str_to_dec(weight)));
        self.asset_list = Some(asset_list);
        self.to_owned()
    }

    fn with_rebalancing(&mut self, is_rebalancing_used: bool) -> Self {
        self.is_rebalancing_used = Some(is_rebalancing_used);
        self.to_owned()
    }

    fn with_down_counter(&mut self, down_counter: u128) -> Self {
        self.down_counter = Some(Uint128::from(down_counter));
        self.to_owned()
    }

    fn with_funds(&mut self, amount: u128, denom: impl ToProjectAsset + ToString) -> Self {
        self.funds.push(coin(amount, denom.to_string()));
        self.to_owned()
    }
}

impl BuilderableDeposit for User {
    fn with_asset(&mut self, asset: impl ToString, weight: &str) -> Self {
        self.asset_list.push(Asset::new(
            &asset.to_string(),
            str_to_dec(weight),
            CHAIN_ID_DEV,
        ));
        self.to_owned()
    }

    fn with_rebalancing(&mut self, is_rebalancing_used: bool) -> Self {
        self.is_rebalancing_used = is_rebalancing_used;
        self.to_owned()
    }

    fn with_down_counter(&mut self, down_counter: u128) -> Self {
        self.down_counter = Uint128::from(down_counter);
        self.to_owned()
    }

    fn with_funds(&mut self, amount: u128, _denom: impl ToProjectAsset + ToString) -> Self {
        self.stable_balance = Uint128::from(amount);
        self.to_owned()
    }
}

pub trait BuilderableUser {
    fn prepare() -> Self;
    fn complete_with_name(&mut self, project_account: ProjectAccount) -> (Addr, User);
}

impl BuilderableUser for User {
    fn prepare() -> Self {
        Self::default()
    }

    fn complete_with_name(&mut self, project_account: ProjectAccount) -> (Addr, User) {
        (project_account.to_address(), self.to_owned())
    }
}

#[derive(Debug, Clone)]
pub struct WithdrawBuilder {
    sender: Addr,
    amount: Uint128,
}

impl WithdrawBuilder {
    fn prepare(project_account: ProjectAccount) -> Self {
        Self {
            sender: project_account.to_address(),
            amount: Uint128::zero(),
        }
    }

    #[track_caller]
    pub fn execute_and_switch_to<'a>(&self, project: &'a mut Project) -> &'a mut Project {
        let WithdrawBuilder { sender, amount } = self.to_owned();

        let result = project.app.execute_contract(
            sender,
            project.get_app_contract_address(),
            &ExecuteMsg::Withdraw { amount },
            &[],
        );

        project.save_logs_and_return(result)
    }
}

pub trait BuilderableWithdraw {
    fn with_amount(&mut self, amount: u128) -> Self;
}

impl BuilderableWithdraw for WithdrawBuilder {
    fn with_amount(&mut self, amount: u128) -> Self {
        self.amount = Uint128::from(amount);
        self.to_owned()
    }
}

#[derive(Debug, Clone)]
pub struct UpdateConfigBuilder {
    sender: Addr,
    scheduler: Option<String>,
    terraswap_factory: Option<String>,
    terraswap_router: Option<String>,
    fee_rate: Option<Decimal>,
}

impl UpdateConfigBuilder {
    fn prepare(project_account: ProjectAccount) -> Self {
        Self {
            sender: project_account.to_address(),
            scheduler: None,
            terraswap_factory: None,
            terraswap_router: None,
            fee_rate: None,
        }
    }

    #[track_caller]
    pub fn execute_and_switch_to<'a>(&self, project: &'a mut Project) -> &'a mut Project {
        let UpdateConfigBuilder {
            sender,
            scheduler,
            terraswap_factory,
            terraswap_router,
            fee_rate,
        } = self.to_owned();

        let result = project.app.execute_contract(
            sender,
            project.get_app_contract_address(),
            &ExecuteMsg::UpdateConfig {
                scheduler,
                terraswap_factory,
                terraswap_router,
                fee_rate,
            },
            &[],
        );

        project.save_logs_and_return(result)
    }
}

pub trait BuilderableUpdateConfig {
    fn with_scheduler(&mut self, scheduler: impl ToString) -> Self;
    fn with_terraswap_factory(&mut self, terraswap_factory_address: impl ToString) -> Self;
    fn with_terraswap_router(&mut self, terraswap_router_address: impl ToString) -> Self;
    fn with_fee_rate(&mut self, fee_rate: &str) -> Self;
}

impl BuilderableUpdateConfig for UpdateConfigBuilder {
    fn with_scheduler(&mut self, scheduler: impl ToString) -> Self {
        self.scheduler = Some(scheduler.to_string());
        self.to_owned()
    }

    fn with_terraswap_factory(&mut self, terraswap_factory_address: impl ToString) -> Self {
        self.terraswap_factory = Some(terraswap_factory_address.to_string());
        self.to_owned()
    }

    fn with_terraswap_router(&mut self, terraswap_router_address: impl ToString) -> Self {
        self.terraswap_router = Some(terraswap_router_address.to_string());
        self.to_owned()
    }

    fn with_fee_rate(&mut self, fee_rate: &str) -> Self {
        self.fee_rate = Some(str_to_dec(fee_rate));
        self.to_owned()
    }
}

impl BuilderableUpdateConfig for Config {
    fn with_scheduler(&mut self, scheduler: impl ToString) -> Self {
        self.scheduler = Addr::unchecked(scheduler.to_string());
        self.to_owned()
    }

    fn with_terraswap_factory(&mut self, terraswap_factory_address: impl ToString) -> Self {
        self.terraswap_factory = Addr::unchecked(terraswap_factory_address.to_string());
        self.to_owned()
    }

    fn with_terraswap_router(&mut self, terraswap_router_address: impl ToString) -> Self {
        self.terraswap_router = Addr::unchecked(terraswap_router_address.to_string());
        self.to_owned()
    }

    fn with_fee_rate(&mut self, fee_rate: &str) -> Self {
        self.fee_rate = str_to_dec(fee_rate);
        self.to_owned()
    }
}

pub trait BuilderableConfig {
    fn prepare_by(project_account: ProjectAccount) -> Self;
}

impl BuilderableConfig for Config {
    fn prepare_by(project_account: ProjectAccount) -> Self {
        Self::new(
            &project_account.to_address(),
            &project_account.to_address(),
            &Addr::unchecked(""),
            &Addr::unchecked(""),
            FEE_RATE,
        )
    }
}

#[derive(Debug, Clone)]
pub struct SwapBuilder {
    sender: Addr,
}

impl SwapBuilder {
    fn prepare(project_account: ProjectAccount) -> Self {
        Self {
            sender: project_account.to_address(),
        }
    }

    #[track_caller]
    pub fn execute_and_switch_to<'a>(&self, project: &'a mut Project) -> &'a mut Project {
        let SwapBuilder { sender } = self.to_owned();

        let result = project.app.execute_contract(
            sender,
            project.get_app_contract_address(),
            &ExecuteMsg::Swap {},
            &[],
        );

        project.save_logs_and_return(result)
    }
}

#[derive(Debug, Clone)]
pub struct TransferBuilder {
    sender: Addr,
}

impl TransferBuilder {
    fn prepare(project_account: ProjectAccount) -> Self {
        Self {
            sender: project_account.to_address(),
        }
    }

    #[track_caller]
    pub fn execute_and_switch_to<'a>(&self, project: &'a mut Project) -> &'a mut Project {
        let TransferBuilder { sender } = self.to_owned();

        let result = project.app.execute_contract(
            sender,
            project.get_app_contract_address(),
            &ExecuteMsg::Transfer {},
            &[],
        );

        project.save_logs_and_return(result)
    }
}

pub trait BuilderableBalance {
    fn prepare_for(account: ProjectAccount) -> Self;
    fn with_funds(&mut self, amount: u128, asset: impl ToTerraswapAssetInfo) -> Self;
}

impl BuilderableBalance for AccountBalance {
    fn prepare_for(account: ProjectAccount) -> Self {
        (account.to_address(), vec![])
    }

    fn with_funds(&mut self, amount: u128, asset: impl ToTerraswapAssetInfo) -> Self {
        let (address, mut asset_info_and_amount_list) = self.clone();
        asset_info_and_amount_list.push((asset.to_terraswap_asset_info(), Uint128::from(amount)));

        (address, asset_info_and_amount_list)
    }
}
