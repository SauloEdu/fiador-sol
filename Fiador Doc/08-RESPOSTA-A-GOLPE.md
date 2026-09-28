# Plano contra golpes: prevenir, perceber e responder

Criado em 2026-09-27. Este documento responde a duas perguntas que a banca vai fazer: **"como vocês evitam o golpe?"** e **"o que vocês fazem se ele acontecer?"**. A prevenção em detalhe está em [06-CONSELHO-SEGURANCA.md](06-CONSELHO-SEGURANCA.md), seção 8. Aqui estão o resumo, o **roteiro de resposta** e o que existe hoje em comparação com o que falta construir.

> A parte jurídica é uma análise preliminar para o hackathon, **não é parecer**. Antes de operar com dinheiro real, ela precisa ser validada pelo advogado de regulação (06, seção 9.8).

## Resposta para a banca (30 segundos)

> "Golpe em garantia de aluguel sempre vai existir, igual no seguro-fiança. A gente não promete que ele não acontece: a gente faz ele **não compensar**, **aparecer cedo** e **ter dono**.
> Não compensa porque a cobertura do fundo cresce com o histórico de pagamentos, o proprietário tem franquia e a imobiliária entra com uma garantia que perde primeiro.
> Aparece cedo porque o fundo não paga na hora: o dinheiro fica em quarentena e só sai conforme o despejo anda, e qualquer investidor pode contestar.
> E tem dono porque tudo fica registrado na blockchain. Cada pagamento, cada carteira e cada documento viram prova. Se acontecer, a gente segura o pagamento, descredencia a imobiliária, leva as provas à polícia e cobra de volta de quem deu o golpe. O que for recuperado volta para o fundo."

## 1. Os golpes que esperamos

| # | Golpe | Como funciona | Gravidade | Bug |
|---|---|---|---|---|
| G1 | **Conluio** (o principal) | Imobiliária, proprietário e inquilina combinados fazem um contrato fictício. A inquilina paga os 2 meses de espera e para de pagar; caução e fundo pagam o "proprietário". Rende cerca de R$ 14.200 por contrato de R$ 5.000. | 🔴 | B-A24 |
| G2 | **Falso proprietário** | Alguém aluga um imóvel que não é dele, ou vários contratos usam o mesmo imóvel. | 🔴 | 06, seção 4.3 |
| G3 | **Laranja / carteira nova** | A inquilina dá calote e volta com uma carteira nova, sem histórico negativo. | 🟠 | B-A13 |
| G4 | **Reputação fabricada** | Contratos de valor mínimo geram reputação máxima e selos por R$ 0,000042, e com isso uma caução menor. | 🔴 na demo | B-A23, B-A09 |
| G5 | **Imobiliária juiz em causa própria** | A imobiliária é também proprietária e decide a disputa de danos a favor de si mesma. | 🔴 em produção | B-A25 |
| G6 | **Pix contestado (MED)** | A pessoa paga por Pix, o dinheiro vira caução ou cota, e depois ela contesta o Pix no banco. | 🟠 | 06, seção 4.5 |
| G7 | **Invasão da conta da inquilina** | Golpe de phishing ou celular roubado: alguém assina transações no lugar dela. | 🟠 | B-A40 |
| G8 | **Ataque ao sistema** | Chave do admin vazada, `initialize` tomado ou demo derrubada. | 🔴 | B-A21, B-A22, B-A26, B-A08 |

## 2. Antes: as camadas que fazem o golpe não compensar

O resumo da seção 8 do [06](06-CONSELHO-SEGURANCA.md). Nenhuma camada resolve sozinha; o golpe precisa passar por todas.

| Camada | Medida | Contra | Hoje | Quando |
|---|---|---|---|---|
| 1. Tirar o incentivo | Cobertura que cresce com os meses pagos (¼ de aluguel por mês, até 3) | G1 | ✅ `coverage_growth_bps` desde 28/09 | feito |
| | Franquia do proprietário (o fundo paga 80%) | G1 | ✅ `landlord_deductible_bps` desde 28/09 | feito |
| | Garantia da imobiliária, que perde primeiro | G1, G2, G5 | ❌ | antes de dinheiro real |
| | Espera de 2 aluguéis antes do fundo entrar | G1 | ✅ `coverage_waiting_periods` | já existe |
| | Limite de 50% do fundo por imobiliária e teto por contrato | G1 em série | ✅ `agency_max_pool_bps`, `max_coverage_amount` | já existe |
| 2. Ganhar tempo | Pagamento do fundo em quarentena (30 s na demo; 7 dias sugeridos em produção); a equipe congela ou cancela | G1, G2 | ✅ desde 28/09 (contestação por investidores ainda não) | feito em parte |
| | Fundo paga conforme o despejo anda (notificação, ação, liminar) | G1, G2 | ❌ | antes de dinheiro real |
| 3. Perceber pelos rastros | Alerta de calote logo depois da espera | G1 | ❌ | devnet |
| | Grafo de carteiras, preço do aluguel por CEP, vistoria, DataJud | G1, G2 | ❌ | produção |
| 4. Identidade | CPF ligado a uma única carteira (atestador fora da blockchain) | G3, G1 | ❌ | antes de dinheiro real |
| | Matrícula do imóvel e um só contrato ativo por imóvel | G2 | ❌ | antes de dinheiro real |
| Regras básicas | Imobiliária ≠ proprietário; aluguel mínimo; mês com duração máxima; 1 pagamento em dia por mês na reputação | G4, G5, G8 | ✅ desde 28/09 | feito |

