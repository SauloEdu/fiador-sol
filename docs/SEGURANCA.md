# Revisão de segurança da arquitetura — Fiador.sol

> ⚠️ **Documento histórico (primeira revisão, 23/09).** Algumas proteções descritas aqui não existem no código (ver B-A41 em `Fiador Doc/04-BUGS.md`). A segurança atual está em `Fiador Doc/07-SEGURANCA-SOFTWARE.md` (técnica), `06-CONSELHO-SEGURANCA.md` (achados e plano) e `08-RESPOSTA-A-GOLPE.md` (golpes e incidentes).

> 23/09/2026 · Revisão do desenho em [ARQUITETURA.md](ARQUITETURA.md). Itens 1–8 viraram testes automáticos em `programs/fiador/tests/test_lease.rs`.
> Gravidade: 🔴 crítica (perda de dinheiro) · 🟠 alta · 🟡 média

## O que não vale mais neste documento (B-A41, conferido em 2026-09-27)

| Item | O documento diz | O código faz de fato |
|---|---|---|
| 1 | "2 aluguéis pagos **em dia**" | A espera conta também os pagos com atraso. E o conluio continua lucrativo (B-A24); ver `Fiador Doc/08-RESPOSTA-A-GOLPE.md`. |
| 2 | Tier exige "proprietários diferentes" | Não é conferido (`profile.rs`). A reputação máxima custa R$ 0,000042 (B-A23). |
| 6 | "Cotas virtuais" | Não existem; só o depósito inicial do admin. |
| 8 | Termos protegidos contra o admin | Valem contra a Config, mas quem tem a chave de atualização reescreve o programa inteiro (B-A22). |
| 12 | Checklist como feito | Nenhum `emit!` (B-A38) e nenhuma conta é fechada; o mint não é validado (B-A28). |
| 13 | "Quatro carteiras diferentes" | É uma só: admin, emissora do tBRL, keeper e atualização (B-A22). |
| 14 | "Nada disso afeta as garantias do programa" | Afeta: qualquer visitante vira imobiliária (B-A08) e trava 100% do fundo com um "mês" de 100 anos (B-A26). |

## Resumo

| # | Brecha | Gravidade | Correção | No MVP? |
|---|---|---|---|---|
| 1 | Proprietário e inquilino combinados drenam o pool | 🔴 | Só imobiliária credenciada cria contrato; carência de cobertura; teto por contrato | Sim |
| 2 | Reputação "fabricada" com contratos falsos de 1 segundo | 🔴 | Período mínimo na Config; reputação só conta contratos de imobiliária credenciada | Sim |
| 3 | Proprietário recebe duas vezes pelo mesmo mês | 🔴 | Pagamento após cobrança vai recompor cofre/pool, não ao proprietário | Sim |
| 4 | Investidor foge do pool antes de um calote conhecido | 🟠 | Saque com aviso prévio (cooldown) | Sim |
| 5 | Pool promete mais cobertura do que tem | 🟠 | Contrato só ativa se o pool tiver cobertura livre | Sim |
| 6 | Ataque da primeira cota do pool | 🟠 | Depósito inicial mínimo feito pelo admin ~~+ cotas virtuais~~ (não existem) | Sim |
| 7 | Caução volta ao inquilino mesmo com dano no imóvel | 🟠 | Janela de contestação antes da devolução | Sim (simplificada) |
| 8 | Admin muda regras de contratos já assinados | 🟠 | Termos copiados para o contrato na criação | Sim |
| 9 | Pix simulado emite tBRL infinito para qualquer um | 🟡 | Limite por carteira e por hora; só devnet | Sim |
| 10 | Reserva de rendimento esgota | 🟡 | Rendimento limitado ao saldo da reserva | Sim |
| 11 | Página pública expõe valores de aluguel | 🟡 | Página mostra só faixa e contagens | Sim |
| 12 | Validação de contas Solana (mint falsa, conta trocada) | 🔴 | Checklist técnico abaixo | Sim |
| 13 | Chaves de admin e de upgrade | 🟠 | Carteiras separadas; multisig em produção | Parcial |

