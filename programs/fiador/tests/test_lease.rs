//! Testes do Fiador.sol com LiteSVM (Solana simulada em memória, com relógio controlável).
//! Cada brecha de docs/SEGURANCA.md vira pelo menos um caso aqui.
use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::{instruction::Instruction, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    fiador::{state::*, LeaseTerms},
    litesvm::{types::FailedTransactionMetadata, LiteSVM},
    litesvm_token::{
        get_spl_account, spl_token::state::Account as TokenAccount, CreateAccount, CreateMint,
        MintTo,
    },
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

const DEC: u64 = 1_000_000; // 6 casas decimais: 1 tBRL = 1_000_000 unidades
fn brl(reais: u64) -> u64 {
    reais * DEC
}

fn token_program() -> Pubkey {
    anchor_spl::token::ID
}

fn pda(seeds: &[&[u8]]) -> Pubkey {
    Pubkey::find_program_address(seeds, &fiador::id()).0
}

/// Endereço dos dados do programa publicado (loader atualizável).
fn program_data() -> Pubkey {
    Pubkey::find_program_address(&[fiador::id().as_ref()], &anchor_lang::solana_program::bpf_loader_upgradeable::ID).0
}

/// Grava a autoridade de atualização nos dados do programa. Formato do cabeçalho:
/// tipo (4 bytes, 3 = ProgramData) · slot (8) · Option<Pubkey> (1 + 32).
fn definir_autoridade_de_atualizacao(svm: &mut LiteSVM, autoridade: &Pubkey) {
    let endereco = program_data();
    let mut conta = svm.get_account(&endereco).expect("dados do programa");
    conta.data[12] = 1;
    conta.data[13..45].copy_from_slice(autoridade.as_ref());
    svm.set_account(endereco, conta).unwrap();
}

fn lease_pda(landlord: &Pubkey, tenant: &Pubkey, id: u64) -> Pubkey {
    pda(&[b"lease", landlord.as_ref(), tenant.as_ref(), &id.to_le_bytes()])
}

/// Parâmetros do deploy de demonstração: "um mês" = 60 s.
fn demo_params() -> ConfigParams {
    ConfigParams {
        demo_mode: true,
        min_period_secs: 60,
        max_period_secs: 600,
        min_rent_amount: brl(100),
        grace_secs: 20,
        premium_bps: 800,
        apy_bps: 1000,
        coverage_months: 3,
        max_coverage_amount: brl(15_000),
        coverage_waiting_periods: 2,
        // Nos testes antigos a cobertura é cheia desde a espera e sem franquia, para
        // eles continuarem testando o que testavam. As regras reais (¼ de aluguel por
        // mês pago e franquia de 20%) estão em `regras_antifraude()`.
        coverage_growth_bps: 30_000,
        landlord_deductible_bps: 0,
        agency_max_pool_bps: 5000,
        withdraw_cooldown_secs: 30,
        dispute_window_secs: 30,
        // Sem quarentena nos testes antigos; os testes de resposta a golpe usam 30 s.
        pool_quarantine_secs: 0,
    }
}

struct Env {
    svm: LiteSVM,
    admin: Keypair,
    agency: Keypair,
    landlord: Keypair,
    tenant: Keypair,
    stranger: Keypair,
    investor: Keypair,
    mint: Pubkey,
    admin_token: Pubkey,
    tenant_token: Pubkey,
    stranger_token: Pubkey,
    landlord_token: Pubkey,
    investor_token: Pubkey,
}

impl Env {
    fn new() -> Self {
        let mut svm = LiteSVM::new();
        let bytes = include_bytes!(concat!(env!("CARGO_TARGET_TMPDIR"), "/../deploy/fiador.so"));
        svm.add_program(fiador::id(), bytes).unwrap();

        let [admin, agency, landlord, tenant, stranger, investor] =
            [(); 6].map(|_| Keypair::new());
        // O LiteSVM publica o programa sem autoridade de atualização; aqui o admin
        // passa a ser quem publicou (o `initialize` exige isso: B-A21).
        definir_autoridade_de_atualizacao(&mut svm, &admin.pubkey());
        for k in [&admin, &agency, &landlord, &tenant, &stranger, &investor] {
            svm.airdrop(&k.pubkey(), 100_000_000_000).unwrap();
        }
        let mint = CreateMint::new(&mut svm, &admin)
            .authority(&admin.pubkey())
            .decimals(6)
            .send()
            .unwrap();
        let admin_token = CreateAccount::new(&mut svm, &admin, &mint)
            .owner(&admin.pubkey())
            .send()
            .unwrap();
        let tenant_token = CreateAccount::new(&mut svm, &admin, &mint)
            .owner(&tenant.pubkey())
            .send()
            .unwrap();
        let stranger_token = CreateAccount::new(&mut svm, &admin, &mint)
            .owner(&stranger.pubkey())
            .send()
            .unwrap();
        let landlord_token = CreateAccount::new(&mut svm, &admin, &mint)
            .owner(&landlord.pubkey())
            .send()
            .unwrap();
        let investor_token = CreateAccount::new(&mut svm, &admin, &mint)
            .owner(&investor.pubkey())
            .send()
            .unwrap();
        MintTo::new(&mut svm, &admin, &mint, &investor_token, brl(100_000))
            .owner(&admin)
            .send()
            .unwrap();
        MintTo::new(&mut svm, &admin, &mint, &admin_token, brl(1_000_000))
            .owner(&admin)
            .send()
            .unwrap();
        MintTo::new(&mut svm, &admin, &mint, &tenant_token, brl(1_000_000))
            .owner(&admin)
            .send()
            .unwrap();
        MintTo::new(&mut svm, &admin, &mint, &stranger_token, brl(100_000))
            .owner(&admin)
            .send()
            .unwrap();

        Env {
            svm, admin, agency, landlord, tenant, stranger, investor, mint,
            admin_token, tenant_token, stranger_token, landlord_token, investor_token,
        }
    }

    fn send(&mut self, ix: Instruction, signers: &[&Keypair]) -> Result<(), FailedTransactionMetadata> {
        let payer = signers[0].pubkey();
        let blockhash = self.svm.latest_blockhash();
        let msg = Message::new_with_blockhash(&[ix], Some(&payer), &blockhash);
        let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), signers).unwrap();
        let res = self.svm.send_transaction(tx).map(|_| ());
        self.svm.expire_blockhash();
        res
    }

    fn fetch<T: AccountDeserialize>(&self, key: &Pubkey) -> T {
        let acc = self.svm.get_account(key).expect("conta não existe");
        T::try_deserialize(&mut acc.data.as_slice()).unwrap()
    }

    fn balance(&self, token_account: &Pubkey) -> u64 {
        get_spl_account::<TokenAccount>(&self.svm, token_account).unwrap().amount
    }

    // ---------- instruções ----------

    fn initialize(&mut self, params: ConfigParams, deposit: u64) -> Result<(), FailedTransactionMetadata> {
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::Initialize { params, initial_pool_deposit: deposit }.data(),
            fiador::accounts::Initialize {
                admin: self.admin.pubkey(),
                config: pda(&[b"config"]),
                pool: pda(&[b"pool"]),
                mint: self.mint,
                pool_vault: pda(&[b"pool_vault"]),
                yield_reserve: pda(&[b"yield_reserve"]),
                admin_token: self.admin_token,
                program_data: program_data(),
                token_program: token_program(),
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        let admin = self.admin.insecure_clone();
        self.send(ix, &[&admin])
    }

    fn register_agency(&mut self, signer: &Keypair, authority: Pubkey) -> Result<(), FailedTransactionMetadata> {
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::RegisterAgency { authority }.data(),
            fiador::accounts::RegisterAgency {
                admin: signer.pubkey(),
                config: pda(&[b"config"]),
                agency: pda(&[b"agency", authority.as_ref()]),
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(ix, &[signer])
    }

    fn init_profile(&mut self, tenant: &Keypair) -> Result<(), FailedTransactionMetadata> {
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::InitProfile {}.data(),
            fiador::accounts::InitProfile {
                tenant: tenant.pubkey(),
                profile: pda(&[b"profile", tenant.pubkey().as_ref()]),
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(ix, &[tenant])
    }

    fn create_lease(
        &mut self,
        agency: &Keypair,
        landlord: &Keypair,
        tenant: Pubkey,
        id: u64,
        terms: LeaseTerms,
    ) -> Result<(), FailedTransactionMetadata> {
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::CreateLease { lease_id: id, terms }.data(),
            fiador::accounts::CreateLease {
                agency_authority: agency.pubkey(),
                landlord: landlord.pubkey(),
                tenant,
                config: pda(&[b"config"]),
                agency: pda(&[b"agency", agency.pubkey().as_ref()]),
                lease: lease_pda(&landlord.pubkey(), &tenant, id),
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        if agency.pubkey() == landlord.pubkey() {
            self.send(ix, &[agency])
        } else {
            self.send(ix, &[agency, landlord])
        }
    }

    fn accept_lease(
        &mut self,
        signer: &Keypair,
        signer_token: Pubkey,
        lease: Pubkey,
    ) -> Result<(), FailedTransactionMetadata> {
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::AcceptLease {}.data(),
            fiador::accounts::AcceptLease {
                tenant: signer.pubkey(),
                config: pda(&[b"config"]),
                pool: pda(&[b"pool"]),
                agency: pda(&[b"agency", self.agency.pubkey().as_ref()]),
                lease,
                profile: pda(&[b"profile", signer.pubkey().as_ref()]),
                mint: self.mint,
                vault: pda(&[b"vault", lease.as_ref()]),
                tenant_token: signer_token,
                token_program: token_program(),
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(ix, &[signer])
    }

    /// Ambiente pronto: protocolo inicializado com R$ 100.000 no pool e imobiliária credenciada.
    fn ready() -> Self {
        let mut env = Env::new();
        env.initialize(demo_params(), brl(100_000)).unwrap();
        let (admin, agency) = (env.admin.insecure_clone(), env.agency.pubkey());
        env.register_agency(&admin, agency).unwrap();
        env
    }
}

fn terms(rent_reais: u64) -> LeaseTerms {
    LeaseTerms {
        rent_amount: brl(rent_reais),
        period_secs: 60,
        total_periods: 12,
        contract_hash: [7u8; 32],
    }
}

/// Confere que a transação falhou com o erro esperado (nome aparece nos logs).
fn assert_err(res: Result<(), FailedTransactionMetadata>, expected: &str) {
    let err = res.expect_err(&format!("deveria falhar com {expected}"));
    let logs = err.meta.logs.join("\n");
    assert!(
        logs.contains(expected) || format!("{:?}", err.err).contains(expected),
        "esperava {expected}, veio: {:?}\n{logs}",
        err.err
    );
}

// ======================= initialize =======================

#[test]
fn inicializa_com_deposito_permanente_no_pool() {
    let env = Env::ready();
    let pool: Pool = env.fetch(&pda(&[b"pool"]));
    assert_eq!(pool.total_assets, brl(100_000));
    assert_eq!(pool.total_shares, brl(100_000));
    assert_eq!(pool.locked_coverage, 0);
    assert_eq!(env.balance(&pda(&[b"pool_vault"])), brl(100_000));

    let config: Config = env.fetch(&pda(&[b"config"]));
    assert!(config.demo_mode);
    assert_eq!(config.admin, env.admin.pubkey());
}

#[test]
fn recusa_modo_producao_com_mes_curto() {
    // SEGURANCA.md item 2: fora da demo, "mês" de 60 s permitiria fabricar reputação.
    let mut env = Env::new();
    let params = ConfigParams { demo_mode: false, ..demo_params() };
    assert_err(env.initialize(params, brl(100_000)), "InvalidConfig");
}

#[test]
fn modo_producao_aceita_mes_de_28_dias() {
    let mut env = Env::new();
    let params = ConfigParams {
        demo_mode: false,
        min_period_secs: PRODUCTION_MIN_PERIOD_SECS,
        max_period_secs: MAX_PERIOD_SECS_LIMIT,
        ..demo_params()
    };
    env.initialize(params, brl(100_000)).unwrap();
}

#[test]
fn nao_inicializa_duas_vezes() {
    let mut env = Env::ready();
    assert!(env.initialize(demo_params(), brl(1)).is_err());
}

// ======================= imobiliária =======================

#[test]
fn so_o_admin_credencia_imobiliaria() {
    let mut env = Env::ready();
    let stranger = env.stranger.insecure_clone();
    assert_err(env.register_agency(&stranger, stranger.pubkey()), "ConstraintHasOne");
}

// ======================= create_lease =======================

#[test]
fn imobiliaria_nao_credenciada_nao_cria_contrato() {
    // SEGURANCA.md item 1: conluio exige imobiliária credenciada.
    let mut env = Env::ready();
    let (stranger, landlord, tenant) =
        (env.stranger.insecure_clone(), env.landlord.insecure_clone(), env.tenant.pubkey());
    assert_err(env.create_lease(&stranger, &landlord, tenant, 1, terms(2000)), "AccountNotInitialized");
}

#[test]
fn ninguem_aluga_de_si_mesmo() {
    let mut env = Env::ready();
    let (agency, landlord) = (env.agency.insecure_clone(), env.landlord.insecure_clone());
    let own = landlord.pubkey();
    assert_err(env.create_lease(&agency, &landlord, own, 1, terms(2000)), "SameParty");
}

#[test]
fn imobiliaria_nao_e_inquilina_de_si_mesma() {
    let mut env = Env::ready();
    let (agency, landlord) = (env.agency.insecure_clone(), env.landlord.insecure_clone());
    let own = agency.pubkey();
    assert_err(env.create_lease(&agency, &landlord, own, 1, terms(2000)), "SameParty");
}

#[test]
fn recusa_mes_abaixo_do_minimo() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.pubkey());
    let t = LeaseTerms { period_secs: 59, ..terms(2000) };
    assert_err(env.create_lease(&agency, &landlord, tenant, 1, t), "PeriodTooShort");
}

#[test]
fn recusa_prazo_invalido() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.pubkey());
    let zero = LeaseTerms { total_periods: 0, ..terms(2000) };
    assert_err(env.create_lease(&agency, &landlord, tenant, 1, zero), "InvalidPeriods");
    let longo = LeaseTerms { total_periods: 37, ..terms(2000) };
    assert_err(env.create_lease(&agency, &landlord, tenant, 2, longo), "InvalidPeriods");
}

