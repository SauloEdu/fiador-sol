# Catálogo de funções

Atualizado em 2026-09-24. **Toda** função, rota, instrução e tela do software deve aparecer aqui. Ao criar, mudar ou remover algo, atualize a linha.

## 1. Programa na Solana (`programs/fiador/src/`)

| Instrução | Quem assina | O que faz | Regras que o programa confere |
|---|---|---|---|
| `initialize(params, initial_pool_deposit)` | admin | Cria a Config, o fundo (com depósito inicial permanente) e a reserva de rendimento. | Parâmetros válidos; em produção, mês de pelo menos 28 dias; só uma vez. |
| `register_agency(authority)` | admin | Credencia uma imobiliária. | Só o admin. |
| `init_profile()` | inquilina | Cria o perfil de reputação. | Um por carteira. |
| `create_lease(lease_id, terms)` | imobiliária + proprietário | Registra o contrato (aluguel, duração do período, nº de meses, impressão digital do PDF) e copia as regras da Config. | Imobiliária ativa; proprietário ≠ inquilina; imobiliária ≠ parte; período ≥ mínimo; prazo válido; cobertura ≤ teto. |
| `accept_lease()` | inquilina | Guarda a caução no cofre (3/2/1 aluguéis pela reputação) e reserva a cobertura no fundo. | Carteira certa; perfil existe; tokens da própria inquilina; fundo com cobertura livre; imobiliária ≤ 50% do fundo; só uma vez. |
| `pay_rent()` | inquilina | Paga o próximo mês em aberto: aluguel ao proprietário e taxa ao fundo. Num mês `covered`, repõe o fundo e depois a caução. Emite o selo aos 3, 6 e 12 em dia. | Não paga além do prazo; em dia ou com atraso, conforme o relógio. |
| `claim_default()` | qualquer um (o keeper) | Cobra o primeiro mês vencido além da carência: a caução paga o proprietário e, se faltar, o fundo cobre. | Só depois da carência; o fundo só entra após 2 aluguéis pagos e até o teto do contrato; não cobra o mesmo mês duas vezes. |
| `end_lease()` | qualquer um (o keeper) | Fim do prazo: abre a janela de danos. | Prazo terminado; nenhum mês vencido sem pagamento nem cobrança. |
| `open_dispute(amount)` | proprietário | Pede um valor de danos da caução; o contrato vai para `disputed`. | Contrato em `ending`; dentro da janela; valor > 0 e ≤ saldo da caução. |
| `resolve_dispute(award)` | imobiliária | Decide quanto da caução vai ao proprietário e paga na hora. | Só a imobiliária do contrato; contrato em `disputed`; valor ≤ pedido e ≤ saldo da caução. Não há prazo para decidir (ver 04-BUGS.md, B-A02). |
| `close_lease()` | qualquer um (o keeper) | Acerto final: repõe o fundo, devolve caução + rendimento à inquilina, libera a cobertura e atualiza a reputação (quem termina devendo recebe um calote). | Janela fechada ou decisão tomada; rendimento limitado ao saldo da reserva. |
| `open_position()` | investidor | Cria a posição no fundo. | Uma por carteira. |
| `pool_deposit(amount)` | investidor | Aporta tBRL e recebe cotas. | Valor > 0; depósito minúsculo não rouba cotas. |
| `request_withdraw(shares)` | investidor | Pede saque de cotas (inicia o aviso prévio). | Cotas ≤ posição. |
| `pool_withdraw()` | investidor | Saca depois do aviso prévio. | Aviso cumprido; valor ≤ parte livre do fundo. |
| `set_badge_mint()` | admin | Registra o mint do selo "Bom Pagador". | Token-2022, intransferível, 0 casas, autoridade = Config. |

Erros (mensagens em português) em `src/errors.rs`. Os 46 testes em `tests/test_lease.rs` cobrem os caminhos principais de cada regra acima. **Não** cobrem as brechas B-A09 a B-A41 nem os ramos listados pelo conselho em [06-CONSELHO-SEGURANCA.md](06-CONSELHO-SEGURANCA.md) (ex.: `end_lease` em `pending`, `set_badge_mint` por quem não é admin, programa de token trocado, depósito zero no fundo).

## 2. Servidor

### Rotas (`web/src/app/api/`)

| Rota | Arquivo | Descrição |
|---|---|---|
| `GET /api/estado` | `api/estado/route.ts` | Rede, programa, mint do tBRL e do selo. |
| `POST /api/demo/preparar` | `api/demo/preparar/route.ts` | SOL de taxa, credenciamento da imobiliária, conta de tBRL do proprietário. |
| `POST /api/pix/cobranca` | `api/pix/cobranca/route.ts` | Cria a cobrança Pix simulada `{ carteira, valor }`. |
| `POST /api/pix/confirmar` | `api/pix/confirmar/route.ts` | Paga a cobrança: emite tBRL na carteira `{ id }`. |
| `POST /api/keeper` | `api/keeper/route.ts` | Cobrança automática: `claim_default`, `end_lease`, `close_lease`. |

