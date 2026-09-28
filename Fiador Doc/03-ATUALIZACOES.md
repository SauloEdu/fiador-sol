# Histórico de atualizações

Da mais nova para a mais antiga. **Toda mudança no software ganha uma entrada aqui** (modelo no README). As entradas anteriores a 2026-09-24 foram reconstruídas a partir das conversas de construção.

## 2026-09-28 · Pedido de saque com prazo (B-A12)
- **Quem:** Claude Opus 5.5
- **O quê:** o pedido de saque do fundo vale só por uma janela do tamanho do aviso prévio. Antes, um pedido antigo ficava pronto para sempre, e o investidor saía no instante em que via um calote chegando. A tela do investidor mostra o prazo e o pedido vencido.
- **Arquivos:** `programs/fiador/src/{errors.rs,instructions/pool_ops.rs}`, `programs/fiador/tests/test_lease.rs`, `web/src/app/investidor/{dados.ts,resgatar/page.tsx}`, `web/src/idl/*`, Fiador Doc 02, 03 e 04.
- **Verificação:**
  - `cargo test` 67/67;
  - `tsc` sem erros;
  - programa atualizado na Solana local;
  - no navegador: aporte de R$ 5.000, pedido de resgate, contagem do aviso prévio, "concluir em até 0:21" e, depois, "O pedido de resgate venceu".
- **Pendências:** B-A27 (provisão de sinistros).

## 2026-09-28 · Pronto para a devnet e Pix sem emissão dupla
- **Quem:** Claude Opus 5.5
- **O quê:**
  - `scripts/publicar-devnet.sh`: confere o saldo, compila, testa, publica o programa com o admin como autoridade de atualização, roda o `setup` na devnet (`.demo.devnet.json`) e mostra as variáveis para hospedar;
  - o servidor aceita `DEMO_CONFIG` (hospedagem sem arquivo) e `DEMO_FILE`;
  - o `setup` imprime a linha `DEMO_CONFIG`;
  - Pix simulado sem emissão dupla (B-A19 → B-027);
  - README do projeto reescrito: o que está pronto, segurança e ponto jurídico refeito conforme o conselho (06, seção 4.1).
- **Por quê:** último passo antes da devnet; os jurados leem o README primeiro.
- **Arquivos:** `scripts/publicar-devnet.sh`, `web/scripts/setup-demo.ts`, `web/src/lib/{server,pix}.ts`, `web/src/app/api/pix/confirmar/route.ts`, `web/.gitignore`, `README.md`, Fiador Doc 03 e 04.
- **Verificação:**
  - `tsc` sem erros;
  - sintaxe do script conferida;
  - teste do Pix com duas confirmações simultâneas (uma emissão só) e chamada de outro site recusada.
- **Pendências:**
  - **SOL de teste na devnet:** a torneira pela linha de comando recusou por limite; é preciso pegar em https://faucet.solana.com (login do Saulo no GitHub) para a carteira `3xM9TNYuY1dRUjbdePg3oBL5gvHHgwHCZELZG9NK2ws5` e rodar o script;
  - hospedar o site (precisa de conta do Saulo, por exemplo na Vercel).

## 2026-09-28 · Resposta a golpe no programa, Central de risco e demo protegida
- **Quem:** Claude Opus 5.5 (meta do Saulo: construir o app até ficar pronto, com commits e pushs autorizados)
- **O quê:**
  - **Programa, 5 instruções novas:** pausa de emergência, suspensão de imobiliária e quarentena do pagamento do fundo, com congelar, cancelar e liberar.
  - **Programa, outras mudanças:** `initialize` preso a quem publicou o programa (B-A21); eventos nas movimentações principais (B-A38); rendimento com a mesma conta da tela e sem correr depois do prazo (B-A20).
  - **Site:** Central de risco (`/risco`) e atalho "E se for golpe?" no Palco; senha da demo (`DEMO_TOKEN`) nas rotas que usam a chave do admin; recusa de chamadas de outros sites; a cobrança automática libera a quarentena e diz de onde saiu cada pagamento.
  - **Textos:** limite de 50% por imobiliária na tela (B-A01); textos honestos sobre rendimento, dados e calote.