**Com cobertura crescente e franquia,** o lucro do conluio cai de cerca de R$ 14.200 em 8 meses para cerca de R$ 6.400 em 18 meses (conta aproximada do conselho). Isso dá tempo para as camadas 2 e 3 pegarem o golpe antes de o dinheiro sair.

## 3. Como percebemos que está acontecendo

| Sinal | Nível | Quem percebe |
|---|---|---|
| Calote no 1º mês depois da espera do fundo | 🟡 atenção | alerta automático (keeper/indexador) |
| 2 ou mais calotes cedo na mesma imobiliária em 90 dias | 🟠 investigar | alerta automático |
| Carteiras da inquilina e do proprietário abastecidas pela mesma origem, ou dinheiro voltando entre elas | 🟠 investigar | análise do grafo de transações |
| Aluguel acima de 1,5× o preço de mercado do CEP | 🟡 atenção | pontuação de risco na criação do contrato |
| Contestação de um investidor durante a quarentena | 🟠 investigar | o próprio programa (contestação on-chain) |
| Denúncia (vizinho, síndico, proprietário verdadeiro) | 🟠 investigar | canal de denúncia |
| Pagamentos do fundo muito acima da média da semana | 🔴 incidente | monitoramento do fundo |
| Transação do admin que ninguém da equipe fez | 🔴 incidente | alerta de saldo e de assinatura |

- **🟡 atenção:** anotar no contrato, sem bloquear nada.
- **🟠 investigar:** abrir um caso (seção 4) e segurar o pagamento do fundo daquele contrato.
- **🔴 incidente:** abrir um caso com prioridade máxima; pode exigir pausa geral.

## 4. Quando acontece: roteiro de resposta

Cada caso recebe um número (ex.: `GOLPE-2026-001`) e um responsável. **Cada passo feito é anotado no caso, com data e hora**, porque isso vira prova.

### Passo 1 · Conter (na primeira hora)

Objetivo: o dinheiro para de sair.

| Ação | Hoje (demo) | Alvo (produção) |
|---|---|---|
| Segurar o pagamento do fundo do contrato suspeito | ✅ Quarentena: o pagamento do fundo fica retido e a equipe congela (`freeze_pool_payment`) na Central de risco (`/risco`). | O mesmo, com multisig; e contestação por investidores com garantia. |
| Impedir novos contratos da imobiliária suspeita | ✅ `set_agency_active`: a imobiliária suspensa não cria contratos e seus convites não podem ser aceitos. | O mesmo, com multisig. |
| Parar tudo, se for ataque ao sistema (G8) | ✅ `set_paused`: bloqueia contratos novos, aportes, saques e pagamentos do fundo; o aluguel continua. | O mesmo, com multisig. |
| Colocar carteiras e CPFs na lista de observação | manual (planilha) | lista interna consultada na criação do contrato |
| Parar o keeper, se ele estiver sendo usado no ataque | desligar o servidor | segredo do cron trocado |

> **Desde 28/09 o programa tem pausa, suspensão de imobiliária e quarentena.** Na demo, a Central de risco (`/risco`) executa o passo 1 ao vivo.

### Passo 2 · Preservar as provas (primeiras 24 horas)

A blockchain ajuda muito aqui: **nada pode ser apagado**.

1. Exportar o histórico do contrato, com todas as assinaturas: quem criou, quem aceitou, cada pagamento, cada cobrança e para qual carteira foi cada centavo, com data e hora da rede.
2. Rastrear o dinheiro: para onde as carteiras que receberam mandaram os valores, e se voltaram para alguém do grupo.
3. Juntar o que está fora da blockchain: documentos da imobiliária, cadastro, vistoria, conversas, comprovantes de Pix (`endToEndId`).
4. Registrar a impressão digital (hash) do dossiê, para provar depois que ele não foi alterado.
5. Guardar tudo por pelo menos 5 anos (Lei 9.613/1998).

