# Formato de saída de cada especialista

Devolva **só** o relatório abaixo, em português, no máximo ~1.800 palavras. Sem introdução sobre você.

## 1. Veredito sobre as brechas já registradas
Uma linha por B-Axx que a sua lente alcança (ignore as outras):
`B-Axx · confirmada | refutada | gravidade → X | correção sugerida ruim → melhor: … · motivo curto · arquivo:linha`

## 2. Achados novos (falhas)
Para cada um, do mais grave para o menos grave:

```
### [SIGLA-n] Título curto
- Gravidade: 🔴 crítica | 🟠 alta | 🟡 média | ⚪ baixa  (demo: X · produção: Y, se diferentes)
- Onde: arquivo:linha (ou "processo", "contrato jurídico", "hospedagem")
- Cenário de ataque/falha: passo a passo concreto, com quem faz o quê e quanto se perde.
- Evidência: o trecho do código ou a norma que prova.
- Correção: o que mudar, do jeito mais simples que resolve.
- Confiança: alta (verifiquei) | média | hipótese (precisa de teste)
```

Use a sigla do seu arquivo (ex.: RTO-1, RTF-1, CISO-1, SC-1, PIX-1, ATU-1, REG-1, LGPD-1, PLD-1, SRE-1).

## 3. Lacunas (o que deveria existir e não existe)
`- [SIGLA-Ln] O que falta · por que importa · quando é necessário (hackathon | devnet pública | dinheiro real)`

## 4. Três prioridades
As três ações que você faria primeiro, na ordem.
