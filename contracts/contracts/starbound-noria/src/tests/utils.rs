use cosmwasm_std::{
    coin,
    testing::{mock_dependencies, mock_env, mock_info, MockApi, MockQuerier, MockStorage},
    Addr, Attribute, Coin, Empty, Env, MessageInfo, OwnedDeps, Response, StdResult, Uint128,
};
use cw_multi_test::{App, AppResponse, ContractWrapper, Executor};

use crate::{
    actions::helpers::math::str_to_dec,
    contract::{execute, instantiate, query},
    error::ContractError,
    messages::{instantiate::InstantiateMsg, query::QueryMsg},
    state::{Asset, User, CHAIN_ID_DEV},
};

pub const ADDR_ADMIN: &str = "noria18tnvnwkklyv4dyuj8x357n7vray4v4zugmp3du";
pub const ADDR_ALICE: &str = "noria1gjqnuhv52pd2a7ets2vhw9w9qa9knyhyhd7uh3";
pub const ADDR_BOB: &str = "noria1chgwz55h9kepjq0fkj5supl2ta3nwu63sck8c3";
pub const ADDR_INVALID: &str = "addr1invalid";

pub const DENOM_DENOM: &str = "ucrd";
pub const DENOM_NORIA: &str = "unoria";
pub const DENOM_NONEXISTENT: &str = "DENOM_NONEXISTENT";

pub const IS_REBALANCING_USED: bool = false;
pub const FUNDS_AMOUNT: u128 = 10_000;

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
    let msg = InstantiateMsg {
        terraswap_factory: "".to_string(),
    };

    let res = instantiate(deps.as_mut(), env.clone(), info.clone(), msg);
    (deps, env, info, res)
}

pub struct Project {
    pub address: Addr,
    app: App,
    factory_address: Addr,
}

impl Project {
    pub fn new(chain_id_mocked: Option<&str>) -> Self {
        let mut app = Self::create_app();
        // set specific chain_id to prevent execution of mocked actions on real networks
        let chain_id = chain_id_mocked.unwrap_or(CHAIN_ID_DEV);
        app.update_block(|block| block.chain_id = String::from(chain_id));

        let id = Self::store_code(&mut app);
        let address = Self::instantiate(&mut app, id);
        let factory_address = Addr::unchecked("");

        Self {
            address,
            app,
            factory_address,
        }
    }

    fn get_factory_address(&self) -> Addr {
        self.factory_address.clone()
    }

    #[track_caller]
    fn create_app() -> App {
        App::new(|router, _api, storage| {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(ADDR_ADMIN),
                    vec![
                        coin(FUNDS_AMOUNT, DENOM_DENOM),
                        coin(FUNDS_AMOUNT, DENOM_NORIA),
                    ],
                )
                .unwrap();

            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(ADDR_ALICE),
                    vec![
                        coin(FUNDS_AMOUNT, DENOM_DENOM),
                        coin(FUNDS_AMOUNT, DENOM_NORIA),
                    ],
                )
                .unwrap();

            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(ADDR_BOB),
                    vec![
                        coin(FUNDS_AMOUNT, DENOM_DENOM),
                        coin(FUNDS_AMOUNT, DENOM_NORIA),
                    ],
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
            Addr::unchecked(ADDR_ADMIN),
            &Empty {},
            &[],
            "Starbound",
            Some(ADDR_ADMIN.to_string()),
        )
        .unwrap()
    }

    // #[track_caller]
    // pub fn withdraw(&mut self, sender: &str, amount: Uint128) -> Result<AppResponse, StdError> {
    //     self.app
    //         .execute_contract(
    //             Addr::unchecked(sender.to_string()),
    //             self.address.clone(),
    //             &ExecuteMsg::Withdraw { amount },
    //             &[],
    //         )
    //         .map_err(|err| err.downcast().unwrap())
    // }

    // #[allow(clippy::too_many_arguments)]
    // #[track_caller]
    // pub fn update_config(
    //     &mut self,
    //     sender: &str,
    //     scheduler: Option<String>,
    //     stablecoin_denom: Option<String>,
    //     stablecoin_pool_id: Option<u64>,
    //     fee_default: Option<Decimal>,
    //     fee_native: Option<Decimal>,
    //     dapp_address_and_denom_list: Option<Vec<(String, String)>>,
    // ) -> Result<AppResponse, StdError> {
    //     self.app
    //         .execute_contract(
    //             Addr::unchecked(sender.to_string()),
    //             self.address.clone(),
    //             &ExecuteMsg::UpdateConfig {
    //                 scheduler,
    //                 stablecoin_denom,
    //                 stablecoin_pool_id,
    //                 fee_default,
    //                 fee_native,
    //                 dapp_address_and_denom_list,
    //             },
    //             &[],
    //         )
    //         .map_err(|err| err.downcast().unwrap())
    // }

    #[track_caller]
    pub fn query_users(&self, address_list: Vec<&str>) -> StdResult<Vec<(Addr, User)>> {
        let address_list: Vec<String> = address_list
            .iter()
            .map(|x| x.to_owned().to_owned())
            .collect();

        self.app
            .wrap()
            .query_wasm_smart(self.address.clone(), &QueryMsg::QueryUsers { address_list })
    }

    #[track_caller]
    pub fn query_dex(&self) -> StdResult<terraswap::factory::PairsResponse> {
        self.app.wrap().query_wasm_smart(
            self.get_factory_address(),
            &terraswap::factory::QueryMsg::Pairs {
                start_after: None,
                limit: None,
            },
        )
    }

    #[track_caller]
    pub fn query_balances(&self, address: &str) -> StdResult<Vec<Coin>> {
        self.app.wrap().query_all_balances(address)
    }

    // #[track_caller]
    // pub fn query_pairs(&self, contract: &Addr) -> StdResult<Vec<PairInfo>> {
    //     self.app
    //         .wrap()
    //         .query_wasm_smart(contract, &QueryMsg::QueryPairs {})
    // }

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
            Asset::new(&Addr::unchecked(ADDR_ALICE), str_to_dec("0.5")),
            Asset::new(&Addr::unchecked(ADDR_ALICE), str_to_dec("0.5")),
        ];

        let user_alice = User::new(
            &asset_list_alice,
            Uint128::from(4_u128),
            Uint128::from(FUNDS_AMOUNT),
            IS_REBALANCING_USED,
        );

        let asset_list_bob: Vec<Asset> = vec![
            Asset::new(&Addr::unchecked(ADDR_BOB), str_to_dec("0.3")),
            Asset::new(&Addr::unchecked(ADDR_BOB), str_to_dec("0.7")),
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

    // pub fn get_pools() -> Vec<Pool> {
    //     vec![
    //         // "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2"
    //         Pool::new(
    //             Uint128::one(),
    //             u128_to_dec(10),
    //             "channel-1110",
    //             "transfer",
    //             "uatom",
    //         ),
    //         // "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
    //         Pool::new(
    //             Uint128::from(497_u128),
    //             u128_to_dec(2),
    //             "channel-1110",
    //             "transfer",
    //             "ujuno",
    //         ),
    //         // "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F",
    //         Pool::new(Uint128::from(481_u128), u128_to_dec(1), "", "", ""),
    //         // virtual OSMO / OSMO pool
    //         Pool::new(Uint128::zero(), str_to_dec("0.8"), "", "", ""),
    //     ]
    // }
}
