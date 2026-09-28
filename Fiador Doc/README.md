# Fiador Doc

A memória oficial do software Fiador.sol. Tudo o que o sistema faz, como foi construído, o que mudou e quais bugs foram corrigidos fica aqui.

> **Regra obrigatória.** Qualquer IA (Claude, Codex, Cursor, Copilot ou outra) ou pessoa que alterar o software precisa atualizar o Fiador Doc **no mesmo trabalho em que fez a mudança**, antes de dizer que terminou. Mudança sem registro no Fiador Doc conta como trabalho incompleto.

## Por onde começar

1. **[00-PAINEL.md](00-PAINEL.md):** uma página com a situação, os números e as respostas para a banca.
2. **[01-ARQUITETURA.md](01-ARQUITETURA.md):** como o sistema funciona.
3. **[07-SEGURANCA-SOFTWARE.md](07-SEGURANCA-SOFTWARE.md):** a arquitetura vista só como software: fronteiras, quem pode chamar o quê, chaves, verificação de hoje e arquitetura-alvo.
4. **[06-CONSELHO-SEGURANCA.md](06-CONSELHO-SEGURANCA.md):** o que os 10 especialistas acharam, a antifraude (seção 8) e o plano do que fazer depois (seção 9).
5. **[08-RESPOSTA-A-GOLPE.md](08-RESPOSTA-A-GOLPE.md):** como evitamos o golpe e o roteiro do que fazer se ele acontecer (resposta pronta para a banca).
6. **[04-BUGS.md](04-BUGS.md):** cada brecha, com causa, correção e teste.

## Mapa por assunto

| Assunto | Arquivos |
|---|---|
| **Visão geral e banca** | 00-PAINEL |
| **Como o software funciona** | 01-ARQUITETURA, 02-FUNCOES, 05-DECISOES |
| **Segurança** | 07-SEGURANCA-SOFTWARE (técnica), 06-CONSELHO-SEGURANCA (achados e plano), 08-RESPOSTA-A-GOLPE (fraude e incidentes), `provas/` |
| **Registro do que mudou** | 03-ATUALIZACOES, 04-BUGS |

## O que tem aqui

| Arquivo | Para que serve | Quando atualizar |
|---|---|---|
| [00-PAINEL.md](00-PAINEL.md) | Resumo de uma página: situação, números-chave, o mais urgente e respostas para a banca. | Sempre que um número ou uma prioridade mudar. |
| [01-ARQUITETURA.md](01-ARQUITETURA.md) | Como o software é montado: camadas, contas na Solana, servidor, site, fluxos e ambientes. | Quando mudar a estrutura: conta nova, rota nova, camada nova, novo fluxo, troca de biblioteca. |
| [02-FUNCOES.md](02-FUNCOES.md) | Catálogo de **todas** as funções: instruções do programa, rotas da API, funções das bibliotecas, componentes e telas. | Sempre que criar, renomear, remover ou mudar o comportamento de uma função, rota ou tela. |
| [03-ATUALIZACOES.md](03-ATUALIZACOES.md) | Histórico de atualizações, da mais nova para a mais antiga. | Em **toda** mudança no software, por menor que seja. |
| [04-BUGS.md](04-BUGS.md) | Bugs corrigidos (sintoma, causa, correção) e bugs conhecidos ainda abertos. | Quando corrigir um bug, quando descobrir um bug e não corrigir, e quando um erro de documentação for encontrado. |
| [05-DECISOES.md](05-DECISOES.md) | Decisões técnicas e o motivo de cada uma, em linguagem simples, para defender o projeto na banca. | Quando escolher entre caminhos diferentes (biblioteca, regra, modelo de dados, texto que muda a promessa do produto). |
| [06-CONSELHO-SEGURANCA.md](06-CONSELHO-SEGURANCA.md) | Relatório do conselho de segurança (10 especialistas): veredito sobre as brechas, achados novos, temas jurídicos, econômicos e de dados, e plano por fase. | A cada rodada do conselho (skill `conselho-seguranca`), e quando uma brecha for corrigida, marcando-a no plano. |
| [07-SEGURANCA-SOFTWARE.md](07-SEGURANCA-SOFTWARE.md) | Arquitetura sob a ótica de segurança de software: verificação feita, fronteiras de confiança, matriz de acesso por instrução e por rota, invariantes, chaves, dependências, arquitetura-alvo e checklist para cada mudança. | Quando mudar instrução, rota, chave, dependência ou fronteira; rodar o checklist (seção 10) em toda mudança de software. |
| [08-RESPOSTA-A-GOLPE.md](08-RESPOSTA-A-GOLPE.md) | Golpes esperados, camadas de prevenção (hoje × alvo), sinais de alerta, roteiro de resposta em 6 passos (conter, preservar provas, investigar, agir e comunicar, recuperar, aprender) e respostas para a banca. | Quando uma camada antifraude for construída (marcar ✅), quando um golpe novo for identificado e depois de cada caso real. |
| `provas/` | Provas de conceito do conselho: testes LiteSVM que passam enquanto a brecha existe, e a simulação do fundo. | Ao corrigir uma brecha: levar o teste para a suíte com as asserções invertidas. |

