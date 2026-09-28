# Plano de expansão internacional · Fiador.sol

> Pesquisa de 27/09/2026. Cada fato tem fonte (números entre colchetes, lista no fim). O que está marcado como **leitura nossa** é avaliação da equipe, não fato. O que não foi confirmado está dito. Antes de usar números em público, confira a fonte.

## 1. A tese em uma frase

Todo país que aluga imóveis precisa de uma garantia, e em quase todos ela é cara, lenta ou constrangedora. O Fiador.sol é um **motor de liquidação automática** (cofre + regras + reputação) que se encaixa em qualquer país; o que muda de um país para outro é **o parceiro regulado** que assume o risco e **qual módulo de garantia** a lei permite.

**Para investidores:** "Começamos no Brasil, onde a dor é grande e temos distribuição pelas imobiliárias. O mesmo programa serve em outros países: muda o parceiro local e o tipo de garantia, não o produto."

## 2. O que a pesquisa mostrou (padrão que se repete)

1. **Um fundo que paga o proprietário quando o inquilino atrasa é tratado como seguro ou fiança regulada em quase todos os países.** Os concorrentes dos EUA vendem apólice ou *surety bond* [7][6]; os do Reino Unido são produtos de seguro autorizados pela FCA [36]; no Brasil, seguro-fiança exige autorização da SUSEP [41].
   **Leitura nossa:** a expansão sempre passa por uma seguradora ou afiançadora parceira local. O Fiador.sol vira a infraestrutura; a entidade regulada fica com o risco.
2. **Onde a caução existe, a lei costuma dizer onde ela fica:** banco na Alemanha [17], esquema oficial no Reino Unido [34], órgão regional na Espanha [26], poupança no Brasil [40]. Na Colômbia, depósito em dinheiro é proibido para moradia [55].
   **Leitura nossa:** o produto precisa ser modular: "caução no cofre" onde a lei permite; "garantia sem depósito" (fiança) onde não permite.
3. **Stablecoin está saindo da zona cinzenta:** GENIUS Act nos EUA (lei desde 18/7/2025; vigência até 18/1/2027) [14][15]; MiCA na UE (fim da transição em 1/7/2026, USDC é compatível) [32][33]; regime da FCA no Reino Unido em 25/10/2027 [38]; BCB no Brasil desde 2/2/2026 [45].
   **Leitura nossa:** usar sempre stablecoin de emissor regulado e operar por prestador autorizado; nunca emitir moeda própria em produção.
4. **O preço do risco decide quem sobrevive:** o QuintoAndar fechou a QuintoCred em 2025 (45 mil contratos, ~3 mil imobiliárias); um comprador recusou a carteira pelo risco e porque a taxa era ~5%, contra ~10% no mercado [44]. A taxa de 8% do Fiador.sol fica entre as duas.
5. **A ideia de premiar o bom pagador já tem precedente:** a Hoggax, na Argentina, dá desconto na próxima garantia para quem pagou em dia [53]. A diferença do Fiador.sol é a reputação ser do inquilino, portátil e verificável.

## 3. País por país