- **Por quê:** itens 2, 4 e 5 do painel, prioridades 3 e 4 da banca (08, seção 6) e o que falta antes da devnet (06, seção 5).
- **Arquivos:**
  - programa: `programs/fiador/src/{lib.rs,events.rs,errors.rs,state/{config,lease}.rs,instructions/{emergency,initialize,claim_default,close_lease,create_lease,accept_lease,pool_ops,pay_rent,mod}.rs}`, `programs/fiador/tests/test_lease.rs`;
  - site: `web/src/{lib/{api,server,historia,constants}.ts,components/{SenhaDemo.tsx,useDemo.ts,Pix.tsx,PixFluxo.tsx},app/{risco/**,api/{admin,keeper,estado,demo/preparar,pix/cobranca,pix/confirmar}/route.ts,apresentacao/{page.tsx,palco.module.css},imobiliaria/casca.tsx,inquilino/**,page.tsx}}`, `web/scripts/{setup-demo,e2e}.ts`, `web/src/idl/*`;
  - `scripts/demo-local.sh`, `CLAUDE.md`, `web/README.md`;
  - Fiador Doc: 00, 01, 02, 04, 05 (D-17, D-18), 06, 08.
- **Verificação:**
  - `cargo test` 66/66, sem aviso de pilha;
  - `tsc` sem erros;
  - Solana local com `--upgradeable-program`: o `setup` achou a autoridade sozinho, e o `e2e.ts` passou;
  - atualização do programa em vigor com `solana program deploy --upgrade-authority` (sem apagar a rede);
  - no navegador: Central de risco pausou, retomou, suspendeu e reativou a imobiliária, e cada ação apareceu com o link do registro na Solana.
- **Checklist de segurança:**
  - instruções de admin com `has_one = admin`;
  - a liberação (`release`) é pública, mas só depois do prazo e sem congelamento;
  - o dinheiro em quarentena nunca sai do cofre do fundo;
  - o layout de `Config` e `Lease` mudou (nova inicialização em redes já existentes);
  - a senha da demo nunca vai ao código do navegador (só `localStorage` de quem apresenta).
- **Pendências:**
  - contestação por investidores;
  - `set_admin` em duas etapas;
  - eventos em aporte e saque;
  - estado `emitindo` no Pix (B-A19);
  - publicar na devnet.

## 2026-09-28 · Antifraude no programa: cobertura crescente e franquia
- **Quem:** Claude Opus 5.5
- **O quê:** primeira camada antifraude contra o golpe do conluio (B-A24; 06, seção 8.1). O fundo cobre ¼ de aluguel a cada aluguel pago, até 3 aluguéis, e paga 80% do que faltar. A franquia de 20% fica como dívida da inquilina com o proprietário (`landlord_debt`), paga primeiro na quitação. As telas passaram a mostrar a cobertura liberada até agora.
- **Por quê:** item 4 do painel e prioridade 1 da banca (08, seção 6). Pedido do Saulo para seguir a construção.
- **Arquivos:**
  - programa: `programs/fiador/src/{state/{config,lease}.rs,instructions/{initialize,create_lease,claim_default}.rs}`, `programs/fiador/tests/test_lease.rs`;
  - site: `web/src/idl/*`, `web/src/components/{useDemo.ts,DemoConsole.tsx}`, `web/src/lib/historia.ts`, `web/src/app/{proprietario/{dados.ts,page.tsx},imobiliaria/{page.tsx,contrato/page.tsx},apresentacao/page.tsx}`, `web/scripts/setup-demo.ts`;
  - Fiador Doc: 00, 01, 02, 04, 05 (D-16), 06, 08.
