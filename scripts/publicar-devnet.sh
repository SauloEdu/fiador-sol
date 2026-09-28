#!/bin/zsh
# Publica o Fiador.sol na devnet e prepara a demo (tBRL, selo, fundo).
# Uso: ./scripts/publicar-devnet.sh
#
# Antes: a carteira do admin (~/.config/solana/id.json) precisa de ~5 SOL de teste na
# devnet. Pegue em https://faucet.solana.com (login com GitHub) colando o endereço que
# este script mostra. O programa é publicado com o admin como autoridade de atualização,
# e logo em seguida o setup chama o `initialize` (que só aceita essa autoridade: B-A21).
set -euo pipefail
cd "${0:A:h}/.."
export PATH="$HOME/.local/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

RPC="https://api.devnet.solana.com"
ADMIN_KEYPAIR="${ADMIN_KEYPAIR:-$HOME/.config/solana/id.json}"
PROGRAM_KEYPAIR="target/deploy/fiador-keypair.json"
PROGRAM_ID=$(solana address -k "$PROGRAM_KEYPAIR")
ADMIN=$(solana address -k "$ADMIN_KEYPAIR")

echo "Programa: $PROGRAM_ID"
echo "Admin:    $ADMIN"
SALDO=$(solana balance -u "$RPC" -k "$ADMIN_KEYPAIR" | awk '{print $1}')
echo "Saldo do admin na devnet: $SALDO SOL"
if (( $(echo "$SALDO < 5" | bc -l) )); then
  echo "\nFaltam SOL de teste. Abra https://faucet.solana.com, cole o endereço $ADMIN,"
  echo "escolha devnet e peça algumas vezes até passar de 5 SOL. Depois rode este script de novo."
  exit 1
fi

echo "\nCompilando e testando…"
anchor build
cargo test --quiet

echo "\nPublicando o programa na devnet…"
solana program deploy -u "$RPC" \
  --program-id "$PROGRAM_KEYPAIR" \
  --upgrade-authority "$ADMIN_KEYPAIR" \
  --keypair "$ADMIN_KEYPAIR" \
  target/deploy/fiador.so

echo "\nPreparando a demo na devnet (initialize, tBRL, selo, fundo)…"
cp target/idl/fiador.json target/types/fiador.ts web/src/idl/
(cd web && RPC_URL="$RPC" ADMIN_KEYPAIR="$ADMIN_KEYPAIR" DEMO_FILE=".demo.devnet.json" npm run --silent setup)

cat <<FIM

Pronto. O programa está na devnet:
  https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet

Para rodar o site apontando para a devnet na sua máquina:
  cd web && DEMO_FILE=.demo.devnet.json NEXT_PUBLIC_RPC_URL=$RPC NEXT_PUBLIC_CLUSTER=devnet npm run dev

Para hospedar (ex.: Vercel), defina as variáveis de ambiente do projeto:
  NEXT_PUBLIC_RPC_URL=$RPC  (melhor: um RPC dedicado, B-A34)
  NEXT_PUBLIC_CLUSTER=devnet
  DEMO_CONFIG=<a linha DEMO_CONFIG impressa acima>
  DEMO_TOKEN=<uma senha de apresentação; compartilhe só com quem vai apresentar ou avaliar>
  ADMIN_SECRET_KEY=<conteúdo de $ADMIN_KEYPAIR; copie você mesmo, nunca cole em chat>
FIM