#[test]
fn proprietario_precisa_assinar() {
    // A imobiliária sozinha não cria contrato em nome de um proprietário.
    let mut env = Env::ready();
    let agency = env.agency.insecure_clone();
    let landlord = env.landlord.pubkey();
    let tenant = env.tenant.pubkey();
    let mut metas = fiador::accounts::CreateLease {
        agency_authority: agency.pubkey(),
        landlord,
        tenant,
        config: pda(&[b"config"]),
        agency: pda(&[b"agency", agency.pubkey().as_ref()]),
        lease: lease_pda(&landlord, &tenant, 1),
        system_program: system_program::ID,
    }
    .to_account_metas(None);
    metas[1].is_signer = false;
    let ix = Instruction::new_with_bytes(
        fiador::id(),
        &fiador::instruction::CreateLease { lease_id: 1, terms: terms(2000) }.data(),
        metas,
    );
    assert_err(env.send(ix, &[&agency]), "AccountNotSigner");
}

#[test]
fn cria_contrato_copiando_os_termos_da_config() {
    // SEGURANCA.md item 8: termos ficam gravados no contrato.
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.pubkey());
    env.create_lease(&agency, &landlord, tenant, 1, terms(2000)).unwrap();

    let lease: Lease = env.fetch(&lease_pda(&landlord.pubkey(), &tenant, 1));
    assert_eq!(lease.status, LeaseStatus::Pending);
    assert_eq!(lease.rent_amount, brl(2000));
    assert_eq!(lease.premium_bps, 800);
    assert_eq!(lease.grace_secs, 20);
    assert_eq!(lease.coverage_cap, brl(6000)); // 3 × 2.000, abaixo do teto de 15.000
    assert_eq!(lease.coverage_waiting_periods, 2);
    assert_eq!(lease.contract_hash, [7u8; 32]);
    assert!(lease.periods.iter().all(|p| *p == PeriodState::Open));
}

#[test]
fn cobertura_respeita_o_teto_absoluto() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.pubkey());
    env.create_lease(&agency, &landlord, tenant, 1, terms(40_000)).unwrap();
    let lease: Lease = env.fetch(&lease_pda(&landlord.pubkey(), &tenant, 1));
    assert_eq!(lease.coverage_cap, brl(15_000)); // e não 120.000
}

// ======================= accept_lease =======================

fn env_com_contrato(rent: u64) -> (Env, Pubkey) {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    env.create_lease(&agency, &landlord, tenant.pubkey(), 1, terms(rent)).unwrap();
    env.init_profile(&tenant).unwrap();
    (env, lease_pda(&landlord.pubkey(), &tenant.pubkey(), 1))
}

#[test]
fn inquilino_sem_historico_deposita_3_alugueis() {
    let (mut env, lease) = env_com_contrato(2000);
    let (tenant, tenant_token) = (env.tenant.insecure_clone(), env.tenant_token);
    let antes = env.balance(&tenant_token);
    env.accept_lease(&tenant, tenant_token, lease).unwrap();

    let l: Lease = env.fetch(&lease);
    assert_eq!(l.status, LeaseStatus::Active);
    assert_eq!(l.deposit_required, brl(6000));
    assert_eq!(l.deposit_balance, brl(6000));

    let vault = pda(&[b"vault", lease.as_ref()]);
    assert_eq!(env.balance(&vault), brl(6000));
    assert_eq!(antes - env.balance(&tenant_token), brl(6000));
    // O cofre pertence ao PDA do contrato: só o programa movimenta.
    let vault_acc = get_spl_account::<TokenAccount>(&env.svm, &vault).unwrap();
    assert_eq!(vault_acc.owner, lease);

    let pool: Pool = env.fetch(&pda(&[b"pool"]));
    assert_eq!(pool.locked_coverage, brl(6000));
    let agency: Agency = env.fetch(&pda(&[b"agency", env.agency.pubkey().as_ref()]));
    assert_eq!(agency.coverage_in_use, brl(6000));
    let profile: TenantProfile = env.fetch(&pda(&[b"profile", env.tenant.pubkey().as_ref()]));
    assert_eq!(profile.leases_started, 1);
}

#[test]
fn outra_carteira_nao_aceita_o_contrato() {
    let (mut env, lease) = env_com_contrato(2000);
    let (stranger, stranger_token) = (env.stranger.insecure_clone(), env.stranger_token);
    env.init_profile(&stranger).unwrap();
    // As sementes do contrato incluem o inquilino: outra carteira não bate com o PDA.
    assert_err(env.accept_lease(&stranger, stranger_token, lease), "ConstraintSeeds");
}

#[test]
fn nao_usa_token_de_outra_pessoa() {
    let (mut env, lease) = env_com_contrato(2000);
    let (tenant, stranger_token) = (env.tenant.insecure_clone(), env.stranger_token);
    assert_err(env.accept_lease(&tenant, stranger_token, lease), "ConstraintTokenOwner");
}

