# Registro de bugs

Numeração: `B-0xx` para corrigidos, `B-Axx` para abertos. Ao corrigir um aberto, mova-o para "Corrigidos" com a data e o número novo, e cite o número antigo. Erros de documentação também entram aqui.

## Abertos

### B-A01 · As telas não mostram o limite de 50% do fundo por imobiliária
- **Status:** aberto (encontrado em 2026-09-24)
- **Sintoma:** o painel da imobiliária mostra quanto de proteção ela reservou, mas não mostra o limite. No canvas de design o limite foi retirado das telas.
- **Causa:** erro de documentação (ver B-012). O limite existe no programa: `agency_max_pool_bps = 5000`, conferido em `accept_lease`.
- **Correção sugerida:** na barra lateral de `web/src/app/imobiliaria/casca.tsx`, mostrar "R$ X de R$ Y (metade do fundo)", com Y = `pool.totalAssets × 50%`, e voltar a linha nas Configurações do canvas.
- **Como testar:** criar um contrato e conferir que o limite aparece e bate com o fundo.

### B-A02 · Não há prazo para a imobiliária decidir os danos
- **Status:** aberto
- **Sintoma:** depois que o proprietário pede danos, a caução fica parada até a imobiliária decidir, sem data limite.
- **Causa:** `resolve_dispute` não tem prazo e `close_lease` exige a decisão quando há contestação.
- **Correção sugerida:** acrescentar um prazo (ex.: 15 dias) depois do qual `close_lease` libera a caução à inquilina, com teste novo.
- **Conselho (2026-09-24):** gravidade 🟠. Sem prazo, a imobiliária pode segurar a caução para forçar um acordo (PLD), e a caução retida continua sem render para a inquilina (Lei 8.245, art. 38, §2º; REG). Correção melhor:
  - prazo para decidir e direito de resposta da inquilina (B-A25);
  - vencido o prazo, o **valor disputado** fica retido até acordo ou ordem judicial, sem voltar automaticamente a nenhuma das partes;
  - o resto da caução é liberado.
- **Como testar:** teste LiteSVM avançando o relógio além do prazo sem decisão.

### B-A03 · Comprovantes em outro navegador ficam sem data e sem código da transação
- **Status:** aberto
- **Sintoma:** abrindo o app em outro aparelho, a cartela e os valores estão certos, mas os comprovantes não mostram data nem assinatura.
- **Causa:** a data e a assinatura vêm dos eventos guardados no navegador que fez a transação (`fiador-eventos-v1`).
- **Correção sugerida:** buscar as assinaturas do contrato na Solana (`getSignaturesForAddress` do `Lease`) e decodificar as instruções.

### B-A04 · Decisões tomadas pelo console antigo não aparecem no extrato do proprietário
- **Status:** aberto (baixo impacto)
- **Causa:** o `/demo` registra a decisão sem `kind: "decisao"`. O painel novo (`/imobiliaria/contrato`) já registra certo.
- **Correção sugerida:** passar os metadados no `DemoConsole`, ou aposentar o console.

### B-A05 · O resgate do investidor pede sempre todas as cotas
- **Status:** aberto (limitação de interface)
- **Causa:** a tela chama `requestWithdraw` com todas as cotas.
- **Correção sugerida:** campo de valor com conversão para cotas.

### B-A06 · Cobranças Pix pendentes somem se o servidor reiniciar
- **Status:** aberto (só na demonstração)
- **Causa:** `web/src/lib/pix.ts` guarda as cobranças na memória do processo.
- **Correção sugerida:** em produção, trocar por um parceiro de Pix real e um banco de dados.
- **Conselho (2026-09-24):** gravidade → 🟠 se o site for hospedado. Em serverless, cada instância tem o próprio `Map`: a cobrança criada numa instância dá 404 na outra, mesmo sem reinício, e isso pode quebrar a demo na frente da banca (SRE, PIX, RTF).
  - **Na demo:** guardar a cobrança num KV ou num token assinado (HMAC) devolvido ao navegador.
  - **Em produção:** banco de dados com `txid`/`endToEndId` como chave única.

### B-A07 · A página pública de reputação depende de o navegador alcançar a rede
- **Status:** aberto
- **Causa:** `reputacao/[carteira]/Historico.tsx` lê a Solana pelo navegador; com a rede local, só funciona na máquina da demonstração.
- **Correção sugerida:** resolvido naturalmente na devnet; opcionalmente, ler pelo servidor.

> **B-A08 a B-A20** saíram da primeira revisão de brechas (2026-09-24). **B-A21 a B-A41** saíram do conselho de segurança do mesmo dia, com 10 especialistas. O relatório completo, com os temas jurídicos e econômicos, está em [06-CONSELHO-SEGURANCA.md](06-CONSELHO-SEGURANCA.md). As provas de conceito ficam em `provas/`: são testes que **passam hoje**, ou seja, a brecha existe. Siglas dos especialistas: RTO, RTF, CISO, SC, PIX, ATU, REG, LGPD, PLD, SRE.

### B-A08 · Qualquer pessoa vira imobiliária credenciada pela rota de preparação 🔴
- **Status:** aberto (2026-09-24) · confirmado pelo conselho (RTF, CISO, PLD)
- **Sintoma:** um `POST /api/demo/preparar` com qualquer carteira no campo `imobiliaria` faz o admin assinar `register_agency` para ela. Na devnet, a rota também transfere 0,05 SOL do admin para cada carteira nova. Basta **abrir a página inicial** para disparar a rota: cada navegador novo gera 4 carteiras e custa cerca de 0,21 SOL ao admin (RTF-3).
- **Causa:** a rota não tem autenticação nem lista de carteiras permitidas (`web/src/app/api/demo/preparar/route.ts:16-39`; `web/src/components/useDemo.ts:176-185`).
- **Correção:**
  - **Demo:** o token secreto `DEMO_TOKEN` passa a ser exigido em `preparar`, `pix/confirmar` e `keeper`. Só o navegador do apresentador tem o token; o público fica só com leitura. Tirar apenas o `register_agency` quebraria a demo e não fecharia o gasto de SOL.
  - **Produção:** credenciar só depois de verificar a empresa (KYB: CNPJ, CRECI, sócios, PEP e sanções) e assinar o contrato de credenciamento.
