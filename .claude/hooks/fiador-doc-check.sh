#!/bin/bash
# Stop hook: impede encerrar se houve mudança de código depois da última
# atualização de "Fiador Doc/03-ATUALIZACOES.md". Regra do CLAUDE.md/AGENTS.md.
entrada=$(cat)
# Já bloqueou uma vez neste ciclo: deixa encerrar para não entrar em loop.
[ "$(printf '%s' "$entrada" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0

raiz="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$raiz" || exit 0
ref="Fiador Doc/03-ATUALIZACOES.md"
[ -f "$ref" ] || exit 0

mudados=$(find programs/fiador/src programs/fiador/tests web/src web/scripts scripts \
  -type f -newer "$ref" -not -path '*/node_modules/*' -not -name '.DS_Store' 2>/dev/null | head -10)
[ -z "$mudados" ] && exit 0

lista=$(printf '%s' "$mudados" | sed 's/^/- /')
motivo="Arquivos de código mudaram depois da última entrada do Fiador Doc:
$lista
Antes de encerrar, atualize o Fiador Doc: entrada nova em 03-ATUALIZACOES.md (sempre), 02-FUNCOES.md se mexeu em funções, 04-BUGS.md se corrigiu bug, 01-ARQUITETURA.md e 05-DECISOES.md quando couber."
jq -n --arg r "$motivo" '{decision: "block", reason: $r}'
