use cosmwasm_std::{
    coin,
    testing::{mock_dependencies, mock_env, mock_info, MockApi, MockQuerier, MockStorage},
    Addr, Attribute, Coin, Decimal, Empty, Env, MessageInfo, OwnedDeps, Response, StdError,
    Uint128,
};
use cw_multi_test::{App, AppResponse, ContractWrapper, Executor};

use crate::{
    actions::helpers::math::{str_to_dec, u128_to_dec},
    contract::{execute, instantiate, query},
    error::ContractError,
    messages::{
        execute::ExecuteMsg,
        instantiate::InstantiateMsg,
        query::{QueryMsg, QueryPoolsAndUsersResponse},
    },
    state::{AddrUnchecked, Asset, Denom, Pool, User, CHAIN_ID_DEV},
};

pub const ADDR_ADMIN_OSMO: &str = "osmo1k6ja23e7t9w2n87m2dn0cc727ag9pjkm2xlmck";

pub const ADDR_ALICE_OSMO: &str = "osmo1gjqnuhv52pd2a7ets2vhw9w9qa9knyhy7y9tgx";
pub const ADDR_ALICE_JUNO: &str = "juno1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyqd4qeg";
pub const ADDR_ALICE_ATOM: &str = "cosmos1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyklkm75";

pub const ADDR_BOB_OSMO: &str = "osmo1chgwz55h9kepjq0fkj5supl2ta3nwu63e3ds8x";
pub const ADDR_BOB_JUNO: &str = "juno1chgwz55h9kepjq0fkj5supl2ta3nwu638camkg";
pub const ADDR_BOB_ATOM: &str = "cosmos1chgwz55h9kepjq0fkj5supl2ta3nwu63327q35";
pub const ADDR_BOB_STARS: &str = "stars1chgwz55h9kepjq0fkj5supl2ta3nwu639kfa69";
pub const ADDR_BOB_SCRT: &str = "secret1cpl0n9hx9e3az7vl9tnvl5w0r7x9a4wgq2jk5m";

pub const ADDR_INVALID: &str = "addr1invalid";

pub const DENOM_OSMO: &str = "uosmo";
pub const DENOM_ATOM: &str = "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2";
pub const DENOM_JUNO: &str = "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED";
pub const DENOM_EEUR: &str = "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
pub const DENOM_STARS: &str =
    "ibc/987C17B11ABC2B20019178ACE62929FE9840202CE79498E29FE8E5CB02B7C0A4";
pub const DENOM_SCRT: &str = "ibc/0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A";
pub const DENOM_NONEXISTENT: &str = "DENOM_NONEXISTENT";

pub const IS_REBALANCING_USED: bool = false;
pub const FUNDS_AMOUNT: u128 = 10_000;

// TODO: replace EEUR -> USDC on mainnet
const STABLECOIN_DENOM: &str =
    "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F";
const STABLECOIN_POOL_ID: u64 = 481;

pub enum UserName {
    Alice,
    Bob,
}

pub type Instance = (
    OwnedDeps<MockStorage, MockApi, MockQuerier, Empty>,
    Env,
    MessageInfo,
    Result<Response, ContractError>,
);

pub fn get_instance(addr: &str) -> Instance {
    let mut deps = mock_dependencies();
    let env = mock_env();
    let info = mock_info(addr, &[]);
    let msg = InstantiateMsg {};

    let res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg);
    (deps, env, info, res)
}

// pub fn instantiate_and_deposit(
//     is_rebalancing_used: bool,
//     is_current_period: bool,
//     funds_amount: u128,
// ) -> Instance {
//     let funds_denom = DENOM_EEUR;

//     let (mut deps, env, mut info, _) = get_instance(ADDR_ADMIN_OSMO);

//     let asset_list_alice = vec![
//         Asset {
//             asset_denom: DENOM_ATOM.to_string(),
//             wallet_address: Addr::unchecked(ADDR_ALICE_ATOM),
//             wallet_balance: Uint128::zero(),
//             weight: str_to_dec("0.5"),
//             amount_to_transfer: Uint128::zero(),
//         },
//         Asset {
//             asset_denom: DENOM_JUNO.to_string(),
//             wallet_address: Addr::unchecked(ADDR_ALICE_JUNO),
//             wallet_balance: Uint128::zero(),
//             weight: str_to_dec("0.5"),
//             amount_to_transfer: Uint128::zero(),
//         },
//     ];

//     let user = User {
//         asset_list: asset_list_alice,
//         day_counter: Uint128::from(3_u128),
//         deposited: Uint128::from(funds_amount),
//         is_rebalancing_used,
//     };

//     let msg = ExecuteMsg::Deposit { user };
//     info.funds = vec![coin(funds_amount, funds_denom)];
//     info.sender = Addr::unchecked(ADDR_ALICE_OSMO);
//     let res = execute(deps.as_mut(), env.clone(), info.clone(), msg);

//     (deps, env, info, res)
// }

