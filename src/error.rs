use cosmwasm_std::StdError;
use thiserror::Error;

/// Never is a placeholder to ensure we don't return any errors
#[derive(Error, Debug)]
pub enum Never {}

#[derive(Error, Debug)]
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

    // IBC
    #[error("Channel not found")]
    ChannelNotFound {},

    #[error("Swap order not found")]
    OrderNotFound {},

    #[error("Only supports channel with ibc version ics20-1, got {version}")]
    InvalidIbcVersion { version: String },

    #[error("Only supports unordered channel")]
    OnlyOrderedChannel {},

    #[error("Token reply result not found")]
    TokenResultNotFound {},

    #[error("Invalid amount")]
    InvalidAmountValue {},

    #[error("Denom not allowed: {denom}")]
    DenomNotAllowed { denom: String },

    #[error("Swap in progress")]
    SwapPending {},
}
