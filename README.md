# Fiador.sol

Garantia locatícia on-chain na Solana: caução via Pix que rende, fiador coletivo e reputação de bom pagador.

## O problema
- Fiador: constrangedor e cada vez mais raro.
- Seguro-fiança: caro (1–2 aluguéis/ano) e não volta.
- Caução: parada rendendo poupança.
- Inadimplência vira ação de despejo que leva meses.

## A solução
1. **Caução que rende** — depósito via Pix → stablecoin → escrow (programa Anchor).
   - Atraso > X dias: proprietário recebe automaticamente.
   - Fim do contrato sem pendência: caução volta ao inquilino com rendimento.
2. **Fiador coletivo** — pool onde investidores garantem vários inquilinos e recebem a taxa que hoje vai para a seguradora.
3. **Reputação de bom pagador** — selo on-chain intransferível (Token-2022) por mês pago em dia; histórico reduz a caução no próximo aluguel.

## O que está pronto (hackathon)
Documentação viva do software em [Fiador Doc/](Fiador%20Doc/README.md) (comece pelo [painel](Fiador%20Doc/00-PAINEL.md)).

**Programa na Solana** (Anchor 1.2, `programs/fiador`): 21 instruções e **66 testes** (`cargo test`).
- [x] Caução num cofre do contrato; cobrança automática do atraso depois da carência; devolução com rendimento simulado
- [x] Fundo de garantia com cotas, aviso prévio de saque e limite de 50% por imobiliária
- [x] **Antifraude:** cobertura do fundo cresce ¼ de aluguel por mês pago (cheia em 12 meses) e franquia de 20% do proprietário
- [x] **Resposta a golpe:** pausa de emergência, suspensão de imobiliária e quarentena do pagamento do fundo (congelar, cancelar, liberar)
- [x] Reputação de bom pagador e selo Token-2022 intransferível (3º, 6º e 12º pagamento em dia)
- [x] Proteções: não paga mês adiantado, dívida com o dono registrada, disputa não reabre, aluguel mínimo, mês máximo, imobiliária ≠ proprietário, `initialize` só por quem publicou o programa, eventos em cada movimentação

**Site** (Next.js, `web/`), design de app de banco:
- [x] Apps da inquilina (`/inquilino`), do proprietário (`/proprietario`), da imobiliária (`/imobiliaria`) e do investidor (`/investidor`)
- [x] **Palco da banca** (`/apresentacao`): o celular da Ana ao vivo e cada registro da Solana aparecendo na hora
- [x] **Central de risco** (`/risco`): a cena "e se for golpe?"
- [x] Reputação pública (`/reputacao/[carteira]`), Pix simulado e cobrança automática
- [x] Senha de apresentação (`DEMO_TOKEN`) nas rotas que usam a chave do admin

**Rodar na sua máquina:** `./scripts/demo-local.sh` e abra http://localhost:3000/apresentacao
**Publicar na devnet:** `./scripts/publicar-devnet.sh` (precisa de ~5 SOL de teste na carteira do admin)
- [ ] Programa publicado na devnet

## Segurança
Revisão por um conselho de 10 especialistas (cibersegurança, smart contract, Pix, atuário, regulação, LGPD, fraude, operação): [06-CONSELHO-SEGURANCA](Fiador%20Doc/06-CONSELHO-SEGURANCA.md). Cada brecha corrigida tem teste; as abertas estão em [04-BUGS](Fiador%20Doc/04-BUGS.md). Roteiro contra golpes: [08-RESPOSTA-A-GOLPE](Fiador%20Doc/08-RESPOSTA-A-GOLPE.md).

## Ponto jurídico (proposta, a validar com advogado)
- A inquilina oferece **uma única garantia**: a caução (Lei 8.245/91, art. 37, parágrafo único, proíbe mais de uma). Em produção, a caução fica aplicada em cotas de fundo regulado em nome dela e cedida ao proprietário (cessão fiduciária de cotas, art. 37, IV, e Lei 11.196/2005, art. 88).
- A cobertura do fundo vira um "aluguel garantido" contratado pelo proprietário ou pela imobiliária, emitido por seguradora parceira ou dentro do sandbox regulatório. O programa na Solana é o motor que liquida os pagamentos automaticamente.
- Rendimento só de aplicação real, sem taxa prometida. Detalhes: [06, seção 4](Fiador%20Doc/06-CONSELHO-SEGURANCA.md).

## Diferencial do time
Fundador opera automação de ações de despejo (Delamôra Advocacia / Beexbe) e tem canal com imobiliárias.
Pitch: *"Eu automatizo ações de despejo. Quero que elas deixem de existir."*