- **Verificação:**
  - `cargo test` 59/59, com 4 testes novos. Um teste antigo (`quem_pediu_saque_ainda_absorve_o_calote`) foi ajustado: pela regra nova, quem nunca pagou não libera cobertura;
  - `tsc` sem erros;
  - Solana local reiniciada, `setup` e `e2e.ts` passaram (proprietário R$ 8.000, inquilina R$ 11.520, perfil 3 em dia e 1 calote).
  - as 9 rotas principais respondem 200;
  - no navegador, o Palco criou o contrato, guardou a caução e pagou agosto, sem erro no console.
- **Ajuste na tela da inquilina:** o cartão do aluguel na tela inicial (`/inquilino`) mostra "dá para pagar a partir de… daqui a mm:ss" enquanto o mês não começou, em vez do botão "Pagar com Pix" (`inquilino/dados.ts`: `comecaEm`).
- **Checklist de segurança:**
  - nenhuma instrução nova;
  - o layout de `Config` e `Lease` mudou (nova inicialização em qualquer rede);
  - conta em `u128`, sem estouro;
  - a cobertura travada no aceite continua sendo o teto (conservador).
- **Pendências:**
  - `pause`, `suspend_agency` e quarentena;
  - garantia da imobiliária;
  - commit e push aguardando autorização.

## 2026-09-28 · Primeiro lote de correções de segurança no programa
- **Quem:** Claude Opus 5.5
- **O quê:** seis brechas do conselho de segurança corrigidas no programa, cada uma com teste de regressão:
  - **B-A09:** só paga mês que já começou; a reputação conta no máximo 1 pagamento em dia por janela de tempo, somando todos os contratos (`last_on_time_ts`).
  - **B-A10:** o que a caução e o fundo não cobrem vira `landlord_debt`, paga primeiro ao proprietário na quitação.
  - **B-A18:** disputa decidida não reabre.
  - **B-A23 (em parte):** aluguel mínimo na Config (`min_rent_amount`).
  - **B-A25 (em parte):** imobiliária não pode ser a proprietária.
  - **B-A26:** mês máximo na Config (`max_period_secs`, até 35 dias) e vencimento com conta verificada.

  Ajustes no site:
  - o Palco, a tela de pagar e o console mostram "mês começa em mm:ss" em vez de oferecer pagamento adiantado;
  - `setup-demo.ts` passa os parâmetros novos (600 s e R$ 100);
  - `e2e.ts` espera cada mês começar.
- **Incidente:** a chave do programa tinha sumido antes de hoje. O endereço mudou para `AxA7odS9fftDNCmx8QaqYiiU79mNEemTcper2VWswjp4`, e a chave nova foi copiada para `~/Documents/Fiador-backups/` (B-023). Impacto baixo: nunca houve publicação na devnet.
- **Também:**
  - primeiro commit do código (`4515e52`);
  - backup do projeto em `~/Documents/Fiador-backups/backup-antes-correcoes-2026-09-28.tgz`;
  - `.claude/worktrees/` no `.gitignore`.
- **Por quê:** item 2 do plano do hackathon (06, seção 5); pedido do Saulo para começar a construção do app.
- **Arquivos:**
  - programa: `programs/fiador/src/{errors.rs,lib.rs,state/{config,lease,profile}.rs,instructions/{initialize,create_lease,pay_rent,claim_default,end_lease,dispute}.rs}`, `programs/fiador/tests/test_lease.rs`, `Anchor.toml`;
  - site: `web/src/idl/*`, `web/src/lib/historia.ts`, `web/src/app/apresentacao/page.tsx`, `web/src/app/inquilino/pagar/page.tsx`, `web/src/components/DemoConsole.tsx`, `web/scripts/{setup-demo,e2e}.ts`, `web/README.md`;
  - Fiador Doc: 00, 01, 02, 04, 06, 07, 08.
