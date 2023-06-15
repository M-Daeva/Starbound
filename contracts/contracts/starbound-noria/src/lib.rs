pub mod contract;
pub mod error;
pub mod state;

pub mod actions {
    pub mod execute;
    pub mod instantiate;
    pub mod other;
    pub mod query;

    pub mod helpers {
        pub mod math;
        pub mod verifier;
    }
}

pub mod messages {
    pub mod execute;
    pub mod instantiate;
    pub mod other;
    pub mod query;
}

#[cfg(test)]
mod tests {
    pub mod builders;
    pub mod helpers;
    pub mod integration;
    pub mod robot;
    pub mod robot_test;
    pub mod suite;
    pub mod suite_test;
}
