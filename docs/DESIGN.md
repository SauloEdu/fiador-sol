# Design do Fiador.sol — linhas e jornadas

> 23/09/2026 · Planejamento antes de refazer o site. Skills de referência instaladas no projeto: `frontend-design` e `apple-design` (`.claude/skills/`).

## 1. Por que o design atual foi vetado

O visual atual (fundo quase preto, um único verde-menta vivo) cai nos clichês de interface gerada por IA:

- quase preto com um acento ácido;
- rótulos em MAIÚSCULAS espaçadas acima de cada título;
- informações coladas com "·";
- fonte monoespaçada em rótulos pequenos;
- tudo dividido em cartões iguais com o mesmo arredondamento.

Além disso, é um **painel técnico de demonstração**: mostra as quatro pessoas ao mesmo tempo. Nenhum usuário real usaria o produto assim.

**Regra daqui em diante:** nada de escuro com neon. Cada tela é desenhada para **uma** pessoa, com uma tarefa principal.

## 2. O produto em uma frase, por pessoa

| Pessoa | O que ela quer | Onde usa | Sente que o produto funciona quando… |
|---|---|---|---|
| **Inquilino** | Alugar sem fiador e sem pagar seguro que não volta | Celular | Paga o mês em um toque e vê a caução rendendo e a reputação subindo |
| **Proprietário** | Receber em dia e não entrar na Justiça | Celular, às vezes | Recebe mesmo quando o inquilino atrasa |
| **Imobiliária** | Fechar contratos mais rápido e reduzir inadimplência | Computador, o dia todo | Vê a carteira inteira e só precisa agir nas exceções |
| **Investidor do pool** | Ganhar com prêmios de aluguel com risco visível | Computador | Entende quanto ganha, quanto está travado e o risco |
| **Outra imobiliária (pública)** | Conferir se um inquilino é bom pagador | Link recebido | Confia no histórico sem pedir documento |

O público principal é **não-cripto**. Palavras como "carteira", "token" e "transação" ficam escondidas ou traduzidas: a caução está "guardada no cofre do contrato", e o selo é um "selo de bom pagador".

## 3. Jornadas

### Inquilino — celular, é a jornada principal do vídeo
1. **Convite**: recebe o link da imobiliária no WhatsApp e abre a proposta. A tela mostra o imóvel, o aluguel, a caução exigida (3, 2 ou 1 aluguel, conforme a reputação) e a comparação "sem fiador, sem seguro-fiança".
2. **Entrar**: com e-mail. Na demo, a carteira é criada sozinha e fica invisível.
3. **Caução via Pix**: tela de Pix com "copia e cola", depois a confirmação "Caução guardada no cofre do contrato. Rende 10% ao ano e volta no fim."
4. **Início (uso mensal)**: um bloco dominante, "Próximo aluguel: R$ 2.160 · vence em 10/11", com o botão **Pagar com Pix**. Abaixo:
   - os recibos dos meses pagos;
   - a caução com o rendimento acumulado;
   - os selos.
5. **Atrasou**: aviso claro e sem ameaça: "O aluguel de outubro foi pago ao proprietário com a sua caução. Quite para recompor." O botão vira **Quitar outubro**.
6. **Fim do contrato**: acompanha a janela de vistoria (contestação) e recebe a devolução com rendimento. O selo aparece.
7. **Reputação**: "Compartilhar meu histórico" gera o link público.

### Proprietário — celular, poucas visitas
1. Convite, depois confere os dados do contrato e assina (aprova).
2. **Início**: "Seu aluguel está garantido" mostra quanto de caução e de pool protege o imóvel. Abaixo, a lista de recebimentos (em dia, ou "pago pela caução").
3. No fim do contrato, se houver dano: **Registrar danos**, com valor e fotos. Quem decide é a imobiliária.

