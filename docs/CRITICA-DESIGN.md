# Crítica de UI/UX — 47 telas da direção Recibo

> 23/09/2026 · Avaliação feita por uma IA revisora independente, a partir do código das telas (`gen2.py` e os `.dc.html`), de `docs/DESIGN.md` e de `docs/ARQUITETURA.md`. Ela não viu as telas renderizadas. Os contrastes foram calculados.

## Notas (0 a 10)

| Critério | Nota | Por quê |
|---|---|---|
| Identidade visual | 7 | Memorável no celular; no computador (imobiliária e investidor) volta a ser painel de SaaS comum |
| Clareza | 5 | Vocabulário simples, mas "garantia", "prêmio" e "cobertura" se misturam, e há promessas enganosas |
| Hierarquia | 7 | Um bloco dominante por tela; faltam estados de "processando" e há becos sem saída |
| Consistência | 4 | Datas, valores e nomes de estado mudam entre telas |
| Acessibilidade | 5 | Paleta principal passa; estado só por cor, sem foco visível, ações como links `#` |
| Responsividade | 4 | Colisões já em 390px; código estoura em 360px; tabela da imobiliária não cabe em 1440px |
| Confiança | 4 | Faltam "simulado" em telas-chave; assinaturas cursivas parecem falsas; promessas jurídicas arriscadas |
| Microcopy | 6 | Direto e humano, mas toda tela abre com uma frase de efeito com ponto final, e isso vira tique |

## Críticos
1. **As telas prometem o que o programa não faz.**
   - Login por e-mail.
   - Devolução da caução por Pix.
   - Avisos por WhatsApp.
   - PDF do contrato guardado.
   - Fotos na contestação.
   - Prazo para a imobiliária decidir, com a caução voltando sozinha depois.

   Para cada item: construir, ou reescrever o texto para o que existe.
2. **"Sem seguro que não volta", mas a taxa de 8% também não volta.** São R$ 1.920 por ano. Chamar de "Taxa de garantia (não volta)" e fazer uma comparação honesta com o seguro-fiança.
3. **"No mesmo dia" e "na hora" são falsos.** O proprietário recebe 5 dias depois do vencimento, no fim da carência.
4. **Números e datas se contradizem.**
   - O palco mostra três "hoje" diferentes.
   - A mini-cartela da Av. Central tem um código inválido (`"ppcx"`), e novembro aparece vazio.
   - A garantia livre ignora o teto de R$ 15.000 do pool.
   - A soma dos prêmios não bate com as barras do gráfico.
   - O "≈ 4,6%" contradiz os ~38% que o próprio pool indica.

## Altos
- **Palco:** o momento principal está pequeno demais; não há prova de que roda na Solana (transações, link para o explorador); há dois controles de tempo; o texto fica ilegível à distância.
- **Mini-cartela da imobiliária:** depende só de cor (verde e vermelho com luminância quase igual, 1,11:1).
- **Tabela da imobiliária:** não cabe em 1440px.
- **Colisões no celular:**
  - a assinatura se sobrepõe ao carimbo em `AluguelPago` e `Recibo`;
  - o carimbo cobre o valor em `Atraso`;
  - o campo de código estoura em 360px.
- **Buracos nas jornadas:**
  - ordem Convite → Entrar indefinida;
  - falta a tela "registrando o pagamento…";
  - falta a tela de erro de transação;
  - becos sem saída;
  - decisão irreversível sem confirmação.
- **Rendimento:** "simulado" some justamente onde o inquilino decide.
- **Linguagem jurídica perigosa:** "sem ação de despejo", "sem advogado", e o recibo diz "Recebemos", como se o Fiador.sol recebesse o aluguel.
- **Página pública e LGPD:** mostra o endereço completo da carteira e não tem controle para desativar o link.
- **Acessibilidade:** sem foco visível; ações feitas como links `#`; 6 contrastes reprovados (aba inativa, horários, selo apagado, borda de campo, barras do gráfico, "Feito" no palco).
- **Regra do "0 calote":** confirmar se um mês pago pela caução conta como calote. Se contar, a Ana nunca chega a 2 aluguéis de caução, e as telas mentem.

## Médios
- **Glossário único:**
  - "Taxa de garantia" para os R$ 160;
  - "Proteção do proprietário" para caução + pool;
  - "PAGO PELA CAUÇÃO" sempre igual;
  - "Fundo de garantia" para o público; "pool" só na tela do investidor.
- **Cores:**
  - vermelho não serve para o proprietário, porque para ele é boa notícia;
  - azul fica só no que é clicável;
  - "PERDA" do investidor em vermelho.