#[test]
fn nao_aceita_duas_vezes() {
    let (mut env, lease) = env_com_contrato(2000);
    let (tenant, tenant_token) = (env.tenant.insecure_clone(), env.tenant_token);
    env.accept_lease(&tenant, tenant_token, lease).unwrap();
    // O cofre já existe (init falha) — e o status já não é Pending.
    assert!(env.accept_lease(&tenant, tenant_token, lease).is_err());
}

#[test]
fn sem_perfil_nao_aceita() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    env.create_lease(&agency, &landlord, tenant.pubkey(), 1, terms(2000)).unwrap();
    let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), 1);
    let token = env.tenant_token;
    assert_err(env.accept_lease(&tenant, token, lease), "AccountNotInitialized");
}

#[test]
fn imobiliaria_nao_trava_mais_que_50_por_cento_do_pool() {
    // SEGURANCA.md item 1: pool de 100.000 → limite de 50.000 por imobiliária.
    // Cada contrato de R$ 40.000 trava o teto de 15.000.
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    env.init_profile(&tenant).unwrap();
    let token = env.tenant_token;
    for id in 1..=4u64 {
        env.create_lease(&agency, &landlord, tenant.pubkey(), id, terms(40_000)).unwrap();
        let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), id);
        let res = env.accept_lease(&tenant, token, lease);
        if id <= 3 {
            res.unwrap(); // 15k, 30k, 45k
        } else {
            assert_err(res, "AgencyCoverageLimit"); // 60k > 50k
        }
    }
}

#[test]
fn pool_nao_promete_cobertura_que_nao_tem() {
    // SEGURANCA.md item 5: com limite por imobiliária de 100%, quem barra é o lastro do pool.
    let mut env = Env::new();
    let params = ConfigParams { agency_max_pool_bps: 10_000, ..demo_params() };
    env.initialize(params, brl(20_000)).unwrap();
    let (admin, agency, landlord, tenant) = (
        env.admin.insecure_clone(),
        env.agency.insecure_clone(),
        env.landlord.insecure_clone(),
        env.tenant.insecure_clone(),
    );
    env.register_agency(&admin, agency.pubkey()).unwrap();
    env.init_profile(&tenant).unwrap();
    let token = env.tenant_token;
    for id in 1..=2u64 {
        env.create_lease(&agency, &landlord, tenant.pubkey(), id, terms(40_000)).unwrap();
        let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), id);
        let res = env.accept_lease(&tenant, token, lease);
        if id == 1 {
            res.unwrap(); // trava 15k de 20k
        } else {
            assert_err(res, "InsufficientPoolCoverage"); // sobraram 5k
        }
    }
}

// =====================================================================
//                FLUXO DO CONTRATO: aluguel, atraso, fim
// =====================================================================

impl Env {
    fn warp(&mut self, secs: i64) {
        let mut clock: anchor_lang::prelude::Clock = self.svm.get_sysvar();
        clock.unix_timestamp += secs;
        self.svm.set_sysvar(&clock);
    }

    fn now(&self) -> i64 {
        let clock: anchor_lang::prelude::Clock = self.svm.get_sysvar();
        clock.unix_timestamp
    }

    fn fund_yield_reserve(&mut self, amount: u64) {
        let reserve = pda(&[b"yield_reserve"]);
        let (admin, mint) = (self.admin.insecure_clone(), self.mint);
        MintTo::new(&mut self.svm, &admin, &mint, &reserve, amount).owner(&admin).send().unwrap();
    }

    /// Espera o mês a pagar começar, como uma inquilina real (o programa recusa
    /// pagamento adiantado: B-A09). Mês já coberto (quitação) não precisa esperar.
    fn esperar_mes_comecar(&mut self, lease: Pubkey) {
        let l: Lease = self.fetch(&lease);
        if let Some(i) = l.next_unsettled() {
            if l.periods[i] == PeriodState::Open {
                let inicio = l.period_start(i).unwrap();
                let agora = self.now();
                if agora < inicio {
                    self.warp(inicio - agora);
                }
            }
        }
    }

    fn pay_rent(&mut self, lease: Pubkey) -> Result<(), FailedTransactionMetadata> {
        self.esperar_mes_comecar(lease);
        self.pay_rent_sem_esperar(lease)
    }

    fn pay_rent_sem_esperar(&mut self, lease: Pubkey) -> Result<(), FailedTransactionMetadata> {
        let tenant = self.tenant.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::PayRent {}.data(),
            fiador::accounts::PayRent {
                tenant: tenant.pubkey(),
                pool: pda(&[b"pool"]),
                pool_vault: pda(&[b"pool_vault"]),
                lease,
                vault: pda(&[b"vault", lease.as_ref()]),
                profile: pda(&[b"profile", tenant.pubkey().as_ref()]),
                config: pda(&[b"config"]),
                mint: self.mint,
                tenant_token: self.tenant_token,
                landlord_token: self.landlord_token,
                token_program: token_program(),
                badge_mint: None,
                tenant_badge: None,
                badge_token_program: None,
            }
            .to_account_metas(None),
        );
        self.send(ix, &[&tenant])
    }

    /// Chamado por uma carteira qualquer (o "keeper"), não pelo proprietário.
    fn claim_default(&mut self, lease: Pubkey) -> Result<(), FailedTransactionMetadata> {
        let keeper = self.stranger.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::ClaimDefault {}.data(),
            fiador::accounts::ClaimDefault {
                caller: keeper.pubkey(),
                pool: pda(&[b"pool"]),
                pool_vault: pda(&[b"pool_vault"]),
                agency: pda(&[b"agency", self.agency.pubkey().as_ref()]),
                lease,
                vault: pda(&[b"vault", lease.as_ref()]),
                config: pda(&[b"config"]),
                mint: self.mint,
                landlord_token: self.landlord_token,
                token_program: token_program(),
            }
            .to_account_metas(None),
        );
        self.send(ix, &[&keeper])
    }

    fn end_lease(&mut self, lease: Pubkey) -> Result<(), FailedTransactionMetadata> {
        let keeper = self.stranger.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::EndLease {}.data(),
            fiador::accounts::EndLease { caller: keeper.pubkey(), lease }.to_account_metas(None),
        );
        self.send(ix, &[&keeper])
    }

    fn open_dispute(&mut self, signer: &Keypair, lease: Pubkey, amount: u64) -> Result<(), FailedTransactionMetadata> {
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::OpenDispute { amount }.data(),
            fiador::accounts::OpenDispute { landlord: signer.pubkey(), lease }.to_account_metas(None),
        );
        self.send(ix, &[signer])
    }

    fn resolve_dispute(&mut self, signer: &Keypair, lease: Pubkey, award: u64) -> Result<(), FailedTransactionMetadata> {
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::ResolveDispute { award }.data(),
            fiador::accounts::ResolveDispute {
                agency_authority: signer.pubkey(),
                agency: pda(&[b"agency", signer.pubkey().as_ref()]),
                lease,
                vault: pda(&[b"vault", lease.as_ref()]),
                config: pda(&[b"config"]),
                mint: self.mint,
                landlord_token: self.landlord_token,
                token_program: token_program(),
            }
            .to_account_metas(None),
        );
        self.send(ix, &[signer])
    }

    fn close_lease(&mut self, lease: Pubkey) -> Result<(), FailedTransactionMetadata> {
        let keeper = self.stranger.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::CloseLease {}.data(),
            fiador::accounts::CloseLease {
                caller: keeper.pubkey(),
                config: pda(&[b"config"]),
                pool: pda(&[b"pool"]),
                pool_vault: pda(&[b"pool_vault"]),
                yield_reserve: pda(&[b"yield_reserve"]),
                agency: pda(&[b"agency", self.agency.pubkey().as_ref()]),
                lease,
                vault: pda(&[b"vault", lease.as_ref()]),
                profile: pda(&[b"profile", self.tenant.pubkey().as_ref()]),
                mint: self.mint,
                tenant_token: self.tenant_token,
                token_program: token_program(),
            }
            .to_account_metas(None),
        );
        self.send(ix, &[&keeper])
    }

    fn open_position(&mut self) -> Result<(), FailedTransactionMetadata> {
        let investor = self.investor.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::OpenPosition {}.data(),
            fiador::accounts::OpenPosition {
                owner: investor.pubkey(),
                position: pda(&[b"position", investor.pubkey().as_ref()]),
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        self.send(ix, &[&investor])
    }

    fn pool_deposit(&mut self, amount: u64) -> Result<(), FailedTransactionMetadata> {
        let investor = self.investor.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::PoolDeposit { amount }.data(),
            fiador::accounts::PoolDeposit {
                owner: investor.pubkey(),
                position: pda(&[b"position", investor.pubkey().as_ref()]),
                pool: pda(&[b"pool"]),
                pool_vault: pda(&[b"pool_vault"]),
                config: pda(&[b"config"]),
                mint: self.mint,
                owner_token: self.investor_token,
                token_program: token_program(),
            }
            .to_account_metas(None),
        );
        self.send(ix, &[&investor])
    }

    fn request_withdraw(&mut self, shares: u64) -> Result<(), FailedTransactionMetadata> {
        let investor = self.investor.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::RequestWithdraw { shares }.data(),
            fiador::accounts::RequestWithdraw {
                owner: investor.pubkey(),
                position: pda(&[b"position", investor.pubkey().as_ref()]),
            }
            .to_account_metas(None),
        );
        self.send(ix, &[&investor])
    }

    fn pool_withdraw(&mut self) -> Result<(), FailedTransactionMetadata> {
        let investor = self.investor.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::PoolWithdraw {}.data(),
            fiador::accounts::PoolWithdraw {
                owner: investor.pubkey(),
                position: pda(&[b"position", investor.pubkey().as_ref()]),
                pool: pda(&[b"pool"]),
                pool_vault: pda(&[b"pool_vault"]),
                config: pda(&[b"config"]),
                mint: self.mint,
                owner_token: self.investor_token,
                token_program: token_program(),
            }
            .to_account_metas(None),
        );
        self.send(ix, &[&investor])
    }

    fn lease(&self, key: &Pubkey) -> Lease {
        self.fetch(key)
    }

    fn profile(&self) -> TenantProfile {
        self.fetch(&pda(&[b"profile", self.tenant.pubkey().as_ref()]))
    }

    fn pool(&self) -> Pool {
        self.fetch(&pda(&[b"pool"]))
    }
}

