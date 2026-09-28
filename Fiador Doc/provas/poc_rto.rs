// Provas de conceito do conselho de segurança (2026-09-24). NÃO compila sozinho:
// cole estas funções no fim de programs/fiador/tests/test_lease.rs (usam Env, LeaseTerms, brl, lease_pda de lá)
// e rode: cargo test --test test_lease poc_  (ou sonda_). Todas PASSAM hoje = a brecha existe.
// Depois da correção, inverta as asserções para virarem testes de regressão.

// ======================= PoC RTO (conselho de segurança) =======================

/// RTO-1: reputação máxima fabricada com aluguéis de 1 unidade (0,000001 tBRL),
/// em contratos paralelos de 1 mês, pagos no mês corrente (vale mesmo com a correção do B-A09).
#[test]
fn poc_rto_reputacao_fabricada_com_aluguel_minimo() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    env.init_profile(&tenant).unwrap();
    let token = env.tenant_token;
    let pool_antes = env.pool().total_assets;
    let saldo_antes = env.balance(&token);
    for id in 100..112u64 {
        let t = LeaseTerms { rent_amount: 1, period_secs: 60, total_periods: 1, contract_hash: [1u8; 32] };
        env.create_lease(&agency, &landlord, tenant.pubkey(), id, t).unwrap();
        let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), id);
        env.accept_lease(&tenant, token, lease).unwrap();
        // mês 0 já começou (start_ts): pagamento permitido mesmo com a correção do B-A09
        env.pay_rent(lease).unwrap();
    }
    let p = env.profile();
    assert_eq!(p.on_time, 12);
    assert_eq!(p.leases_started, 12);
    assert_eq!(p.tier(), 2);
    assert_eq!(env.pool().total_assets, pool_antes, "prêmio de 8% sobre 1 unidade = 0");
    let gasto = saldo_antes - env.balance(&token);
    println!("custo em tBRL (unidades) para tier 2: {gasto} (caução 36 u presa + 12 u de aluguel)");
    // Contrato real de R$ 5.000: caução de 1 aluguel só, e o pool cobre até R$ 15.000.
    let t = LeaseTerms { rent_amount: brl(5000), period_secs: 60, total_periods: 12, contract_hash: [2u8; 32] };
    env.create_lease(&agency, &landlord, tenant.pubkey(), 999, t).unwrap();
    let real = lease_pda(&landlord.pubkey(), &tenant.pubkey(), 999);
    env.accept_lease(&tenant, token, real).unwrap();
    assert_eq!(env.lease(&real).deposit_required, brl(5000));
}

/// RTO-2: período gigante trava cobertura do pool para sempre (due_ts estoura i64 -> pânico).
#[test]
fn poc_rto_trava_perpetua_da_cobertura() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    env.init_profile(&tenant).unwrap();
    let t = LeaseTerms { rent_amount: brl(5000), period_secs: i64::MAX, total_periods: 1, contract_hash: [3u8; 32] };
    env.create_lease(&agency, &landlord, tenant.pubkey(), 7, t).unwrap();
    let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), 7);
    let token = env.tenant_token;
    env.accept_lease(&tenant, token, lease).unwrap();
    assert_eq!(env.pool().locked_coverage, brl(15_000));
    env.warp(10 * 365 * 24 * 3600);
    let r1 = env.pay_rent(lease);
    let r2 = env.claim_default(lease);
    let r3 = env.end_lease(lease);
    for (n, r) in [("pay", &r1), ("claim", &r2), ("end", &r3)] {
        match r { Ok(_) => println!("{n}: OK"), Err(e) => println!("{n}: erro {:?} / {:?}", e.err, e.meta.logs.iter().filter(|l| l.contains("Error") || l.contains("panick") || l.contains("overflow")).collect::<Vec<_>>()) }
    }
    let l = env.lease(&lease);
    println!("status {:?} periods0 {:?} on_time {} late {} due0 {}", l.status, l.periods[0], l.paid_on_time, l.paid_late, l.due_ts(0));
    println!("locked {}", env.pool().locked_coverage);
}

