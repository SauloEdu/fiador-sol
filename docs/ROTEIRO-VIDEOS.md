# Roteiro de gravação — Fiador.sol

> Dois vídeos para a submissão na Colosseum: **pitch** e **demo técnica**.
> Regras da Colosseum (conferidas em 27/09): **pitch de 2 a 3 minutos** e **demo técnica de no máximo 3 minutos**. O pitch é a primeira coisa que os jurados assistem e decide se o projeto passa para a avaliação detalhada. O roteiro traz a fala em inglês (para a banca global) e a tradução logo abaixo, para você saber exatamente o que está dizendo.
> ⚠️ Os números marcados com † devem ser conferidos com fonte antes de gravar.

## O que gravar e quando

| Take | O quê | Onde | Quando dá para gravar |
|---|---|---|---|
| A | Você falando para a câmera (abertura, problema, time, fechamento) | Celular na horizontal, rosto + ombros | **Já** — só depende do texto |
| B | Tela do app: fluxo completo da demo | Gravação de tela do Mac | Depois do app pronto (~09/10) |
| C | Tela do código e dos testes passando | Gravação de tela do Mac | Depois do programa pronto (~03/10) |
| D | Explorer da Solana mostrando a transação | Gravação de tela | Junto com o take B |
| E (opcional) | Imagens de apoio: fachada de prédio, placa "aluga-se", contrato em papel | Celular | Qualquer momento |

Grave o take A agora em uma versão de treino. Você vai regravar no fim, mais solto, mas treinar cedo muda o resultado.

---

## Vídeo 1 — Pitch (≈ 2min45)

| Tempo | Imagem | Fala |
|---|---|---|
| 0:00–0:15 | Take A, olhando para a câmera | **EN:** "I'm Saulo. My company automates eviction lawsuits for unpaid rent in Brazil. I built Fiador.sol so those lawsuits stop being necessary." <br>**PT:** Sou o Saulo. Minha empresa automatiza ações de despejo por falta de pagamento no Brasil. Construí o Fiador.sol para que essas ações deixem de ser necessárias. |
| 0:15–0:50 | Take A + imagens E ou texto na tela | **EN:** "To rent a home in Brazil you need a guarantee. A guarantor — a friend who puts their own property at risk. Rent insurance — costing about one month's rent every year†, money you never see again. Or a cash deposit that sits in a savings account. And when a tenant stops paying, the landlord waits months† in court." <br>**PT:** Para alugar um imóvel no Brasil você precisa de garantia. Um fiador — um amigo que arrisca o próprio imóvel. Seguro-fiança — cerca de um aluguel por ano, dinheiro que não volta. Ou caução parada na poupança. E quando o inquilino para de pagar, o proprietário espera meses na Justiça. |
| 0:50–1:20 | Take A → diagrama simples (3 blocos) | **EN:** "Fiador.sol replaces all of that on Solana. The tenant pays the deposit with Pix. It goes into an on-chain escrow and earns yield. If rent is late, the landlord is paid automatically — no court, no waiting. A community pool backs tenants and earns the premium insurers charge today. And every on-time payment builds a reputation the tenant owns." <br>**PT:** O Fiador.sol substitui tudo isso na Solana. O inquilino paga a caução com Pix. Ela vai para um cofre on-chain e rende. Se o aluguel atrasa, o proprietário recebe automaticamente — sem Justiça, sem espera. Um pool coletivo garante os inquilinos e ganha a taxa que as seguradoras cobram hoje. E cada pagamento em dia constrói uma reputação que é do inquilino. |
| 1:20–2:00 | Take B acelerado (trechos da demo) | **EN:** "Here, one month lasts sixty seconds. The tenant pays month one — the landlord receives instantly. Month two, no payment. After the grace period, the contract pays the landlord from the deposit. On screen, in seconds." <br>**PT:** Aqui, um mês dura sessenta segundos. O inquilino paga o mês um — o proprietário recebe na hora. Mês dois, sem pagamento. Depois da carência, o contrato paga o proprietário com a caução. Na tela, em segundos. |
| 2:00–2:20 | Take B: selo na carteira + página de reputação | **EN:** "At the end, the deposit comes back with yield, and the tenant gets a non-transferable 'good payer' badge. Next time they rent, they need a smaller deposit." <br>**PT:** No fim, a caução volta com rendimento e o inquilino ganha um selo intransferível de bom pagador. No próximo aluguel, precisa de caução menor. |
| 2:20–2:35 | Take A | **EN:** "Why Solana? Fees of a fraction of a cent and instant settlement — the only way monthly rent for millions of Brazilian families† makes sense on-chain." <br>**PT:** Por que Solana? Taxas de fração de centavo e liquidação instantânea — o único jeito de o aluguel mensal de milhões de famílias brasileiras fazer sentido on-chain. |
| 2:35–2:50 | Take A | **EN:** "I already work with real-estate agencies every day — they are our distribution. Next step: a pilot with partner agencies in Brasília. I'm Saulo, this is Fiador.sol. Thank you." <br>**PT:** Já trabalho com imobiliárias todos os dias — elas são nossa distribuição. Próximo passo: um piloto com imobiliárias parceiras em Brasília. Sou o Saulo, este é o Fiador.sol. Obrigado. |