/// Contrato de R$ 2.000 ativo (caução de R$ 6.000), com `periods` meses de 60 s.
fn contrato_ativo(periods: u8) -> (Env, Pubkey) {
    contrato_ativo_com(Env::ready(), periods)
}

fn contrato_ativo_com(mut env: Env, periods: u8) -> (Env, Pubkey) {
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    let t = LeaseTerms { total_periods: periods, ..terms(2000) };
    env.create_lease(&agency, &landlord, tenant.pubkey(), 1, t).unwrap();
    env.init_profile(&tenant).unwrap();
    let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), 1);
    let token = env.tenant_token;
    env.accept_lease(&tenant, token, lease).unwrap();
    (env, lease)
}

/// Passa do vencimento + carência do período `index` (0 = primeiro mês).
fn depois_da_carencia(env: &mut Env, lease: &Pubkey, index: usize) {
    let l = env.lease(lease);
    let alvo = l.due_ts(index).unwrap() + l.grace_secs + 1;
    let agora = env.now();
    if alvo > agora {
        env.warp(alvo - agora);
    }
}

// ----------------------------- pagamento ------------------------------

#[test]
fn aluguel_em_dia_vai_ao_proprietario_e_premio_ao_pool() {
    let (mut env, lease) = contrato_ativo(12);
    let (tenant_antes, landlord_antes) = (env.balance(&env.tenant_token), env.balance(&env.landlord_token));
    let pool_antes = env.pool().total_assets;

    env.pay_rent(lease).unwrap();

    assert_eq!(env.balance(&env.landlord_token) - landlord_antes, brl(2000));
    assert_eq!(tenant_antes - env.balance(&env.tenant_token), brl(2160)); // 2.000 + 8%
    assert_eq!(env.pool().total_assets - pool_antes, brl(160));
    assert_eq!(env.balance(&pda(&[b"pool_vault"])), brl(100_160));
    let l = env.lease(&lease);
    assert_eq!(l.periods[0], PeriodState::Paid);
    assert_eq!(l.paid_on_time, 1);
    assert_eq!(env.profile().on_time, 1);
}

#[test]
fn pagamento_atrasado_conta_como_atraso() {
    let (mut env, lease) = contrato_ativo(12);
    env.warp(61); // venceu, mas ainda ninguém cobrou
    env.pay_rent(lease).unwrap();
    assert_eq!(env.lease(&lease).paid_late, 1);
    assert_eq!(env.profile().late, 1);
    assert_eq!(env.profile().on_time, 0);
}

#[test]
fn nao_paga_alem_do_prazo_do_contrato() {
    let (mut env, lease) = contrato_ativo(2);
    env.pay_rent(lease).unwrap();
    env.pay_rent(lease).unwrap();
    assert_err(env.pay_rent(lease), "NoPeriodDue");
}

// ----------------------------- atraso ---------------------------------

#[test]
fn ninguem_cobra_antes_da_carencia() {
    let (mut env, lease) = contrato_ativo(12);
    assert_err(env.claim_default(lease), "NothingToClaim"); // nem venceu
    env.warp(70); // venceu (60 s), mas a carência (20 s) não acabou
    assert_err(env.claim_default(lease), "NothingToClaim");
}

#[test]
fn atraso_paga_o_proprietario_na_hora_com_a_caucao() {
    let (mut env, lease) = contrato_ativo(12);
    let landlord_antes = env.balance(&env.landlord_token);
    depois_da_carencia(&mut env, &lease, 0);

    // Quem cobra é uma carteira qualquer (keeper), não o proprietário.
    env.claim_default(lease).unwrap();

    assert_eq!(env.balance(&env.landlord_token) - landlord_antes, brl(2000));
    assert_eq!(env.balance(&pda(&[b"vault", lease.as_ref()])), brl(4000));
    let l = env.lease(&lease);
    assert_eq!(l.status, LeaseStatus::Defaulted);
    assert_eq!(l.periods[0], PeriodState::Covered);
    assert_eq!(l.deposit_balance, brl(4000));
    assert_eq!(l.deposit_debt, brl(2000));
}

#[test]
fn nao_cobra_o_mesmo_mes_duas_vezes() {
    let (mut env, lease) = contrato_ativo(12);
    depois_da_carencia(&mut env, &lease, 0);
    env.claim_default(lease).unwrap();
    // O mês 2 ainda não venceu: nada a cobrar, e o mês 1 não é cobrado de novo.
    assert_err(env.claim_default(lease), "NothingToClaim");
}

#[test]
fn pagar_mes_coberto_recompoe_a_caucao_e_nao_paga_o_proprietario_de_novo() {
    // SEGURANCA.md item 3: pagamento em dobro.
    let (mut env, lease) = contrato_ativo(12);
    depois_da_carencia(&mut env, &lease, 0);
    env.claim_default(lease).unwrap();
    let landlord_antes = env.balance(&env.landlord_token);

    env.pay_rent(lease).unwrap(); // quita o mês 1 atrasado

    assert_eq!(env.balance(&env.landlord_token), landlord_antes, "proprietário não recebe de novo");
    assert_eq!(env.balance(&pda(&[b"vault", lease.as_ref()])), brl(6000), "caução recomposta");
    let l = env.lease(&lease);
    assert_eq!(l.periods[0], PeriodState::Settled);
    assert_eq!(l.status, LeaseStatus::Active);
    assert_eq!(l.deposit_debt, 0);
    assert_eq!(env.profile().late, 1);
}

#[test]
fn pool_cobre_depois_que_a_caucao_acaba() {
    // 2 meses pagos (carência de cobertura cumprida), depois 4 meses sem pagar:
    // 3 saem da caução e o 4º sai do pool.
    let (mut env, lease) = contrato_ativo(12);
    env.pay_rent(lease).unwrap();
    env.pay_rent(lease).unwrap();
    let pool_antes = env.pool().total_assets;
    let landlord_antes = env.balance(&env.landlord_token);

    for mes in 2..6 {
        depois_da_carencia(&mut env, &lease, mes);
        env.claim_default(lease).unwrap();
    }

    assert_eq!(env.balance(&env.landlord_token) - landlord_antes, brl(8000));
    assert_eq!(pool_antes - env.pool().total_assets, brl(2000));
    let l = env.lease(&lease);
    assert_eq!(l.deposit_balance, 0);
    assert_eq!(l.pool_debt, brl(2000));
    assert_eq!(l.pool_covered_total, brl(2000));
    assert_eq!(env.pool().locked_coverage, brl(4000)); // 6.000 travados - 2.000 usados
}

#[test]
fn pool_nao_cobre_quem_nunca_pagou() {
    // SEGURANCA.md item 1: carência de cobertura barra o golpe "aluga e some".
    let (mut env, lease) = contrato_ativo(12);
    let pool_antes = env.pool().total_assets;
    for mes in 0..4 {
        depois_da_carencia(&mut env, &lease, mes);
        env.claim_default(lease).unwrap();
    }
    assert_eq!(env.pool().total_assets, pool_antes, "pool intacto");
    assert_eq!(env.lease(&lease).pool_covered_total, 0);
}

#[test]
fn quitar_mes_coberto_pelo_pool_devolve_ao_pool_primeiro() {
    let (mut env, lease) = contrato_ativo(12);
    env.pay_rent(lease).unwrap();
    env.pay_rent(lease).unwrap();
    for mes in 2..6 {
        depois_da_carencia(&mut env, &lease, mes);
        env.claim_default(lease).unwrap();
    }
    let pool_antes = env.pool().total_assets;
    env.pay_rent(lease).unwrap(); // quita o mês 3 (coberto pela caução)
    // Primeiro repõe o pool (2.000) + prêmio (160); nada volta à caução ainda.
    assert_eq!(env.pool().total_assets - pool_antes, brl(2160));
    let l = env.lease(&lease);
    assert_eq!(l.pool_debt, 0);
    assert_eq!(l.deposit_balance, 0);
}

// ----------------------------- fim do contrato -----------------------------

#[test]
fn nao_encerra_antes_do_prazo() {
    let (mut env, lease) = contrato_ativo(2);
    env.pay_rent(lease).unwrap();
    env.pay_rent(lease).unwrap();
    assert_err(env.end_lease(lease), "LeaseNotOver");
}

#[test]
fn nao_encerra_com_mes_vencido_sem_cobranca() {
    let (mut env, lease) = contrato_ativo(2);
    env.pay_rent(lease).unwrap();
    env.warp(200);
    assert_err(env.end_lease(lease), "PendingPeriods");
}

