#!/bin/zsh
# Liga a demo inteira na sua máquina: Solana local + programa + preparação + site.
# Uso: ./scripts/demo-local.sh        (depois abra http://localhost:3000/demo)
# Ctrl+C encerra tudo.
set -euo pipefail
cd "${0:A:h}/.."
export PATH="$HOME/.local/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"
PROGRAM_ID=$(solana address -k target/deploy/fiador-keypair.json)

if [ ! -f target/deploy/fiador.so ]; then
  echo "Compilando o programa…"; anchor build --no-idl
fi

if ! solana -u localhost cluster-version >/dev/null 2>&1; then
  echo "Ligando a Solana local…"
  solana-test-validator --reset --ledger .localnet --bpf-program "$PROGRAM_ID" target/deploy/fiador.so --quiet &
  VALIDATOR=$!
  trap 'kill $VALIDATOR 2>/dev/null' EXIT
  until solana -u localhost cluster-version >/dev/null 2>&1; do sleep 1; done
fi

cd web
if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "\nO site já está rodando: abra http://localhost:3000/demo"
  echo "(Se quiser reiniciar, feche o processo que usa a porta 3000 e rode este comando de novo.)"
  exit 0
fi
[ -d node_modules ] || npm install
echo "Preparando a demo (tBRL, selo, pool)…"
npm run --silent setup
echo "\nAbra http://localhost:3000/demo\n"
npm run dev