> Se conseguir uma carta de interesse de uma imobiliária antes de gravar, troque a frase do piloto por: "Agency X has already committed to a pilot." Isso vale mais que qualquer slide.

---

## Vídeo 2 — Demo técnica (≈ 2min45)

Só gravação de tela, com sua voz por cima. Pode ler o texto.

| Tempo | Tela | Fala |
|---|---|---|
| 0:00–0:20 | Diagrama da arquitetura (ARQUITETURA.md, seção 1) | **EN:** "Fiador.sol has three layers: an Anchor program on Solana that holds every rule involving money, a Next.js app, and a keeper that triggers late-payment claims." <br>**PT:** O Fiador.sol tem três camadas: um programa Anchor na Solana com todas as regras que envolvem dinheiro, um app Next.js e um keeper que aciona a cobrança de atraso. |
| 0:20–0:50 | Código: contas `Lease`, `Pool`, `TenantProfile` | **EN:** "Each lease is a program account. The deposit sits in a vault only the program can sign for. Terms are copied into the lease, so the admin can't change the rules of a signed contract." <br>**PT:** Cada contrato é uma conta do programa. A caução fica num cofre que só o programa pode movimentar. Os termos são copiados para o contrato, então o admin não muda as regras de um contrato assinado. |
| 0:50–1:20 | Código: `claim_default` | **EN:** "Anyone can call claim_default, but the program checks the clock and the period state. It can only act on an unpaid, overdue period — and never twice. The keeper just presses the button." <br>**PT:** Qualquer um pode chamar o claim_default, mas o programa confere o relógio e o estado do período. Só age em período vencido e não pago — e nunca duas vezes. O keeper só aperta o botão. |
| 1:20–1:45 | Take C: terminal com testes passando | **EN:** "We tested the attacks that matter: a landlord and tenant colluding to drain the pool, fake reputation from one-second leases, double payment, and investors fleeing before a default." <br>**PT:** Testamos os ataques que importam: proprietário e inquilino combinados para drenar o pool, reputação fabricada com contratos de um segundo, pagamento em dobro e investidor fugindo antes de um calote. |
| 1:45–2:25 | Take B + D: fluxo real na devnet e a transação no explorer | **EN:** "Live on devnet: Pix is simulated and mints a test BRL stablecoin. Here the deposit enters the vault... here the default is claimed... and here is the transaction on the explorer." <br>**PT:** Ao vivo na devnet: o Pix é simulado e emite uma stablecoin de real de teste. Aqui a caução entra no cofre... aqui a cobrança do atraso... e aqui a transação no explorer. |
| 2:25–2:45 | README com "próximos passos" | **EN:** "Next: a real BRL on-ramp, an embedded wallet so tenants never see crypto, and a legal structure as a fiduciary assignment of fund shares, which Brazilian rental law already allows." <br>**PT:** Próximos passos: on-ramp real em reais, carteira embutida para o inquilino nunca ver cripto, e estrutura jurídica como cessão fiduciária de cotas, que a Lei do Inquilinato já permite. |

---

## Updates semanais (1 minuto, opcionais, mas contam muito)

A Colosseum pede um vídeo de 1 minuto por semana com o progresso e as dificuldades da semana. Não é obrigatório, mas mostra ritmo, e os jurados podem perguntar sobre isso na entrevista. Só o time, os jurados e a Colosseum veem.