#[test]
fn caucao_volta_com_rendimento_e_reputacao_sobe() {
    let (mut env, lease) = contrato_ativo(2);
    env.fund_yield_reserve(brl(1000));
    env.pay_rent(lease).unwrap();
    env.pay_rent(lease).unwrap();
    env.warp(120);
    env.end_lease(lease).unwrap();
    assert_err(env.close_lease(lease), "DisputeWindowOpen");

    env.warp(31);
    let antes = env.balance(&env.tenant_token);
    env.close_lease(lease).unwrap();
    let recebido = env.balance(&env.tenant_token) - antes;

    let l = env.lease(&lease);
    // 10% ao ano, com 1 ano = 12 meses do contrato, contado só até o fim do prazo:
    // 2 meses de 60 s = 1/6 de ano → R$ 6.000 × 10% / 6 = R$ 100 (B-A20).
    assert_eq!(recebido, brl(6000) + brl(100));
    assert_eq!(l.status, LeaseStatus::Closed);
    assert_eq!(env.pool().locked_coverage, 0, "cobertura destravada");
    let agency: Agency = env.fetch(&pda(&[b"agency", env.agency.pubkey().as_ref()]));
    assert_eq!(agency.coverage_in_use, 0);
    let p = env.profile();
    assert_eq!((p.on_time, p.leases_completed, p.defaults), (2, 1, 0));
}

#[test]
fn rendimento_limitado_ao_saldo_da_reserva() {
    let (mut env, lease) = contrato_ativo(2);
    env.fund_yield_reserve(1); // 0,000001 tBRL
    env.pay_rent(lease).unwrap();
    env.pay_rent(lease).unwrap();
    env.warp(200);
    env.end_lease(lease).unwrap();
    env.warp(31);
    let antes = env.balance(&env.tenant_token);
    env.close_lease(lease).unwrap();
    assert_eq!(env.balance(&env.tenant_token) - antes, brl(6000) + 1);
}

#[test]
fn contestacao_de_danos_decidida_pela_imobiliaria() {
    // SEGURANCA.md item 7.
    let (mut env, lease) = contrato_ativo(2);
    env.pay_rent(lease).unwrap();
    env.pay_rent(lease).unwrap();
    env.warp(120);
    env.end_lease(lease).unwrap();

    let (landlord, agency, stranger) =
        (env.landlord.insecure_clone(), env.agency.insecure_clone(), env.stranger.insecure_clone());
    assert_err(env.open_dispute(&stranger, lease, brl(1500)), "ConstraintSeeds");
    assert_err(env.open_dispute(&landlord, lease, brl(7000)), "InvalidAmount");
    env.open_dispute(&landlord, lease, brl(1500)).unwrap();

    env.warp(31);
    assert_err(env.close_lease(lease), "DisputeWindowOpen"); // precisa de decisão
    assert!(env.resolve_dispute(&stranger, lease, brl(1000)).is_err());
    assert_err(env.resolve_dispute(&agency, lease, brl(2000)), "InvalidAmount"); // acima do pedido

    let landlord_antes = env.balance(&env.landlord_token);
    env.resolve_dispute(&agency, lease, brl(1000)).unwrap();
    assert_eq!(env.balance(&env.landlord_token) - landlord_antes, brl(1000));

    let antes = env.balance(&env.tenant_token);
    env.close_lease(lease).unwrap();
    assert_eq!(env.balance(&env.tenant_token) - antes, brl(5000)); // reserva vazia: sem rendimento
}

#[test]
fn contestacao_fora_da_janela_nao_vale() {
    let (mut env, lease) = contrato_ativo(2);
    env.pay_rent(lease).unwrap();
    env.pay_rent(lease).unwrap();
    env.warp(120);
    env.end_lease(lease).unwrap();
    env.warp(31);
    let landlord = env.landlord.insecure_clone();
    assert_err(env.open_dispute(&landlord, lease, brl(100)), "DisputeWindowClosed");
}

#[test]
fn quem_termina_devendo_fica_marcado_e_caucao_repoe_o_pool() {
    // 2 meses pagos; depois 4 sem pagar (3 da caução, 1 do pool); contrato de 6 meses.
    let (mut env, lease) = contrato_ativo(6);
    env.pay_rent(lease).unwrap();
    env.pay_rent(lease).unwrap();
    for mes in 2..6 {
        depois_da_carencia(&mut env, &lease, mes);
        env.claim_default(lease).unwrap();
    }
    env.end_lease(lease).unwrap();
    env.warp(31);
    env.close_lease(lease).unwrap();

    let p = env.profile();
    assert_eq!(p.defaults, 1);
    assert_eq!(p.tier(), 0, "calote zera o benefício");
    let l = env.lease(&lease);
    assert_eq!(l.pool_debt, brl(2000), "dívida com o pool continua registrada");
    assert_eq!(env.pool().locked_coverage, 0);
}

// ----------------------------- pool -----------------------------------

#[test]
fn investidor_entra_e_sai_do_pool_com_aviso_previo() {
    let mut env = Env::ready();
    env.open_position().unwrap();
    env.pool_deposit(brl(10_000)).unwrap();
    let pos: Position = env.fetch(&pda(&[b"position", env.investor.pubkey().as_ref()]));
    assert_eq!(pos.shares, brl(10_000)); // cota a R$ 1,00

    assert_err(env.pool_withdraw(), "NoPendingWithdraw");
    assert_err(env.request_withdraw(brl(10_001)), "InvalidAmount");
    env.request_withdraw(brl(10_000)).unwrap();
    assert_err(env.pool_withdraw(), "CooldownActive"); // SEGURANCA.md item 4

    env.warp(30);
    let antes = env.balance(&env.investor_token);
    env.pool_withdraw().unwrap();
    assert_eq!(env.balance(&env.investor_token) - antes, brl(10_000));
    assert_eq!(env.pool().total_assets, brl(100_000));
}

#[test]
fn investidor_ganha_os_premios() {
    let (mut env, lease) = contrato_ativo(12);
    env.open_position().unwrap();
    env.pool_deposit(brl(100_000)).unwrap(); // metade do pool
    for _ in 0..10 {
        env.pay_rent(lease).unwrap(); // 10 × 160 de prêmio
    }
    env.request_withdraw(brl(100_000)).unwrap();
    env.warp(30);
    let antes = env.balance(&env.investor_token);
    env.pool_withdraw().unwrap();
    assert_eq!(env.balance(&env.investor_token) - antes, brl(100_800)); // metade de 1.600
}

#[test]
fn quem_pediu_saque_ainda_absorve_o_calote() {
    // SEGURANCA.md item 4: pedir saque antes de um calote conhecido não protege.
    let mut env = Env::new();
    let params = ConfigParams { coverage_waiting_periods: 0, ..demo_params() };
    env.initialize(params, brl(100_000)).unwrap();
    let (admin, agency) = (env.admin.insecure_clone(), env.agency.pubkey());
    env.register_agency(&admin, agency).unwrap();
    env.open_position().unwrap();
    env.pool_deposit(brl(100_000)).unwrap();
    let (mut env, lease) = contrato_ativo_com(env, 12);

    // Com a cobertura crescente, o fundo só cobre quem já pagou algum aluguel.
    env.pay_rent(lease).unwrap();
    env.request_withdraw(brl(100_000)).unwrap(); // vê o atraso chegando e pede saque
    for mes in 1..5 {
        depois_da_carencia(&mut env, &lease, mes); // 3 da caução, 1 do pool
        env.claim_default(lease).unwrap();
    }
    // O pedido venceu durante os meses de atraso (B-A12): renova e espera o aviso prévio.
    assert_err(env.pool_withdraw(), "WithdrawRequestExpired");
    env.request_withdraw(brl(100_000)).unwrap();
    env.warp(30);
    let antes = env.balance(&env.investor_token);
    env.pool_withdraw().unwrap();
    // arcou com metade dos 2.000 e ganhou metade do prêmio de 160 do mês pago
    assert_eq!(env.balance(&env.investor_token) - antes, brl(99_000) + brl(80));
}

#[test]
fn saque_nao_libera_cobertura_travada() {
    // SEGURANCA.md item 5.
    let mut env = Env::new();
    let params = ConfigParams { agency_max_pool_bps: 10_000, ..demo_params() };
    env.initialize(params, brl(20_000)).unwrap();
    let (admin, agency, landlord, tenant) = (
        env.admin.insecure_clone(),
        env.agency.insecure_clone(),
        env.landlord.insecure_clone(),
        env.tenant.insecure_clone(),
    );
    env.register_agency(&admin, agency.pubkey()).unwrap();
    env.open_position().unwrap();
    env.pool_deposit(brl(10_000)).unwrap(); // pool = 30.000
    env.init_profile(&tenant).unwrap();
    let token = env.tenant_token;
    for id in 1..=2u64 {
        env.create_lease(&agency, &landlord, tenant.pubkey(), id, terms(40_000)).unwrap();
        let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), id);
        env.accept_lease(&tenant, token, lease).unwrap(); // trava 15.000 cada
    }
    env.request_withdraw(brl(10_000)).unwrap();
    env.warp(30);
    assert_err(env.pool_withdraw(), "WithdrawExceedsFree");
}

#[test]
fn deposito_minusculo_nao_rouba_cotas() {
    // SEGURANCA.md item 6: cotas arredondam contra quem deposita.
    let mut env = Env::ready();
    env.open_position().unwrap();
    // Com o pool a R$ 1,00 por cota, 1 unidade ainda vale 1 cota; depois de prêmios
    // a cota vale mais e 1 unidade vira 0 cotas → recusado.
    let (mut env, lease) = contrato_ativo_com(env, 12);
    for _ in 0..5 {
        env.pay_rent(lease).unwrap();
    }
    assert_err(env.pool_deposit(1), "InvalidAmount");
}


// =====================================================================
//                SELO "BOM PAGADOR" (Token-2022 intransferível)
// =====================================================================

use anchor_spl::token_2022::spl_token_2022::{
    self as t22,
    extension::ExtensionType,
    state::Mint as Mint22,
};

fn token_2022() -> Pubkey {
    anchor_spl::token_2022::ID
}

