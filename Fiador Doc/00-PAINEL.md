# Painel do Fiador.sol · o que saber de cabeça

Atualizado em 2026-09-28. Uma página para consultar antes de reuniões e da banca. Os detalhes estão nos arquivos indicados.

## Onde o projeto está

| Área | Situação | Onde ler |
|---|---|---|
| Programa na Solana | 21 instruções, **67/67 testes passando** (regressões das brechas corrigidas, antifraude, resposta a golpe, `initialize` protegido e invariantes). Endereço novo `AxA7…` desde 28/09 (B-023). Roda na rede local; ainda não foi publicado na devnet. | [01-ARQUITETURA](01-ARQUITETURA.md) |
| Segurança do software | **25 brechas de segurança abertas** (B-A08 a B-A41). Fechadas: B-A36 (27/09); B-A09, B-A10, B-A18, B-A19, B-A20, B-A21 e B-A26 (28/09); em parte: B-A08, B-A12, B-A14, B-A23, B-A24, B-A25, B-A33, B-A38; B-A11 era falso alarme. | [07-SEGURANCA-SOFTWARE](07-SEGURANCA-SOFTWARE.md), [04-BUGS](04-BUGS.md) |
| Golpes e resposta a incidentes | 8 tipos de golpe mapeados e roteiro de resposta em 6 passos. Hoje **não há pausa, suspensão de imobiliária nem quarentena** no programa: a resposta começaria tarde. | [08-RESPOSTA-A-GOLPE](08-RESPOSTA-A-GOLPE.md) |
| Riscos de negócio, jurídicos e de dados | Tese jurídica a refazer; preço do fundo a recalibrar; faltam identidade e documentos LGPD. | [06-CONSELHO-SEGURANCA](06-CONSELHO-SEGURANCA.md) |
| Código no git | **Só 4 arquivos** versionados; o resto está só no notebook, sem backup. | B-A37 |

## Os números que importam

| Número | O que é |
|---|---|
| **R$ 14.200** | Lucro do golpe do conluio por contrato de R$ 5.000 hoje. Com cobertura crescente + franquia, cai para cerca de R$ 6.400, e o golpe passa a levar 18 meses. |
| **R$ 0,000042** | Custo de fabricar reputação máxima e 3 selos (contratos de 1 unidade de aluguel). |
| **~1 minuto** | Tempo para um visitante travar 100% do fundo da demo, sem gastar nada. |
| **1 chave** | Hoje uma única carteira atualiza o programa, é admin, emite o tBRL e roda o keeper. |
| **8% ao mês** | Taxa ao fundo sobre cada aluguel (0,96 aluguel por ano). Cara para a inquilina honesta, segundo o atuário. |
| **5 anos** | Prazo máximo para manter o registro de calote (CDC, art. 43). Hoje ele é eterno. |

## As 7 coisas mais urgentes antes da banca

1. ~~`.env*` no `.gitignore`~~ (27/09) e ~~commit do código~~ (28/09, `4515e52`). Falta o push para o GitHub e o backup cifrado das chaves fora do notebook (B-A37).
2. ~~`DEMO_TOKEN` nas rotas da demo~~ (28/09). Falta RPC dedicado na devnet (B-A34).
3. ~~No programa: imobiliária ≠ proprietário, mês máximo, aluguel mínimo, só paga mês que já começou, `landlord_debt`, disputa não reabre~~ (feito em 28/09).
4. ~~Cobertura crescente + franquia~~ e ~~pausa, suspensão de imobiliária e quarentena~~ (feito em 28/09; Central de risco em `/risco`).
5. ~~Tirar da tela as promessas erradas~~ (28/09: rendimento igual ao programa e sem taxa prometida, "nome e CPF fora da blockchain", definição de calote corrigida).
6. Reescrever o "Ponto jurídico" do README (06, seção 4.1).
7. Slide de riscos com a resposta de cada pergunta abaixo.

## Perguntas difíceis da banca e como responder

| Pergunta | Resposta curta |
|---|---|
| "E se o dono e o inquilino combinarem?" | "O fundo só paga com o despejo em andamento; a cobertura cresce com o histórico; o dono tem franquia; e cada pagamento do fundo pode ser contestado pelos investidores. A imobiliária responde com garantia própria." |
| "E se o golpe acontecer mesmo assim?" | "Seguramos o pagamento em quarentena, descredenciamos a imobiliária, levamos o dossiê da blockchain à polícia e cobramos de quem deu o golpe; o recuperado volta ao fundo." Roteiro completo em [08-RESPOSTA-A-GOLPE](08-RESPOSTA-A-GOLPE.md). |
| "Isso não é seguro? Precisa de SUSEP?" | "Em produção, a cobertura é emitida por seguradora parceira ou via sandbox. O programa é o motor de liquidação automática." |
| "Caução e fundo não são duas garantias?" | "Na versão de produção, a única garantia da inquilina é a caução, aplicada em cotas de fundo regulado e cedida ao proprietário (Lei 11.196, art. 88). O 'aluguel garantido' é contratado pelo proprietário." |
| "E a LGPD, com tudo público na blockchain?" | "Na cadeia vão só dados pessoais mínimos; nome, CPF e contrato ficam com a imobiliária. A reputação tem prazo de validade e canal de revisão." |
| "Quem controla o dinheiro?" | "Nenhuma pessoa: os cofres são do programa. Em produção, a atualização do programa fica num multisig com timelock e build verificável." |
| "Por que a inquilina pagaria isso em vez do seguro-fiança?" | "A caução volta com rendimento, não precisa de fiador, e o bom pagador ganha caução menor no próximo aluguel." (Atenção: o preço ainda precisa ser recalibrado; ver 06, seção 4.2.) |
| "Como vocês acham fraude?" | Seção 8 do 06: quatro camadas (tirar o incentivo, ganhar tempo, detectar rastros, identidade e vigilância). |

## Como manter isto vivo

- Toda mudança no software atualiza o Fiador Doc no mesmo trabalho (regra no [README](README.md)).
- Antes da devnet e antes de dinheiro real, rodar de novo o conselho de segurança (skill `conselho-seguranca`: peça "rode o conselho de segurança").
- Ao corrigir uma brecha, levar o teste de `provas/` para a suíte com a asserção invertida e mover o bug para "Corrigidos".