- **Verificação:**
  - `cargo test` 55/55 (46 antigos + 8 regressões + invariantes com eventos aleatórios);
  - build sem aviso de pilha;
  - `clippy` sem avisos no programa (só avisos de estilo nos testes);
  - `tsc --noEmit` sem erros;
  - Solana local reiniciada com o programa novo e `setup` concluído;
  - `e2e.ts` no relógio real: 3 meses em dia (1 selo), 4º mês cobrado da caução, proprietário com R$ 8.000, acerto final devolvendo R$ 4.000, perfil com 3 em dia e 1 calote;
  - o primeiro `e2e` falhou com `PeriodNotStarted`, porque o relógio da rede anda segundos atrás do computador. O script passou a esperar pelo relógio da rede (as telas já usavam o relógio da rede).
- **Checklist de segurança (07, seção 10):**
  - nenhuma instrução nova;
  - nenhuma chave nova no navegador;
  - erros novos no fim da lista, sem mudar os códigos antigos;
  - o layout das contas mudou (`Config`, `Lease`, `TenantProfile`), o que exige inicializar de novo qualquer rede (feito na local).
- **Pendências:**
  - B-A23: trocar contratos iniciados por concluídos;
  - B-A25: resposta da inquilina à disputa;
  - próximos itens do plano: cobertura crescente + franquia, `pause`/`suspend_agency`/quarentena, `DEMO_TOKEN`;
  - push para o GitHub, aguardando autorização.

## 2026-09-27 · Fiador Doc unificado, plano contra golpes e segurança organizada
- **Quem:** Claude Opus 5.5
- **O quê:**
  - **Unificação:** o trabalho de segurança de 24/09, feito numa cópia isolada (worktree `arquitetura-brechas-aca3c2`, que não tinha o código), foi trazido para a pasta principal: 00-PAINEL, 06, 07, `provas/`, versões ampliadas de 01 a 05 e a skill `conselho-seguranca`. Cópia de segurança da versão anterior no rascunho da sessão.
  - **Documento novo `08-RESPOSTA-A-GOLPE.md`:** 8 golpes esperados, camadas de prevenção (hoje × alvo), sinais de alerta, roteiro de resposta em 6 passos (conter, preservar provas, investigar, agir e comunicar, recuperar, aprender), roteiros por tipo de golpe, ordem de quem arca com a perda e respostas para a banca.
  - **Organização:** mapa por assunto no README; painel com a linha de golpes e a pergunta "e se acontecer mesmo assim?"; 01 e 07 apontam para 06, 07 e 08 em vez do `docs/SEGURANCA.md`; `CLAUDE.md` e `AGENTS.md` citam 00, 06, 07 e 08 e a skill; `docs/ARQUITETURA.md` e `docs/SEGURANCA.md` marcados como históricos.
  - **Segurança:** `.env*`, `*keypair*.json` e `id.json` no `.gitignore` (B-A36 → B-018, corrigido); `docs/SEGURANCA.md` com o quadro "O que não vale mais" e marcações nos itens errados (B-A41, em andamento).
- **Por quê:** pedido do Saulo para organizar os arquivos, melhorar a parte de segurança e ter pronto como o golpe é resolvido e o que fazer se ele acontecer.
- **Arquivos:** `Fiador Doc/*`, `.claude/skills/conselho-seguranca/**`, `.gitignore`, `web/.gitignore`, `docs/SEGURANCA.md`, `docs/ARQUITETURA.md`, `CLAUDE.md`, `AGENTS.md`.
- **Verificação:** `git check-ignore` confirma que `web/.env`, `.env` e o keypair do programa são ignorados e que `.env.example` continua versionável; nenhum segredo no `git status`; links internos do Fiador Doc conferidos. Nenhum código do programa ou do site foi alterado.
- **Pendências:**
  - no programa: cobertura crescente e franquia, `agency ≠ landlord`, `pause` e `suspend_agency`, quarentena (08, seção 6);
  - commit e backup das chaves (B-A37), com autorização do Saulo;
  - reescrever ou aposentar `docs/SEGURANCA.md` (B-A41).

