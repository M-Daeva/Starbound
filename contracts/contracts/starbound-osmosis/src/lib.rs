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
    pub mod helpers;
    pub mod unit;
}