### Passo 3 · Investigar e decidir (até 72 horas)

| Pergunta | Onde olhar |
|---|---|
| O imóvel existe e é de quem disse ser dono? | matrícula no cartório, vistoria, síndico ou portaria |
| Alguém mora lá? | conta de luz, vistoria com fotos datadas |
| As partes se conhecem? | grafo de carteiras, endereço, parentesco, quadro de sócios na Receita |
| A imobiliária conferiu o que devia? | contrato de credenciamento e o checklist dela |

Decisão, registrada no caso:
- **Não é golpe** (calote comum): libera o pagamento do fundo e segue o fluxo normal de cobrança.
- **É golpe:** cancela o pagamento em quarentena, descredencia a imobiliária e segue para o passo 4.
- **Dúvida:** o valor fica retido até a próxima etapa do despejo (a regra "paga conforme o despejo anda").

### Passo 4 · Agir e comunicar (até 7 dias)

| Com quem | O quê |
|---|---|
| Polícia e Ministério Público | Boletim de ocorrência e notícia-crime por estelionato (Código Penal, art. 171), com o dossiê do passo 2. |
| COAF | Comunicação de operação suspeita, se houver sinal de lavagem de dinheiro (Lei 9.613/1998). O prazo é de 24 horas depois de detectar, e quem comunica é o parceiro regulado de pagamentos. |
| Imobiliária | Descredenciamento e execução da garantia dela, conforme o contrato de credenciamento. |
| Investidores do fundo | Aviso no painel público: o que aconteceu, quanto o fundo perdeu, quanto foi segurado e o que muda. Transparência é o que mantém o investidor. |
| Proprietário honesto (se o golpe foi contra ele, como no G2) | Orientação e registro do caso; ele não perde a cobertura por culpa de terceiros. |
| ANPD e titulares | Só se houver vazamento de dados pessoais: comunicar em até 3 dias úteis (06, seção 4.4). |

### Passo 5 · Recuperar o dinheiro (30 dias em diante)

Ordem de quem cobre a perda (alvo):
1. **Caução da inquilina** (já é assim hoje).
2. **Garantia da imobiliária** (primeira perda).
3. **Franquia do proprietário** (a parte que o fundo não paga; 20% desde 28/09, e continua sendo dívida da inquilina com o dono).
4. **Fundo** (o que sobrar, depois da quarentena).

Depois:
- **Cobrar a dívida:** a dívida que sobrou com o fundo vira título, cobrado da inquilina identificada e dos comparsas (direito de regresso), com ação judicial se for preciso.
- O que for recuperado **volta para o fundo**. Uma parte vai para quem denunciou ou contestou (recompensa).
- O registro de calote fica no perfil da inquilina pelo prazo máximo de 5 anos (CDC, art. 43), com aviso prévio.

### Passo 6 · Aprender (até 15 dias depois de fechar o caso)

1. Relatório curto do caso: como entrou, por que as camadas não pararam, quanto custou.
2. A brecha vira bug em [04-BUGS.md](04-BUGS.md), com teste que reproduz o golpe.
3. Ajustar as regras: pontuação de risco, limites e prazos da quarentena.
4. Registrar em [03-ATUALIZACOES.md](03-ATUALIZACOES.md) e atualizar este documento.

## 5. Roteiros rápidos por tipo de golpe

| Golpe | Conter | Principal prova | Recuperar de quem |
|---|---|---|---|
| G1 conluio | Congelar a quarentena e suspender a imobiliária | Grafo de carteiras e imóvel vazio | Garantia da imobiliária, depois inquilina e proprietário (regresso) |
| G2 falso proprietário | Congelar a quarentena; avisar o dono verdadeiro | Matrícula do imóvel | Garantia da imobiliária e o falsário |
| G3 laranja | Bloquear o CPF na lista de observação | Atestador de identidade (CPF → carteira) | Inquilina identificada |
| G4 reputação fabricada | Zerar o desconto de caução daquele perfil | Contratos de valor mínimo no histórico | Não há perda direta; corrigir a regra (B-A23) |
| G5 imobiliária juiz | Anular a decisão e retomar a disputa com revisão humana | `agency` = `landlord` no contrato | Imobiliária |
| G6 Pix contestado | Quarentena antes do saque; reserva para o MED | `endToEndId` do Pix | Pagador, por meio do parceiro de Pix |
| G7 conta invadida | Orientar a inquilina a trocar a carteira; bloquear o perfil antigo | Transações fora do padrão dela | Depende do caso; a caução continua no cofre do contrato |
| G8 ataque ao sistema | Pausa geral; trocar as chaves (multisig) | Assinaturas do admin | Seguro de risco cibernético (06, seção 9.7) |

