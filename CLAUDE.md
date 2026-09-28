# Fiador.sol
Projeto do hackathon Crypto World's Fair (Colosseum) via Superteam Brasil, na Solana. Prazo: 12/10/2026 23h59 PT.
Leia README.md (visão), `Fiador Doc/00-PAINEL.md` (situação atual) e `Fiador Doc/01-ARQUITETURA.md` (fonte da verdade técnica, o que o código faz). `docs/ARQUITETURA.md` e `docs/SEGURANCA.md` são o plano e a revisão originais (históricos). Também: docs/ROTEIRO-VIDEOS.md, docs/contexto-chat.md (origem) e docs/inscricao.md (formulários).
Saulo está construindo solo com o Claude: explique decisões técnicas em linguagem simples, porque ele precisa defender o projeto na banca.
Idioma: português. Stack: Anchor (Rust) na devnet, Next.js + wallet adapter no front.

## Rotina do Saulo (app "Rotina Fiador" no Mac)
- `rotina/rotina.json` é a lista de tarefas que o app mostra (janela + ícone na barra de menus). O app relê o arquivo a cada 2 s.
- Sempre que combinar algo com o Saulo, concluir uma entrega ou mudar prazos: atualize esse arquivo (adicione, marque `feito`, ajuste `data`) e mude `atualizado` para a data de hoje. Mantenha JSON válido.
- `responsavel`: "voce" (Saulo) ou "claude". Use `detalhe` para o passo a passo em linguagem simples, `copiar` para texto pronto e `link` para o site.
- O Saulo também marca tarefas como feitas pelo app; releia o arquivo antes de editar para não desfazer as marcações dele.
- Código do app em `rotina/app/`; reinstalar com `rotina/app/instalar.sh`.

## Programa (Anchor 1.2)
- Ferramentas: `export PATH="$HOME/.local/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"` (anchor 1.2.0 em ~/.local/bin, Solana CLI 4.2 da Anza).
- Compilar: `anchor build --no-idl` (rápido) ou `anchor build` (gera a IDL para o front). Testar: `cargo test` (LiteSVM 0.16, relógio simulado via `warp`).
- Contas grandes nas structs `#[derive(Accounts)]` vão em `Box<...>`: o limite de pilha da Solana é 4 KB e o build avisa com "overflows the maximum allowed frame space". Esse aviso NÃO pode ser ignorado.
- Anchor 1.x: `CpiContext::new(program_id: Pubkey, accounts)` — passa `token_program.key()`, não `to_account_info()`.
- Chave do programa em `target/deploy/fiador-keypair.json` (fora do git): se perder, o endereço do programa muda.

## Site da demo (web/)
- Next.js 16 + `@anchor-lang/core` 1.2 (web3.js v1). IDL copiada de `target/idl` para `web/src/idl/` — **recopie depois de mudar o programa** (`cp target/idl/fiador.json target/types/fiador.ts web/src/idl/`).
- Rodar: Solana local (`solana-test-validator --reset --ledger .localnet --bpf-program <id> target/deploy/fiador.so`), depois `npm --prefix web run setup`, depois o preview "fiador-web" (.claude/launch.json).
- Chaves do admin/keeper só no servidor (`web/src/lib/server.ts`); carteiras de demonstração no localStorage do navegador.
- Teste de ponta a ponta: `npx tsx scripts/e2e.ts` (dentro de web/, ~5 min por causa do relógio real).
- Rotas do produto (design "Recibo" com cara de banco, igual ao canvas): `/` página inicial, `/apresentacao` Palco da banca (celular da Ana ao vivo + registros da Solana + botão Avançar), `/inquilino` app da Ana, `/proprietario` app do Carlos, `/imobiliaria` painel (cria o contrato), `/investidor` fundo, `/reputacao/[carteira]` página pública. `/demo` é o console técnico antigo.
- Componentes visuais em `web/src/ui/` (index.tsx + ui.module.css); regras da história (nomes, meses, cartela, cofre) em `web/src/lib/historia.ts`. Estado compartilhado entre abas: `DemoProvider` + `useDemo` (eventos no localStorage e BroadcastChannel).

## Fiador Doc (obrigatório para qualquer IA)
A pasta `Fiador Doc/` é o registro oficial do software. Toda IA que mexer no projeto **precisa atualizá-la no mesmo trabalho**, antes de dar a tarefa por terminada:
- `03-ATUALIZACOES.md`: uma entrada nova em **toda** mudança (quem, o quê, por quê, arquivos, verificação, pendências).
- `02-FUNCOES.md`: ao criar, mudar ou remover instrução, rota, função, componente, tela ou script.
- `04-BUGS.md`: ao achar ou corrigir bug (erros de documentação também).
- `01-ARQUITETURA.md` e `05-DECISOES.md`: quando mudar a estrutura ou escolher entre caminhos.
- Segurança: rodar o checklist de `07-SEGURANCA-SOFTWARE.md` (seção 10) em toda mudança de software; ao corrigir uma brecha, marcar no plano do `06-CONSELHO-SEGURANCA.md` e levar o teste de `provas/` para a suíte com as asserções invertidas; ao construir uma camada antifraude ou de resposta (pausa, suspensão, quarentena), marcar ✅ em `08-RESPOSTA-A-GOLPE.md`.
- `00-PAINEL.md`: quando um número ou uma prioridade mudar.
- Antes da devnet e de dinheiro real, rodar a skill `conselho-seguranca` ("rode o conselho de segurança").
Leia `Fiador Doc/README.md` para os modelos. Mudança sem registro é trabalho incompleto. Um hook de encerramento (`.claude/hooks/fiador-doc-check.sh`) avisa quando há código mais novo que o `03-ATUALIZACOES.md`.
