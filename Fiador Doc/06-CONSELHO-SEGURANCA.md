# Conselho de segurança · revisão de 2026-09-24

Dez especialistas avaliaram a arquitetura e o código do Fiador.sol, cada um pela sua lente, usando a skill `conselho-seguranca` (`.claude/skills/conselho-seguranca/`). Depois, as conclusões foram conferidas no código e consolidadas aqui. Os achados de software viraram entradas em [04-BUGS.md](04-BUGS.md); os temas de negócio, jurídicos e de processo ficam neste documento.

> A parte jurídica (seções 4.1 e 4.4) é análise preliminar para o hackathon, **não é parecer**. Cada afirmação traz o grau de certeza que o especialista deu.

| Especialista | Sigla | Lente |
|---|---|---|
| Red team on-chain | RTO | atacar o programa (6 provas de conceito que passam) |
| Red team off-chain / pentester | RTF | atacar servidor, rotas, navegador, chaves, dependências |
| CISO / arquiteto de segurança | CISO | modelo de ameaças, custódia de chaves, governança, resposta |
| Auditor de smart contract | SC | invariantes, checagens do Anchor, testes (5 sondagens que passam) |
| Engenheiro de pagamentos | PIX | Pix, MED, stablecoin, conciliação |
| Atuário / risco de crédito | ATU | solvência e preço do fundo (simulação em Python) |
| Regulação financeira e imobiliária | REG | SUSEP, CVM, Banco Central, Lei 8.245, CDC |
| Encarregado de dados (DPO) | LGPD | LGPD, dados imutáveis, cadastro de crédito |
| Compliance PLD/FT e fraude | PLD | KYC, lavagem, golpes, conluio |
| SRE / operação | SRE | keeper, RPC, deploy, incidentes |

## 1. Resumo executivo

- **Análise anterior revisada:** das 13 brechas da primeira revisão (B-A08 a B-A20), **12 foram confirmadas** (5 delas com prova de conceito que passa) e **1 foi refutada** (B-A11: a disputa de danos não consegue passar na frente do fundo; ver seção 2). Em 7 das confirmadas, a correção sugerida estava ruim ou incompleta e foi substituída.
- **Achados novos de software:** 21 (B-A21 a B-A41). **9 chegam a 🔴** em algum cenário (demo, devnet ou produção); os outros ficam entre 🟠 e 🟡. A gravidade de cada um em cada cenário está na seção 3.
- **Achados fora do software:** a tese jurídica do projeto precisa ser refeita antes da banca (seção 4.1), e o fundo tem problema de preço e de solvência (seção 4.2).

**Os cinco problemas mais graves**

1. **O golpe do conluio continua lucrativo mesmo depois das correções** (B-A24). Imobiliária, proprietário e inquilina combinados lucram cerca de **R$ 14.200 por contrato** à custa do fundo. Três especialistas chegaram a esse número por caminhos diferentes (PLD, ATU, RTO). Não há correção única: o golpe se enfrenta em camadas (tirar o incentivo, ganhar tempo, detectar rastros, identidade), descritas na **seção 8**.
2. **Uma única chave controla tudo** (B-A22), e **qualquer pessoa pode rodar `initialize` antes da equipe** (B-A21). Na devnet, quem pegar a chave (ou chegar primeiro) fica com o programa e com todo o dinheiro. Cinco especialistas apontaram o B-A21.
3. **A demo pode ser derrubada na frente da banca em cerca de 1 minuto e sem custo** (B-A26 + B-A08). Qualquer visitante vira imobiliária, emite tBRL de graça e cria contratos com "mês" de 100 anos que travam 100% do fundo. Daí em diante, o aceite da Ana falha.
4. **Reputação máxima e os 3 selos custam R$ 0,000042** (B-A23). Isso vale mesmo depois de corrigir o pagamento adiantado (B-A09).
5. **A inquilina paga duas garantias pelo mesmo contrato** (caução + taxa de 8% ao fundo que protege o proprietário). A Lei 8.245 proíbe isso (art. 37, parágrafo único; REG-1). Além disso, o fundo se parece com seguro sem autorização da SUSEP e as cotas com valor mobiliário sem registro na CVM (REG-2, REG-3).

## 2. Veredito sobre a análise anterior

