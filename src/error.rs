use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Custom Error val: {val:?}")]
    CustomError { val: String },

    #[error("Funds are not found!")]
    FundsAreNotFound {},

    #[error("User is not found!")]
    UserIsNotFound {},

    #[error("Non equal vectors")]
    NonEqualVectors {},

    #[error("Empty vector")]
    EmptyVector {},
}