- **Como testar:** `curl -XPOST localhost:3000/api/demo/preparar` sem token deve responder 401.

### B-A12 · Pedido de saque do fundo não expira 🔴
- **Status:** aberto · **confirmado com prova** (`poc_rto_b_a12_saida_antes_do_calote`). O CISO propôs 🟠; ficou 🔴 pela regra do conselho.
- **Sintoma:** o investidor pede o saque de tudo logo depois de aportar e, quando vê um atraso, sai antes de o fundo pagar a cobertura.
- **Causa:** `pool_ops.rs:142-146` só confere `agora ≥ pedido + aviso`.
- **Correção:** a janela de validade sozinha não basta. Com pedidos escalonados entre carteiras, cerca de 22% do dinheiro fica sempre pronto para sair (SC). Juntar três medidas:
  - validade curta (≤ 1 dia);
  - aviso prévio maior que a carência;
  - saque pelo **menor** valor de cota entre o pedido e o saque, descontada a provisão de sinistros (B-A27).
- **Como testar:** inverter a prova.

### B-A13 · Calote só entra na reputação no fechamento do contrato 🟠
- **Status:** aberto · confirmado, gravidade reduzida de 🔴 para 🟠 (RTO, CISO): uma carteira nova já paga a caução máxima, então o ganho é limitado.
- **Sintoma:** com um contrato em atraso, a inquilina aceita outro com a caução do nível que tinha antes. Uma inquilina de nível 2 pode aceitar N contratos ao mesmo tempo, com 1 aluguel de caução cada, antes do primeiro atraso.
- **Causa:** `claim_default` não altera o `TenantProfile`; `profile.defaults` só aumenta no `close_lease`.
- **Correção:**
  - contadores `active_leases` e `delinquent_leases` no perfil: sobem no `accept_lease`/`claim_default`, descem no `pay_rent` (quando não sobra mês `covered`) e no `close_lease`. O `claim_default` passa a receber o `profile` como conta `mut`;
  - desconto de caução só com 0 outro contrato ativo;
  - identidade verificada fora da blockchain (B-A24).
- **Como testar:** contrato A em `defaulted`; o aceite do contrato B deve exigir 3 aluguéis.

### B-A14 · Não há como descredenciar imobiliária, pausar ou trocar o admin 🟠 (🔴 em produção)
- **Status:** aberto · confirmado (CISO, SRE, PLD)
- **Causa:** `Agency.active` nunca vira falso; não há pausa, `set_admin` nem atualização da Config (`lib.rs:15-98`).
- **Efeito:** não existe resposta a incidente. Somado ao B-A22, um vazamento de chave não tem conserto.
- **Correção:** `set_agency_active`, `set_admin` em duas etapas (propõe e aceita), `paused` na Config (bloqueia entradas: aceite, aporte e criação, **nunca** saídas legítimas) e congelar posição ou contrato por ordem judicial. Runbook dizendo quem assina a pausa.

### B-A15 · Keeper aberto usa a chave do admin 🟠 (🔴 na devnet)
- **Status:** aberto · confirmado (CISO, RTF, SRE, PIX)
- **Sintoma:** qualquer pessoa chama `POST /api/keeper` em laço. As taxas e as contas de tBRL de contratos de terceiros saem da carteira do admin (`keeper/route.ts:50,82`).
- **Causa:** rota sem autenticação; `serverContext()` usa a mesma chave para tudo.
- **Correção:** ver B-A22 (chaves separadas) e B-A32 (keeper fora do navegador, por cron com segredo e limite de gasto).

### B-A16 · Contrato encerra sem chance de quitar, e usar a caução vira calote permanente 🟠
- **Status:** aberto · confirmado (LGPD, REG, SC, ATU)
- **Sintoma:** o keeper chama `end_lease` no primeiro instante permitido; o `pay_rent` recusa `Ending`; os meses `covered` viram calote para sempre no `close_lease`. A tela de selos diz "calote é só terminar devendo", o que contradiz o código (CDC, art. 31).
- **Causa:** `pay_rent.rs:80-83`; `close_lease.rs:129,140`; `profile.rs:22-32` sem prazo de validade.
- **Correção:**
  - aceitar `pay_rent` de mês `covered` durante a janela de danos, sem mudar o status para `Active`;
  - contar calote só pela dívida que sobrou (`pool_debt > 0` ou `landlord_debt > 0`);
  - gravar a data do calote e parar de pesar depois de no máximo 5 anos (CDC, art. 43, §1º; o prazo de 24 meses sugerido antes também é aceitável);
  - avisar a inquilina antes de registrar (CDC, art. 43, §2º).
- **Relacionado:** D-06.

### B-A17 · O fundo trava se os ativos chegarem a zero 🟠
- **Status:** aberto · confirmado (SC, RTO, ATU)
- **Causa:** `pool_ops.rs:65-68` divide por `total_assets` (pânico, não erro). Perto de zero, dá `MathOverflow` (1 unidade contra 10¹² cotas). O `claim_default` pode consumir até o último centavo.
- **Correção:** **piso de ativos**. O depósito inicial nunca serve de cobertura: `from_pool ≤ total_assets − piso` e `free_assets` calculado sobre `total − piso`. "Reiniciar 1:1" (sugerido antes) está **errado**: tira dinheiro de quem entra depois.

### B-A19 · Pix simulado: limite contornável e emissão dupla 🟡
- **Status:** aberto · confirmado (PIX, RTF, CISO)
- **Causa:**
  - O limite é por carteira de destino e fica na memória: um terceiro consegue esgotar o limite da Ana e bloquear o Pix dela (RTF-5).
  - Duas chamadas simultâneas emitem duas vezes.
  - **Segundo caminho de emissão dupla:** o `mintTo` chega à rede, a confirmação estoura o tempo, o `catch` devolve 500 sem marcar a cobrança como paga, e o "tentar de novo" emite outra vez.