| Bug | Veredito | O que muda |
|---|---|---|
| B-A02 disputa sem prazo | confirmada, 🟠 | Correção nova: prazo para decidir, direito de resposta da inquilina e, vencido o prazo, o valor disputado fica retido (não volta a nenhuma das partes). O resto da caução é liberado. (REG, PLD) |
| B-A06 Pix em memória | confirmada, 🟠 se hospedado | Em serverless, cada instância tem memória própria: a cobrança dá 404 mesmo sem reinício. (SRE, PIX, RTF) |
| B-A08 credenciamento aberto | confirmada, 🔴 | Basta abrir a página inicial para gastar SOL do admin. Correção nova: token secreto da demo (`DEMO_TOKEN`) nas rotas que usam a chave do admin, público só com leitura; em produção, verificação da empresa (KYB) e contrato de credenciamento. (RTF, CISO, PLD) |
| B-A09 pagamento adiantado | **confirmada com prova** | A correção "mês já começou" não basta (ver B-A23). Melhor: contar a espera do fundo por tempo decorrido e aceitar no máximo 1 pagamento em dia por janela de tempo e por inquilina. (SC, RTO, ATU) |
| B-A10 proprietário sem receber | **confirmada com prova** | A correção "recusar o `claim_default`" era **ruim**: o mês ficaria `open` para sempre, e o `end_lease` e a cobertura travariam. Correção nova: guardar a dívida com o proprietário (`landlord_debt`) e pagá-la primeiro na quitação. (SC, RTO) |
| B-A11 danos antes do fundo | **refutada** | Invariante I7: sempre que o fundo tem dívida a receber, a caução está zerada, e aí `open_dispute` não aceita valor nenhum. Vira falso alarme (B-016). Manter o limite `caução − dívida com o fundo` como defesa, caso uma correção futura quebre o I7. (SC; conferido no código) |
| B-A12 pedido de saque eterno | **confirmada com prova** | Só a janela de validade não resolve: pedidos escalonados entre carteiras mantêm cerca de 22% do dinheiro sempre pronto para sair. Juntar com B-A27 (provisão e saque pelo menor valor da cota). (SC, RTO, ATU) |
| B-A13 calote fora da reputação | confirmada, gravidade → 🟠 | Uma carteira nova já paga a caução máxima, então o ganho é limitado. Correção nova: contador de contratos ativos e em atraso no perfil; desconto de caução só sem outro contrato ativo; identidade fora da blockchain (B-A24). (RTO, CISO, PLD) |
| B-A14 sem pausa nem descredenciamento | confirmada, → 🔴 em produção | Sem isso não existe resposta a incidente. (CISO, SRE) |
| B-A15 keeper aberto | confirmada, → 🔴 na devnet | Ver B-A22 (chave única) e B-A32 (keeper no navegador). (CISO, RTF, SRE) |
| B-A16 calote permanente | confirmada | Correção nova: calote só pela dívida que sobrou, com validade de no máximo 5 anos (CDC, art. 43, §1º) e aviso prévio à inquilina; `pay_rent` aceito na janela de danos. (LGPD, REG, SC) |
| B-A17 fundo zerado | confirmada | "Reiniciar 1:1" era **ruim** (tira dinheiro de quem entra). Correção nova: piso de ativos; o depósito inicial nunca serve de cobertura. Perto de zero, também dá `MathOverflow`. (SC, RTO) |
| B-A18 disputa reaberta | **confirmada com prova** | Correção mantida. (SC, RTO) |
| B-A19 Pix: limite e emissão dupla | confirmada | Existe um segundo caminho para emitir duas vezes: a emissão chega à rede, a confirmação estoura o tempo e o "tentar de novo" emite outra vez. Correção nova: estado `emitindo` antes do `await`, id da cobrança no memo, teto global e `DEMO_TOKEN`. (PIX, RTF) |
| B-A20 rendimento mostrado × pago | confirmada, → 🟠 em produção | Também: o rendimento corre sem limite até alguém fechar o contrato, e a reserva acaba sem aviso. Prometer taxa fixa sem ativo por trás é publicidade enganosa (CDC, art. 37) e parece captação remunerada. (SC, ATU, REG) |

## 3. Achados novos de software (detalhe em 04-BUGS)

