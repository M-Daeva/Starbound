#[cfg(not(feature = "library"))]
use cosmwasm_std::StdError;
use osmosis_std::types::osmosis::gamm::v1beta1::SwapAmountInRoute;

use crate::state::AssetDenom;

// TODO: add tests for helpers
pub struct Denoms;

impl<'a> Denoms {
    pub fn list() -> Vec<(&'a str, &'a str)> {
        vec![
            (
                "ATOM",
                "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
            ),
            ("OSMO", "uosmo"),
            ("ION", "uion"),
            (
                "AKT",
                "ibc/1480B8FD20AD5FCAE81EA87584D269547DD4D436843C1D20F15E00EB64743EF4",
            ),
            (
                "DVPN",
                "ibc/9712DBB13B9631EDFA9BF61B55F1B2D290B2ADB67E3A4EB3A875F3B6081B3B84",
            ),
            (
                "IRIS",
                "ibc/7C4D60AA95E5A7558B0A364860979CA34B7FF8AAF255B87AF9E879374470CEC0",
            ),
            (
                "CRO",
                "ibc/E6931F78057F7CC5DA0FD6CEF82FF39373A6E0452BF1FD76910B93292CF356C1",
            ),
            (
                "XPRT",
                "ibc/A0CC0CF735BFB30E730C70019D4218A1244FF383503FF7579C9201AB93CA9293",
            ),
            (
                "REGEN",
                "ibc/1DCC8A6CB5689018431323953344A9F6CC4D0BFB261E88C9F7777372C10CD076",
            ),
            (
                "NGM",
                "ibc/1DC495FCEFDA068A3820F903EDBD78B942FBD204D7E93D3BA2B432E9669D1A59",
            ),
            (
                "EEUR",
                "ibc/5973C068568365FFF40DEDCF1A1CB7582B6116B731CD31A12231AE25E20B871F",
            ),
            (
                "JUNO",
                "ibc/46B44899322F3CD854D2D46DEEF881958467CDD4B3B10086DA49296BBED94BED",
            ),
            (
                "LIKE",
                "ibc/9989AD6CCA39D1131523DB0617B50F6442081162294B4795E26746292467B525",
            ),
            (
                "USTC",
                "ibc/BE1BB42D4BE3C30D50B68D7C41DB4DFCE9678E8EF8C539F6E6A9345048894FCC",
            ),
            (
                "BCNA",
                "ibc/D805F1DA50D31B96E4282C1D4181EDDFB1A44A598BFF5666F4B43E4B8BEA95A5",
            ),
            (
                "BTSG",
                "ibc/4E5444C35610CC76FC94E7F7886B93121175C28262DDFDDE6F84E82BF2425452",
            ),
            (
                "XKI",
                "ibc/B547DC9B897E7C3AA5B824696110B8E3D2C31E3ED3F02FF363DCBAD82457E07E",
            ),
            (
                "SCRT",
                "ibc/0954E1C28EB7AF5B72D24F3BC2B47BBB2FDF91BDDFD57B74B99E133AED40972A",
            ),
            (
                "MED",
                "ibc/3BCCC93AD5DF58D11A6F8A05FA8BC801CBA0BA61A981F57E91B8B598BF8061CB",
            ),
            (
                "BOOT",
                "ibc/FE2CD1E6828EC0FAB8AF39BAC45BC25B965BA67CCBC50C13A14BD610B0D1E2C4",
            ),
            (
                "CMDX",
                "ibc/EA3E1640F9B1532AB129A571203A0B9F789A7F14BB66E350DCBFA18E1A1931F0",
            ),
            (
                "CHEQ",
                "ibc/7A08C6F11EF0F59EB841B9F788A87EC9F2361C7D9703157EC13D940DC53031FA",
            ),
            (
                "STARS",
                "ibc/987C17B11ABC2B20019178ACE62929FE9840202CE79498E29FE8E5CB02B7C0A4",
            ),
            (
                "HUAHUA",
                "ibc/B9E0A1A524E98BB407D3CED8720EFEFD186002F90C1B1B7964811DD0CCC12228",
            ),
            (
                "LUM",
                "ibc/8A34AF0C1943FD0DFCDE9ADBF0B2C9959C45E87E6088EA2FC6ADACD59261B8A2",
            ),
            (
                "DSM",
                "ibc/EA4C0A9F72E2CEDF10D0E7A9A6A22954DB3444910DB5BE980DF59B05A46DAD1C",
            ),
            (
                "GRAV",
                "ibc/E97634A40119F1898989C2A23224ED83FDD0A57EA46B3A094E287288D1672B44",
            ),
            (
                "SOMM",
                "ibc/9BBA9A1C257E971E38C1422780CE6F0B0686F0A3085E2D61118D904BFE0F5F5E",
            ),
            (
                "ROWAN",
                "ibc/8318FD63C42203D16DDCAF49FE10E8590669B3219A3E87676AC9DA50722687FB",
            ),
            (
                "NETA",
                "ibc/297C64CC42B5A8D8F82FE2EBE208A6FE8F94B86037FA28C4529A23701C228F7A",
            ),
            (
                "UMEE",
                "ibc/67795E528DF67C5606FC20F824EA39A6EF55BA133F4DC79C90A8C47A0901E17C",
            ),
            (
                "DEC",
                "ibc/9BCB27203424535B6230D594553F1659C77EC173E36D9CF4759E7186EE747E84",
            ),
            (
                "PSTAKE",
                "ibc/8061A06D3BD4D52C4A28FFECF7150D370393AF0BA661C3776C54FF32836C3961",
            ),
            (
                "DAI",
                "ibc/0CD3A0285E1341859B5E86B6AB7682F023D03E97607CCC1DC95706411D866DF7",
            ),
            (
                "USDC",
                "ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858",
            ),
            (
                "MNTL",
                "ibc/CBA34207E969623D95D057D9B11B0C8B32B89A71F170577D982FDDE623813FFC",
            ),
            (
                "WETH",
                "ibc/EA1D43981D5C9A1C4AAEA9C23BB1D4FA126BA9BC7020A25E0AE4AA841EA25DC5",
            ),
            (
                "WBTC",
                "ibc/D1542AA8762DB13087D8364F3EA6509FD6F009A34F00426AF9E4F9FA85CBBF1F",
            ),
            (
                "EVMOS",
                "ibc/6AE98883D4D5D5FF9E50D7130F1305DA2FFA0C652D1DD9C123657C6B4EB2DF8A",
            ),
            (
                "TGD",
                "ibc/1E09CB0F506ACF12FDE4683FB6B34DA62FB4BE122641E0D93AAF98A87675676C",
            ),
            (
                "DOT",
                "ibc/3FF92D26B407FD61AE95D975712A7C319CDE28DE4D80BDC9978D935932B991D7",
            ),
            (
                "ODIN",
                "ibc/C360EF34A86D334F625E4CBB7DA3223AEA97174B61F35BB3758081A8160F7D9B",
            ),
            (
                "GLTO",
                "ibc/52C57FCA7D6854AA178E7A183DDBE4EF322B904B1D719FC485F6FFBC1F72A19E",
            ),
            (
                "GEO",
                "ibc/9B6FBABA36BB4A3BF127AE5E96B572A5197FD9F3111D895D8919B07BC290764A",
            ),
            (
                "BLD",
                "ibc/2DA9C149E9AD2BD27FEFA635458FB37093C256C1A940392634A16BEA45262604",
            ),
            (
                "CUDOS",
                "ibc/E09ED39F390EC51FA9F3F69BEA08B5BBE6A48B3057B2B1C3467FAAE9E58B021B",
            ),
        ]
    }

    pub fn get(symbol: &str) -> Result<AssetDenom, StdError> {
        for item in Self::list() {
            let (s, d) = item;
            if s == symbol {
                return Ok(d.to_string());
            }
        }

        Err(StdError::NotFound {
            kind: format!("{} denom is not found!", symbol),
        })
    }
}