- **Correção:**
  - estado `aberta → emitindo → paga | falhou` gravado **antes** do primeiro `await`;
  - id da cobrança no memo da emissão, conferido na rede antes de tentar de novo;
  - limite por quem chama e teto global num armazenamento persistente;
  - `DEMO_TOKEN`.
- **Relacionado:** B-A06, B-A33.

### B-A20 · A tela mostra um rendimento que o programa não paga 🟡 (🟠 em produção)
- **Status:** aberto · confirmado (SC, ATU, REG)
- **Sintoma:** a demo mostra cerca de 10%; a Solana paga quase zero. Além disso:
  - o rendimento corre **sem limite** até alguém fechar o contrato (`elapsed` sem teto, `close_lease.rs:80`);
  - quando a reserva acaba, paga R$ 0 sem aviso (`close_lease.rs:86`);
  - prometer taxa fixa sobre depósito de terceiros sem ativo por trás é publicidade enganosa (CDC, art. 37) e parece captação remunerada (06, seção 4.1).
- **Causa:** `historia.ts` usa "1 ano = 12 períodos"; `close_lease.rs:80-85` usa o ano real.
- **Correção:**
  - mesma fórmula na tela e no programa;
  - tempo limitado a `end_ts + janela`;
  - evento quando `yield_paid < accrued`;
  - no produto, rendimento só de ativo real e sem prometer taxa fixa.

### B-A21 · Qualquer carteira pode rodar o `initialize` antes da equipe e virar admin para sempre 🔴 (devnet/produção)
- **Status:** aberto (2026-09-24) · SRE-1, CISO-2, SC-1, RTO-3, RTF-9
- **Sintoma:** entre o `anchor deploy` e o `npm run setup`, um robô chama `initialize` com o próprio mint e as próprias regras. O PDA `["config"]` fica ocupado e não existe `set_admin`. A única saída é publicar com outro endereço. Um mint com PermanentDelegate ou congelamento dá ao atacante controle sobre os cofres.
- **Causa:** `initialize.rs:10-12,77`: `admin: Signer` sem restrição.
- **Correção:** exigir `program_data.upgrade_authority_address == Some(admin)` (conta `ProgramData`) ou uma chave fixa no código; publicar e inicializar no mesmo script, logo em seguida.
- **Como testar:** LiteSVM: `initialize` assinado por uma carteira que não é a autoridade de atualização deve falhar.

### B-A22 · Uma chave só é autoridade de atualização, admin, emissora do tBRL e keeper 🔴 (devnet/produção)
- **Status:** aberto · CISO-1, RTF-2
- **Sintoma:** `Anchor.toml:14`, `setup-demo.ts:46,84` e `server.ts:14-18` usam o mesmo `~/.config/solana/id.json`. O plano da devnet é colocar essa chave na hospedagem (`ADMIN_SECRET_KEY`). Quem ler as variáveis da hospedagem (conta invadida, colaborador, log ou dependência comprometida) publica um programa novo e **leva todos os cofres e o fundo**. Contradiz o item 13 do `docs/SEGURANCA.md` ("quatro carteiras").
- **Correção:**
  - gerar 4 chaves: atualização, admin, emissão do tBRL e keeper;
  - `solana program set-upgrade-authority` para a chave fria, que fica fora da hospedagem;
  - na hospedagem, só o keeper (≤ 1 SOL) e, se preciso, a emissão com teto;
  - em produção, multisig (Squads) com timelock e, quando o código congelar, `--final`.

### B-A23 · Reputação máxima e 3 selos com aluguel de 1 unidade 🔴 (demo) · 🟠 (produção)
- **Status:** **corrigido em parte em 2026-09-28**: aluguel mínimo na Config (`min_rent_amount`, R$ 100 na demo) e no máximo 1 pagamento em dia por janela de tempo, somando todos os contratos (`last_on_time_ts`). Testes `regressao_b_a23_*`. **Falta:** trocar `leases_started` por contratos concluídos com ≥ 6 períodos e limitar o desconto quando o aluguel novo for maior que o maior já pago. Antes: · **confirmado com prova** (`poc_rto_reputacao_fabricada_com_aluguel_minimo`) · RTO-1
- **Sintoma:**
  - 12 contratos de 1 período com aluguel de 1 unidade, cada um pago no mês corrente, dão `on_time=12`, `leases_started=12`, nível 2 e 3 selos.
  - Custo: 42 unidades (R$ 0,000042). O prêmio de 8% sobre 1 unidade arredonda para 0.
  - Depois, a inquilina aceita um contrato real **em outra imobiliária, honesta**, com caução de 1 aluguel, e dá o calote.
  - Funciona mesmo com a B-A09 corrigida.
- **Causa:** `create_lease.rs:57` (só `rent > 0`), `lease.rs:94-97`, `profile.rs:22-32` (conta contratos **aceitos**, não concluídos).
- **Correção:**
  - aluguel mínimo na Config;
  - 1 pagamento em dia por janela de tempo (B-A09);
  - `leases_started` substituído por contratos **concluídos** com ≥ 6 períodos;
  - desconto de caução limitado quando o aluguel novo for maior que o maior aluguel já pago.