| Bug | Gravidade (demo · produção) | O problema | Quem viu |
|---|---|---|---|
| B-A21 | 🟡 · 🔴 (devnet 🔴) | `initialize` sem dono: quem chamar primeiro vira admin para sempre e escolhe o mint. | SRE, CISO, SC, RTO, RTF |
| B-A22 | ⚪ · 🔴 (devnet 🔴) | Uma chave só é autoridade de atualização, admin, emissora do tBRL e keeper, e o plano é colocá-la na hospedagem. | CISO, RTF |
| B-A23 | 🔴 · 🟠 | Reputação máxima e 3 selos com 12 contratos de aluguel = 1 unidade (prova de conceito). | RTO |
| B-A24 | 🟠 · 🔴 | Conluio com imobiliária credenciada lucra ~R$ 14.200 por contrato; a dívida com o fundo nunca é cobrada. | PLD, ATU, RTO |
| B-A25 | 🟡 · 🔴 | A imobiliária pode ser a própria proprietária e decidir a disputa; a inquilina não tem como responder. | PLD, CISO, SC, RTO, REG |
| B-A26 | 🔴 · 🟠 | "Mês" sem duração máxima: cobertura travada para sempre, pânico por estouro; na demo, qualquer um trava 100% do fundo (prova de conceito). | SC, RTO, RTF |
| B-A27 | 🟡 · 🔴 | O fundo só registra a perda uns 3 meses depois de ela ficar visível; quem sai antes deixa o prejuízo para quem fica. | ATU, RTO |
| B-A28 | ⚪ · 🔴 | O mint não é validado: extensões do Token-2022 e congelamento pelo emissor quebram a contabilidade ou travam cofres. | PIX, SC, RTO |
| B-A29 | 🟡 · 🟡 | O selo pode ser trocado a qualquer hora e congelado, travando o `pay_rent` no 3º, 6º e 12º pagamento. | RTO, SC, CISO |
| B-A30 | 🟡 · 🟠 | A garantia termina no prazo do contrato, não na entrega das chaves; não há rescisão, cancelamento de contrato pendente nem aviso de garantia esgotada. | REG, ATU, SC |
| B-A31 | 🟡 · 🟠 | A cobertura travada ignora o prazo restante: contratos curtos pagam 8% por uma proteção que nunca pode ser usada. | ATU |
| B-A32 | 🟠 · 🔴 | O keeper roda no navegador dos visitantes, falha em silêncio, se sobrepõe e lê todos os contratos a cada vez. | SRE, RTF |
| B-A33 | 🟠 (devnet) · — | Rotas acionáveis por qualquer site; visitas comuns drenam o SOL do admin; um terceiro bloqueia o Pix da Ana; erros crus vazam dados. | RTF, CISO |
| B-A34 | 🟠 · 🟡 | O RPC público da devnet limita as leituras e o Palco congela em silêncio no meio da apresentação. | RTF |
| B-A35 | 🟠 (devnet) · 🟠 | Configuração frágil: `.demo.json` lido em tempo de execução, RPC do servidor ≠ RPC do navegador, setup e servidor com chaves diferentes, `demo-local.sh` sobe binário velho. | SRE, RTF, CISO |
| B-A36 | 🟠 · 🟠 | O `.gitignore` não protege arquivos `.env` e o repositório é público (github.com/SauloEdu/fiador-sol). | RTF |
| B-A37 | 🟠 · 🟠 | Código, programa e chaves só no notebook: só 4 arquivos estão no git, sem backup nem build verificável. | CISO, SRE |
| B-A38 | 🟡 · 🟠 | O programa não emite eventos: nada para monitorar, conciliar ou investigar. | CISO, SC, RTO |
| B-A39 | 🟡 · 🟠 | "Em dia" decidido pela hora da rede, não pela hora do Pix; cobrança não presa a contrato nem mês; valores em ponto flutuante. | PIX |
| B-A40 | ⚪ · 🟠 | Histórico financeiro público e permanente por carteira identificável; o produto promete "dados fora da blockchain"; hash do contrato sem sal; não há como corrigir nem apagar. | LGPD |
| B-A41 | 🟡 · 🟡 | `docs/SEGURANCA.md` afirma controles que não existem (cotas virtuais, proprietários diferentes, quatro carteiras, contas fechadas, atalhos da demo sem efeito). | SC, CISO, RTF |

Erros de documentação corrigidos nesta revisão: B-016 (B-A11 era falso alarme) e B-017 (01-ARQUITETURA dizia que o `close_lease` repõe o fundo com a caução restante, o que nunca acontece).

## 4. Temas fora do software

### 4.1 Jurídico e regulatório (REG) · dono: advogado de regulação financeira

