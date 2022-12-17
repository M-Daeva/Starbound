use cosmwasm_std::StdError;
use thiserror::Error;

/// Never is a placeholder to ensure we don't return any errors
#[derive(Error, Debug)]
pub enum Never {}

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Custom Error val: {val:?}")]
    CustomError { val: String },

    #[error("Funds are not found!")]
    FundsAreNotFound {},

    #[error("Sended funds are not equal planned payment!")]
    FundsAreNotEqual {},

    #[error("There are not enough funds to withdraw!")]
    WithdrawAmountIsExceeded {},

    #[error("User is not found!")]
    UserIsNotFound {},

    #[error("Asset is not found in pool list!")]
    AssetIsNotFound {},

    #[error("Non equal vectors")]
    NonEqualVectors {},

    #[error("Empty vector")]
    EmptyVector {},

    #[error("Sender does not have access permissions!")]
    Unauthorized {},

    #[error("Pool is not updated!")]
    PoolIsNotUpdated {},

    #[error("Sum of weights is not equal one!")]
    WeightsAreUnbalanced {},

    #[error("Assets are duplicated!")]
    DuplicatedAssets {},

    #[error("Unexpected funds were found!")]
    UnexpectedFunds {},

    #[error("Weight is out of range!")]
    WeightIsOutOfRange {},

    #[error("Stablecoin pool id is not updated!")]
    StablePoolIdIsNotUpdated {},
}
