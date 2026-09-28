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

## MVP do hackathon
Arquitetura completa em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
- [x] Programa Anchor: 16 instruções, 46 testes (`cargo test`)
- [x] Pool de garantia com aviso prévio de saque
- [x] Perfil de reputação + selo Token-2022 intransferível
- [x] Pix simulado + keeper de cobrança automático
- [x] Site da demo (Next.js): imobiliária, inquilino, proprietário, investidor, reputação pública — ver [web/README.md](web/README.md)
- [x] Demo: atraso → keeper cobra → proprietário recebe na hora
- [ ] Publicar na devnet

## Ponto jurídico
Lei 8.245/91, art. 38 §2: caução em dinheiro vai para poupança. Enquadramento proposto:
cessão fiduciária de cotas (art. 37, IV) ou sandbox regulatório.

## Diferencial do time
Fundador opera automação de ações de despejo (Delamôra Advocacia / Beexbe) e tem canal com imobiliárias.
Pitch: *"Eu automatizo ações de despejo. Quero que elas deixem de existir."*