| Tema | Certeza | O que fazer |
|---|---|---|
| **Duas garantias no mesmo contrato:** a inquilina paga caução e também 8% a um fundo que protege o mesmo proprietário. A Lei 8.245, art. 37, parágrafo único, torna nula a garantia excedente, e o art. 43, II, trata a exigência como contravenção do locador. | norma: certo · enquadramento: provável | Uma única garantia da inquilina. O fundo vira "aluguel garantido", contratado e pago pelo proprietário ou pela imobiliária. |
| **Seguro sem autorização:** o fundo recebe prêmio de muitos e indeniza a inadimplência de terceiros (DL 73/1966; Lei 7.492/1986, art. 1º, parágrafo único, I). O próprio código chama a taxa de "prêmio" e de "seguro". | provável | Cobertura emitida por seguradora parceira (o fundo on-chain vira o motor de liquidação) ou sandbox SUSEP. Trocar o nome da taxa não resolve. |
| **Valor mobiliário e captação:** cotas com expectativa de retorno sobre o esforço de terceiros (Lei 6.385/1976, art. 2º, IX). A caução que "rende 10%" pago pela reserva da plataforma parece captação remunerada (Lei 4.595/1964, art. 17). | CIC: certo · captação: provável | Fundo regulado (Res. CVM 175) ou crowdfunding (Res. CVM 88, a confirmar). O rendimento da caução só pode vir de ativo real em nome da inquilina. |
| **A tese do README não se encaixa:** a cessão fiduciária de cotas (Lei 11.196/2005, art. 88) é da inquilina cedendo **as próprias** cotas de fundo regulado. Hoje as cotas são dos investidores, e a caução é tBRL. | certo | Reescrever o "Ponto jurídico": a caução é aplicada em cotas de fundo regulado em nome da inquilina e cedida ao proprietário. |
| **Caução fora da poupança** (art. 38, §2º); rendimento só sobre a parte devolvida. | certo / provável | Resolvido pela tese acima. |
| **Garantia até a entrega das chaves** (art. 39); reajuste, encargos, rescisão. | certo | B-A30. |
| **Aviso de garantia esgotada** para o proprietário pedir despejo liminar (art. 59, §1º, IX). | provável | B-A30. É o ponto em que a experiência do fundador rende mais na banca. |
| **Ativos virtuais:** Lei 14.478/2022 e Res. BCB 519/520/521 de 2025, em vigor desde 02/02/2026. Converter Pix em stablecoin exige prestadora ou instituição autorizada. | normas: certo · enquadramento: provável | Operar por parceiro autorizado, com stablecoin de emissor regulado, sem mint próprio. |
| **CDC:** tela promete rendimento que não é pago; a tela de selos diz "calote é só terminar devendo", o que contradiz o código. | provável | B-A20, B-A16. |

### 4.2 Econômico (ATU) · dono: atuário

- **Preço errado nas duas pontas** (estimativas do especialista, a calibrar com dados reais):
  - **Para a inquilina honesta, é caro:** caução + 0,96 aluguel por ano sai cerca de 0,86 aluguel por ano mais caro que a caução comum.
  - **Contra a fraude, é barato:** com calote de 3% a 15% ao ano, a sinistralidade fica entre 5% e 25% e o retorno entre 20% e 30% ao ano sobre o capital travado. Só no cenário de 30% de calote a sinistralidade sobe para 56%.
  - **Seleção adversa:** quem aceita essas condições tende a ser quem foi recusado no seguro-fiança.
- **Prêmio único para qualquer caução:** a caução de 1 aluguel transfere 2 aluguéis de risco ao fundo sem cobrar nada a mais. É preciso prêmio por faixa.
- **Faltam limites de concentração:** limite global de cobertura travada (ex.: 70% do fundo), contrato ≤ 2–5% do fundo, contadores de sinistro pago, recuperado e baixado.
- **100% do prêmio vai ao fundo:** a plataforma não tem receita.
- **Para a banca:** um slide com cenários de 3% a 30% de calote e um golpe coordenado, marcados como estimativa. A simulação usada está em `provas/` (ver seção 6).

### 4.3 Identidade, fraude e lavagem (PLD) · dono: compliance PLD/FT

- **Ninguém é identificado.** Uma carteira nova apaga o calote e tem a mesma caução de quem nunca alugou. Proposta: um atestador fora da blockchain liga o CPF a uma única carteira; o perfil ganha `verified_by`. **Não** gravar hash de CPF na blockchain, porque é reversível por força bruta.
- **O imóvel não é identificado:** abre espaço para o golpe do falso proprietário e para vários contratos cobrindo o mesmo imóvel. Guardar o hash da matrícula e aceitar um único contrato ativo por imóvel.
- **Três caminhos de lavagem:** caução que volta "limpa" com rendimento, entrada e saída rápidas do fundo, e aluguel fictício com "informe de IR" pronto. Controles: Pix só de conta com o mesmo CPF, devolução só para o mesmo CPF, regras de monitoramento M1–M6, guarda dos registros por 5 anos e comunicação ao COAF em 24 h (Lei 9.613/1998).
- **Checagem de sanções e PEP** antes do aporte (Lei 13.810/2019).
- **Imobiliária sem responsabilidade pelas perdas:** acrescentar `losses_total` na `Agency` e descredenciamento automático.

### 4.4 Proteção de dados (LGPD) · dono: encarregado de dados (DPO)

- **"Nenhum dado pessoal on-chain" é falso** quando a carteira pode ser ligada à pessoa (LGPD, art. 5º, I, e art. 12, §3º; certo). Corrigir D-15, `lease.rs:39` e a frase "Seus dados fora da blockchain" da página inicial.
- **A reputação é um cadastro de crédito:** decisão automatizada da caução sem revisão (art. 20; certo). Pode estar sujeita à Lei 12.414/2011 (a confirmar). Aviso prévio e prazo máximo de 5 anos para o registro negativo (CDC, art. 43).
- **Direitos do titular** (art. 18): criar `close_profile`, `correct_profile` e permitir aceitar contrato sem perfil (com caução máxima).
- **Documentos que faltam para operar com dados reais:** relatório de impacto (RIPD), aviso de privacidade, matriz controlador/operador, encarregado nomeado, plano de incidente (comunicar em 3 dias úteis).

