# Decisões técnicas

Cada decisão com o motivo, em linguagem simples, para o Saulo defender na banca. Registre aqui toda escolha entre caminhos diferentes.

### D-01 · Solana com Anchor
Taxas de centavos e confirmação em segundos permitem cobrar, pagar e devolver todo mês automaticamente. O Anchor dá segurança de tipos e checagens de conta prontas.

### D-02 · A caução fica num cofre do programa, sem dono
O cofre é uma conta derivada do contrato (`["vault", lease]`). Nenhuma pessoa tem a chave; só as regras movimentam o dinheiro. É isso que torna a caução confiável para o dono e segura para a inquilina.

### D-03 · Pix simulado que emite "real digital de teste" (tBRL)
Na demonstração não há dinheiro real. O "Já paguei" faz o servidor emitir tBRL na carteira. Em produção, um parceiro de Pix converteria reais em uma stablecoin brasileira.

### D-04 · A cobrança automática não tem poder especial
`claim_default`, `end_lease` e `close_lease` podem ser chamados por qualquer pessoa: o programa confere o relógio e o estado. O keeper do servidor só aperta o botão na hora certa. Se ele parar, qualquer um pode cobrar.
Ressalva (2026-09-24): hoje o keeper assina com a chave do admin, que também emite tBRL e credencia imobiliárias. O programa não dá poder extra ao keeper, mas a chave dele tem esses poderes (ver B-A15).

### D-05 · Regras do fundo de garantia
O fundo entra só depois de 2 aluguéis pagos (evita golpe de alugar e nunca pagar), cobre até 3 aluguéis e no máximo R$ 15.000 por contrato, e cada imobiliária reserva no máximo 50% do fundo (evita concentração de risco). Quem pede saque ainda absorve calotes durante o aviso prévio.

### D-06 · Mês quitado é atraso, não calote
Se a caução pagou o dono e a inquilina repôs depois, o mês vira `settled` e conta como pago com atraso. Calote é só terminar o contrato devendo (`close_lease` com dívida).

### D-07 · Selo "Bom Pagador" intransferível, emitido no pagamento
Token-2022 com a extensão NonTransferable: não pode ser vendido nem passado adiante. Sai no `pay_rent`, no 3º, 6º e 12º pagamento em dia.

### D-08 · Rendimento da caução é simulado
10% ao ano, pago por uma reserva abastecida no início. Em produção, viria de aplicação real, com os riscos informados.

### D-09 · Carteiras de teste no navegador; login por e-mail só no desenho
Para a demonstração funcionar sem instalar nada, o navegador cria 4 carteiras de teste. Em produção, o plano é login por e-mail com carteira embutida (Privy ou Web3Auth).

### D-10 · A Solana é a fonte da verdade
As telas leem o contrato a cada 2 segundos. Os eventos guardados no navegador só servem para montar extratos e comprovantes, e são sincronizados entre abas (Palco, celular e painéis).

### D-11 · A "história" é uma camada de apresentação
Ana, Carlos, Imobiliária Sol e meses a partir de agosto de 2026 ficam em `historia.ts`. O programa só conhece carteiras e períodos. Assim o produto conta uma história real sem inventar dados na blockchain.

### D-12 · Design "Recibo" com cara de banco
Carimbos, cartela e comprovantes em papel dão identidade; a estrutura de app de banco dá confiança. O fundo escuro com neon foi vetado pelo Saulo.

### D-13 · O Palco mostra o app de verdade
O celular do Palco é um iframe do `/inquilino`: a banca vê o produto real, não uma imitação, e cada registro aparece com o link para o explorador da Solana.

### D-14 · Chave de atualização do programa
Na demonstração, é da equipe. Em produção, deve ir para um multisig (várias assinaturas), com o código verificado publicamente.
Ressalva (2026-09-24): hoje é a mesma carteira do admin, do mint do tBRL e do keeper (`Anchor.toml:14`). Antes da devnet pública, ela deve virar uma chave fria separada (B-A22).

### D-15 · Dados pessoais fora da blockchain
Nome, CPF e o PDF do contrato ficam com a imobiliária. Na Solana vão só carteiras, valores, datas e a impressão digital do contrato (LGPD).
Ressalva (2026-09-24, conselho de segurança): isso **não** quer dizer "nenhum dado pessoal na Solana". Quando a carteira pode ser ligada à pessoa, o histórico de aluguel, atrasos e disputas é dado pessoal, e fica público para sempre (LGPD, art. 5º, I, e art. 12, §3º). Frase defensável para a banca: "dados pessoais mínimos na cadeia; valores públicos". Ver B-A40.

### D-16 · Cobertura crescente e franquia de 20% (2026-09-28)
O fundo passa a cobrir ¼ de aluguel a cada aluguel pago (cobertura cheia de 3 aluguéis com 12 meses) e paga 80% do que faltar; os 20% ficam como franquia do proprietário, mas continuam sendo dívida da inquilina com ele. **Motivo:** o golpe do conluio (B-A24) lucrava pagando 2 meses e dando calote; agora ele precisa pagar muitos meses para liberar a cobertura, e o dono combinado perde a franquia. O inquilino honesto não percebe diferença, e o dono honesto recebe 90% na hora num calote depois de 12 meses (08, seção 8). **Nos testes antigos**, a cobertura é cheia e sem franquia (`coverage_growth_bps` = 30000, `landlord_deductible_bps` = 0), para eles continuarem testando o que testavam; as regras reais estão em `regras_antifraude()`. Os números são parâmetros da Config, a calibrar com o piloto.