impl Env {
    /// Cria um mint Token-2022 com 0 casas. `non_transferable` liga a extensão que
    /// impede transferir/vender o selo.
    fn create_badge_mint(&mut self, authority: &Pubkey, non_transferable: bool) -> Pubkey {
        let mint = Keypair::new();
        let admin = self.admin.insecure_clone();
        let exts: Vec<ExtensionType> =
            if non_transferable { vec![ExtensionType::NonTransferable] } else { vec![] };
        let space = ExtensionType::try_calculate_account_len::<Mint22>(&exts).unwrap();
        let lamports = self.svm.minimum_balance_for_rent_exemption(space);
        // system_program::CreateAccount montado à mão (índice 0 + lamports + espaço + dono)
        let mut data = vec![0u8, 0, 0, 0];
        data.extend_from_slice(&lamports.to_le_bytes());
        data.extend_from_slice(&(space as u64).to_le_bytes());
        data.extend_from_slice(token_2022().as_ref());
        let create = Instruction {
            program_id: system_program::ID,
            accounts: vec![
                anchor_lang::solana_program::instruction::AccountMeta::new(admin.pubkey(), true),
                anchor_lang::solana_program::instruction::AccountMeta::new(mint.pubkey(), true),
            ],
            data,
        };
        let mut ixs = vec![create];
        if non_transferable {
            ixs.push(t22::instruction::initialize_non_transferable_mint(&token_2022(), &mint.pubkey()).unwrap());
        }
        ixs.push(t22::instruction::initialize_mint2(&token_2022(), &mint.pubkey(), authority, None, 0).unwrap());
        let blockhash = self.svm.latest_blockhash();
        let msg = Message::new_with_blockhash(&ixs, Some(&admin.pubkey()), &blockhash);
        let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&admin, &mint]).unwrap();
        self.svm.send_transaction(tx).unwrap();
        mint.pubkey()
    }

    fn set_badge_mint(&mut self, badge_mint: Pubkey) -> Result<(), FailedTransactionMetadata> {
        let admin = self.admin.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::SetBadgeMint {}.data(),
            fiador::accounts::SetBadgeMint {
                admin: admin.pubkey(),
                config: pda(&[b"config"]),
                badge_mint,
                badge_token_program: token_2022(),
            }
            .to_account_metas(None),
        );
        self.send(ix, &[&admin])
    }

    fn badge_account(&mut self, badge_mint: Pubkey) -> Pubkey {
        let (admin, tenant) = (self.admin.insecure_clone(), self.tenant.pubkey());
        litesvm_token::CreateAssociatedTokenAccount::new(&mut self.svm, &admin, &badge_mint)
            .owner(&tenant)
            .token_program_id(&token_2022())
            .send()
            .unwrap()
    }

    fn pay_rent_with_badge(
        &mut self,
        lease: Pubkey,
        badge: Option<(Pubkey, Pubkey)>,
    ) -> Result<(), FailedTransactionMetadata> {
        self.esperar_mes_comecar(lease);
        let tenant = self.tenant.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::PayRent {}.data(),
            fiador::accounts::PayRent {
                tenant: tenant.pubkey(),
                pool: pda(&[b"pool"]),
                pool_vault: pda(&[b"pool_vault"]),
                lease,
                vault: pda(&[b"vault", lease.as_ref()]),
                profile: pda(&[b"profile", tenant.pubkey().as_ref()]),
                config: pda(&[b"config"]),
                mint: self.mint,
                tenant_token: self.tenant_token,
                landlord_token: self.landlord_token,
                token_program: token_program(),
                badge_mint: badge.map(|b| b.0),
                tenant_badge: badge.map(|b| b.1),
                badge_token_program: badge.map(|_| token_2022()),
            }
            .to_account_metas(None),
        );
        self.send(ix, &[&tenant])
    }

    /// Saldo de uma conta Token-2022 (os 8 bytes do `amount` ficam no offset 64).
    fn badge_balance(&self, account: &Pubkey) -> u64 {
        let data = self.svm.get_account(account).unwrap().data;
        u64::from_le_bytes(data[64..72].try_into().unwrap())
    }
}

#[test]
fn selo_precisa_ser_intransferivel_e_emitido_so_pelo_programa() {
    let mut env = Env::ready();
    let config = pda(&[b"config"]);
    let transferivel = env.create_badge_mint(&config, false);
    assert_err(env.set_badge_mint(transferivel), "InvalidBadgeMint");
    let admin = env.admin.pubkey();
    let de_outro = env.create_badge_mint(&admin, true);
    assert_err(env.set_badge_mint(de_outro), "ConstraintMintMintAuthority");
    let certo = env.create_badge_mint(&config, true);
    env.set_badge_mint(certo).unwrap();
    let c: Config = env.fetch(&config);
    assert_eq!(c.badge_mint, certo);
}

#[test]
fn selo_cai_na_carteira_no_terceiro_mes_em_dia() {
    let (mut env, lease) = contrato_ativo(12);
    let config = pda(&[b"config"]);
    let badge = env.create_badge_mint(&config, true);
    env.set_badge_mint(badge).unwrap();
    let conta = env.badge_account(badge);

    // Com o selo definido, pagar sem as contas do selo é recusado.
    assert_err(env.pay_rent_with_badge(lease, None), "InvalidBadgeAccounts");

    for _ in 0..2 {
        env.pay_rent_with_badge(lease, Some((badge, conta))).unwrap();
    }
    assert_eq!(env.badge_balance(&conta), 0);
    env.pay_rent_with_badge(lease, Some((badge, conta))).unwrap();
    assert_eq!(env.badge_balance(&conta), 1, "1º selo aos 3 meses em dia");
    for _ in 0..3 {
        env.pay_rent_with_badge(lease, Some((badge, conta))).unwrap();
    }
    assert_eq!(env.badge_balance(&conta), 2, "2º selo aos 6 meses em dia");
}

#[test]
fn selo_nao_pode_ser_transferido() {
    let (mut env, lease) = contrato_ativo(12);
    let config = pda(&[b"config"]);
    let badge = env.create_badge_mint(&config, true);
    env.set_badge_mint(badge).unwrap();
    let conta = env.badge_account(badge);
    for _ in 0..3 {
        env.pay_rent_with_badge(lease, Some((badge, conta))).unwrap();
    }
    // O inquilino tenta passar o selo para outra carteira: o Token-2022 recusa.
    let (admin, tenant, stranger) =
        (env.admin.insecure_clone(), env.tenant.insecure_clone(), env.stranger.pubkey());
    let destino = litesvm_token::CreateAssociatedTokenAccount::new(&mut env.svm, &admin, &badge)
        .owner(&stranger)
        .token_program_id(&token_2022())
        .send()
        .unwrap();
    let ix = t22::instruction::transfer_checked(
        &token_2022(), &conta, &badge, &destino, &tenant.pubkey(), &[], 1, 0,
    )
    .unwrap();
    assert!(env.send(ix, &[&tenant]).is_err());
    assert_eq!(env.badge_balance(&conta), 1);
}

#[test]
fn atraso_nao_rende_selo() {
    let (mut env, lease) = contrato_ativo(12);
    let config = pda(&[b"config"]);
    let badge = env.create_badge_mint(&config, true);
    env.set_badge_mint(badge).unwrap();
    let conta = env.badge_account(badge);
    env.warp(61); // mês 1 pago atrasado
    for _ in 0..3 {
        env.pay_rent_with_badge(lease, Some((badge, conta))).unwrap();
    }
    assert_eq!(env.badge_balance(&conta), 0, "só 2 em dia até aqui");
}


// ======================= Regressões do conselho de segurança (2026-09-28) =======================
// Cada teste é uma prova de conceito de Fiador Doc/provas/ com a asserção invertida:
// o ataque que funcionava agora precisa falhar.

#[test]
fn regressao_b_a09_nao_paga_mes_que_ainda_nao_comecou() {
    let (mut env, lease) = contrato_ativo(12);
    env.pay_rent(lease).unwrap(); // mês 0 já começou no aceite
    assert_err(env.pay_rent_sem_esperar(lease), "PeriodNotStarted");
    env.warp(60); // começa o mês 1
    env.pay_rent(lease).unwrap();
    assert_eq!(env.lease(&lease).paid_on_time, 2);
    assert_eq!(env.profile().on_time, 2);
}

#[test]
fn regressao_b_a10_proprietario_recebe_o_que_faltou_na_quitacao() {
    let (mut env, lease) = contrato_ativo(6);
    let antes = env.balance(&env.landlord_token);
    // 4 meses sem pagar: a caução paga 3; o fundo não entra (nenhum aluguel pago).
    for mes in 0..4 {
        depois_da_carencia(&mut env, &lease, mes);
        env.claim_default(lease).unwrap();
    }
    let l = env.lease(&lease);
    assert_eq!(env.balance(&env.landlord_token) - antes, brl(6000));
    assert_eq!(l.landlord_debt, brl(2000), "o 4º mês fica registrado como dívida com o proprietário");
    // A inquilina quita os 4 meses: o proprietário recebe o 4º e a caução volta ao valor exigido.
    for _ in 0..4 {
        env.pay_rent(lease).unwrap();
    }
    let l = env.lease(&lease);
    assert_eq!(env.balance(&env.landlord_token) - antes, brl(8000));
    assert_eq!(l.landlord_debt, 0);
    assert_eq!(l.deposit_balance, brl(6000), "a caução não passa do exigido");
}

