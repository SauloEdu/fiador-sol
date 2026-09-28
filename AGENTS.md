# Instruções para agentes de IA (Fiador.sol)

Leia primeiro `CLAUDE.md` (regras do projeto, ferramentas e comandos), `Fiador Doc/README.md` e `Fiador Doc/00-PAINEL.md`.

## Regra obrigatória: alimentar o Fiador Doc
A pasta `Fiador Doc/` documenta a arquitetura, as funções, as atualizações, os bugs e as decisões do software. **Qualquer IA que assumir o projeto deve atualizá-la no mesmo trabalho em que muda o código**, antes de encerrar:

| Arquivo | Quando atualizar |
|---|---|
| `03-ATUALIZACOES.md` | Sempre: uma entrada por mudança (quem, o quê, por quê, arquivos, verificação, pendências) |
| `02-FUNCOES.md` | Criou, mudou ou removeu instrução, rota de API, função, componente, tela ou script |
| `04-BUGS.md` | Encontrou ou corrigiu um bug (inclusive erro de documentação) |
| `01-ARQUITETURA.md` | Mudou contas, fluxos, ambientes ou a estrutura |
| `05-DECISOES.md` | Escolheu entre caminhos técnicos diferentes |
| `00-PAINEL.md` | Mudou um número, uma prioridade ou a situação do projeto |
| `07-SEGURANCA-SOFTWARE.md` | Mexeu em instrução, rota, chave, dependência ou fronteira (rode o checklist da seção 10) |
| `06-CONSELHO-SEGURANCA.md` | Corrigiu uma brecha do plano (marque como feita) ou rodou uma nova auditoria |
| `08-RESPOSTA-A-GOLPE.md` | Construiu uma camada antifraude ou de resposta a incidente, ou identificou um golpe novo |

Mudança sem registro no Fiador Doc conta como trabalho incompleto.

## Outras regras
- Idioma: português, com explicações simples (o Saulo defende o projeto na banca).
- Nada de commit ou push sem autorização explícita do Saulo.
- Nunca coloque chaves ou credenciais no código do navegador nem no git.
