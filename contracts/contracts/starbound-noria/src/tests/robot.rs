#[derive(Debug, Clone, Default)]
pub struct Project {
    users: Vec<User>,
    pools: Vec<Pool>,
}

impl Project {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn prepare_user(&self, name: &str) -> User {
        let mut user = User::default();
        user.name = name.to_string();
        user
    }

    pub fn show_users(&self) -> Self {
        println!("\n{:#?}\n", &self.users);
        self.to_owned()
    }

    pub fn prepare_pool(&self, asset1: &str, asset2: &str) -> Pool {
        let mut pool = Pool::default();
        pool.assets = (asset1.to_string(), asset2.to_string());
        pool
    }

    pub fn show_pools(&self) -> Self {
        println!("\n{:#?}\n", &self.pools);
        self.to_owned()
    }
}

#[derive(Debug, Clone, Default)]
pub struct User {
    pub name: String,
    pub funds: u128,
}

impl User {
    pub fn with_funds(&self, funds: u128) -> Self {
        let mut user = self.to_owned();
        user.funds = funds;
        user
    }

    pub fn back_to(&self, project: &mut Project) -> Project {
        project.users.push(self.to_owned());
        project.to_owned()
    }
}

#[derive(Debug, Clone, Default)]
pub struct Pool {
    pub assets: (String, String),
    pub liquidity: (u128, u128),
}

impl Pool {
    pub fn with_liquidity(&self, amount1: u128, amount2: u128) -> Self {
        let mut pool = self.to_owned();
        pool.liquidity = (amount1, amount2);
        pool
    }

    pub fn back_to(&self, project: &mut Project) -> Project {
        project.pools.push(self.to_owned());
        project.to_owned()
    }
}
