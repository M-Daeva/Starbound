use crate::tests::robot::Project;

#[test]
fn robot() {
    let mut project = Project::new();

    project
        .prepare_user("Alice")
        .with_funds(42)
        .back_to(&mut project)
        .prepare_user("Bob")
        .with_funds(420)
        .back_to(&mut project)
        .show_users()
        .prepare_pool("qwe", "asd")
        .with_liquidity(5, 10)
        .back_to(&mut project)
        .prepare_pool("zxc", "tyu")
        .with_liquidity(1, 7)
        .back_to(&mut project)
        .show_pools();
}