**Como gravar (15 minutos):** celular na horizontal para o rosto nos primeiros 10 s, depois a tela do Mac mostrando o Palco (`/apresentacao`) e as telas. Pode ler o texto num teleprompter. Não precisa editar muito: legenda automática do CapCut e pronto.

### Semana 2 · versão final (28/09)

Página de gravação com as cenas, o que clicar, a edição e o teleprompter: https://claude.ai/artifact/TeJbU8xJ9yGEjyFh6o4fvv

**Ideia:** contar uma história, sem números técnicos. Quem assiste precisa ver o Carlos recebendo **sozinho**.

| Tempo | Imagem | Fala (PT) | Legenda (EN) |
|---|---|---|---|
| 0:00–0:08 | Rosto | "Eu trabalho com ações de despejo. Todo mês eu vejo proprietário sem receber e inquilino sem fiador. Então eu construí o Fiador.sol." | I work on eviction lawsuits. Every month I see landlords unpaid and tenants with no guarantor. So I built Fiador.sol. |
| 0:08–0:22 | Palco: contrato, caução, agosto pago | "A Ana aluga sem fiador. A caução vai por Pix para um cofre na Solana que ninguém consegue mexer. Ela paga agosto, e o Carlos recebe na hora." | Ana rents with no guarantor. Her deposit goes via Pix into a vault on Solana that nobody can touch. She pays August, and Carlos gets paid instantly. |
| 0:22–0:36 | Palco: setembro atrasa, carimbo PAGO PELA CAUÇÃO | "Agora ela atrasa setembro. Sem advogado, sem Justiça: acabou a carência, e o cofre pagou o Carlos sozinho. Está tudo registrado aqui, na blockchain." | Now she misses September. No lawyer, no court: when the grace period ends, the vault pays Carlos on its own. Every step is recorded on-chain. |
| 0:36–0:50 | Central de risco: pausar e suspender | "Essa semana a gente atacou o próprio sistema, com dez especialistas. E se for golpe? Um clique: o fundo para, a imobiliária é suspensa, e o pagamento do fundo fica em quarentena." | This week we attacked our own system with ten experts. What if it's fraud? One click: the fund stops, the agency is suspended, and the fund's payout is held in quarantine. |
| 0:50–1:00 | Rosto | "Próximo passo: devnet e um piloto com imobiliárias em Brasília. Fiador.sol: aluguel sem fiador, e proprietário sem calote." | Next: devnet and a pilot with real estate agencies in Brasília. Fiador.sol: renting without a guarantor, and landlords who always get paid. |

### Semana 3 · prazo provável 05/10

Mostrar: correções antifraude funcionando (cena "e se for golpe?"), programa na devnet com o link do explorador, e o que as imobiliárias disseram (carta de interesse ou conversas). Texto será montado no dia com o que de fato foi feito.

---

## Dicas de gravação

- **Celular na horizontal**, na altura dos olhos, de frente para uma janela (luz natural no rosto, nunca atrás).
- **Áudio importa mais que imagem:** use o fone com microfone ou um lapela; grave em cômodo com cortinas/móveis (menos eco).
- **Teleprompter:** um app gratuito de teleprompter no próprio celular. Leia devagar; é normal gravar cada bloco 3–4 vezes.
- **Gravação de tela no Mac:** `Cmd + Shift + 5` → "Gravar tela inteira". Aumente o zoom do navegador para 125% para a banca enxergar.
- **Legendas em inglês** no vídeo final (CapCut gera automaticamente) — muitos avaliadores assistem sem som.
- **Edição:** CapCut ou iMovie. Corte pausas; use o take B acelerado (1,5×–2×) onde for só espera.
- Publique no YouTube como **não listado** e cole o link na submissão.

## Checklist antes de enviar

- [ ] Vídeo de pitch dentro do limite de tempo
- [ ] Vídeo técnico dentro do limite de tempo
- [ ] Números marcados com † conferidos com fonte
- [ ] Legendas em inglês
- [ ] Links do YouTube abertos em aba anônima (funcionam sem login)
- [ ] Link do repositório público e README atualizado
- [ ] Programa implantado na devnet e endereço no README