/// B-A10: "recusar claim_default quando nada é pago" deixaria o mês Open para sempre e o end_lease bloqueado.
/// Aqui só confirmamos o bug atual: mês marcado Covered com R$ 0 e pagamento posterior volta à inquilina.
#[test]
fn poc_rto_b_a10_mes_coberto_sem_dinheiro() {
    let (mut env, lease) = contrato_ativo(12);
    for i in 0..4 { depois_da_carencia(&mut env, &lease, i); env.claim_default(lease).unwrap(); }
    let l = env.lease(&lease);
    assert_eq!(l.periods[3], PeriodState::Covered);
    assert_eq!(l.pool_covered_total, 0);
    let ll = env.landlord_token;
    let antes = env.balance(&ll);
    for _ in 0..4 { env.pay_rent(lease).unwrap(); }
    assert_eq!(env.balance(&ll), antes, "proprietário não recebe nada da quitação");
    assert_eq!(env.lease(&lease).deposit_balance, brl(8000), "caução passa do exigido (6000)");
}

/// B-A12: pedido antigo permite sair na janela entre vencimento e cobrança.
#[test]
fn poc_rto_b_a12_saida_antes_do_calote() {
    let mut env = Env::ready();
    env.open_position().unwrap();
    env.pool_deposit(brl(50_000)).unwrap();
    let shares = env.fetch::<Position>(&pda(&[b"position", env.investor.pubkey().as_ref()])).shares;
    env.request_withdraw(shares).unwrap();
    env.warp(10_000); // pedido "pronto" para sempre
    let (mut env, lease) = contrato_ativo_com(env, 12);
    // paga 2 meses (libera o pool), depois some
    env.pay_rent(lease).unwrap(); env.pay_rent(lease).unwrap();
    for i in 2..5 { depois_da_carencia(&mut env, &lease, i); env.claim_default(lease).unwrap(); }
    depois_da_carencia(&mut env, &lease, 5);
    // investidor vê o atraso e sai antes do claim que usa o pool
    env.pool_withdraw().unwrap();
    env.claim_default(lease).unwrap();
    assert!(env.lease(&lease).pool_covered_total > 0);
}

#[test]
fn poc_rto_trava_periodo_100_anos() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    env.init_profile(&tenant).unwrap();
    let t = LeaseTerms { rent_amount: brl(5000), period_secs: 100 * 365 * 24 * 3600, total_periods: 36, contract_hash: [3u8; 32] };
    env.create_lease(&agency, &landlord, tenant.pubkey(), 8, t).unwrap();
    let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), 8);
    let token = env.tenant_token;
    env.accept_lease(&tenant, token, lease).unwrap();
    env.warp(50 * 365 * 24 * 3600);
    assert!(env.end_lease(lease).is_err());
    assert!(env.claim_default(lease).is_err());
    println!("locked {}", env.pool().locked_coverage);
}

/// Pagar i64::MAX períodos: due_ts de índice 1 estoura?
#[test]
fn poc_rto_overflow_due_ts() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    env.init_profile(&tenant).unwrap();
    let t = LeaseTerms { rent_amount: brl(1000), period_secs: i64::MAX / 2, total_periods: 3, contract_hash: [3u8; 32] };
    env.create_lease(&agency, &landlord, tenant.pubkey(), 9, t).unwrap();
    let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), 9);
    let token = env.tenant_token;
    env.accept_lease(&tenant, token, lease).unwrap();
    for k in 0..3 { let r = env.pay_rent(lease); println!("pay {k}: {:?}", r.as_ref().map_err(|e| (e.err.clone(), e.meta.logs.iter().filter(|l| l.contains("panick")|| l.contains("rror")).cloned().collect::<Vec<_>>()))); }
    let r = env.end_lease(lease);
    println!("end: {:?}", r.as_ref().map_err(|e| (e.err.clone(), e.meta.logs.iter().filter(|l| l.contains("panick")|| l.contains("rror")).cloned().collect::<Vec<_>>())));
    let l = env.lease(&lease); println!("status {:?} end_ts {}", l.status, l.end_ts);
}