### Imobiliária — computador, uso diário
1. **Carteira de contratos** (tela inicial): tabela com imóvel, inquilino, aluguel, situação do mês e garantia disponível. Filtros: *em dia*, *em carência*, *coberto pela caução*, *em contestação*.
2. **Novo contrato**: imóvel, proprietário, inquilino (convite por link), aluguel, prazo e PDF do contrato (só o hash vai para a blockchain). Em seguida, envio dos convites.
3. **Exceções**: atrasos cobrados automaticamente (o keeper, que na interface se chama "cobrança automática") e **contestações para decidir**.
4. **Consultar reputação** de um candidato colando o link ou a carteira.

### Investidor — computador
1. **Pool de garantia**: quanto há no pool, quanto está reservado para contratos, quanto rendeu em prêmios e o histórico de coberturas pagas.
2. **Aportar com Pix**, depois **Pedir saque**, com aviso prévio e contagem visível.

### Modo apresentação (para a banca e os vídeos)
A demo continua existindo, mas como **palco**:
- o celular do inquilino e a tela da imobiliária lado a lado;
- um controle "avançar o tempo" discreto;
- o roteiro de passos.

As telas mostradas são as mesmas do produto real, e não um painel técnico.

## 4. Arquitetura de páginas

```
/                         apresentação (para quem chega pelo link do projeto)
/convite/[contrato]       proposta ao inquilino ou ao proprietário
/inquilino                início do inquilino (mobile-first)
/inquilino/pagar          Pix do aluguel ou da caução
/proprietario             início do proprietário
/imobiliaria              carteira de contratos (desktop)
/imobiliaria/novo         criar contrato
/imobiliaria/contrato/[id]
/pool                     investidor
/reputacao/[carteira]     página pública
/apresentacao             palco da demo (inquilino + imobiliária lado a lado)
```

## 5. Três direções visuais

As três seguem os fundamentos da `apple-design`:
- fonte do sistema, com espaçamento entre letras ajustado por tamanho;
- movimento que responde ao toque, com molas sem quique como padrão;
- materiais translúcidos só na navegação;
- respeito a "reduzir movimento".

O que muda entre elas é **o objeto que dá identidade** ao produto.

### Direção A — "Recibo"
O mundo do aluguel é feito de papel: contrato, recibo, carimbo de PAGO, firma reconhecida. Aqui, **cada mês pago vira um recibo**, e o momento marcante é o **carimbo** caindo sobre o mês.

- **Cores:**
  - Papel `#F5F7FA` (cinza-papel frio, não creme);
  - Tinta `#18233D` (texto);
  - Caneta `#2447C9` (azul de caneta esferográfica, para as ações);
  - Carimbo pago `#2E7A4D`;
  - Carimbo atraso `#B42A22`;
  - Grafite `#697386`.
- **Tipografia:** fonte do sistema (SF Pro no iPhone e no Mac) para toda a interface, com números tabulares. O carimbo usa uma fonte condensada e pesada (Barlow Condensed), em maiúsculas porque carimbos são assim.
- **Layout:** no celular, uma coluna, com o bloco "Próximo aluguel" em cima e os recibos empilhados como folhas.
  ```
  ┌──────────────────────────┐
  │ Próximo aluguel          │
  │ R$ 2.160    vence 10/11  │
  │ [ Pagar com Pix ]        │
  ├──────────────────────────┤
  │ ▭ outubro   ⟦PAGO⟧       │
  │ ▭ setembro  ⟦PAGO⟧       │
  │ ▭ agosto    ⟦COBERTO⟧    │
  └──────────────────────────┘
  ```

### Direção B — "Chave"
Calma de app de banco premium: branco, profundidade suave e um único acento. O objeto é a **chave do imóvel**. O progresso do contrato aparece como uma linha de marcos até "a chave é sua e a caução volta".

- **Cores:** Branco `#FFFFFF`, Névoa `#F1F3F6`, Grafite `#1C1E22` e Azul-petróleo `#0F6E78` (derivado do teal do Pix, dessaturado), com âmbar `#B7791F` e vermelho `#B3261E` só para estados.
- **Tipografia:** só a fonte do sistema, com a hierarquia feita por peso e tamanho.
- **Layout:** muito espaço e cartões só onde há ação. A barra superior é translúcida. Visual seguro e confiável, mas **menos memorável**.