## 2026-09-24 · Arquitetura de segurança do software, antifraude e painel
- **Quem:** Claude Opus 5.5
- **O quê:**
  - **Verificação de software feita hoje:**
    - `cargo test` 46/46 numa cópia limpa (o `.so` testado é mais novo que todo o código-fonte);
    - `cargo clippy` sem avisos; `tsc --noEmit` sem erros;
    - `npm audit --omit=dev`: 12 falhas conhecidas (5 altas, 7 médias), todas em dependências indiretas das bibliotecas da Solana;
    - nenhum segredo no código nem no histórico do git; nenhum cabeçalho de segurança HTTP configurado.
  - **Documentos novos:**
    - `07-SEGURANCA-SOFTWARE.md`: fronteiras de confiança, matriz de acesso das 16 instruções e das 5 rotas, invariantes, chaves, dependências, arquitetura-alvo e checklist para cada mudança;
    - `00-PAINEL.md`: resumo de uma página com números, urgências e respostas para a banca.
  - **Relatório 06 ampliado:** seção 8 (quatro camadas antifraude contra o conluio) e seção 9 (plano ampliado do que fazer depois, por área e com dono).
  - **Guia e skill:** guia "Por onde começar" no README; skill `conselho-seguranca` passa a ler e atualizar 00 e 07.
- **Por quê:** pedido do Saulo para ter tudo estruturado no projeto, registrar a antifraude e mais medidas no relatório, e verificar a segurança no nível de software.
- **Arquivos:** `Fiador Doc/00-PAINEL.md`, `07-SEGURANCA-SOFTWARE.md`, `06-CONSELHO-SEGURANCA.md`, `04-BUGS.md` (B-A24), `README.md`, `.claude/skills/conselho-seguranca/SKILL.md`.
- **Verificação:** as listadas acima. Nenhum código do projeto foi alterado.
- **Pendências:**
  - rodar `cargo audit` (ferramenta não instalada) e fuzzing;
  - build verificável;
  - todas as correções do plano (06, seções 5, 8 e 9).

## 2026-09-24 · Conselho de segurança (10 especialistas)
- **Quem:** Claude Opus 5.5, orquestrando 10 subagentes com a skill nova `conselho-seguranca`.
- **O quê:**
  - **Skill** `.claude/skills/conselho-seguranca/` criada: orquestrador, modelo de achado e 10 perfis (red team on-chain, red team off-chain, CISO, auditor de smart contract, pagamentos Pix, atuário, regulatório, LGPD, PLD/fraude, SRE).
  - **Revisão** de toda a arquitetura: das 13 brechas anteriores, 12 confirmadas (5 com prova) e 1 refutada (B-A11 → B-016); 21 achados novos (B-A21 a B-A41).
  - **Documentos:** relatório `06-CONSELHO-SEGURANCA.md`; provas de conceito em `provas/`; correções em 01, 02 e 05 (B-017, ressalvas em D-14 e D-15).
- **Por quê:** pedido do Saulo para que profissionais de cada área avaliassem a arquitetura, corrigissem a análise anterior e encontrassem falhas e lacunas, com a cibersegurança atuando com força.
- **Arquivos:** `.claude/skills/conselho-seguranca/**`, `Fiador Doc/06-CONSELHO-SEGURANCA.md`, `Fiador Doc/provas/*`, `Fiador Doc/01-ARQUITETURA.md`, `02-FUNCOES.md`, `04-BUGS.md`, `05-DECISOES.md`, `README.md`.
- **Verificação:**
  - Os especialistas rodaram a suíte numa cópia no rascunho: 46 testes existentes + 11 provas, todos passando.
  - Os achados 🔴 e 🟠 novos foram conferidos no código por mim (`initialize` sem restrição, `create_lease` sem `agency ≠ landlord`, período sem máximo, nenhum `emit!`, `.gitignore` sem `.env`, remoto público, uma única carteira em `Anchor.toml`, `setup-demo.ts` e `server.ts`).
  - A refutação da B-A11 foi conferida em `claim_default.rs:72-83` e `pay_rent.rs:119-120`.
  - Nenhum código do projeto foi alterado.