| Mercado | Quem aluga | Garantia hoje | Obstáculo principal | Como o Fiador.sol funcionaria | Atratividade |
|---|---|---|---|---|---|
| **Brasil** | 17,8 mi de domicílios (23%) [46] | caução até 3 aluguéis, fiador, seguro-fiança, título de capitalização [40] | SUSEP para o fundo; BCB para cripto [41][45] | produto atual, com a tese jurídica refeita e seguradora parceira | **mercado-base** |
| **Argentina** | não confirmado | depósito e moeda livres desde o DNU 70/2023 [52]; Hoggax online [53] | registro de prestador de cripto na CNV [54] | caução em dólar digital no cofre + reputação; concorrer com a Hoggax na reputação portátil | **alta** |
| **México** | 6,1 mi de famílias (15,7%) [51] | 1 mês de depósito + aval (fiador com imóvel) ou póliza jurídica [47] | Banxico proíbe bancos de operar cripto [50] | "renta garantizada" com parceiro fora do sistema bancário; substituir o aval | **média** |
| **Chile** | não confirmado | 1–2 meses + aval [59]; despejo acelerado pela Lei 21.461 [60] | registro na CMF (Lei Fintec) [61] | caução no cofre + fundo com seguradora parceira | **média** |
| **Portugal** | não confirmado | caução até 2 rendas + fiador [29] | mercado pequeno | porta de entrada na Europa: mesma língua e mesma cultura de fiador | **média** |
| **Espanha** | 26,4% da população [21] | fiança de 1 mês num órgão regional + garantia adicional até 2 meses [26][27] | despejo de 6 a 15 meses [28]; licença MiCA | só a "garantia adicional" e o seguro contra falta de pagamento, com parceiro | **média** |
| **EUA** | 45,3 mi de famílias [16] | depósito limitado por estado (1 mês na CA e em NY) [1][3] | seguro regulado estado a estado; concorrentes com mais de US$ 100 mi captados [7][8][10] | infraestrutura (B2B) para garantidoras ou nicho de estados que aceitam alternativa ao depósito (ex.: Flórida [4]) | **média** |
| **Reino Unido** | 4,7 mi de famílias (Inglaterra) [39] | até 5 semanas, em esquema oficial [34] | FCA; fim do despejo sem justa causa [35] | só como seguro parceiro autorizado | **baixa-média** |
| **Alemanha** | 53% da população [21] | até 3 aluguéis, em banco [17] | depósito obrigatoriamente em banco; seguradoras grandes dominam [19] | só como seguro-caução com seguradora | **média-baixa** |
| **França** | 38,6% [21] | 1 mês + garantia Visale gratuita do governo [22][23] | o governo já dá de graça | não priorizar | **baixa** |
| **Colômbia** | não confirmado | depósito proibido; só fiança, apólice ou codevedor [55] | modelo de caução é ilegal | só como afiançadora (taxa + reputação), sem cofre de caução | **baixa** (modelo atual) |

## 4. Plano de expansão por fase

**Leitura nossa.** Datas são metas, não compromissos; cada fase só começa quando a anterior provar os números (inadimplência, preço, recuperação).

| Fase | Quando (meta) | Onde | O que precisa estar pronto |
|---|---|---|---|
| **0 · Provar** | 2026–2027 | Brasil (piloto em Brasília) | 1–2 imobiliárias parceiras, fundo pequeno e teto baixo por contrato; tese jurídica refeita; seguradora ou sandbox SUSEP; parceiro de Pix e stablecoin autorizado pelo BCB; auditoria do programa |
| **1 · Crescer no Brasil** | 2027–2028 | Capitais do Brasil | preço por faixa de risco; reputação com volume; integração com os sistemas das imobiliárias |
| **2 · América Latina** | 2028 | Argentina → Chile → México | parceiro regulado em cada país; stablecoin em dólar ou moeda local; tradução do produto; em México, parceiro fora do sistema bancário |
| **3 · Europa pela porta de Portugal** | 2028–2029 | Portugal → Espanha | licença MiCA via parceiro; stablecoin em euro compatível; módulo "garantia adicional" para a Espanha |
| **4 · EUA como infraestrutura** | 2029+ | EUA | vender o motor (liquidação + reputação) para garantidoras e seguradoras, em vez de competir de frente com Rhino/Jetty e TheGuarantors |

**Por que essa ordem:**
- América Latina primeiro: a dor do fiador é parecida, a regulação é mais leve (Argentina livre [52], Chile com lei clara [61]), e há concorrentes menores (Homie captou US$ 1,3 mi + US$ 7 mi [48][49]).
- Portugal antes da Espanha: mesma língua e mesma cultura de fiador; serve de base para a licença MiCA e para entrar na UE.
- EUA por último e como B2B: é o maior mercado, mas saturado e fragmentado por estado.
- França, Alemanha, Reino Unido e Colômbia ficam fora do plano inicial pelos motivos da tabela.