pub fn get_initial_pools() -> Vec<(Denom, Pool)> {
    let init_pools = vec![
        // ATOM / OSMO
        (
            "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
            Pool::new(
                Uint128::one(),
                u128_to_dec(10),
                "channel-1110",
                "transfer",
                "uatom",
            ),
        ),
        // JUNO / OSMO
        (
            "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
            Pool::new(
                Uint128::from(497_u128),
                u128_to_dec(2),
                "channel-1110",
                "transfer",
                "ujuno",
            ),
        ),
        // STABLECOIN / OSMO
        (
            STABLECOIN_DENOM,
            Pool::new(
                Uint128::from(STABLECOIN_POOL_ID as u128),
                u128_to_dec(1),
                "",
                "",
                "",
            ),
        ),
        // virtual OSMO / OSMO pool
        (
            DENOM_OSMO,
            Pool::new(Uint128::zero(), str_to_dec("0.8"), "", "", ""),
        ),
    ];

    let extracted_pools: Vec<(Denom, Pool)> = init_pools
        .iter()
        .map(|x| {
            let (denom, pool) = x.to_owned();
            (denom.to_owned(), pool)
        })
        .collect();

    extracted_pools
}

pub struct Project {
    pub address: Addr,
    app: App,
}

impl Project {
    pub fn new(chain_id_mocked: Option<&str>) -> Self {
        let mut app = Self::create_app();
        // set specific chain_id to prevent execution of mocked actions on real networks
        let chain_id = chain_id_mocked.unwrap_or(CHAIN_ID_DEV);
        app.update_block(|block| block.chain_id = String::from(chain_id));

        let id = Self::store_code(&mut app);
        let address = Self::instantiate(&mut app, id);

        Self { address, app }
    }