### B-A24 · Conluio com imobiliária credenciada lucra cerca de R$ 14.200 por contrato 🔴 (produção)
- **Status:** aberto, **mitigado em parte em 2026-09-28**: cobertura crescente (¼ de aluguel por mês pago) e franquia de 20% do proprietário no programa (testes `cobertura_do_fundo_cresce_com_os_meses_pagos`, `franquia_do_proprietario_e_paga_primeiro_na_quitacao`, `cobertura_cheia_so_depois_de_12_meses_pagos`). Pela conta do conselho, o lucro cai para cerca de R$ 6.400 e o golpe passa a levar cerca de 18 meses. Faltam as outras camadas (08-RESPOSTA-A-GOLPE). · PLD-1, ATU-1, RTO-5 (três caminhos independentes chegaram ao mesmo número)
- **Sintoma:** imobiliária, proprietário e inquilina combinados; aluguel de R$ 5.000 por 8 meses ou mais.
  1. A inquilina paga 2 meses; o aluguel volta ao comparsa, e o custo real são só as taxas de 8% (R$ 800).
  2. Ela para de pagar; a caução cobre os meses 3 a 5 e o fundo cobre os meses 6 a 8 (até R$ 15.000).
  3. A dívida com o fundo fica só registrada (`close_lease.rs:145`) e ninguém a cobra.
  - Dá para repetir até 50% do fundo por imobiliária. A marca de calote some com uma carteira nova.
- **Causa:** a única barreira é `paid ≥ coverage_waiting_periods` (`claim_default.rs:77-81`). Não há garantia própria da imobiliária, identidade nem prova de ocupação ou de despejo.
- **Correção** (o programa sozinho não resolve):
  - garantia da imobiliária de 10–20% da `coverage_in_use`, consumida **antes** do fundo;
  - espera do fundo por tempo (B-A09), mais longa em produção;
  - teto por imobiliária menor no piloto (ex.: 10%);
  - `losses_total` na `Agency`, com descredenciamento automático;
  - identidade verificada da inquilina e do proprietário e imóvel identificado pela matrícula (06, seção 4.3);
  - demais camadas antifraude (cobertura que cresce com o tempo, franquia do proprietário, quarentena com contestação pelos investidores, sinais de detecção e pontuação de risco): 06, seção 8.

### B-A25 · A imobiliária pode ser a proprietária e decidir a própria disputa; a inquilina não tem voz 🟠 (🔴 em produção)
- **Status:** **corrigido em parte em 2026-09-28**: `create_lease` recusa imobiliária = proprietário (`AgencyIsLandlord`, teste `regressao_b_a25_*`). **Falta:** `respond_dispute` para a inquilina, prazo e retenção do valor contestado. Antes: · PLD-2, CISO-5, SC-4, RTO-4, REG-4
- **Sintoma:** `create_lease` confere proprietário ≠ inquilina e imobiliária ≠ inquilina, mas **não** imobiliária ≠ proprietário (`create_lease.rs:54-55`; o próprio teste auxiliar usa esse caso, `test_lease.rs:222`). A imobiliária-proprietária pede danos iguais a toda a caução e decide a favor de si mesma. Mesmo sem esse conflito, a imobiliária é mandatária do proprietário, não árbitro, e a inquilina não tem instrução para responder (`lib.rs:60-68`).
- **Correção:**
  - `require_keys_neq!(agency_authority, landlord)`;
  - instrução `respond_dispute` para a inquilina aceitar ou contestar; o silêncio depois do prazo vale como aceite;
  - com contestação, o valor disputado fica retido até acordo, laudo, câmara independente ou alvará;
  - acima de um teto (ex.: 1 aluguel), exigir árbitro.
- **Relacionado:** B-A02, B-A18.

### B-A27 · O fundo registra a perda tarde, e quem sai antes deixa o prejuízo para quem fica 🟠 (🔴 em produção)
- **Status:** aberto · ATU-2, ATU-6, SC-5, RTO
- **Sintoma:**
  - O contrato fica `defaulted` no 1º atraso, visível para todos.
  - O fundo só paga depois que a caução acaba, cerca de 3 meses depois.
  - Quem sai nesse meio-tempo sai pela cota intacta, mesmo com a B-A12 corrigida.
  - A dívida da inquilina com o fundo não entra no valor da cota. Quem aporta entre o `claim_default` e a quitação compra barato e fica com parte da recuperação.
- **Causa:** `total_assets` só cai em `from_pool` (`claim_default.rs:119`); não existe provisão.
- **Correção:**
  - `pool.provision` = perda esperada do fundo quando o contrato entra em `defaulted`, descontada do valor da cota;
  - saque pelo menor valor da cota entre o pedido e o saque;
  - contadores `claims_paid`, `recovered` e `written_off`.

### B-A28 · O mint do tBRL não é validado (extensões do Token-2022 e congelamento) ⚪ (demo) · 🔴 (produção)
- **Status:** aberto · PIX-1, SC-3, RTO-7
- **Sintoma:** com uma stablecoin real em Token-2022:
  - **TransferFee:** o cofre recebe menos do que `deposit_balance` e o `close_lease` falha para sempre.
  - **TransferHook:** as transferências falham, porque `move_tokens` não repassa as contas extras.
  - **PermanentDelegate/Pausable:** o emissor mexe no fundo.
  - **Congelamento:** uma ordem judicial contra uma pessoa congela o `pool_vault` e trava o fundo inteiro; a conta do proprietário congelada faz o `pay_rent` falhar e a inquilina ser cobrada sem culpa.
- **Causa:** `initialize.rs:32-33` só confere o programa de token.
- **Correção:** recusar TransferFee, TransferHook, PermanentDelegate, Pausable, DefaultAccountState e ConfidentialTransfer; documentar a confiança no congelamento pelo emissor; no `pay_rent`, se a conta do proprietário estiver congelada, guardar o aluguel "a repassar" em vez de falhar.

### B-A29 · O selo pode ser trocado e congelado, travando pagamentos 🟡
- **Status:** aberto · RTO-6, SC-6, CISO-8
- **Sintoma:** o admin (ou quem roubar a chave) chama `set_badge_mint` de novo com um mint que tem congelamento ou `DefaultAccountState=Frozen`. No 3º, 6º e 12º pagamento em dia, o `mint_to` falha e o `pay_rent` inteiro é revertido: a inquilina só consegue pagar atrasada ou é cobrada. Além disso, os metadados do selo apontam para um `selo.json` que não existe (`web/public/` não existe) e podem ser trocados pelo admin.
- **Correção:** `set_badge_mint` só enquanto `badge_mint == default`; exigir `freeze_authority == None` e uma lista fechada de extensões; criar o `selo.json` e, depois do setup, passar a `updateAuthority` para `null`.

