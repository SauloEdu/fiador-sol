---
name: conselho-seguranca
description: Conselho de 10 especialistas que audita a arquitetura e o código do Fiador.sol (programa Anchor na Solana, servidor Next.js, Pix simulado, fundo de garantia, reputação). Cibersegurança com peso dobrado (red team on-chain, red team off-chain e CISO), mais auditor de smart contract, pagamentos Pix, atuário, regulatório financeiro (SUSEP/CVM/BC/Lei do Inquilinato), LGPD, PLD/fraude e SRE. Use para /conselho-seguranca, "auditoria", "revisão de segurança", "avaliem a arquitetura", "procurem brechas", "o que está faltando", ou antes de publicar na devnet ou de mexer com dinheiro real.
---

# Conselho de segurança do Fiador.sol

Dez especialistas avaliam o projeto de forma independente, cada um pela sua lente; depois as conclusões são conferidas contra o código e consolidadas no Fiador Doc. Idioma: português, linguagem simples (o Saulo precisa defender cada item na banca).

## Quem são

| Arquivo | Especialista | Lente |
|---|---|---|
| `especialistas/01-red-team-onchain.md` | Red team on-chain (cyber ofensivo) | Como roubar, travar ou fraudar o programa. **Peso dobrado.** |
| `especialistas/02-red-team-offchain.md` | Red team off-chain / pentester (cyber ofensivo) | Servidor, API, navegador, chaves, dependências, hospedagem. **Peso dobrado.** |
| `especialistas/03-ciso.md` | CISO / arquiteto de segurança (cyber defensivo) | Modelo de ameaças, custódia de chaves, governança, defesa em camadas, o que falta. **Peso dobrado.** |
| `especialistas/04-auditor-smart-contract.md` | Auditor de smart contracts Solana | Correção do programa Anchor linha a linha, invariantes contábeis. |
| `especialistas/05-pagamentos-pix.md` | Engenheiro de pagamentos | Pix, conciliação, estorno/MED, stablecoin, on/off-ramp. |
| `especialistas/06-atuario-risco.md` | Atuário / risco de crédito | Solvência do fundo, taxa de 8%, concentração, corrida de saques. |
| `especialistas/07-regulatorio.md` | Advogado de regulação financeira e imobiliária | SUSEP, CVM, Banco Central, Lei 8.245, CDC. |
| `especialistas/08-lgpd-dpo.md` | Encarregado de dados (DPO) | LGPD, dados on-chain imutáveis, cadastro positivo. |
| `especialistas/09-pld-fraude.md` | Compliance PLD/FT e prevenção a fraude | KYC, lavagem, conluio, contratos falsos. |
| `especialistas/10-sre-operacao.md` | SRE / resposta a incidentes | Keeper, RPC, monitoramento, pausa, recuperação. |

Cada arquivo traz o mandato, o checklist e o que o especialista **não** deve fazer. O formato de saída comum está em `modelo-achado.md`.

## Onde está o material

O código pode estar fora do git (pasta principal do projeto). Descubra a raiz procurando `programs/fiador/src/lib.rs`; em geral é `/Users/sauloeduardo/Projeto Hackatom/`.

Leitura obrigatória para todos, antes de opinar:
1. `Fiador Doc/01-ARQUITETURA.md` (arquitetura como existe hoje, seção 9 = brechas já conhecidas).
2. `Fiador Doc/04-BUGS.md` (B-A08 em diante = brechas já registradas; não repetir, só acrescentar).
3. `Fiador Doc/07-SEGURANCA-SOFTWARE.md` (fronteiras, matriz de acesso, invariantes I1–I8, checklist) `Fiador Doc/06-CONSELHO-SEGURANCA.md` (rodada anterior do conselho) e `Fiador Doc/08-RESPOSTA-A-GOLPE.md` (golpes e roteiro de resposta).
4. `docs/SEGURANCA.md` (13 ameaças originais e correções).
5. `README.md` e `docs/inscricao.md` (promessa do produto).
6. O código da sua lente (cada especialista lista os arquivos).

## Como rodar

1. **Preparar o briefing comum:** raiz do código, lista acima, data de hoje, pedido do usuário e a regra "somente leitura no repositório; rascunhos e provas de conceito só no diretório de rascunho da sessão".
2. **Disparar os 10 especialistas em paralelo** (um subagente por arquivo de `especialistas/`, tipo `general-purpose`, em segundo plano). O prompt de cada um = briefing comum + conteúdo integral do seu arquivo + `modelo-achado.md`.
3. **Consolidar** quando todos voltarem:
   - Junte achados duplicados (mesma causa = um achado, citando todos os especialistas que o viram).
   - **Confira cada achado 🔴 e 🟠 no código** (arquivo e linha). Achado sem evidência verificável vira "hipótese", não bug.
   - Para cada brecha já registrada (B-A08…), registre o veredito do conselho: confirmada, refutada, gravidade ajustada ou correção sugerida melhorada.
   - Separe **falhas** (algo existe e está errado) de **lacunas** (algo que deveria existir e não existe: controle, processo, documento, papel).
   - Em conflito de gravidade, prevalece a maior entre os três de cyber, salvo se outro especialista provar que o cenário é impossível.
4. **Registrar no Fiador Doc** (regra obrigatória do projeto):
   - `Fiador Doc/06-CONSELHO-SEGURANCA.md`: relatório do conselho (resumo executivo, veredito sobre as brechas antigas, achados novos, lacunas, plano por fase: hackathon / devnet pública / dinheiro real, e o profissional dono de cada item).
   - `04-BUGS.md`: novas entradas `B-Axx` para falhas confirmadas; ajustar as antigas conforme o veredito.
   - `01-ARQUITETURA.md` seção 9: atualizar a tabela.
   - `03-ATUALIZACOES.md`: entrada nova.
   - `07-SEGURANCA-SOFTWARE.md`: atualizar as matrizes (seções 3 e 5), a verificação do dia (seção 1: `cargo test`, `cargo clippy`, `tsc`, `npm audit`, busca de segredos) e a arquitetura-alvo.
   - `00-PAINEL.md`: atualizar números, prioridades e respostas para a banca.
   - `08-RESPOSTA-A-GOLPE.md`: marcar ✅ as camadas antifraude e de resposta que passaram a existir, acrescentar golpes novos e revisar o roteiro de resposta.
   - `README.md` do Fiador Doc: manter o guia "Por onde começar" em dia.
5. **Responder ao usuário** com o resumo: quantos achados por gravidade, os 5 mais graves, o que foi refutado, e as lacunas mais importantes.

## Regras do conselho

- Ninguém altera código do projeto numa auditoria. Correções são sugeridas; implementá-las é outra tarefa.
- Toda afirmação técnica cita `arquivo:linha`. Toda afirmação jurídica cita a norma e diz o grau de certeza ("certo", "provável", "a confirmar com especialista").
- Diferenciar sempre **demonstração** (rede local, tBRL sem valor) de **produção** (dinheiro real). Um achado pode ser 🟡 na demo e 🔴 em produção; registre os dois.
- Não repetir o que já está registrado sem acrescentar nada: cite o B-Axx e diga só o que muda.
