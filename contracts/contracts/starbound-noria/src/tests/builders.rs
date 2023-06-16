use cosmwasm_std::{coin, Addr, Coin, Decimal, Uint128};
use cw_multi_test::{AppResponse, Executor};

use crate::{
    actions::helpers::math::str_to_dec,
    messages::execute::ExecuteMsg,
    tests::suite::{Project, ProjectAccount, ToAddress, ToProjectAsset},
};

trait Helpers {
    fn check_logs(&self);
}

impl Helpers for Project {
    fn check_logs(&self) {
        self.logs.as_ref().unwrap(); // check errors
    }
}

pub trait Builders {
    fn display_logs(&mut self) -> &mut Self;
    fn assert_error(&mut self, submsg: impl ToString) -> &mut Self;
    fn prepare_deposit_by(&mut self, project_account: ProjectAccount) -> DepositBuilder;
}

impl Builders for Project {
    fn display_logs(&mut self) -> &mut Self {
        self.check_logs();
        println!("\n{:#?}\n", &self.logs);
        self
    }

    fn assert_error(&mut self, submsg: impl ToString) -> &mut Self {
        let err = self.logs.as_ref().unwrap_err();

        let context = format!("{}", err);
        let source = err.source().unwrap().to_string();
        let info = format!("{}\n{}", context, source);
        speculoos::assert_that(&info).matches(|x| x.contains(&submsg.to_string()));

        self.logs = Ok(AppResponse::default()); // clear logs after reading error
        self
    }

    fn prepare_deposit_by(&mut self, project_account: ProjectAccount) -> DepositBuilder {
        self.check_logs();
        DepositBuilder::new(project_account)
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
    pub fn new(project_account: ProjectAccount) -> Self {
        Self {
            sender: project_account.to_address(),
            asset_list: None,
            down_counter: None,
            is_rebalancing_used: None,
            funds: vec![],
        }
    }

    pub fn with_asset(&mut self, asset: impl ToString, weight: &str) -> Self {
        let mut asset_list = self.asset_list.clone().unwrap_or(vec![]);
        asset_list.push((asset.to_string(), str_to_dec(weight)));
        self.asset_list = Some(asset_list);
        self.to_owned()
    }

    pub fn with_rebalancing(&mut self, is_rebalancing_used: bool) -> Self {
        self.is_rebalancing_used = Some(is_rebalancing_used);
        self.to_owned()
    }

    pub fn with_down_counter(&mut self, down_counter: u128) -> Self {
        self.down_counter = Some(Uint128::from(down_counter));
        self.to_owned()
    }

    pub fn with_funds(&mut self, amount: u128, denom: impl ToProjectAsset + ToString) -> Self {
        self.funds.push(coin(amount, denom.to_string()));
        self.to_owned()
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

        project.logs = project.app.execute_contract(
            sender,
            project.get_app_contract_address(),
            &ExecuteMsg::Deposit {
                asset_list,
                is_rebalancing_used,
                down_counter,
            },
            &funds,
        );

        project
    }
}