### B-A30 · A garantia termina no prazo, não na entrega das chaves; não há rescisão nem aviso de garantia esgotada 🟠
- **Status:** aberto · REG-7, REG-8, ATU-5, SC-L2
- **Sintoma:**
  - **Fim do prazo:** o keeper encerra no fim do prazo e, 15 dias depois, a caução volta. Isso acontece mesmo com a inquilina ainda no imóvel (Lei 8.245, art. 39: a garantia vale até a devolução do imóvel).
  - **Calote cedo:** num calote no 3º de 30 meses, os 21 meses seguintes são "cobrados" com R$ 0 (B-A10), e não há como rescindir.
  - **Contrato pendente:** não existe `cancel_lease` para um contrato que a inquilina nunca aceita.
  - **Aviso ao proprietário:** ele não é avisado quando a caução e a cobertura acabam, justamente o momento de pedir o despejo liminar (art. 59, §1º, IX).
  - **Termos que faltam:** reajuste anual, encargos (condomínio, IPTU), multa e juros de mora.
- **Correção:**
  - `deliver_keys` antes do `end_lease`;
  - `terminate_lease` depois de N meses cobertos;
  - `cancel_lease` para contrato `Pending`;
  - campo `guarantee_exhausted` com aviso nas telas do proprietário e da imobiliária (gancho para a notificação e a petição de despejo);
  - mostrar ao proprietário quanto de proteção ainda resta.

### B-A31 · A cobertura travada ignora o prazo restante 🟠
- **Status:** aberto · ATU-3
- **Sintoma:** num contrato de 5 meses com caução de 3 aluguéis, o fundo **nunca** paga, mas trava 3 aluguéis e cobra 8% de cada aluguel. Do mês 9 em diante de um contrato de 12 meses, a exposição é zero e a cobertura continua travada.
- **Causa:** `coverage_cap` é fixado em `create_lease.rs:64-68` e só é liberado no `close_lease`.
- **Correção:** `cap = min(3 × aluguel, teto, (períodos − espera − meses de caução) × aluguel)`; recusar a taxa (ou cobrar zero) quando `cap = 0`; opcionalmente, liberar a cobertura à medida que os meses são pagos.

### B-A32 · O keeper depende de visitantes, falha em silêncio e se sobrepõe 🟠 (🔴 em produção)
- **Status:** aberto · SRE-2, SRE-3, SRE-8, RTF-7
- **Sintoma:**
  - **Depende de visitantes:** o keeper só roda se alguém com contrato estiver com o site aberto (`useDemo.ts:269-297`). Às 3h, ninguém cobra nem devolve caução.
  - **Falha em silêncio:** os erros voltam só no JSON e o navegador os descarta (`catch {}`).
  - **Sobreposição:** `setInterval` não espera a execução anterior; N abas executam em paralelo.
  - **Lista inteira:** `lease.all()` roda a cada vez, e o laço sequencial com `await` passa do tempo limite da hospedagem, sempre deixando os mesmos contratos de fora.
  - **SOL sem controle:** o keeper cria contas com o SOL do admin, sem teto nem alerta.
- **Correção:**
  - cron único no servidor, com segredo e chave própria;
  - filtro `memcmp` por status ou indexador;
  - lote com orçamento de tempo;
  - log estruturado e alerta para mês vencido sem cobrança, erro repetido e saldo baixo de SOL.

### B-A33 · Rotas acionáveis por qualquer site, e visitas comuns drenam o SOL 🟠 (devnet)
- **Status:** aberto · CISO-3, RTF-3, RTF-5, RTF-10, CISO-9
- **Sintoma:**
  - **Chamadas de outros sites:** as rotas aceitam `POST` `text/plain` de qualquer origem. Uma página maliciosa faz os navegadores dos visitantes chamarem `preparar`, `pix/*` e `keeper`, então limite por IP não adianta.
  - **Erros crus:** `errorMessage(e)` devolve erro cru. Um `ADMIN_SECRET_KEY` mal formatado (base58 em vez de JSON) vaza cerca de 10 caracteres da chave na resposta, e um erro de arquivo expõe o caminho `/Users/…`.
  - **RPC exposto:** `/api/estado` devolve o `rpc`, o que vaza a chave de API de um RPC pago.
  - **Guard removido:** o `server-only` foi retirado (B-005).
- **Correção:** conferir `Origin`/`Sec-Fetch-Site` e exigir `Content-Type: application/json`; `DEMO_TOKEN`; mensagens genéricas, com o detalhe só no log; não devolver o `rpc`; `server-context.ts` separado para os scripts e `server-only` de volta.

### B-A34 · O RPC público da devnet congela o Palco 🟠 (demo)
- **Status:** aberto · RTF-4
- **Sintoma:** cada `useDemo` faz 10 chamadas a cada 2 s. O Palco tem duas instâncias (página e iframe), então 50 `getAccountInfo` a cada 10 s saem do mesmo IP. O limite publicado do `api.devnet.solana.com` é de cerca de 40 por método a cada 10 s (a confirmar). O RPC responde 429, o `.catch(() => {})` engole o erro e a cartela para no meio do pitch.
- **Correção:** RPC dedicado (plano gratuito do Helius ou QuickNode); `getMultipleAccountsInfo`; leitura a cada 4 s; aviso visível quando a leitura falhar.

### B-A35 · Configuração de ambiente frágil 🟠 (devnet)
- **Status:** aberto · SRE-4, SRE-5, SRE-6, RTF-6, CISO-7
- **Sintoma:**
  - `web/.demo.json` (fora do git) é lido em tempo de execução, e na hospedagem todas as rotas respondem 500.
  - O RPC do servidor (`demo.rpc`) pode divergir do RPC do navegador (`NEXT_PUBLIC_RPC_URL`) sem que nada perceba.
  - O `setup-demo.ts` ignora `ADMIN_SECRET_KEY` e pode usar outra chave que o servidor.
  - O `demo-local.sh` não recompila se o `.so` existe e não recopia o IDL, então sobe o binário velho mesmo depois de uma correção.
  - O setup sempre cria a Config com `demoMode: true`, sem olhar a rede.