pub struct Pools;

impl<'a> Pools {
    pub fn list() -> Vec<(&'a str, &'a str, u128)> {
        vec![
            ("ATOM", "OSMO", 1),
            ("ION", "OSMO", 2),
            ("AKT", "OSMO", 3),
            ("AKT", "ATOM", 4),
            ("DVPN", "OSMO", 5),
            ("ATOM", "DVPN", 6),
            ("IRIS", "OSMO", 7),
            ("ATOM", "IRIS", 8),
            ("CRO", "OSMO", 9),
            ("ATOM", "CRO", 10),
            ("ATOM", "XPRT", 13),
            ("XPRT", "OSMO", 15),
            ("REGEN", "ATOM", 22),
            ("REGEN", "OSMO", 42),
            ("NGM", "EEUR", 461),
            ("NGM", "OSMO", 463),
            ("EEUR", "OSMO", 481),
            ("ATOM", "EEUR", 482),
            ("JUNO", "OSMO", 497),
            ("ATOM", "JUNO", 498),
            ("LIKE", "OSMO", 553),
            ("ATOM", "LIKE", 555),
            ("USTC", "OSMO", 560),
            ("BCNA", "OSMO", 571),
            ("ATOM", "BCNA", 572),
            ("BTSG", "OSMO", 573),
            ("ATOM", "BTSG", 574),
            ("XKI", "OSMO", 577),
            ("SCRT", "OSMO", 584),
            ("SCRT", "ATOM", 585),
            ("MED", "OSMO", 586),
            ("ATOM", "MED", 587),
            ("BOOT", "OSMO", 597),
            ("ATOM", "CMDX", 600),
            ("CMDX", "OSMO", 601),
            ("CHEQ", "OSMO", 602),
            ("STARS", "OSMO", 604),
            ("HUAHUA", "OSMO", 605),
            ("ATOM", "HUAHUA", 606),
            ("LUM", "OSMO", 608),
            ("ATOM", "STARS", 611),
            ("ATOM", "DSM", 618),
            ("DSM", "OSMO", 619),
            ("GRAV", "OSMO", 625),
            ("SOMM", "OSMO", 627),
            ("ROWAN", "OSMO", 629),
            ("NETA", "OSMO", 631),
            ("UMEE", "OSMO", 641),
            ("ATOM", "DEC", 645),
            ("PSTAKE", "OSMO", 648),
            ("DAI", "OSMO", 674),
            ("USDC", "OSMO", 678),
            ("MNTL", "OSMO", 690),
            ("WETH", "OSMO", 704),
            ("WBTC", "OSMO", 712),
            ("XPRT", "USDC", 719),
            ("EVMOS", "OSMO", 722),
            ("MNTL", "USDC", 738),
            ("TGD", "OSMO", 769),
            ("DOT", "OSMO", 773),
            ("ODIN", "OSMO", 777),
            ("GLTO", "OSMO", 778),
            ("GEO", "OSMO", 787),
            ("BLD", "OSMO", 795),
            ("CUDOS", "OSMO", 796),
        ]
    }

    pub fn get_routes(
        symbol_first: &str,
        symbol_second: &str,
    ) -> Result<Vec<SwapAmountInRoute>, StdError> {
        let denom_second = &Denoms::get(symbol_second)?;
        let mut pool_first = Vec::<SwapAmountInRoute>::new();
        let mut pool_second = Vec::<SwapAmountInRoute>::new();
        const SYMBOL_OSMO: &str = "OSMO";

        for (s1, s2, n) in Self::list() {
            // returns direct pool
            if (s1 == symbol_first && s2 == symbol_second)
                || (s1 == symbol_second && s2 == symbol_first)
            {
                return Ok(vec![SwapAmountInRoute {
                    pool_id: n as u64,
                    token_out_denom: denom_second.to_string(),
                }]);
            }

            // fill pool list with first symbol pools
            if s1 == symbol_first && s2 == SYMBOL_OSMO {
                pool_first.push(SwapAmountInRoute {
                    pool_id: n as u64,
                    token_out_denom: SYMBOL_OSMO.to_string(),
                });
            }

            // fill pool list with second symbol pools
            if s1 == symbol_second && s2 == SYMBOL_OSMO {
                pool_second.push(SwapAmountInRoute {
                    pool_id: n as u64,
                    token_out_denom: denom_second.to_string(),
                });
            }
        }

        let result: Vec<SwapAmountInRoute> = pool_first
            .into_iter()
            .chain(pool_second.into_iter())
            .collect();

        if result.is_empty() {
            return Err(StdError::NotFound {
                kind: format!(
                    "From {} to {} routes are not found!",
                    symbol_first, symbol_second
                ),
            });
        }

        Ok(result)
    }
}