### `web/src/lib/server.ts` (só servidor)

| Função | O que faz |
|---|---|
| `loadAdmin()` | Lê a chave do admin (`ADMIN_SECRET_KEY` ou arquivo). |
| `loadDemo()` | Lê `web/.demo.json` (rede, programa, mints). |
| `serverContext()` | Conexão, admin, cliente do programa e mints prontos. |
| `chainNow(connection)` | Relógio da Solana. |
| `isLocal(rpc)` | Diz se a rede é local. |
| `withinLimit(chave, valor, max)` | Limite de valor por hora do Pix simulado. |
| `json(dados, status)` | Resposta JSON. |
| `errorMessage(e)` | Mensagem legível de erro. |

### `web/src/lib/pix.ts`

| Função | O que faz |
|---|---|
| `criarCobranca(carteira, valor)` | Gera id e código "copia e cola" fictício e guarda em memória. |
| `buscarCobranca(id)` | Busca a cobrança. |

## 3. Bibliotecas do site (`web/src/lib/`)

### `actions.ts` (transações)

| Função | Instrução | Quem assina |
|---|---|---|
| `createLease(conn, imob, prop, inquilina, id, aluguel, meses, duração)` | `create_lease` | imobiliária + proprietário |
| `acceptLease(conn, inquilina, lease, agency, addrs)` | `init_profile` (se preciso) + `accept_lease` | inquilina |
| `payRent(conn, inquilina, lease, proprietário, addrs)` | `pay_rent` | inquilina |
| `openDispute(conn, proprietário, lease, reais)` | `open_dispute` | proprietário |
| `resolveDispute(conn, imob, lease, proprietário, reais, addrs)` | `resolve_dispute` | imobiliária |
| `poolDeposit(conn, investidor, reais, addrs)` | `open_position` (se preciso) + `pool_deposit` | investidor |
| `requestWithdraw(conn, investidor, cotas)` | `request_withdraw` | investidor |
| `poolWithdraw(conn, investidor, addrs)` | `pool_withdraw` | investidor |
| `tokenBalance(conn, mint, dono, token2022?)` | leitura de saldo | — |
| `readableError(e)` | traduz erro do programa ou da rede | — |

### Outros

| Arquivo | Funções |
|---|---|
| `constants.ts` | `PROGRAM_ID`, `RPC_URL`, `CLUSTER`, `DECIMALS`, `UNIT`, `DEMO`, `explorerTx(sig)`, `explorerAddress(addr)` |
| `format.ts` | `toUnits(reais)`, `fromUnits(v)`, `brl(v)`, `short(addr)` |
| `pdas.ts` | `configPda`, `poolPda`, `poolVaultPda`, `yieldReservePda`, `agencyPda`, `profilePda`, `positionPda`, `leasePda`, `vaultPda` |
| `program.ts` | `keypairWallet(kp)`, `getProgram(conn, carteira)` |
| `historia.ts` | `PESSOAS`, `IMOVEL`, `nomeMes(i)`, `anoMes(i)`, `Mes(i)`, `dataCarimbo(i)`, `vencimento(l, i)`, `celula(l, i, agora)`, `proximoAPagar(l)`, `taxa(l)`, `mesesDeCaucao(perfil)`, `rendimento(l, agora)`, `mmss(s)`, `momento(l, agora)` |

## 4. Estado e componentes (`web/src/components/`)

| Arquivo | Exporta | O que faz |
|---|---|---|
| `useDemo.ts` | `useDemo()`, `agoraChain(snap)`, tipos `LeaseView`, `Snapshot`, `Evento`, `TipoEvento`, `Papel` | Carteiras de teste, preparação por sessão, leitura da Solana a cada 2 s, keeper a cada 5 s, eventos persistidos e sincronizados entre abas, `executar()` (devolve a assinatura), `novoContrato()`, `novaDemo()`. |
| `DemoProvider.tsx` | `DemoProvider`, `useD()`, `useTick(ms)` | Compartilha o `useDemo` numa área e re-renderiza para contagens regressivas. |
| `PixFluxo.tsx` | `PixFluxo` | Pix no padrão dos bancos; chama `/api/pix/*` e avisa quando pago. |
| `DemoConsole.tsx`, `Pix.tsx` | `DemoConsole`, `Pix` | Console técnico antigo (`/demo`). |