- **Pendências:**
  - plano por fase em 06, seção 5;
  - `docs/SEGURANCA.md` (fora deste branch) precisa ser revisto (B-A41);
  - renomear o teste citado em B-017;
  - levar a skill e o Fiador Doc para a pasta principal.

## 2026-09-24 · Revisão de brechas e 01-ARQUITETURA corrigida
- **Quem:** Claude Opus 5.5
- **O quê:** 01-ARQUITETURA passou a descrever o que o código faz de fato: regra exata da caução pela reputação, rendimento da demo, limite de 50% medido no aceite, quem assina cada instrução, para onde vai o dinheiro em cada passo, o que conta como calote, a proteção de cada rota e os poderes da chave do admin. Ganhou a seção 9 com 13 brechas encontradas na leitura do código, registradas como B-A08 a B-A20. Também corrigidos os erros de documentação B-014 e B-015 e acrescentada uma ressalva em D-04.
- **Por quê:** pedido do Saulo para encontrar brechas na arquitetura e melhorar o documento.
- **Arquivos:** `Fiador Doc/01-ARQUITETURA.md`, `Fiador Doc/04-BUGS.md`, `Fiador Doc/05-DECISOES.md`.
- **Verificação:** leitura das 16 instruções em `programs/fiador/src/` e das rotas em `web/src/app/api/`. Nenhum código foi alterado; as brechas não foram reproduzidas em teste.
- **Pendências:** corrigir B-A08 a B-A13 (ordem sugerida em 01-ARQUITETURA, seção 9), com um teste LiteSVM para cada; levar as brechas novas para `docs/SEGURANCA.md`.

## 2026-09-24 · Criação do Fiador Doc
- **Quem:** Claude Opus 5.5
- **O quê:** criada a pasta `Fiador Doc/` com arquitetura, catálogo de funções, histórico, registro de bugs e decisões. A regra "toda IA deve alimentar o Fiador Doc" foi incluída em `CLAUDE.md` e em `AGENTS.md`.
- **Por quê:** pedido do Saulo, para que qualquer IA que assuma o projeto saiba o que existe e registre o que mudar.
- **Arquivos:** `Fiador Doc/*`, `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/hooks/fiador-doc-check.sh`.
- **Trava automática:** hook de encerramento do Claude Code que impede terminar a sessão quando há arquivos de código (`programs/fiador/src|tests`, `web/src`, `web/scripts`, `scripts`) mais novos que este arquivo. Ele bloqueia uma vez por ciclo (`stop_hook_active`), para não entrar em loop.
- **Verificação:** conteúdo conferido contra o código (instruções em `programs/fiador/src/lib.rs`, regras em `instructions/*.rs`, rotas em `web/src/app/api/`, exportações em `web/src/**`). Ao conferir, foi encontrado o erro de documentação B-012 (limite de 50% por imobiliária).
- **Pendências:** B-A01 (mostrar o limite por imobiliária nas telas).

## 2026-09-23 · Site novo a partir do canvas de design
- **Quem:** Claude Opus 5.5, com dois subagentes (app do proprietário; investidor e reputação).
- **O quê:** site refeito no design "Recibo" com cara de banco, ligado ao programa na Solana:
  - componentes visuais em `web/src/ui/`;
  - regras da história em `web/src/lib/historia.ts`;
  - apps da inquilina (`/inquilino`), do proprietário (`/proprietario`), da imobiliária (`/imobiliaria`) e do investidor (`/investidor`);
  - Palco da banca (`/apresentacao`), página inicial nova e reputação pública reescrita.

  O console antigo passou para `/demo`, com o estilo em `web/src/app/demo/legacy.css`.