---

## 1. Conluio para drenar o pool 🔴

**Ataque:** a mesma pessoa (ou dois amigos) cria um contrato de R$ 50.000/mês, deposita a caução, não paga e aciona `claim_default`. O pool cobre 3 aluguéis além da caução → R$ 150.000 saem do bolso dos investidores.

**Correção:**
- Nova conta `Agency` (`["agency", wallet]`), criada só pelo admin. `create_lease` exige a assinatura de uma imobiliária credenciada. A imobiliária responde pelo cadastro (como já faz hoje com o fiador).
- `landlord != tenant` e `agency != tenant`. *(Falta `agency != landlord`: B-A25.)*
- **Carência de cobertura:** o pool só cobre depois de 2 aluguéis pagos em dia no contrato. Antes disso, só a caução responde.
- **Teto por contrato:** cobertura máxima em reais na Config (ex.: R$ 15.000), além do limite de 3 aluguéis.
- **Teto por imobiliária:** soma das coberturas ativas de uma imobiliária ≤ X% do pool.

## 2. Reputação fabricada 🔴

**Ataque:** `period_secs` é livre. O golpista cria um contrato consigo mesmo com período de 1 segundo, paga 12 "meses" em 12 segundos (o dinheiro volta para ele) e vira tier 2: próximos contratos exigem só 1 aluguel de caução.

**Correção:**
- `min_period_secs` na Config: 28 dias em produção; 60 s **só** no deploy de demonstração (flag `demo_mode` fixada no `initialize`).
- Reputação só conta contratos criados por imobiliária credenciada (item 1).
- ~~Tier exige também contratos com proprietários diferentes~~ **não implementado** (B-A23).

## 3. Pagamento em dobro ao proprietário 🔴

**Ataque/erro:** o mês 2 atrasa, `claim_default` paga o proprietário com a caução. Depois o inquilino paga o mês 2 via `pay_rent` e o dinheiro vai de novo ao proprietário.

**Correção:** cada período tem estado (`Open`, `Paid`, `Covered`). `pay_rent` de período `Covered` manda o dinheiro para **recompor o pool primeiro e depois o cofre da caução**. `claim_default` só age em período `Open` e vencido — isso também impede cobrar o mesmo mês duas vezes.

## 4. Fuga do pool antes do calote 🟠

**Ataque:** todo o estado é público. Um investidor vê que um contrato está atrasado e saca antes do `claim_default`; quem fica paga o prejuízo.

**Correção:** saque em duas etapas — `request_withdraw` e `pool_withdraw` só após cooldown (7 dias; demo: 30 s). Durante o cooldown as cotas continuam absorvendo perdas.

## 5. Cobertura sem lastro 🟠

**Correção:** `accept_lease` trava `cobertura_do_contrato` em `locked_coverage` e falha se `total_assets - locked_coverage` for insuficiente. `close_lease` destrava.

## 6. Ataque da primeira cota 🟠

**Ataque:** o primeiro investidor deposita 1 unidade, depois "doa" tBRL direto ao cofre e distorce o preço das cotas, fazendo depósitos seguintes receberem 0 cotas.

**Correção:** o `initialize` já faz um depósito do admin que nunca é sacado; a conta usa `total_assets` registrado no estado (não o saldo do cofre) e arredonda contra o depositante.

## 7. Dano ao imóvel 🟠

**Falha de negócio:** no desenho atual, `close_lease` devolve a caução automaticamente. Na vida real, caução também cobre danos e contas em aberto.

**Correção:** ao fim do prazo o contrato entra em `Ending` por uma janela (15 dias; demo: 30 s). Nela o proprietário pode `open_dispute` com um valor. Sem disputa, `close_lease` devolve tudo. Com disputa, a imobiliária credenciada decide com `resolve_dispute` (MVP); em produção, arbitragem.

## 8. Admin mudando regras no meio do jogo 🟠

**Correção:** `premium_bps`, `grace_secs`, `apy_bps` e cobertura são copiados para a conta `Lease` no `create_lease`. Mudanças na Config valem só para contratos novos.