## 5. Como o produto precisa mudar para ser global

| Peça | Hoje | Versão global |
|---|---|---|
| Garantia | caução no cofre | módulos: **cofre de caução** (onde a lei deixa), **garantia sem depósito** (fiança/seguro), **garantia adicional** (Espanha) |
| Quem assume o risco | fundo de investidores | seguradora ou afiançadora parceira local; o fundo on-chain vira o motor de pagamento e pode ser o resseguro |
| Moeda | tBRL de teste | stablecoin de emissor regulado de cada país (ex.: USDC; euro compatível com MiCA) |
| Reputação | por carteira, só dentro do Fiador.sol | **portátil entre países**, ligada à identidade verificada, com consentimento e prazo de validade |
| Parâmetros | fixos na Config | por país: limite de caução, carência, prazo de devolução, prazo máximo do registro negativo |
| Idioma e telas | português | português, espanhol e inglês |

**A vantagem que ninguém tem (leitura nossa):** um histórico de bom pagador **que atravessa fronteiras**. Um brasileiro que se muda para Portugal ou uma argentina que se muda para o Chile chega sem histórico local. Com o Fiador.sol, ela leva a reputação. Não encontramos nenhum projeto on-chain de aluguel que junte fundo de garantia e reputação; o mais próximo é o RentLock, escrow na Solana ainda sem dinheiro real [62] (busca não exaustiva).

## 6. Modelo de negócio na expansão

1. **Taxa por contrato (B2B2C):** uma parte da taxa de garantia fica com a plataforma; a imobiliária vende.
2. **Licença do motor (B2B):** seguradoras e garantidoras usam o Fiador.sol para liquidar pagamentos automaticamente e pagam por contrato ativo.
3. **Reputação verificada:** imobiliárias e proprietários consultam o histórico (com autorização da inquilina) e pagam pela consulta.

## 7. Riscos da expansão

- **Regulação:** cada país exige parceiro e licença; sem parceiro, não há entrada.
- **Preço do risco:** errar a taxa quebra o fundo (caso QuintoCred [44]).
- **Concorrência bem financiada** nos EUA e na Europa [7][10][19].
- **Garantia pública gratuita** pode anular o produto (França, Visale [23]).
- **Dados pessoais:** a reputação portátil precisa cumprir LGPD, GDPR e as leis locais (direito de corrigir e apagar, prazo de validade).
- **Cripto em mudança:** regras novas entrando em vigor em 2026–2027 [15][33][38].

## 8. Frases para a banca

- "Garantia de aluguel é um problema mundial. Nos EUA há 45 milhões de famílias que alugam; no Brasil, quase 18 milhões."
- "Em cada país a gente não vira seguradora: a gente é o motor que paga na hora, e o parceiro local assume o risco."
- "Começamos pela América Latina, onde a dor do fiador é igual à nossa, e entramos na Europa por Portugal."
- "O que ninguém tem é um histórico de bom pagador que vai com a pessoa quando ela muda de país."

## Fontes

