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

### Semana 2 · prazo 28/09, 8h PDT (12h de Brasília)

| Tempo | Imagem | Fala |
|---|---|---|
| 0:00–0:08 | Rosto | **EN:** "Hi, I'm Saulo, building Fiador.sol: a rent guarantee on Solana that replaces the guarantor in Brazil." <br>**PT:** Oi, sou o Saulo e estou construindo o Fiador.sol: uma garantia de aluguel na Solana que substitui o fiador no Brasil. |
| 0:08–0:25 | Tela: código e `cargo test` 46/46 | **EN:** "This week we went from a program to a product. The Anchor program has 16 instructions and 46 passing tests: deposit escrow, automatic payment to the landlord when rent is late, a guarantee pool and on-chain reputation." <br>**PT:** Nesta semana saímos de um programa para um produto. O programa Anchor tem 16 instruções e 46 testes passando: cofre da caução, pagamento automático ao proprietário quando o aluguel atrasa, um fundo de garantia e reputação on-chain. |
| 0:25–0:38 | Tela: Palco com o celular da Ana e os registros da Solana | **EN:** "On top of it, a banking-style app for each person (tenant, landlord, agency and investor) and a live stage that shows every Solana transaction as it happens." <br>**PT:** Em cima dele, um app com cara de banco para cada pessoa (inquilina, proprietário, imobiliária e investidor) e um palco ao vivo que mostra cada transação da Solana na hora. |
| 0:38–0:55 | Tela: `Fiador Doc/08-RESPOSTA-A-GOLPE.md` ou rosto | **EN:** "Then we attacked our own design. A ten-expert security review found 40 issues. The biggest one is collusion between landlord, tenant and agency. Our answer: coverage that grows with payment history, a landlord deductible, and fund payouts held in quarantine." <br>**PT:** Depois atacamos nosso próprio desenho. Uma revisão de segurança com dez especialistas achou 40 problemas. O maior é o conluio entre proprietário, inquilina e imobiliária. Nossa resposta: cobertura que cresce com o histórico de pagamentos, franquia do proprietário e pagamentos do fundo em quarentena. |
| 0:55–1:00 | Rosto | **EN:** "Next week: shipping those fixes and deploying to devnet. Thanks!" <br>**PT:** Semana que vem: essas correções e a publicação na devnet. Obrigado! |

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
