// Provas de conceito do conselho de segurança (2026-09-24). NÃO compila sozinho:
// cole estas funções no fim de programs/fiador/tests/test_lease.rs (usam Env, LeaseTerms, brl, lease_pda de lá)
// e rode: cargo test --test test_lease poc_  (ou sonda_). Todas PASSAM hoje = a brecha existe.
// Depois da correção, inverta as asserções para virarem testes de regressão.

// ======================= SONDAGENS DO AUDITOR =======================
#[test]
fn sonda_b_a09_adiantado_conta_em_dia() {
    let (mut env, lease) = contrato_ativo(12);
    for _ in 0..3 { env.pay_rent(lease).unwrap(); }
    let l = env.lease(&lease);
    assert_eq!(l.paid_on_time, 3);
    assert_eq!(env.profile().on_time, 3);
}

#[test]
fn sonda_b_a18_reabre_disputa() {
    let (mut env, lease) = contrato_ativo(2);
    env.pay_rent(lease).unwrap();
    env.pay_rent(lease).unwrap();
    env.warp(120);
    env.end_lease(lease).unwrap();
    let (landlord, agency) = (env.landlord.insecure_clone(), env.agency.insecure_clone());
    env.open_dispute(&landlord, lease, brl(1000)).unwrap();
    env.resolve_dispute(&agency, lease, brl(500)).unwrap();
    env.open_dispute(&landlord, lease, brl(1000)).unwrap();
    assert_eq!(env.lease(&lease).status, LeaseStatus::Disputed);
}

#[test]
fn sonda_b_a10_mes_coberto_sem_dinheiro() {
    let (mut env, lease) = contrato_ativo(6);
    let antes = env.balance(&env.landlord_token);
    for mes in 0..4 { depois_da_carencia(&mut env, &lease, mes); env.claim_default(lease).unwrap(); }
    let l = env.lease(&lease);
    assert_eq!(l.periods[3], PeriodState::Covered);
    assert_eq!(env.balance(&env.landlord_token) - antes, brl(6000));
    for _ in 0..4 { env.pay_rent(lease).unwrap(); }
    assert_eq!(env.balance(&env.landlord_token) - antes, brl(6000), "dono nunca recebe o 4o mes");
    assert_eq!(env.lease(&lease).deposit_balance, brl(8000), "valor foi para a caucao da inquilina");
}

#[test]
fn sonda_periodo_gigante_panico() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) = (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    let t = LeaseTerms { total_periods: 12, period_secs: i64::MAX / 4, ..terms(2000) };
    env.create_lease(&agency, &landlord, tenant.pubkey(), 1, t).unwrap();
    env.init_profile(&tenant).unwrap();
    let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), 1);
    let token = env.tenant_token;
    env.accept_lease(&tenant, token, lease).unwrap();
    assert_eq!(env.pool().locked_coverage, brl(6000));
    let r = env.claim_default(lease);
    let e = r.expect_err("deveria falhar");
    println!("claim_default periodo gigante: {:?}\n{}", e.err, e.meta.logs.join("\n"));
    let r = env.end_lease(lease);
    let e = r.expect_err("deveria falhar");
    println!("end_lease periodo gigante: {:?}\n{}", e.err, e.meta.logs.join("\n"));
}

#[test]
fn sonda_invariante_divida_pool_implica_caucao_zero() {
    let mut seed: u64 = 0x9E3779B97F4A7C15;
    let mut rnd = || { seed ^= seed << 13; seed ^= seed >> 7; seed ^= seed << 17; seed };
    for _run in 0..12 {
        let (mut env, lease) = contrato_ativo(12);
        for _ in 0..40 {
            let r = rnd() % 4;
            if r == 0 { let _ = env.pay_rent(lease); }
            else if r == 1 { let _ = env.claim_default(lease); }
            else { env.warp((rnd() % 90) as i64 + 1); let _ = env.claim_default(lease); }
            let l = env.lease(&lease);
            assert!(!(l.pool_debt > 0 && l.deposit_balance > 0), "invariante quebrado: debt={} dep={}", l.pool_debt, l.deposit_balance);
            assert_eq!(env.balance(&pda(&[b"vault", lease.as_ref()])), l.deposit_balance);
            let p = env.pool();
            assert!(env.balance(&pda(&[b"pool_vault"])) >= p.total_assets);
            assert_eq!(p.locked_coverage, l.coverage_cap - l.pool_covered_total);
        }
    }
}