#[test]
fn regressao_b_a18_disputa_decidida_nao_reabre() {
    let (mut env, lease) = contrato_ativo(2);
    env.pay_rent(lease).unwrap();
    env.warp(60);
    env.pay_rent(lease).unwrap();
    env.warp(60);
    env.end_lease(lease).unwrap();
    let (landlord, agency) = (env.landlord.insecure_clone(), env.agency.insecure_clone());
    env.open_dispute(&landlord, lease, brl(1000)).unwrap();
    env.resolve_dispute(&agency, lease, brl(500)).unwrap();
    assert_err(env.open_dispute(&landlord, lease, brl(1000)), "DisputeAlreadyResolved");
}

#[test]
fn regressao_b_a23_aluguel_abaixo_do_minimo_e_recusado() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    let t = LeaseTerms { rent_amount: 1, period_secs: 60, total_periods: 1, contract_hash: [1u8; 32] };
    assert_err(env.create_lease(&agency, &landlord, tenant.pubkey(), 100, t), "InvalidRent");
}

#[test]
fn regressao_b_a23_contratos_paralelos_contam_um_pagamento_em_dia_por_mes() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.insecure_clone());
    env.init_profile(&tenant).unwrap();
    let token = env.tenant_token;
    for id in 100..104u64 {
        let t = LeaseTerms { rent_amount: brl(100), period_secs: 60, total_periods: 1, contract_hash: [1u8; 32] };
        env.create_lease(&agency, &landlord, tenant.pubkey(), id, t).unwrap();
        let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), id);
        env.accept_lease(&tenant, token, lease).unwrap();
        env.pay_rent(lease).unwrap();
    }
    assert_eq!(env.profile().on_time, 1, "4 contratos pagos no mesmo minuto valem 1 mês de reputação");
}

#[test]
fn regressao_b_a25_imobiliaria_nao_e_a_proprietaria() {
    let mut env = Env::ready();
    let (agency, tenant) = (env.agency.insecure_clone(), env.tenant.pubkey());
    assert_err(env.create_lease(&agency, &agency, tenant, 1, terms(2000)), "AgencyIsLandlord");
}

#[test]
fn regressao_b_a26_mes_acima_do_maximo_e_recusado() {
    let mut env = Env::ready();
    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.pubkey());
    for (id, period) in [(1u64, 601i64), (2, 100 * 365 * 24 * 3600), (3, i64::MAX / 4), (4, i64::MAX)] {
        let t = LeaseTerms { period_secs: period, ..terms(2000) };
        assert_err(env.create_lease(&agency, &landlord, tenant, id, t), "PeriodTooLong");
    }
    assert_eq!(env.pool().locked_coverage, 0);
}

#[test]
fn config_recusa_mes_maximo_invalido() {
    let mut env = Env::new();
    let menor = ConfigParams { max_period_secs: 59, ..demo_params() };
    assert_err(env.initialize(menor, brl(1000)), "InvalidConfig");
    let longo = ConfigParams { max_period_secs: MAX_PERIOD_SECS_LIMIT + 1, ..demo_params() };
    assert_err(env.initialize(longo, brl(1000)), "InvalidConfig");
    let sem_minimo = ConfigParams { min_rent_amount: 0, ..demo_params() };
    assert_err(env.initialize(sem_minimo, brl(1000)), "InvalidConfig");
}

/// Invariantes do auditor (I1, I2, I4, I7), com pagamentos e cobranças em ordem aleatória.
/// Protege o caminho do dinheiro depois da dívida com o proprietário (B-A10).
#[test]
fn invariantes_do_dinheiro_com_eventos_aleatorios() {
    let mut seed: u64 = 0x9E3779B97F4A7C15;
    let mut rnd = || {
        seed ^= seed << 13;
        seed ^= seed >> 7;
        seed ^= seed << 17;
        seed
    };
    for _run in 0..12 {
        let (mut env, lease) = contrato_ativo(12);
        for _ in 0..40 {
            match rnd() % 4 {
                0 => { let _ = env.pay_rent_sem_esperar(lease); }
                1 => { let _ = env.claim_default(lease); }
                _ => {
                    env.warp((rnd() % 90) as i64 + 1);
                    let _ = env.claim_default(lease);
                }
            }
            let l = env.lease(&lease);
            assert!(!(l.pool_debt > 0 && l.deposit_balance > 0), "I7: dívida com o fundo implica caução zero");
            assert_eq!(env.balance(&pda(&[b"vault", lease.as_ref()])), l.deposit_balance, "I4");
            let p = env.pool();
            assert!(env.balance(&pda(&[b"pool_vault"])) >= p.total_assets, "I1");
            assert_eq!(p.locked_coverage, l.coverage_cap - l.pool_covered_total, "I2");
            assert!(l.deposit_balance <= l.deposit_required, "a caução nunca passa do exigido");
        }
    }
}


// ======================= Antifraude: cobertura crescente e franquia =======================

/// Regras da demo e de produção: ¼ de aluguel de cobertura por mês pago e franquia de 20%.
fn regras_antifraude() -> ConfigParams {
    ConfigParams { coverage_growth_bps: 2500, landlord_deductible_bps: 2000, ..demo_params() }
}

fn env_com(params: ConfigParams) -> Env {
    let mut env = Env::new();
    env.initialize(params, brl(100_000)).unwrap();
    let (admin, agency) = (env.admin.insecure_clone(), env.agency.pubkey());
    env.register_agency(&admin, agency).unwrap();
    env
}

/// Paga `n` meses em dia e deixa os 3 seguintes serem cobertos pela caução.
fn paga_e_esgota_a_caucao(env: &mut Env, lease: &Pubkey, n: usize) {
    for _ in 0..n {
        env.pay_rent(*lease).unwrap();
    }
    for mes in n..n + 3 {
        depois_da_carencia(env, lease, mes);
        env.claim_default(*lease).unwrap();
    }
    assert_eq!(env.lease(lease).deposit_balance, 0);
}

#[test]
fn cobertura_do_fundo_cresce_com_os_meses_pagos() {
    let params = ConfigParams { landlord_deductible_bps: 0, ..regras_antifraude() };
    let (mut env, lease) = contrato_ativo_com(env_com(params), 12);
    // Golpe típico: paga só os 2 meses de espera e para.
    paga_e_esgota_a_caucao(&mut env, &lease, 2);
    assert_eq!(env.lease(&lease).coverage_available(), brl(1000), "2 meses pagos = ½ aluguel");
    let antes = env.balance(&env.landlord_token);
    depois_da_carencia(&mut env, &lease, 5);
    env.claim_default(lease).unwrap();
    assert_eq!(env.balance(&env.landlord_token) - antes, brl(1000), "o fundo paga só o que já foi liberado");
    depois_da_carencia(&mut env, &lease, 6);
    env.claim_default(lease).unwrap();
    let l = env.lease(&lease);
    assert_eq!(l.pool_covered_total, brl(1000));
    assert_eq!(l.landlord_debt, brl(1000) + brl(2000), "o resto fica como dívida com o proprietário");
}

#[test]
fn franquia_do_proprietario_e_paga_primeiro_na_quitacao() {
    let params = ConfigParams { coverage_growth_bps: 30_000, ..regras_antifraude() };
    let (mut env, lease) = contrato_ativo_com(env_com(params), 12);
    paga_e_esgota_a_caucao(&mut env, &lease, 2);
    let antes = env.balance(&env.landlord_token);
    depois_da_carencia(&mut env, &lease, 5);
    env.claim_default(lease).unwrap();
    assert_eq!(env.balance(&env.landlord_token) - antes, brl(1600), "o fundo paga 80%");
    let l = env.lease(&lease);
    assert_eq!(l.pool_debt, brl(1600));
    assert_eq!(l.landlord_debt, brl(400), "franquia de 20% fica devida ao proprietário");
    // A inquilina volta a pagar: primeiro a franquia ao proprietário, depois o fundo.
    let pool_antes = env.pool().total_assets;
    env.pay_rent(lease).unwrap();
    let l = env.lease(&lease);
    assert_eq!(env.balance(&env.landlord_token) - antes, brl(2000));
    assert_eq!(l.landlord_debt, 0);
    assert_eq!(l.pool_debt, 0);
    assert_eq!(env.pool().total_assets - pool_antes, brl(1600) + brl(160));
}

#[test]
fn cobertura_cheia_so_depois_de_12_meses_pagos() {
    let (mut env, lease) = contrato_ativo_com(env_com(regras_antifraude()), 16);
    paga_e_esgota_a_caucao(&mut env, &lease, 12);
    assert_eq!(env.lease(&lease).coverage_available(), brl(6000), "12 meses = teto de 3 aluguéis");
    let antes = env.balance(&env.landlord_token);
    depois_da_carencia(&mut env, &lease, 15);
    env.claim_default(lease).unwrap();
    assert_eq!(env.balance(&env.landlord_token) - antes, brl(1600));
}

#[test]
fn config_recusa_franquia_de_100_por_cento_e_crescimento_zero() {
    let mut env = Env::new();
    let franquia = ConfigParams { landlord_deductible_bps: 10_000, ..demo_params() };
    assert_err(env.initialize(franquia, brl(1000)), "InvalidConfig");
    let zero = ConfigParams { coverage_growth_bps: 0, ..demo_params() };
    assert_err(env.initialize(zero, brl(1000)), "InvalidConfig");
}


// ======================= Resposta a golpe: pausa, suspensão e quarentena =======================