- **Mudanças no estado (`useDemo`):**
  - eventos com tipo, mês e valor, guardados no navegador e sincronizados entre abas (BroadcastChannel);
  - `executar()` devolve a assinatura da transação;
  - preparação das carteiras a cada sessão;
  - textos da cobrança automática na linguagem da história.
- **Por quê:** pedido do Saulo ("pode progredir") depois da aprovação do design com nota 9,5.
- **Arquivos:** `web/src/ui/*`, `web/src/lib/historia.ts`, `web/src/components/{useDemo.ts,DemoProvider.tsx,PixFluxo.tsx}`, `web/src/app/{page.tsx,home.module.css,layout.tsx,globals.css}`, `web/src/app/{inquilino,proprietario,imobiliaria,investidor,apresentacao,reputacao}/**`.
- **Verificação:**
  - `npx tsc --noEmit` sem erros; as 20 rotas respondem 200;
  - fluxo real testado no navegador contra a Solana local: contrato criado, caução por Pix, agosto pago com recibo, cobrança automática pagando setembro com a caução e o Palco mostrando tudo ao vivo;
  - o subagente testou aporte, resgate pedido e resgate concluído.
- **Pendências:** publicar na devnet; B-A03 a B-A07.

## 2026-09-23 · Design no canvas (91 telas) com nota 9,5
- **Quem:** Claude Opus 5.5, com uma IA crítica de UI/UX (subagente).
- **O quê:** canvas "Fiador.sol — telas Recibo" com 91 telas, avaliado em 8 rodadas; nota final de 9,5 nas seis páginas (a última correção do investidor foi aplicada sem uma nova rodada). Serve de referência visual do site. Link: https://claude.ai/artifact/SwTMom6oEYX48GNaKG7vM7
- **Arquivos:** gerador fora do repositório (scratchpad da sessão); registro em `docs/DESIGN.md` e `docs/CRITICA-DESIGN.md`.
- **Verificação:** avaliação por página com critérios de coerência, linguagem, estética, jornadas, acessibilidade, layout e "cara de banco".
- **Pendências:** nenhuma no design.

## 2026-09-23 · Site da demo (versão 1, console técnico)
- **Quem:** Claude Opus 5.5
- **O quê:** primeiro site Next.js 16 com as rotas de API (estado, preparar, Pix simulado, keeper), o `useDemo`, o console com os quatro papéis numa tela (hoje em `/demo`), o script `setup-demo.ts`, o teste `e2e.ts` e o `scripts/demo-local.sh`.
- **Arquivos:** `web/src/app/api/**`, `web/src/lib/*`, `web/src/components/{DemoConsole.tsx,Pix.tsx,useDemo.ts}`, `web/scripts/*`, `scripts/demo-local.sh`.
- **Verificação:** fluxo completo pelo e2e na Solana local.
- **Pendências:** o design antigo (fundo escuro com verde-neon) foi vetado e depois substituído.

## 2026-09-23 · Programa Anchor com 16 instruções e 46 testes
- **Quem:** Claude Opus 5.5
- **O quê:** programa `fiador`:
  - contrato, caução, pagamento, cobrança da carência, fundo de garantia com cotas e saque com aviso prévio;
  - danos com decisão da imobiliária, acerto final com rendimento;
  - reputação e selo Token-2022 intransferível.

  46 testes com LiteSVM cobrindo as brechas de `docs/SEGURANCA.md`.
- **Arquivos:** `programs/fiador/**`, `Anchor.toml`, `Cargo.toml`, `rust-toolchain.toml`.
- **Verificação:** `cargo test`, 46/46.
- **Pendências:** publicar na devnet.

## 2026-09-22 · Visão, arquitetura e inscrição
- **Quem:** Saulo com o Claude
- **O quê:** README, `docs/ARQUITETURA.md` (plano), `docs/SEGURANCA.md`, `docs/ROTEIRO-VIDEOS.md`, `docs/inscricao.md`, `docs/contexto-chat.md`; repositório no GitHub (commit `afd05fa`).
