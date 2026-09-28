# Fiador.sol — site da demo

Next.js 16 + `@anchor-lang/core` 1.2 + `@solana/web3.js` 1.x. Fala direto com o programa `fiador`.

## Rodar localmente

```bash
# 1) Solana local com o programa já instalado (na raiz do repositório)
solana-test-validator --reset --ledger .localnet \
  --bpf-program C6wuEPiedMo2hxs6DEHSxefKAEwRkKdcQucbi1DVg2wV target/deploy/fiador.so

# 2) Preparar a demo: tBRL, selo, initialize, reserva de rendimento (gera web/.demo.json)
cd web && npm install && npm run setup

# 3) Site
npm run dev   # http://localhost:3000
```

Para devnet: `RPC_URL=https://api.devnet.solana.com npm run setup` e rode o site com
`NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com NEXT_PUBLIC_CLUSTER=devnet`.

## Páginas

| Rota | O que é |
|---|---|
| `/` | Apresentação do produto |
| `/demo` | Demo ao vivo: imobiliária, inquilino, proprietário, investidor, keeper e roteiro |
| `/reputacao/<carteira>` | Reputação pública de um inquilino (lida do programa) |

## API (servidor)

| Rota | Função |
|---|---|
| `GET /api/estado` | Endereços da demo (tBRL, selo) |
| `POST /api/demo/preparar` | SOL para taxas, credencia a imobiliária, cria conta do proprietário |
| `POST /api/pix/cobranca` · `/api/pix/confirmar` | Pix simulado: gera "copia e cola" e emite tBRL (limite por carteira/hora) |
| `POST /api/keeper` | Cobra atrasos, encerra prazos e faz o acerto final quando o programa permite |

A chave do admin (`~/.config/solana/id.json` ou `ADMIN_KEYPAIR`) fica só no servidor.
As carteiras de demonstração ficam no navegador (`localStorage`) — **só para rede de teste**.

## Teste de ponta a ponta

`npx tsx scripts/e2e.ts` percorre um contrato inteiro contra a rede configurada (~5 min).