- **Correção:** endereços e RPC em variáveis de ambiente, com checagem na inicialização (RPC, `config.admin`, autoridade do mint); uma única `loadAdmin()`; o script sempre roda `anchor build` e copia o IDL; `demoMode` só fora da mainnet.

### B-A37 · Código, programa e chaves só no notebook 🟠
- **Status:** aberto · CISO-4, SRE-L6
- **Sintoma:** `git ls-files` lista só 4 arquivos: `programs/`, `web/`, `scripts/` e `docs/SEGURANCA.md` estão fora do git. `target/deploy/fiador-keypair.json` e `~/.config/solana/id.json` não têm backup. Se o disco for perdido, somem o código e o endereço do programa. Também não dá para provar que o binário publicado vem deste código.
- **Correção:** commit (com a autorização do Saulo), backup cifrado das chaves fora da máquina e `solana-verify build` antes da devnet.

### B-A38 · O programa não emite eventos 🟡 (🟠 em produção)
- **Status:** aberto · CISO-6, SC-L1, RTO-L4
- **Causa:** nenhum `emit!` em `programs/fiador/src`.
- **Efeito:** nada para monitorar, conciliar ou investigar; extratos só no navegador (B-A03).
- **Correção:** `emit!` em toda movimentação de dinheiro (valor, contrato, quem assinou) e um indexador ou webhook com alertas.

### B-A39 · "Em dia" pela hora da rede, e a cobrança Pix não fica presa ao contrato 🟡 (🟠 em produção)
- **Status:** aberto · PIX-3, PIX-5, PIX-6
- **Sintoma:**
  - **Atraso do sistema vira atraso da inquilina:** um Pix pago às 23h50 do último dia da carência vira atraso ou calote se o webhook, a emissão ou o RPC atrasarem e alguém chamar `claim_default` antes.
  - **Cobrança solta:** a cobrança guarda só carteira e valor, e o valor vem do navegador (até R$ 200.000). Não há contrato, mês, CPF esperado nem validade no servidor.
  - **Arredondamento:** valores em ponto flutuante; a taxa de 8% sobre R$ 1.234,56 deixa frações de centavo.
- **Correção:**
  - o servidor calcula o valor a partir da `Lease`;
  - a cobrança leva lease, período, CPF e validade;
  - em produção, hora do Pix atestada por uma chave de conciliação (nunca a de emissão), com tolerância;
  - centavos inteiros e taxa arredondada para centavo.

### B-A40 · Dados financeiros públicos por carteira, e o produto promete o contrário 🟠 (produção)
- **Status:** aberto · LGPD-1, LGPD-2, LGPD-4, LGPD-5
- **Sintoma:**
  - **Histórico exposto:** qualquer pessoa filtra os `Lease` pela carteira da inquilina e vê o aluguel, o proprietário, cada atraso e as disputas. A carteira é ligável à pessoa (KYC, link de `/reputacao` compartilhado), e isso é dado pessoal (LGPD, art. 5º, I, e art. 12, §3º).
  - **Promessas falsas:** `lease.rs:39` ("Nenhum dado pessoal on-chain"), D-15 e a página inicial ("Seus dados fora da blockchain", `web/src/app/page.tsx:76`) prometem o contrário.
  - **Hash sem sal:** o hash do contrato não tem sal (`actions.ts:36-39`): com o texto, dá para confirmar os termos.
  - **Direitos do titular:** não há como fechar ou corrigir o perfil (art. 18).
- **Correção:**
  - **Agora:** corrigir as promessas ("dados pessoais mínimos; valores públicos na Solana").
  - **No produto:** hash com sal, `close_profile`/`correct_profile`, aceite sem perfil, consulta de reputação pelo servidor com link assinado pela inquilina.
  - **Com dinheiro real:** estudar esconder o `rent_amount`.

### B-A41 · `docs/SEGURANCA.md` afirma controles que não existem 🟡 (erro de documentação)
- **Status:** aberto · SC, CISO, RTF
- **Sintoma:**
  - item 6 fala em "cotas virtuais", que não existem;
  - item 2 fala em "proprietários diferentes", que não é conferido (`profile.rs:25`);
  - item 1 fala em "2 aluguéis pagos em dia", mas o código conta também os atrasados;
  - item 12 aparece como feito, sem eventos e sem nenhuma conta fechada;
  - item 13 fala em "quatro carteiras", mas é uma só;
  - §14 diz que os atalhos da demo não afetam o programa (B-A08 e B-A26 mostram que afetam);
  - item 8 protege os termos, mas quem tem a chave de atualização reescreve tudo.
- **Correção:** o arquivo está só na pasta principal (fora deste branch); revisar item por item contra este registro.
- **Andamento (2026-09-27):** aviso de documento histórico no topo, quadro "O que não vale mais" e marcações nos itens 1, 2, 6, 12, 13 e 14. Continua aberto até o arquivo ser reescrito ou aposentado de vez.

## Corrigidos

### B-023 · A chave do programa sumiu e o endereço mudou
- **Corrigido em:** 2026-09-28
- **Sintoma:** ao compilar, o Anchor avisou "Program ID mismatch": o código dizia `C6wuEPiedMo2hxs6DEHSxefKAEwRkKdcQucbi1DVg2wV`, mas `target/deploy/fiador-keypair.json` tinha outro endereço.
- **Causa:** a pasta `target/` foi apagada em algum momento antes de 28/09 (o motivo não foi identificado), levando a chave original. Ela não estava no git (de propósito) e não tinha cópia. O backup de 28/09 às 12:49 tentou copiar a chave e falhou em silêncio porque o arquivo já não existia; o `anchor build` seguinte criou uma chave nova.
- **Impacto:** baixo. O programa nunca foi publicado na devnet com o endereço antigo; a Solana local carrega o programa por arquivo.
- **Correção:** endereço novo `AxA7odS9fftDNCmx8QaqYiiU79mNEemTcper2VWswjp4` (`anchor keys sync`), descrição do programa (IDL) recopiada para o site e **cópia da chave em `~/Documents/Fiador-backups/fiador-keypair-AxA7.json`** (permissão 600). Antes da devnet, guardar também uma cópia cifrada fora do notebook (B-A37).
- **Como evitar:** nunca apagar `target/deploy/`; conferir que a cópia da chave existe antes de qualquer `cargo clean`.