    #[track_caller]
    fn create_app() -> App {
        App::new(|router, _api, storage| {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(ADDR_ALICE_OSMO),
                    vec![coin(FUNDS_AMOUNT, DENOM_EEUR)],
                )
                .unwrap();

            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(ADDR_BOB_OSMO),
                    vec![coin(FUNDS_AMOUNT, DENOM_EEUR)],
                )
                .unwrap();
        })
    }

    fn store_code(app: &mut App) -> u64 {
        let contract = ContractWrapper::new(execute, instantiate, query);
        app.store_code(Box::new(contract))
    }

    #[track_caller]
    fn instantiate(app: &mut App, id: u64) -> Addr {
        app.instantiate_contract(
            id,
            Addr::unchecked(ADDR_ADMIN_OSMO),
            &Empty {},
            &[],
            "Starbound",
            Some(ADDR_ADMIN_OSMO.to_string()),
        )
        .unwrap()
    }

    #[track_caller]
    pub fn deposit(
        &mut self,
        sender: &str,
        asset_list: &Vec<Asset>,
        is_rebalancing_used: bool,
        day_counter: Uint128,
        funds: &[Coin],
    ) -> Result<AppResponse, StdError> {
        self.app
            .execute_contract(
                Addr::unchecked(sender.to_string()),
                self.address.clone(),
                &ExecuteMsg::Deposit {
                    asset_list: asset_list.to_owned(),
                    is_rebalancing_used,
                    day_counter,
                },
                funds,
            )
            .map_err(|err| err.downcast().unwrap())
    }

    #[track_caller]
    pub fn withdraw(&mut self, sender: &str, amount: Uint128) -> Result<AppResponse, StdError> {
        self.app
            .execute_contract(
                Addr::unchecked(sender.to_string()),
                self.address.clone(),
                &ExecuteMsg::Withdraw { amount },
                &[],
            )
            .map_err(|err| err.downcast().unwrap())
    }

    #[allow(clippy::too_many_arguments)]
    #[track_caller]
    pub fn update_config(
        &mut self,
        sender: &str,
        scheduler: Option<String>,
        stablecoin_denom: Option<String>,
        stablecoin_pool_id: Option<u64>,
        fee_default: Option<Decimal>,
        fee_native: Option<Decimal>,
        dapp_address_and_denom_list: Option<Vec<(String, String)>>,
    ) -> Result<AppResponse, StdError> {
        self.app
            .execute_contract(
                Addr::unchecked(sender.to_string()),
                self.address.clone(),
                &ExecuteMsg::UpdateConfig {
                    scheduler,
                    stablecoin_denom,
                    stablecoin_pool_id,
                    fee_default,
                    fee_native,
                    dapp_address_and_denom_list,
                },
                &[],
            )
            .map_err(|err| err.downcast().unwrap())
    }

    #[track_caller]
    pub fn update_pools_and_users<T: ToString>(
        &mut self,
        sender: &str,
        pools: Vec<(Denom, Pool)>,
        users: Vec<(T, User)>,
    ) -> Result<AppResponse, StdError> {
        let users: Vec<(AddrUnchecked, User)> = users
            .iter()
            .map(|(addr_generic, user)| (addr_generic.to_string(), user.to_owned()))
            .collect();

        self.app
            .execute_contract(
                Addr::unchecked(sender.to_string()),
                self.address.clone(),
                &ExecuteMsg::UpdatePoolsAndUsers { pools, users },
                &[],
            )
            .map_err(|err| err.downcast().unwrap())
    }

    #[track_caller]
    pub fn init_pools(&mut self, sender: &str) -> Result<AppResponse, StdError> {
        self.update_pools_and_users::<AddrUnchecked>(sender, get_initial_pools(), vec![])
    }

    // #[track_caller]
    // pub fn swap(&mut self, sender: &str) -> Result<AppResponse, StdError> {
    //     self.app
    //         .execute_contract(
    //             Addr::unchecked(sender.to_string()),
    //             self.address.clone(),
    //             &ExecuteMsg::Swap {},
    //             &[],
    //         )
    //         .map_err(|err| err.downcast().unwrap())
    // }

    // #[track_caller]
    // pub fn transfer(&mut self, sender: &str) -> Result<AppResponse, StdError> {
    //     self.app
    //         .execute_contract(
    //             Addr::unchecked(sender.to_string()),
    //             self.address.clone(),
    //             &ExecuteMsg::Transfer {},
    //             &[],
    //         )
    //         .map_err(|err| err.downcast().unwrap())
    // }

    #[track_caller]
    pub fn query_user(&self, address: &str) -> Result<User, StdError> {
        self.app.wrap().query_wasm_smart(
            self.address.clone(),
            &QueryMsg::QueryUser {
                address: address.to_string(),
            },
        )
    }

    #[track_caller]
    pub fn query_pools_and_users(&self) -> Result<QueryPoolsAndUsersResponse, StdError> {
        self.app
            .wrap()
            .query_wasm_smart(self.address.clone(), &QueryMsg::QueryPoolsAndUsers {})
    }

    // #[track_caller]
    // pub fn query_ledger(&self) -> Result<QueryUserResponse, StdError> {
    //     self.app
    //         .wrap()
    //         .query_wasm_smart(self.address.clone(), &QueryMsg::QueryLedger {})
    // }

    // #[track_caller]
    // pub fn query_config(&self) -> Result<QueryUserResponse, StdError> {
    //     self.app
    //         .wrap()
    //         .query_wasm_smart(self.address.clone(), &QueryMsg::QueryConfig {})
    // }

    // #[track_caller]
    // pub fn query_contract_balances(&self) -> Result<Vec<Coin>, StdError> {
    //     self.app.wrap().query_all_balances(&self.address)
    // }

    pub fn get_attrs(res: &AppResponse) -> Vec<Attribute> {
        let mut attrs: Vec<Attribute> = vec![];

        for item in &res.events {
            for attr in &item.attributes {
                attrs.push(attr.to_owned())
            }
        }

        attrs
    }

    pub fn get_attr(res: &AppResponse, key: &str) -> String {
        let attrs = Self::get_attrs(res);
        let attr = attrs.iter().find(|x| x.key == *key).unwrap();

        attr.to_owned().value
    }

    pub fn get_user(user_name: UserName) -> User {
        let asset_list_alice = vec![
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_ALICE_ATOM),
                Uint128::zero(),
                str_to_dec("0.5"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_JUNO,
                &Addr::unchecked(ADDR_ALICE_JUNO),
                Uint128::zero(),
                str_to_dec("0.5"),
                Uint128::zero(),
            ),
        ];

        let user_alice = User::new(
            &asset_list_alice,
            Uint128::from(4_u128),
            Uint128::from(FUNDS_AMOUNT),
            IS_REBALANCING_USED,
        );

        let asset_list_bob: Vec<Asset> = vec![
            Asset::new(
                DENOM_ATOM,
                &Addr::unchecked(ADDR_BOB_ATOM),
                Uint128::from(1_000_u128),
                str_to_dec("0.3"),
                Uint128::zero(),
            ),
            Asset::new(
                DENOM_JUNO,
                &Addr::unchecked(ADDR_BOB_JUNO),
                Uint128::from(1_000_u128),
                str_to_dec("0.7"),
                Uint128::zero(),
            ),
        ];

        let user_bob = User::new(
            &asset_list_bob,
            Uint128::from(3_u128),
            Uint128::from(FUNDS_AMOUNT),
            IS_REBALANCING_USED,
        );

        match user_name {
            UserName::Alice => user_alice,
            _ => user_bob,
        }
    }

    pub fn get_pools() -> Vec<Pool> {
        vec![
            // "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2"
            Pool::new(
                Uint128::one(),
                u128_to_dec(10),
                "channel-1110",
                "transfer",
                "uatom",
            ),
            // "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
            Pool::new(
                Uint128::from(497_u128),
                u128_to_dec(2),
                "channel-1110",
                "transfer",
                "ujuno",
            ),
            // "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F",
            Pool::new(Uint128::from(481_u128), u128_to_dec(1), "", "", ""),
            // virtual OSMO / OSMO pool
            Pool::new(Uint128::zero(), str_to_dec("0.8"), "", "", ""),
        ]
    }
}