## 9. Pix simulado aberto 🟡

**Risco:** `/api/pix/confirmar` emite tBRL para qualquer carteira. Na devnet não há dinheiro real, mas alguém pode lotar o pool de tBRL falso e bagunçar a demo.

**Correção (implementada):** limite de R$ 500.000 por carteira por hora e até R$ 200.000 por cobrança; a mint authority fica apenas no servidor; a demo roda com um deploy próprio (programa e mint só nossos). **Pendente:** captcha, se a demo for publicada na internet.

## 10. Reserva de rendimento 🟡

**Correção:** rendimento pago = `min(calculado, saldo da reserva)`; a tela mostra "rendimento simulado".

## 11. Privacidade (LGPD) 🟡

**Risco:** carteira + valor do aluguel + datas pode identificar alguém.

**Correção:** página pública mostra apenas tier, número de pagamentos em dia e selos — não valores. O valor do aluguel continua on-chain (necessário ao programa), o que deve constar no termo de uso. Em produção avaliar valores cifrados/confidential transfers.

## 12. Checklist técnico do programa 🔴

- Seeds e `bump` validados em toda conta PDA; `has_one` para landlord, tenant, agency, mint.
- Token accounts: conferir `mint`, `owner` e o **token program** (Token vs Token-2022) — nunca aceitar conta passada pelo usuário sem checar.
- `init` (nunca `init_if_needed`) para evitar reinicialização.
- Aritmética com `checked_*` e `u64`/`u128`; nada de float.
- Transferências de cofres só via assinatura do PDA (`CpiContext::new_with_signer`).
- Contas fechadas zeradas e com lamports devolvidos ao pagador correto. **Pendente: nenhuma conta é fechada hoje.**
- Eventos (`emit!`) em toda movimentação para auditoria — **pendente**; hoje o site lê o estado das contas e as assinaturas das transações.
- Testes obrigatórios para cada brecha desta lista (1 a 8 viram casos de teste).

## 13. Chaves 🟠

- Admin, upgrade authority, mint authority do tBRL e keeper: quatro carteiras diferentes. **Hoje é uma só (B-A22).**
- Keeper só paga taxas — não tem poder algum além de acionar `claim_default`.
- Produção: admin e upgrade em multisig (Squads) e programa verificado (build reproduzível).

---

## Mudanças que isto gera na arquitetura

- **Novas contas:** `Agency`; estado por período dentro do `Lease`.
- **Novas instruções:** `register_agency`, `request_withdraw`, `open_dispute`, `resolve_dispute`.
- **Novos estados do contrato:** `Ending` e `Disputed`.
- **Config:** `min_period_secs`, `demo_mode`, `max_coverage_amount`, `coverage_waiting_periods`, `withdraw_cooldown_secs`, `dispute_window_secs`.

Essas mudanças já foram aplicadas em [ARQUITETURA.md](ARQUITETURA.md).

---

## 14. Site da demo (web/) — atalhos aceitáveis só em rede de teste 🟡

| Atalho | Por que existe | Antes de produção |
|---|---|---|
| `/api/demo/preparar` credencia **qualquer** carteira como imobiliária (assinado pelo admin) | Permitir que qualquer pessoa rode a demo | Credenciamento manual (KYC da imobiliária); rota removida |
| Pix simulado emite tBRL | Mostrar a experiência Pix → stablecoin | Parceiro de on-ramp regulado; emissão sai do servidor |
| Carteiras de demonstração no `localStorage` do navegador | Trocar de papel com um clique | Carteira real (Phantom) ou carteira embutida com login |
| Keeper usa a chave do admin | Menos chaves para gerenciar na demo | Chave própria do keeper, sem nenhum outro poder |

~~Nada disso afeta as garantias do programa~~ **Afeta** (B-A08, B-A26): qualquer visitante vira imobiliária e pode travar o fundo. As garantias abaixo continuam valendo: o programa continua recusando cobrança antecipada, pagamento em dobro, saque de cobertura travada, etc.