## 6. O que existe hoje e o que falta construir

| Peça | Situação | Bug ou referência |
|---|---|---|
| Registro imutável de tudo (prova) | ✅ blockchain | — |
| Espera de 2 aluguéis, teto por contrato e limite de 50% por imobiliária | ✅ no programa | — |
| Eventos para monitorar (`emit!`) | ✅ em parte (aluguel, cobrança, encerramento, emergência) | B-A38 |
| Pausa e descredenciamento | ✅ 28/09 | B-A14 (falta `set_admin`) |
| Quarentena com contestação | ✅ quarentena com congelar/cancelar pela equipe; contestação por investidores ainda não | 06, seção 8.2 |
| Cobertura crescente e franquia | ✅ 28/09 | 06, seção 8.1 |
| Imobiliária ≠ proprietário, aluguel mínimo, mês máximo | ✅ 28/09 | B-A25 (em parte), B-A23 (em parte), B-A26 |
| Alertas automáticos | ❌ | 06, seção 9.2 |
| Identidade verificada | ❌ | 06, seção 4.3 |
| Contrato de credenciamento com garantia e regresso | ❌ (jurídico) | 06, seção 9.4 |
| Canal de denúncia e `security.txt` | ❌ | 06, seção 9.3 |

**Prioridade para a banca:**
1. ~~Cobertura crescente + franquia~~ (feito em 28/09).
2. ~~Imobiliária ≠ proprietário~~ (feito em 28/09).
3. ~~`pause` e `suspend_agency`~~ (feito em 28/09).
4. ~~Uma quarentena simples~~ (feito em 28/09; cena na Central de risco, `/risco`, aberta pelo Palco).

Com esses quatro itens, dá para **mostrar na demo** o golpe sendo segurado: o Palco pode ter uma cena "e se for golpe?".

## 7. Perguntas difíceis sobre golpe

| Pergunta | Resposta curta |
|---|---|
| "E se o dono e o inquilino combinarem?" | "O golpe precisa esperar até 12 meses para ter cobertura cheia, o dono perde a franquia, a imobiliária perde a garantia dela e o dinheiro do fundo fica em quarentena, onde qualquer investidor pode contestar." |
| "E se o golpe passar mesmo assim?" | "A gente segura o pagamento, descredencia a imobiliária, leva o dossiê à polícia e cobra de quem deu o golpe. A blockchain é a prova: nada pode ser apagado." |
| "Quem paga o prejuízo?" | "Nessa ordem: a caução, a garantia da imobiliária, a franquia do dono e só depois o fundo. E o fundo tem limite por contrato e por imobiliária." |
| "Blockchain não é anônima?" | "A carteira é pública, mas a pessoa é identificada fora da blockchain, no cadastro com CPF. Ligar uma à outra é o que permite cobrar." |
| "Vocês conseguem parar o sistema num ataque?" | "Sim: o programa tem pausa geral, suspensão por imobiliária e quarentena do pagamento do fundo, que a equipe congela ou cancela. Na demo é uma chave da equipe; em produção, várias assinaturas (multisig)." Dá para mostrar ao vivo na Central de risco. |

## 8. "Então o dono e a imobiliária também perdem?"

As defesas pesam sobre quem frauda e quase não pesam sobre quem é honesto. Números ilustrativos: aluguel de R$ 2.000, caução de 3 aluguéis, franquia de 20%.

| Situação do proprietário | O que ele recebe | Quando |
|---|---|---|
| Hoje, sem garantia | R$ 0 até a Justiça resolver | meses |
| Fiador.sol, calote depois de 12 meses em dia | caução R$ 6.000 (100%) + fundo R$ 4.800 (80% de 3 aluguéis) = R$ 10.800 de R$ 12.000 | na hora, mês a mês |
| Fiador.sol, calote logo no 3º mês | caução R$ 6.000 + um pedaço pequeno do fundo | na hora |

- **A franquia vale só para a parte do fundo;** a caução continua pagando 100%.
- **A garantia da imobiliária** (10 a 20% da cobertura que ela usa) só é tocada quando os contratos dela dão calote. Em troca, ela fecha mais contratos (inquilino sem fiador), trabalha menos (cobrança automática) e tem um argumento para captar proprietários.
- **A cobertura crescente** corta o calote logo depois da espera mínima, que é o padrão da fraude. O honesto que tem um imprevisto no meio do contrato já acumulou cobertura.
- Os percentuais são **parâmetros a calibrar** (ex.: imobiliária com bom histórico deposita menos garantia; franquia só em contratos com sinais de risco).

**Frase:** "As defesas custam quase nada para quem é honesto e tiram o lucro de quem frauda. O dono honesto recebe 90% na hora, contra zero por meses hoje."