## Como alimentar (passo a passo para qualquer IA)

Ao terminar uma mudança no software:

1. **03-ATUALIZACOES.md**: acrescente uma entrada no topo, usando o modelo abaixo.
2. **02-FUNCOES.md**: se criou, mudou ou removeu função, rota, tela ou instrução, atualize a linha correspondente. Nunca deixe uma função existente fora do catálogo.
3. **04-BUGS.md**: se a mudança corrigiu um bug, mova-o de "Abertos" para "Corrigidos" (ou crie a entrada). Se viu um bug e não corrigiu, registre em "Abertos".
4. **01-ARQUITETURA.md**: se a estrutura mudou, atualize a seção e o diagrama.
5. **05-DECISOES.md**: se escolheu entre alternativas, registre a decisão e o motivo.
6. Rode as verificações (`cargo test` para o programa, `npx tsc --noEmit` dentro de `web/`) e anote o resultado na entrada de atualização.

Escreva em português e em linguagem simples: o Saulo precisa conseguir explicar cada item para a banca.

### Modelo de entrada em 03-ATUALIZACOES.md

```markdown
## AAAA-MM-DD · Título curto da mudança
- **Quem:** nome da IA ou da pessoa (ex.: Claude Opus 5.5)
- **O quê:** o que mudou, em 1 a 3 frases.
- **Por quê:** o motivo (pedido do Saulo, bug, crítica de design…).
- **Arquivos:** caminhos principais.
- **Verificação:** o que foi testado e o resultado (ex.: `cargo test` 46/46; `tsc` sem erros; fluxo X testado no navegador).
- **Pendências:** o que ficou para depois (ou "nenhuma").
```

### Modelo de entrada em 04-BUGS.md

```markdown
### B-000 · Título do bug
- **Status:** corrigido em AAAA-MM-DD | aberto
- **Sintoma:** o que a pessoa via.
- **Causa:** por que acontecia.
- **Correção:** o que foi feito (ou a ideia de correção, se aberto).
- **Arquivos:** onde.
- **Como testar:** o passo que prova que está resolvido.
```

## Relação com os outros documentos

- `docs/ARQUITETURA.md` é o **plano original** do programa (escrito antes do código). O Fiador Doc é o **registro vivo** do que existe de fato. Se os dois divergirem, vale o código, e a divergência deve ser anotada em 04-BUGS.md.
- `docs/SEGURANCA.md` é a **primeira** revisão de segurança (23/09), feita sobre o plano. Tem afirmações que não valem mais (B-A41); a versão atual está em 06, 07 e 08.
- `docs/DESIGN.md` e `docs/CRITICA-DESIGN.md` registram o design (canvas "Fiador.sol — telas Recibo").
- `CLAUDE.md` e `AGENTS.md` (na raiz) repetem a regra obrigatória para as IAs.