## 5. Componentes visuais (`web/src/ui/index.tsx`)

`COR` (paleta), `Icone`, `reais()` (formata R$), `Valor` (saldo com R$ e centavos menores; `inteiro` em documentos; `oculto`), `Txt`, `Forte`, `H1`, `H2`, `Rotulo`, `Linha`, `Cartao`, `Documento` (papel serrilhado), `Autenticacao` (registro público), `Botao`, `LinkBotao`, `Banda` (cabeçalho escuro com olho e avisos), `Barra` (barra de título), `Atalhos`, `Mov` + `Extrato` + `Dia` (extrato), `Abas`, `App`, `Pad`, `Carimbo` (com animação), `Selo`, `Cartela`, `Estado` (sucesso, erro, processando), `Passos`, `Alerta` (fatura vencida), `Nota`, `Segmento`.

## 6. Telas (`web/src/app/`)

### Hooks de dados por área

| Arquivo | Hook | Calcula |
|---|---|---|
| `inquilino/dados.ts` | `useInquilino()`, `ABAS` | Aluguel, taxa, próximo mês, vencimento, carência, atraso, cofre, rendimento, cartela, movimentações da conta e do cofre. |
| `proprietario/dados.ts` | `useProprietario()` | Saldo, recebidos, proteção (cofre + fundo após 2 pagos), cartela do dono, janela de danos, movimentações. |
| `investidor/dados.ts` | `useInvestidor()`, `numCotas`, `mmss`, `MENU`, `RESGATE_PEDIDO`, `RESGATE_CONCLUIDO` | Valor da cota, posição, parte livre do fundo, variação, extrato. |

### Páginas

| Rota | Arquivo | Faz |
|---|---|---|
| `/` | `page.tsx` | Página inicial com o celular ao vivo, como funciona, públicos, segurança, perguntas. |
| `/apresentacao` | `apresentacao/page.tsx` | Palco com o botão "Avançar" (cria contrato, caução, paga, espera o atraso, quita) e Pix automático. |
| `/inquilino` | `inquilino/page.tsx` | Início: convite, em dia, carência, atraso, pago pela caução, vistoria, fim; olho de ocultar valores. |
| `/inquilino/aceitar` | `inquilino/aceitar/page.tsx` | Convite → Pix da caução → processando → caução lacrada (`?ver=1` só mostra o contrato). |
| `/inquilino/pagar` | `inquilino/pagar/page.tsx` | Revisar → Pix → processando → comprovante (ou erro). |
| `/inquilino/extrato` | `inquilino/extrato/page.tsx` | Extrato "Sua conta" e `?conta=cofre`. |
| `/inquilino/comprovante/[i]` | `inquilino/comprovante/[i]/page.tsx` | Comprovante do mês i. |
| `/inquilino/caucao` | `inquilino/caucao/page.tsx` | Saldo do cofre, rendimento, movimentações. |
| `/inquilino/selos` | `inquilino/selos/page.tsx` | Progresso dos selos e regra da caução. |
| `/inquilino/conta` | `inquilino/conta/page.tsx` | Conta, segurança, ajuda, recomeçar a demonstração. |
| `/proprietario` e subpáginas | `proprietario/**/page.tsx` | Início, extrato, comprovante, contrato e informe de IR, danos, conta. |
| `/imobiliaria` | `imobiliaria/page.tsx` | Carteira (contrato real + exemplos marcados). |
| `/imobiliaria/novo` | `imobiliaria/novo/page.tsx` | Cria o contrato na Solana. |
| `/imobiliaria/contrato` | `imobiliaria/contrato/page.tsx` | Cartela, eventos, proteção e decisão de danos. |
| — | `imobiliaria/casca.tsx`, `imobiliaria/mini.tsx` | Moldura (`Casca`) e mini-cartela (`Mini`, `simbolos`, `Legenda`). |
| `/investidor` e subpáginas | `investidor/**/page.tsx`, `investidor/Casca.tsx` | Posição, aportar, resgatar, documentos. |
| `/reputacao/[carteira]` | `reputacao/[carteira]/page.tsx` + `Historico.tsx` | Histórico público da carteira. |
| `/demo` | `demo/page.tsx` | Console técnico antigo. |

## 7. Scripts

| Script | O que faz |
|---|---|
| `scripts/demo-local.sh` | Liga a Solana local com o programa, prepara a demo e abre o site. |
| `web/scripts/setup-demo.ts` (`npm run setup`) | Cria o tBRL e o selo, inicializa o protocolo com os parâmetros da demo e grava `web/.demo.json`. |
| `web/scripts/e2e.ts` | Teste de ponta a ponta do fluxo completo (~5 min). |