### Direção C — "Planta"
Linguagem de arquitetura: papel vegetal, linhas de cota, **os meses do contrato desenhados como cômodos de uma planta baixa**, que vão sendo "ocupados" conforme se paga.

- **Cores:** Vegetal `#EEF2F5`, Nanquim `#0F1B2D`, Cota `#8FA6BD`, Laranja-obra `#D9532B`.
- **Tipografia:** Archivo, que tem larguras variáveis (condensada nas cotas e normal no texto).
- **Layout:** grade técnica e muito característica. O risco é parecer escritório de arquitetura em vez de produto financeiro.

## 6. Recomendação

**A ("Recibo") como identidade, com o acabamento da B.**

- **A tem um objeto que só este produto tem.** Recibo e carimbo contam a história do Fiador.sol sem texto: pagou, carimbou; atrasou, a caução carimbou por você. Também rende a cena mais forte do vídeo: o carimbo caindo.
- **B garante a confiança.** Fonte do sistema, espaços generosos e movimento sóbrio, que é o que um produto que guarda dinheiro precisa passar.
- **C fica de fora.** É bonita, mas leva o assunto para arquitetura, e não para o dinheiro do aluguel.

Onde gastar a ousadia: **só no carimbo e no selo**. O resto é quieto: papel, tinta, uma cor de ação.

## 7. Escopo até 07/10

| Prioridade | Tela | Por quê |
|---|---|---|
| 1 | Inquilino: início, pagar, atraso e fim | É a estrela do vídeo e o público principal |
| 2 | Imobiliária: carteira de contratos e novo contrato | Mostra o canal de distribuição (B2B) |
| 3 | Palco `/apresentacao` | Grava a demo com as duas telas lado a lado |
| 4 | Reputação pública (refeita) | Fecha a história do "histórico que é seu" |
| 5 | Proprietário e investidor (versões simples) | Completam o ciclo, com menos tempo de tela |

## 8. Decisão (23/09)

Saulo escolheu a **Direção A, Recibo**. As telas estão no canvas de design: https://claude.ai/artifact/SwTMom6oEYX48GNaKG7vM7. O código só é refeito depois da revisão dele.

## 9. Versão com nota 8 (23/09)

- **79 telas** em 6 páginas, geradas a partir de um **cenário único** (a Ana, o Carlos e a Imobiliária Sol), com contas que fecham.
- **Cores finais:** mesa `#E9EDF2`, papel `#FFFEFB`, tinta `#141E36`, grafite `#4F596C`, caneta `#1F3FBF` (só no que é clicável), verde `#23704A` (pago), vermelho `#B0271F` (pago pela caução, perda), roxo `#5A3CB0` (quitado), âmbar `#8A5208` (carência, simulado). Só modo claro.
- **Papel serrilhado** apenas em documentos com valor (recibo, comprovante, decisão, fita); o resto em cartões lisos.
- **Palco da banca** em 5 estados: contrato, agosto pago, atraso, quitação e fim.
- **Nota da IA crítica:** Entrada 8,0 · Inquilino 8,3 · Proprietário 8,3 · Imobiliária 8,1 · Investidor 8,1 · Página inicial e apresentação 8,2 (detalhes em CRITICA-DESIGN.md).


## 10. Versão com cara de banco (23/09)

- **91 telas**; a identidade Recibo (carimbos, cartela, comprovantes em papel) convive com a estrutura de app de banco brasileiro.
- Celular: cabeçalho escuro (tinta) com saudação, ocultar valores e avisos; cartão principal sobreposto; atalhos redondos; barra de abas por perfil.
- Computador: internet banking (barra superior com busca e último acesso, menu lateral escuro, migalhas).
- Valores: "R$" e centavos menores nos saldos; valor inteiro nos documentos.
- Nota final da IA crítica: 9,5 nas seis páginas.