1. https://www.sf.gov/news--security-deposit-laws-are-changing-july-1-2024
3. https://nysba.org/nys-housing-stability-and-tenant-protection-act-of-2019-part-iii-what-lawyers-must-know/
4. https://www.frls.org/blog/securitydeposit
6. https://shelterforce.org/2020/12/10/security-deposit-alternatives-the-misleading-marketing-of-renters-choice/
7. https://www.prnewswire.com/news-releases/rhino-and-jetty-merge-to-create-the-largest-security-deposit-insurance-company-in-the-market-302370218.html
8. https://www.prnewswire.com/news-releases/rhino-announces-95-million-new-capital-raise-301214970.html
10. https://www.theguarantors.com/blog/company-updates/theguarantors-and-warburg-pincus-growth-investment
14. https://www.congress.gov/crs-product/IN12553
15. https://www.federalregister.gov/documents/2026/08/18/2026-16796/genius-act-regulations-on-payment-stablecoin-issuance-offer-and-sale
16. https://www.redfin.com/news/renter-household-growth-2024/
17. https://www.gesetze-im-internet.de/bgb/__551.html
19. https://mietkautionsdepot.com/kautionsversicherungen-quo-vadis/
21. https://www.destatis.de/Europa/EN/Topic/Population-Labour-Social-Issues/Social-issues-living-conditions/RentedAccommodation.html
22. https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000028806696/
23. https://www.actionlogement.fr/la-garantie-visale
26. https://www.iberley.es/legislacion/articulo-36-ley-arrendamientos-urbanos
27. https://www.mivau.gob.es/vivienda/alquila-bien-es-tu-derecho/alquiler/10-preguntas
28. https://www.arrenta.es/blog/mercado-legislacion/desahucio-espana-plazos-judiciales-15-meses/
29. https://www.idealista.pt/news/imobiliario/habitacao/2022/11/25/55051-senhorios-so-vao-poder-exigir-2-meses-de-rendas-antecipadas-e-caucao
32. https://coinpaprika.com/news/mica-transitional-period-ends-1-july-2026/
33. https://www.esma.europa.eu/sites/default/files/2026-04/ESMA75-113276571-1679_Statement_on_the_end_of_transitional_periods_under_MiCA.pdf
34. https://assets.publishing.service.gov.uk/media/5f745d308fa8f5189a93d141/Tenant_Fees_Act_2019_-_Guidance_for_landlords_and_agents.pdf
35. https://england.shelter.org.uk/professional_resources/news_and_updates/how_section_21_notices_will_be_abolished
36. https://reposit.co.uk/
38. https://www.fca.org.uk/publications/policy-statements/cryptoasset-regime
39. https://assets.publishing.service.gov.uk/media/6930595d4bedc0e762303ffa/2024-25_EHS_Headline_Report.pdf
40. https://www.planalto.gov.br/ccivil_03/leis/l8245.htm
41. https://www.gov.br/susep/pt-br/copy_of_planos-e-produtos/seguros/seguro-fianca-locaticia
44. https://www.infomoney.com.br/minhas-financas/quintoandar-encerra-servico-de-garantia-quintocred-e-surpreende-3-mil-imobiliarias/
45. https://www.mattosfilho.com.br/unico/normas-regulamentacao-ativos-virtuais/
46. https://agenciabrasil.ebc.com.br/geral/noticia/2025-08/parcela-de-familias-quem-pagam-aluguel-sobe-25-em-8-anos-mostra-ibge
47. https://micontrato.mx/blog/deposito-garantia-arrendamiento-mexico
48. https://www.elfinanciero.com.mx/empresas/homie-levanta-1-3-mdd-de-capital-semilla
49. https://latamlist.com/mexican-property-startup-homie-raises-7m-from-equity-international/
50. https://bitfinanzas.com/banco-de-mexico-reafirma-a-bancos-la-prohibicion-de-operar-con-bitcoin/
51. https://www.inegi.org.mx/programas/enigh/nc/2024/
52. https://abeledogottheil.com.ar/locacion-de-inmuebles-encuadre-normativo-resultante-del-dnu-70-2023/
53. https://hoggax.com/blog/preguntas_frecuentes/
54. https://www.argentina.gob.ar/noticias/la-cnv-crea-el-registro-de-proveedores-de-servicios-de-activos-virtuales-psav
55. https://leyes.co/el_regimen_de_arrendamiento_de_vivienda_urbana/16.htm
59. https://www.lucasfinanzas.cl/contrato-de-arriendo-chile/
60. https://www.chileatiende.gob.cl/fichas/107794-devuelveme-mi-casa-ley-n-21-461
61. https://www.cmfchile.cl/portal/principal/623/w4-propertyvalue-48738.html
62. https://rentlock.io/