impl Env {
    fn set_paused(&mut self, signer: &Keypair, paused: bool) -> Result<(), FailedTransactionMetadata> {
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::SetPaused { paused }.data(),
            fiador::accounts::SetPaused { admin: signer.pubkey(), config: pda(&[b"config"]) }.to_account_metas(None),
        );
        self.send(ix, &[signer])
    }

    fn set_agency_active(&mut self, signer: &Keypair, authority: Pubkey, active: bool) -> Result<(), FailedTransactionMetadata> {
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::SetAgencyActive { active }.data(),
            fiador::accounts::SetAgencyActive {
                admin: signer.pubkey(),
                config: pda(&[b"config"]),
                agency: pda(&[b"agency", authority.as_ref()]),
            }
            .to_account_metas(None),
        );
        self.send(ix, &[signer])
    }

    fn admin_pool_payment(&mut self, signer: &Keypair, lease: Pubkey, data: Vec<u8>) -> Result<(), FailedTransactionMetadata> {
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &data,
            fiador::accounts::AdminPoolPayment {
                admin: signer.pubkey(),
                config: pda(&[b"config"]),
                pool: pda(&[b"pool"]),
                lease,
            }
            .to_account_metas(None),
        );
        self.send(ix, &[signer])
    }

    fn freeze(&mut self, signer: &Keypair, lease: Pubkey, frozen: bool) -> Result<(), FailedTransactionMetadata> {
        self.admin_pool_payment(signer, lease, fiador::instruction::FreezePoolPayment { frozen }.data())
    }

    fn cancel(&mut self, signer: &Keypair, lease: Pubkey) -> Result<(), FailedTransactionMetadata> {
        self.admin_pool_payment(signer, lease, fiador::instruction::CancelPoolPayment {}.data())
    }

    fn release(&mut self, lease: Pubkey) -> Result<(), FailedTransactionMetadata> {
        let caller = self.stranger.insecure_clone();
        let ix = Instruction::new_with_bytes(
            fiador::id(),
            &fiador::instruction::ReleasePoolPayment {}.data(),
            fiador::accounts::ReleasePoolPayment {
                caller: caller.pubkey(),
                config: pda(&[b"config"]),
                pool: pda(&[b"pool"]),
                pool_vault: pda(&[b"pool_vault"]),
                lease,
                mint: self.mint,
                landlord_token: self.landlord_token,
                token_program: token_program(),
            }
            .to_account_metas(None),
        );
        self.send(ix, &[&caller])
    }
}

/// Cobertura cheia, sem franquia e com 30 s de quarentena: isola a regra da quarentena.
fn regras_quarentena() -> ConfigParams {
    ConfigParams { pool_quarantine_secs: 30, ..demo_params() }
}

#[test]
fn so_o_admin_pausa_e_suspende() {
    let mut env = Env::ready();
    let (stranger, agency) = (env.stranger.insecure_clone(), env.agency.pubkey());
    assert_err(env.set_paused(&stranger, true), "ConstraintHasOne");
    assert_err(env.set_agency_active(&stranger, agency, false), "ConstraintHasOne");
}

#[test]
fn pausa_bloqueia_contratos_e_fundo_mas_o_aluguel_continua() {
    let (mut env, lease) = contrato_ativo(12);
    let admin = env.admin.insecure_clone();
    env.open_position().unwrap();
    env.set_paused(&admin, true).unwrap();

    let (agency, landlord, tenant) =
        (env.agency.insecure_clone(), env.landlord.insecure_clone(), env.tenant.pubkey());
    assert_err(env.create_lease(&agency, &landlord, tenant, 2, terms(2000)), "ProtocolPaused");
    assert_err(env.pool_deposit(brl(1000)), "ProtocolPaused");
    env.pay_rent(lease).unwrap(); // a inquilina continua pagando
    env.pay_rent(lease).unwrap();

    // Caução esgotada: com a pausa, o fundo não paga; o que falta fica com o proprietário.
    for mes in 2..6 {
        depois_da_carencia(&mut env, &lease, mes);
        env.claim_default(lease).unwrap();
    }
    let l = env.lease(&lease);
    assert_eq!(l.pool_covered_total, 0);
    assert_eq!(l.landlord_debt, brl(2000));

    env.set_paused(&admin, false).unwrap();
    env.pool_deposit(brl(1000)).unwrap();
}

#[test]
fn imobiliaria_suspensa_nao_cria_contrato_nem_convite_e_aceito() {
    let mut env = Env::ready();
    let (admin, agency, landlord, tenant) = (
        env.admin.insecure_clone(),
        env.agency.insecure_clone(),
        env.landlord.insecure_clone(),
        env.tenant.insecure_clone(),
    );
    env.create_lease(&agency, &landlord, tenant.pubkey(), 1, terms(2000)).unwrap();
    env.init_profile(&tenant).unwrap();
    env.set_agency_active(&admin, agency.pubkey(), false).unwrap();

    assert_err(env.create_lease(&agency, &landlord, tenant.pubkey(), 2, terms(2000)), "AgencyInactive");
    let lease = lease_pda(&landlord.pubkey(), &tenant.pubkey(), 1);
    let token = env.tenant_token;
    assert_err(env.accept_lease(&tenant, token, lease), "AgencyInactive");

    env.set_agency_active(&admin, agency.pubkey(), true).unwrap();
    env.accept_lease(&tenant, token, lease).unwrap();
}

#[test]
fn pagamento_do_fundo_fica_em_quarentena_e_depois_vai_ao_proprietario() {
    let (mut env, lease) = contrato_ativo_com(env_com(regras_quarentena()), 12);
    paga_e_esgota_a_caucao(&mut env, &lease, 2);
    let antes = env.balance(&env.landlord_token);
    depois_da_carencia(&mut env, &lease, 5);
    env.claim_default(lease).unwrap();
    let l = env.lease(&lease);
    assert_eq!(l.pool_pending, brl(2000));
    assert_eq!(env.balance(&env.landlord_token), antes, "ainda não saiu do cofre do fundo");

    assert_err(env.release(lease), "QuarantineActive");
    env.warp(30);
    env.release(lease).unwrap();
    assert_eq!(env.balance(&env.landlord_token) - antes, brl(2000));
    assert_eq!(env.lease(&lease).pool_pending, 0);
    assert_err(env.release(lease), "NothingPending");
}

#[test]
fn golpe_confirmado_congela_e_cancela_o_pagamento_do_fundo() {
    let (mut env, lease) = contrato_ativo_com(env_com(regras_quarentena()), 12);
    let (admin, stranger) = (env.admin.insecure_clone(), env.stranger.insecure_clone());
    paga_e_esgota_a_caucao(&mut env, &lease, 2);
    let antes = env.balance(&env.landlord_token);
    depois_da_carencia(&mut env, &lease, 5);
    env.claim_default(lease).unwrap();
    let ativos_depois_da_cobranca = env.pool().total_assets;

    assert_err(env.freeze(&stranger, lease, true), "ConstraintHasOne");
    env.freeze(&admin, lease, true).unwrap();
    env.warp(60);
    assert_err(env.release(lease), "PoolPaymentFrozen");

    env.cancel(&admin, lease).unwrap();
    let l = env.lease(&lease);
    assert_eq!(l.pool_pending, 0);
    assert_eq!(l.pool_debt, 0, "a inquilina deixa de dever ao fundo o que o fundo não pagou");
    assert_eq!(env.pool().total_assets - ativos_depois_da_cobranca, brl(2000), "o dinheiro volta aos investidores");
    assert_eq!(env.balance(&env.landlord_token), antes, "o proprietário não recebe");
    assert!(env.balance(&pda(&[b"pool_vault"])) >= env.pool().total_assets, "I1");
}

#[test]
fn nao_fecha_contrato_com_pagamento_do_fundo_em_quarentena() {
    let (mut env, lease) = contrato_ativo_com(env_com(regras_quarentena()), 6);
    paga_e_esgota_a_caucao(&mut env, &lease, 2);
    depois_da_carencia(&mut env, &lease, 5);
    env.claim_default(lease).unwrap();
    env.end_lease(lease).unwrap();
    assert_err(env.close_lease(lease), "DisputeWindowOpen");
    env.warp(31);
    let l = env.lease(&lease);
    assert!(l.pool_pending > 0);
    assert_err(env.close_lease(lease), "PoolPaymentPending");
    env.release(lease).unwrap();
    env.close_lease(lease).unwrap();
    assert_eq!(env.lease(&lease).status, LeaseStatus::Closed);
}


#[test]
fn so_quem_publicou_o_programa_inicializa() {
    // Regressão B-A21: um estranho chegando primeiro não vira admin.
    let mut env = Env::new();
    let (stranger, mint, token) = (env.stranger.insecure_clone(), env.mint, env.stranger_token);
    let ix = Instruction::new_with_bytes(
        fiador::id(),
        &fiador::instruction::Initialize { params: demo_params(), initial_pool_deposit: brl(1000) }.data(),
        fiador::accounts::Initialize {
            admin: stranger.pubkey(),
            config: pda(&[b"config"]),
            pool: pda(&[b"pool"]),
            mint,
            pool_vault: pda(&[b"pool_vault"]),
            yield_reserve: pda(&[b"yield_reserve"]),
            admin_token: token,
            program_data: program_data(),
            token_program: token_program(),
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );
    assert_err(env.send(ix, &[&stranger]), "NotUpgradeAuthority");
    env.initialize(demo_params(), brl(1000)).unwrap();
}


/// Regressão B-A12: um pedido antigo não fica "pronto" para sempre.
#[test]
fn regressao_b_a12_pedido_de_saque_vence() {
    let mut env = Env::ready();
    env.open_position().unwrap();
    env.pool_deposit(brl(50_000)).unwrap();
    let shares = env.fetch::<Position>(&pda(&[b"position", env.investor.pubkey().as_ref()])).shares;
    env.request_withdraw(shares).unwrap();
    env.warp(10_000);
    assert_err(env.pool_withdraw(), "WithdrawRequestExpired");
    env.request_withdraw(shares).unwrap();
    assert_err(env.pool_withdraw(), "CooldownActive");
    env.warp(30);
    env.pool_withdraw().unwrap();
}