### 4.5 Pagamentos (PIX) · dono: engenheiro de pagamentos

- **O desenho de produção ainda não existe no papel.** Faltam:
  - parceiro regulado que emite e resgata a stablecoin;
  - webhook com mTLS no lugar do botão "já paguei";
  - conciliação por `txid`/`endToEndId`;
  - saída para reais (off-ramp) só para o próprio CPF;
  - quarentena antes de sacar e reserva para devoluções pelo MED.
- **Pix contestado (MED) depois que o dinheiro virou cota ou aluguel:** hoje o prejuízo fica com a plataforma.
- **Pix Automático não cabe no desenho,** porque só a inquilina assina o `pay_rent`. Proposta: `pay_rent_for`, que depende de corrigir antes a B-A09.
- **Quem paga as taxas e o aluguel de contas:** hoje a inquilina paga contas que são do proprietário, e o cofre nunca é fechado.

## 5. Plano por fase (com o dono de cada item)

**Hackathon (antes da banca)**
1. ✅ Colocar `.env*` no `.gitignore` (B-A36, feito em 2026-09-27 como B-018). Fazer commit e backup cifrado das chaves (B-A37). Dono: CTO.
2. No programa, pouco código:
   - `agency ≠ landlord` (B-A25);
   - período máximo e conta de vencimento sem estouro (B-A26);
   - aluguel mínimo (B-A23);
   - espera do fundo contada em tempo e no máximo 1 pagamento em dia por janela (B-A09, B-A23);
   - `landlord_debt` (B-A10);
   - disputa não reabre (B-A18).

   Cada item com o teste de regressão tirado de `provas/`. Dono: engenheiro de smart contract.
3. `DEMO_TOKEN` nas rotas que usam a chave do admin, com o público só em leitura (B-A08, B-A19, B-A33). RPC dedicado e leitura agrupada no Palco (B-A34). Programa e fundo publicados de novo no dia, com plano B local. Dono: AppSec/backend.
4. Corrigir as promessas das telas: rendimento (B-A20), "dados fora da blockchain" (B-A40), "calote é só terminar devendo" (B-A16). Dono: produto.
5. Refazer a tese jurídica e montar os slides de regulação (seção 4.1) e de sinistralidade (seção 4.2). Donos: advogado regulatório e atuário.

**Antes da devnet pública**
- `initialize` preso à autoridade de atualização, e publicação mais inicialização num único script (B-A21).
- Quatro chaves separadas, com a de atualização fora da hospedagem (B-A22).
- Keeper por cron com segredo, chave própria e limite de gasto (B-A15, B-A32).
- Configuração por variáveis de ambiente, com checagem (B-A35).
- Pausa e descredenciamento (B-A14); eventos `emit!` (B-A38).
- Alertas de saldo de SOL, de fundo livre e de erro do keeper.
- `security.txt` e build verificável.
- Teste de invariantes I1–I8 na suíte.
- Provisão de sinistros (B-A27) e corrigir B-A12, B-A13, B-A17.

**Antes de dinheiro real**
- Auditoria externa, multisig com timelock e bug bounty.
- KYC e KYB com atestador de identidade.
- Garantia própria da imobiliária, que arca com a primeira perda (B-A24).
- Mint validado (B-A28).
- Parceiros regulados para Pix, stablecoin, seguro e fundo.
- Documentação LGPD e política de PLD.
- Preço refeito por faixa de risco.

## 6. Provas de conceito

A pasta `provas/` guarda os testes LiteSVM que os especialistas escreveram numa cópia do projeto. **Todos passam hoje**, o que prova que a brecha existe. Para rodar, cole as funções no fim de `programs/fiador/tests/test_lease.rs` e rode `cargo test --test test_lease poc_` (ou `sonda_`). Depois de cada correção, inverta as asserções para que virem testes de regressão.

| Arquivo | Testes |
|---|---|
| `provas/poc_rto.rs` | reputação fabricada com aluguel mínimo (B-A23), trava da cobertura (B-A26), período de 100 anos (B-A26), estouro em `due_ts` (B-A26), mês coberto sem dinheiro (B-A10), saída do fundo antes do calote (B-A12) |
| `provas/poc_sc.rs` | pagamento adiantado (B-A09), disputa reaberta (B-A18), mês coberto sem dinheiro (B-A10), pânico com período gigante (B-A26), invariante I7 (base da refutação de B-A11) |
| `provas/sim_fundo.py` | simulação do atuário: prêmio, perda do fundo, sinistralidade e retorno por aluguel, taxa de calote e caução (`python3 provas/sim_fundo.py`) |

**Invariantes conferidos pelo auditor**, para virar teste da suíte:

| # | Invariante |
|---|---|
| I1 | saldo do cofre do fundo ≥ `total_assets` |
| I2 | `locked_coverage` = Σ(teto − já pago) dos contratos ativos |
| I3 | a mesma soma, por imobiliária |
| I4 | saldo do cofre do contrato = `deposit_balance` |
| I5 | cotas totais = cotas do admin + cotas dos investidores |
| I6 | pedido de saque ≤ cotas |
| I7 | dívida com o fundo > 0 ⇒ caução = 0 |
| I8 | `total_assets ≥ locked_coverage` |

## 7. Divergências entre especialistas e como foram resolvidas

- **B-A11:** o red team on-chain manteve como confirmada, sem prova; o auditor refutou com o invariante I7 e um teste. Conferido no código (`claim_default.rs:72-83` usa toda a caução antes do fundo; `pay_rent.rs:119-120` repõe o fundo antes da caução). **Vale a refutação.**
- **Gravidade da B-A12:** o CISO rebaixou para 🟠 (a perda passa de um investidor para outro); o red team on-chain e o atuário mantiveram 🔴. Pela regra do conselho, fica a maior entre os de cibersegurança: **🔴**.
- **Correção da B-A08:** a primeira revisão sugeria tirar o `register_agency` da rota. O red team off-chain mostrou que isso quebra a demo para os jurados e não fecha o gasto de SOL. **Fica o `DEMO_TOKEN`.**

## 8. Antifraude: camadas contra o golpe do conluio (B-A24)

**O golpe:**
1. Imobiliária, proprietário e inquilina combinados fazem um contrato fictício.
2. A inquilina paga os 2 meses exigidos (o aluguel volta ao comparsa; só as taxas de 8% saem do grupo).
3. Ela para de pagar; a caução cobre 3 meses e o fundo cobre mais 3.
4. Lucro de cerca de R$ 14.200 por contrato de R$ 5.000. A dívida com o fundo nunca é cobrada, e a marca de calote some com uma carteira nova.

A imobiliária **não precisa ser desonesta**: basta ela não conferir quem é dono do imóvel e se alguém mora lá.

Nenhuma medida sozinha resolve. A estratégia é pôr várias camadas: a fraude precisa passar por todas, e cada uma corta um pedaço do lucro ou aumenta a chance de ser pega.

### 8.1 Camada 1 · Tirar o incentivo (funciona mesmo sem detectar nada)

| Medida | Como funciona | Efeito no golpe | Onde entra |
|---|---|---|---|
| **Cobertura que cresce com o tempo** | O fundo cobre, por exemplo, ¼ de aluguel a cada mês pago em dia, até o teto de 3. A cobertura cheia exige cerca de 12 meses pagos. | O golpista paga mais taxas e espera muito mais; os alarmes da camada 3 têm tempo de disparar. A inquilina honesta não percebe diferença. | programa (`claim_default`, `Lease`) |
| **Franquia do proprietário** | O fundo cobre 70–80% do calote e o proprietário arca com o resto, como em qualquer seguro. | Corta direto o lucro. Com a regra anterior, o lucro cai de ~R$ 14.200 em 8 meses para ~R$ 6.400 em 18 meses (conta aproximada). | programa + contrato |
| **Garantia da imobiliária (primeira perda)** | A imobiliária deposita 10–20% da cobertura que usa, consumida antes do fundo. | Ela passa a ter interesse em conferir as partes. | programa (`Agency`) + contrato de credenciamento |
| **Reputação do proprietário e da imobiliária** | Um perfil on-chain para eles também: calotes cedo, disputas e perdas do fundo. | Quem já passou por golpes recebe cobertura menor ou nenhuma. | programa (conta nova) |
| **Cobrar a dívida com o fundo** | A dívida que sobra vira título, cobrado da inquilina identificada (direito de regresso). | O golpe deixa de ser "de graça" para a inquilina-laranja. | processo + identidade |

### 8.2 Camada 2 · Ganhar tempo: o dinheiro do fundo não sai na hora

| Medida | Como funciona |
|---|---|
| **Quarentena com contestação** | O pagamento do fundo fica X dias num cofre intermediário. Qualquer investidor pode contestar com uma pequena garantia. Se procede, o pagamento é cancelado e ele recebe uma recompensa; se não procede, perde a garantia. É a "verificação otimista" usada em blockchain: os investidores, que perdem com a fraude, viram fiscais. |
| **Pagamento conforme o despejo anda** | 1º mês coberto com a notificação, 2º com a ação protocolada, 3º com a liminar ou a sentença. A impressão digital de cada documento vai para a blockchain. Isso encaixa na automação de despejo do fundador. |

### 8.3 Camada 3 · Detectar pelos rastros