### B-022 · "Mês" sem duração máxima travava o fundo e podia entrar em pânico (era B-A26)
- **Corrigido em:** 2026-09-28
- **Correção:** `max_period_secs` na Config (600 s na demo; no máximo 35 dias em qualquer modo), conferido no `create_lease` (`PeriodTooLong`); `due_ts` com conta verificada, sem pânico. A parte da demo aberta a qualquer visitante continua em B-A08.
- **Como testar:** `regressao_b_a26_mes_acima_do_maximo_e_recusado` (601 s, 100 anos, `i64::MAX/4`, `i64::MAX`) e `config_recusa_mes_maximo_invalido`.

### B-021 · A disputa podia ser reaberta depois de decidida (era B-A18)
- **Corrigido em:** 2026-09-28
- **Correção:** `open_dispute` exige `!dispute_resolved` (`DisputeAlreadyResolved`).
- **Como testar:** `regressao_b_a18_disputa_decidida_nao_reabre`.

### B-020 · Mês cobrado sem dinheiro deixava o proprietário sem receber (era B-A10)
- **Corrigido em:** 2026-09-28
- **Correção:** o `claim_default` guarda em `landlord_debt` o que a caução e o fundo não cobriram. Na quitação (`pay_rent` de mês `covered`), o dinheiro paga primeiro essa dívida ao proprietário, depois o fundo e por último a caução. A caução não passa mais do exigido.
- **Como testar:** `regressao_b_a10_proprietario_recebe_o_que_faltou_na_quitacao` (4 meses sem pagar, 4 quitações: o proprietário recebe R$ 8.000 e a caução volta a R$ 6.000) e `invariantes_do_dinheiro_com_eventos_aleatorios`.

### B-019 · Pagar adiantado contava como "em dia" (era B-A09)
- **Corrigido em:** 2026-09-28
- **Correção:** `pay_rent` só aceita o mês que já começou (`PeriodNotStarted`), e a reputação conta no máximo 1 pagamento em dia por janela de `min_period_secs`, somando todos os contratos (`last_on_time_ts`). Com isso, a espera do fundo (2 aluguéis pagos) também passa a exigir tempo decorrido.
- **Como testar:** `regressao_b_a09_nao_paga_mes_que_ainda_nao_comecou`.
- **Efeito nas telas:** o Palco, a tela de pagar e o console mostram "mês começa em mm:ss" em vez de oferecer o pagamento.

### B-018 · O `.gitignore` não protegia `.env` nem arquivos de chave (era B-A36)
- **Corrigido em:** 2026-09-27
- **Sintoma:** um `web/.env` com `ADMIN_SECRET_KEY` iria para o repositório público `github.com/SauloEdu/fiador-sol` no próximo `git add .`.
- **Correção:** `.env*` (com exceção de `.env.example`), `*keypair*.json` e `id.json` no `.gitignore` da raiz; `.env*` no `web/.gitignore`.
- **Arquivos:** `.gitignore`, `web/.gitignore`.
- **Como testar:** `git check-ignore -v web/.env .env target/deploy/fiador-keypair.json` mostra a regra que ignora cada um. Conferido: nenhum segredo aparece no `git status`.

### B-017 · 01-ARQUITETURA dizia que o `close_lease` repõe o fundo com a caução restante
- **Corrigido em:** 2026-09-24 (na documentação)
- **Sintoma:** a seção 3.4 dizia que a caução que sobra paga a dívida com o fundo no fechamento, e a definição de calote falava em "caução restante que repôs todo o fundo".
- **Causa:** pelo invariante I7 (dívida com o fundo > 0 ⇒ caução = 0), o `repay_pool` de `close_lease.rs:76-77` é sempre 0: o código existe, mas nunca movimenta dinheiro. O nome do teste `quem_termina_devendo_fica_marcado_e_caucao_repoe_o_pool` também engana: ele termina com R$ 2.000 de dívida sem repor nada.
- **Correção:** 01-ARQUITETURA, seções 3.4 e 9, corrigidas. **Pendente:** renomear o teste.

### B-016 · B-A11 ("danos pagos antes de repor o fundo") era falso alarme
- **Corrigido em:** 2026-09-24 (refutada pelo conselho de segurança)
- **Sintoma:** a primeira revisão registrou como 🔴 que proprietário e imobiliária combinados pediriam a caução inteira como danos antes de o fundo ser reposto.
- **Causa do erro:**
  - `claim_default.rs:72-83` usa **toda** a caução antes de o fundo pagar;
  - `pay_rent.rs:119-120` repõe o fundo **antes** da caução;
  - por isso, sempre que há dívida com o fundo, `deposit_balance = 0`, e o `open_dispute` (`amount > 0 && amount ≤ deposit_balance`) falha;
  - conferido pelo auditor com o teste `sonda_invariante_divida_pool_implica_caucao_zero` e com um passeio aleatório de 480 passos.
- **Correção:** retirada da lista de abertos. Recomendação mantida como defesa: limitar danos a `deposit_balance − pool_debt`, caso uma correção futura (B-A10, B-A16) permita a caução voltar a ter saldo com dívida no fundo.

### B-015 · 01-ARQUITETURA tratava keeper e admin como chaves separadas
- **Corrigido em:** 2026-09-24 (na documentação; o risco continua aberto em B-A15)
- **Sintoma:** a seção 8 dizia "chaves do admin e do keeper ficam só no servidor", sugerindo duas chaves, e a rota do keeper era descrita como "sem poder além disso".
- **Causa:** o keeper usa `serverContext()`, que carrega a chave do admin.
- **Correção:** seção 4 ganhou a tabela de poderes da chave do admin; seção 8 corrigida.

