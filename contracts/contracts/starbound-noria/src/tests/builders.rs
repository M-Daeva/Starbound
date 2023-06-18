use cosmwasm_std::{coin, from_binary, to_binary, Addr, Coin, Decimal, Uint128};
use cw_multi_test::{AppResponse, Executor};

use crate::{
    actions::helpers::math::str_to_dec,
    messages::execute::ExecuteMsg,
    messages::query::QueryMsg,
    state::{Asset, User},
    tests::suite::{
        Project, ProjectAccount, ToAddress, ToProjectAsset, WrapIntoResponse, WrappedResponse,
    },
};

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

#[derive(Debug, Clone)]
pub struct DepositBuilder {
    pub sender: Addr,
    pub asset_list: Option<Vec<(String, Decimal)>>,
    pub is_rebalancing_used: Option<bool>,
    pub down_counter: Option<Uint128>,
    pub funds: Vec<Coin>,
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

pub trait Builderable {
    fn display_logs(&mut self) -> &mut Self;
    fn assert_error(&mut self, submsg: impl ToString) -> &mut Self;

    fn prepare_deposit_by(&mut self, project_account: ProjectAccount) -> DepositBuilder;

    fn query_users(&mut self, address_list: &[ProjectAccount]) -> &mut Self;
    fn assert_user(&mut self, address_and_user: (Addr, User)) -> &mut Self;
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
            &Addr::unchecked(asset.to_string()),
            str_to_dec(weight),
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