| Sinal | Por que denuncia | Fonte | Custo |
|---|---|---|---|
| Calote logo depois da espera do fundo ("first payment default") | É o padrão clássico de fraude em crédito | blockchain | grátis |
| Dinheiro circulando entre as partes, ou carteiras abastecidas pela mesma origem | Comparsas misturam o dinheiro | blockchain (grafo de transações) | baixo |
| Mesmo aparelho ou mesma rede no cadastro | Os dois cadastrados do mesmo celular | app (impressão digital do aparelho) | baixo |
| Aluguel fora do preço de mercado | Aluguel inflado aumenta o saque do fundo | índices por CEP (ex.: FipeZap) | médio |
| Renda incompatível | Laranja sem renda para o aluguel | Open Finance, com consentimento | médio |
| Vínculo entre as partes | Parentesco, mesmo endereço, sociedade | bases públicas (quadro de sócios na Receita) | médio |
| Imóvel vazio | O sinal mais forte de contrato fictício | vistoria com fotos datadas e localizadas (hash on-chain), síndico ou portaria, conta de luz | médio |
| Histórico judicial | Despejos em série do mesmo proprietário | DataJud (CNJ) | médio |

Com esses sinais, uma **pontuação de risco por contrato** decide: cobertura normal, cobertura reduzida, revisão humana ou sem cobertura.

### 8.4 Camada 4 · Identidade e vigilância coletiva

- **Identidade:** CPF ligado a uma única carteira, guardado por um atestador fora da blockchain; matrícula do imóvel no contrato; um só contrato ativo por imóvel (seção 4.3).
- **Recompensa por denúncia:** uma parte do valor recuperado vai para quem aponta a fraude.
- **Painel público por imobiliária:** calotes cedo, sinistralidade e disputas. A transparência pressiona quem credencia mal.

### 8.5 Ordem sugerida

| # | Medida | Esforço | Fase |
|---|---|---|---|
| 1 | Cobertura crescente + franquia | pouco código no programa | hackathon |
| 2 | Quarentena com contestação (versão simples) | instruções novas | hackathon ou devnet |
| 3 | Alerta de calote cedo por imobiliária + reputação do proprietário | médio | devnet |
| 4 | Garantia da imobiliária + pagamento conforme o despejo | médio (programa + contrato) | antes de dinheiro real |
| 5 | Sinais externos (aparelho, preço, renda, vínculos, vistoria, DataJud) + pontuação | integrações | produção |
| 6 | Identidade verificada + cobrança da dívida | parceiro de KYC + jurídico | antes de dinheiro real |

**Para a banca:** "o fundo só paga quando o despejo está em andamento, a cobertura cresce com o bom histórico e cada pagamento do fundo pode ser contestado pelos investidores". Isso responde à pergunta "e se o dono e o inquilino combinarem?" e liga o produto à história do fundador.

## 9. Medidas para depois (plano ampliado)

A seção 5 lista o mínimo por fase. Aqui está o plano completo do que fazer depois do hackathon, por área. Entre parênteses, o profissional dono de cada área (ver o quadro no fim).

### 9.1 Programa na Solana (engenheiro de smart contract + auditor)
- Todas as correções de B-A09 a B-A41, cada uma com teste de regressão tirado de `provas/`.
- **Teste de invariantes** I1–I8 rodando em toda mudança, e **fuzzing** (teste com entradas aleatórias; ex.: Trident, a ferramenta de fuzzing para Anchor).
- **Versão nas contas** (campo `version`) e instrução de migração, porque um programa não se "desfaz": muda-se com migração.
- **Timelock** em qualquer mudança de parâmetro da Config, com evento público antes de valer.
- **Fechar contas** encerradas e devolver o SOL de aluguel a quem pagou (`Lease`, cofre, `Position` zerada).
- **Limites por imobiliária** em valor absoluto, não só em %; limite global de cobertura travada; contrato ≤ 2–5% do fundo.
- **Cobertura crescente, franquia, garantia da imobiliária, quarentena com contestação** (seção 8).
- **`pay_rent_for`** (pagamento por terceiro ou Pix Automático), só depois de B-A09.
- **Verificação formal** das regras de dinheiro, quando houver orçamento (prova matemática de que os invariantes sempre valem).
- **Auditoria externa** antes de dinheiro real e a cada versão que mexa em dinheiro.

### 9.2 Servidor, site e infraestrutura (AppSec + SRE)
- Porta de autenticação em todas as rotas; login real (e-mail com carteira embutida) em produção.
- **Firewall de aplicação e limite de requisições** na borda (ex.: firewall da hospedagem ou Cloudflare).
- **Cofre de segredos** com rotação periódica das chaves quentes (trimestral) e registro de quem acessou.
- **Banco de dados** para cobranças, eventos e limites, com backup diário e restauração testada.
- **Indexador** dos eventos do programa (ex.: webhooks do Helius) substituindo o `lease.all()`.
- **Monitoramento:**
  - saldo de SOL do admin e do keeper;
  - fundo livre;
  - reserva de rendimento;
  - erros do keeper;
  - contratos vencidos sem cobrança;
  - pagamentos do fundo acima do normal.

  Alertas por Telegram ou e-mail.