- **Papel serrilhado:** só em documentos com valor; alinhar a pauta com o texto.
- **Imobiliária e investidor:** levar o mundo do papel para o computador (livro-caixa, extrato, fita grande).
- **Frases de efeito:** manter só onde há mudança de estado.
- **Assinaturas:** trocar as cursivas por "Aprovado por… em… · registro na Solana" e um selo de autenticação.
- **Carimbos pequenos:** filtro de tinta só a partir de 18px; data com no mínimo 13px.
- **Carência:** trocar "domingo à meia-noite" por "segunda, 16/11, às 0h".
- **Promessa do fundo:** incluir as condições (depois de 2 meses pagos, teto de R$ 15.000).
- **Aceite:** "Li e concordo" antes do Pix; explicar como recorrer da decisão sobre danos.
- **DESIGN.md:** está desatualizado (cores, modo escuro prometido, número de telas).

## O que está realmente bom (manter)
- O recibo saindo da impressora com o carimbo "PAGO" caindo (`AluguelPago`): é a cena do vídeo.
- O envelope lacrado e o valor por extenso.
- A cartela de 12 meses e a fita de somar.
- Os calendários de carência e de aviso prévio.
- "O contrato em 5 pontos".
- A transparência das perdas para o investidor.
- A paleta principal, com contraste de 6 a 8:1.
- Alvos de toque de 44px no geral.
- A consulta de reputação sem pedir documentos.

## Top 5 antes de programar
1. **Um cenário único da demo**, com data de "hoje", contratos, meses e valores numa planilha, e todas as telas refeitas a partir dele.
2. **Passar cada tela contra o programa:** construir o login por e-mail ou mudar os textos que prometem o que não existe.
3. **Revisão de honestidade dos textos:** taxa que não volta, 5 dias, "simulado", recibo em nome do proprietário, sem "sem despejo".
4. **Palco refeito para a banca:** evento central grande, transações na Solana, um só controle de tempo, texto de 20px ou mais.
5. **Pacote de acessibilidade e responsividade:** símbolo além da cor, tabela que caiba em 1280px, colisões resolvidas, `<button>`, foco visível e contrastes corrigidos.


## Rodadas de correção (23/09)

Saulo pediu nota mínima 8 em cada página. Foram três rodadas de correção e avaliação:

| Página | v3 | v4 | Final |
|---|---|---|---|
| Entrada | 6,5 | 8,0 | 8,0 |
| Inquilino | 7,3 | 8,2 | 8,3 |
| Proprietário | 7,2 | 8,3 | 8,3 |
| Imobiliária | 6,8 | 7,8 | 8,1 |
| Investidor e reputação | 6,6 | 7,5 | 8,1 |
| Página inicial e apresentação | 6,6 | 7,8 | 8,2 |

**O que ficou para o código final:** botões de verdade (`<button>`) nas ações, tag de viewport, esconder os links "Protótipo: …" na gravação e, se der tempo, levar o papel às telas de login.

**Achados que viram resposta para a banca:**
- O mês quitado conta como pago (`pay_rent` soma em `paid_late`), então o fundo entra depois de agosto + setembro quitado.
- Os selos saem no pagamento do 3º, 6º e 12º mês em dia, e não no encerramento. A ARQUITETURA precisa refletir isso.
- Não existe limite de uso do fundo por imobiliária; o limite é por contrato (3 aluguéis, até R$ 15.000) e o saque do fundo só usa a parte livre.
- O programa pode ser atualizado: na demo a chave é nossa, em produção vai para um multisig.


## Nível 9,5 com cara de banco (23/09)

Saulo pediu nota 9,5 por página e um design "ainda mais parecido com software de banco". Foi criado o critério C7 ("parece app/internet banking brasileiro de verdade"). Foram mais cinco rodadas:

| Página | R4 | R5 | R6 | R7 | Final |
|---|---|---|---|---|---|
| Entrada | 7,8 | 8,6 | 9,2 | 9,5 | 9,5 |
| Inquilino | 8,2 | 8,9 | 9,3 | 9,5 | 9,5 |
| Proprietário | 8,0 | 8,7 | 9,2 | 9,5 | 9,5 |
| Imobiliária | 7,9 | 8,7 | 9,3 | 9,3 | 9,5 |
| Investidor e reputação | 8,0 | 8,6 | 9,0 | 9,4 | 9,5* |
| Página inicial e apresentação | 8,0 | 8,4 | 9,1 | 9,5 | 9,5 |

\* A última correção (3 datas no gráfico do fundo no celular) foi a que a crítica indicou para chegar a 9,5; foi aplicada sem uma nova rodada.

**Padrões de banco adotados:** cabeçalho escuro com ocultar valores, atalhos redondos, extrato em duas contas (sua conta e cofre), "revise o pagamento", Pix com "copiar código" em destaque, fatura vencida, comprovante com pagador, recebedor e ID da transação, telas de sucesso e erro centradas, informe de IR do proprietário, perfil de investidor, resgate com D+7, internet banking empresarial (tabela com seleção, ordenação e paginação, permissões, aprovação dupla).

**Para o código final:** `<button>` nas ações, `<meta name="viewport">`, esconder links "Protótipo" na gravação e testar o celular do Palco no canvas.