### B-014 · 01-ARQUITETURA descrevia errado a regra de caução pela reputação e o rendimento da demo
- **Corrigido em:** 2026-09-24 (na documentação; a divergência do rendimento continua aberta em B-A20)
- **Sintoma:** o texto dizia "12 em dia em pelo menos 2 contratos" e "rendimento igual, e 1 ano = 12 períodos".
- **Causa:** o código conta 12 em dia no total e 2 contratos **aceitos**; o "1 ano = 12 períodos" existe só na tela.
- **Correção:** seção 3.2 reescrita com a regra exata e a nota sobre o rendimento.

### B-013 · `docs/ARQUITETURA.md` dizia que o selo sai no encerramento
- **Corrigido em:** 2026-09-23
- **Sintoma:** a documentação dizia que `close_lease` emite selo; a tela final do Palco repetia isso.
- **Causa:** o plano mudou; no código, o selo sai só no `pay_rent` (3º, 6º e 12º pagamento em dia).
- **Correção:** texto corrigido em `docs/ARQUITETURA.md` e na tela.

### B-012 · Documentação afirmava que não existe limite por imobiliária
- **Corrigido em:** 2026-09-24 (na documentação; nas telas, ver B-A01)
- **Sintoma:** em 2026-09-23, durante a revisão do design, foi dito que "não existe limite de uso do fundo por imobiliária" e a linha "até 50% do fundo" saiu do canvas.
- **Causa:** a busca no código procurou nomes errados e não encontrou `agency_max_pool_bps`, que existe e é aplicado em `accept_lease` (erro `AgencyCoverageLimit`, teste `imobiliaria_nao_trava_mais_que_50_por_cento_do_pool`).
- **Correção:** Fiador Doc registra o limite corretamente (01-ARQUITETURA, seção 3.2). `docs/CRITICA-DESIGN.md` ainda tem a frase antiga e deve ser lido com esta correção.

### B-011 · O Palco destacava eventos do fundo no lugar dos eventos do contrato
- **Corrigido em:** 2026-09-23
- **Sintoma:** o cartão de destaque do Palco mostrava "Rafael pediu o resgate…".
- **Correção:** o Palco filtra só os tipos da história (contrato, caução, aluguel, quitação, cobrança, encerramento, acerto, danos, decisão).
- **Arquivos:** `web/src/app/apresentacao/page.tsx`.

### B-010 · Carimbo com a data real em vez do mês da história
- **Corrigido em:** 2026-09-23
- **Sintoma:** o recibo de agosto saía carimbado "23 DE SET".
- **Correção:** `dataCarimbo(i)` em `historia.ts` ("AGO 2026").
- **Arquivos:** `web/src/lib/historia.ts`, `web/src/app/inquilino/pagar/page.tsx`, `web/src/app/inquilino/comprovante/[i]/page.tsx`.

### B-009 · Textos técnicos da cobrança automática
- **Corrigido em:** 2026-09-23
- **Sintoma:** "Mês 2 passou da carência… O keeper acionou a cobrança".
- **Correção:** textos na linguagem da história ("Setembro passou da carência… A cobrança automática pagou o Carlos com a caução").
- **Arquivos:** `web/src/components/useDemo.ts`.

### B-008 · Transações falhavam com "Attempt to debit an account but found no record of a prior credit"
- **Corrigido em:** 2026-09-23
- **Sintoma:** criar contrato falhava depois de reiniciar a Solana local.
- **Causa:** o navegador guardava "carteiras já preparadas" de uma rede que foi apagada (`--reset`), então as carteiras estavam sem SOL.
- **Correção:** o `useDemo` chama `/api/demo/preparar` uma vez por sessão (a rota é idempotente) e de novo ao trocar de carteiras.
- **Como testar:** reiniciar a Solana local, abrir `/imobiliaria/novo` e criar o contrato.

### B-007 · `EADDRINUSE` na porta 3000
- **Corrigido em:** 2026-09-23
- **Causa:** outro servidor já usava a porta.
- **Correção:** `scripts/demo-local.sh` detecta a porta ocupada e avisa.

### B-006 · Erro de token "0x1" ilegível
- **Corrigido em:** 2026-09-23
- **Correção:** `readableError()` traduz para "Saldo de tBRL insuficiente…", e o console confere o saldo antes de enviar.
- **Arquivos:** `web/src/lib/actions.ts`.

### B-005 · Scripts `tsx` quebravam por causa do `server-only`
- **Corrigido em:** 2026-09-23
- **Correção:** removido o guard `server-only` de `web/src/lib/server.ts`; a regra "só o servidor importa" ficou em comentário.

### B-004 · Erro de sementes no `pay_rent`, causado por estouro de pilha
- **Corrigido em:** 2026-09-23
- **Causa:** contas grandes na struct de contas passavam do limite de 4 KB da pilha da Solana.
- **Correção:** contas em `Box<...>`. Regra registrada no `CLAUDE.md`: o aviso "overflows the maximum allowed frame space" não pode ser ignorado.

### B-003 · LiteSVM 0.10 com `InvalidAccountData`
- **Corrigido em:** 2026-09-23
- **Causa:** incompatibilidade com o formato novo dos programas (sbpf v3).
- **Correção:** LiteSVM 0.16, Rust 1.97.1, solana-message 4.4.1 e solana-transaction 4.1.6 com a feature blake3.

### B-002 · `CpiContext::new` esperava `Pubkey`
- **Corrigido em:** 2026-09-23
- **Correção:** passar `token_program.key()` (Anchor 1.x).

### B-001 · Instalação do `avm` lenta demais
- **Corrigido em:** 2026-09-23
- **Correção:** binário oficial do anchor 1.2.0 baixado com `gh release download`, em `~/.local/bin`.