- **Logs estruturados** sem dado pessoal, guardados por 5 anos quando forem registros de operação (Lei 9.613).
- **Página de status** e plano B da demo (vídeo gravado + rede local pronta).
- Cabeçalhos de segurança (CSP, HSTS), `npm ci --ignore-scripts`, `cargo audit` e `npm audit` na integração contínua (CI).
- **Build verificável** (`solana-verify`) e hash do commit publicado no README a cada deploy.

### 9.3 Chaves e governança (CISO)
- Quatro chaves separadas agora; **multisig** (ex.: Squads) com timelock de 48–72 h para atualização e admin; `--final` quando o código congelar.
- Política escrita de chaves: quem guarda, onde, como rotaciona, o que fazer se vazar.
- **`security.txt`** no site e no programa (`solana-security-txt`), com canal de contato de segurança.
- **Bug bounty** (ex.: Immunefi) a partir de dinheiro real.
- **Teste de invasão** anual por empresa independente.
- **Simulação de incidente** a cada semestre: exercício em sala ("e se a chave vazar?", "e se o fundo for drenado?").

### 9.4 Antifraude e identidade (compliance PLD/FT + fraude)
- Tudo da seção 8, na ordem da 8.5.
- Parceiro de KYC/KYB (identidade de pessoas e empresas) e atestador de identidade fora da blockchain.
- Lista de observação interna (carteiras, CPFs e imobiliárias suspeitos) e revisão humana acima de uma pontuação de risco.
- Política de PLD escrita, responsável designado, comunicação ao COAF e checagem de sanções e PEP.
- Contrato de credenciamento com responsabilidade da imobiliária por fraude e cláusula de regresso.

### 9.5 Dados pessoais (DPO)
- RIPD (relatório de impacto), aviso de privacidade, termos de uso e matriz de papéis (controlador e operador).
- `close_profile`, `correct_profile`, aceite sem perfil, prazo de validade do calote e aviso prévio antes do registro.
- Hash do contrato com sal; reputação consultada pelo servidor e com link assinado pela inquilina.
- Encarregado nomeado, canal do titular e plano de incidente (comunicar em 3 dias úteis).

### 9.6 Pagamentos (engenheiro de pagamentos)
- Parceiro regulado de Pix e stablecoin; webhook com mTLS; conciliação diária; off-ramp só para o próprio CPF.
- Quarentena antes de sacar e reserva para devoluções pelo MED.
- Hora do Pix atestada por uma chave de conciliação separada.
- Escolha da stablecoin com análise do emissor (congelamento, extensões).

### 9.7 Produto e negócio (atuário + fundador)
- **Preço por faixa de risco,** com a taxa separada da receita da plataforma (hoje 100% vai ao fundo).
- **Lâmina do investidor** com retorno em cenário base e em estresse; painel público de sinistralidade.
- **Piloto controlado:** 1 ou 2 imobiliárias conhecidas, fundo pequeno, teto por contrato baixo, revisão mensal dos números.
- **Seguros da própria empresa:** responsabilidade civil e risco cibernético.

### 9.8 Jurídico (advogado regulatório)
- Parecer formal sobre SUSEP, CVM, Banco Central e Lei 8.245, e a decisão entre sandbox e parcerias (seguradora, administrador de fundo, prestadora de ativos virtuais).
- Reescrever a tese: caução em cotas de fundo regulado cedidas ao proprietário; o fundo vira "aluguel garantido" do proprietário.
- **Contrato-modelo de locação:**
  - cláusulas on-chain e autorização de levantamento;
  - vistoria;
  - garantia até a entrega das chaves;
  - reajuste e encargos.
- Termos de uso para inquilina, proprietário, imobiliária e investidor.

### 9.9 Quadro de responsáveis

| Área | Profissional | Quando contratar ou envolver |
|---|---|---|
| Programa | engenheiro de smart contract Solana | já (equipe) |
| Programa | auditoria externa | antes de dinheiro real |
| Servidor e site | AppSec / backend | já |
| Operação | SRE / DevOps | devnet pública |
| Chaves e governança | CISO (em equipe pequena, o CTO) | já |
| Antifraude e PLD | compliance PLD/FT | antes de usuários reais (em geral vem com o parceiro de Pix) |
| Dados | DPO / advogado de LGPD | antes de usuários reais |
| Pagamentos | engenheiro de pagamentos + parceiro regulado | antes de dinheiro real |
| Preço e fundo | atuário | antes de abrir o fundo a investidores |
| Regulação | advogado de regulação financeira | já (tese para a banca), parecer formal antes de lançar |
