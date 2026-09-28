import Link from "next/link";
import { Carimbo, Cartela, COR, Icone, LinkBotao, Selo } from "@/ui";
import s from "./home.module.css";

const PUBLICOS: [string, string, string, string][] = [
  ["/inquilino", "Quem aluga", "Sem fiador, caução que rende e volta, e um histórico que diminui a próxima caução.", "Abrir o app da Ana"],
  ["/proprietario", "Quem é dono", "Recebe mesmo se o inquilino atrasar: primeiro da caução, depois do fundo, até 3 aluguéis (o fundo entra após 2 pagos, até R$ 15.000).", "Abrir o app do Carlos"],
  ["/imobiliaria", "Imobiliárias", "Contratos fechados em minutos e atrasos resolvidos sem cobrança manual.", "Abrir o painel"],
  ["/investidor", "Investidores", "Recebem a taxa de garantia de cada aluguel protegido, com coberturas e perdas à vista.", "Ver o fundo"],
];
const FAQ: [string, string][] = [
  ["O que acontece se eu atrasar?", "Há 5 dias de carência. Depois, a caução paga o proprietário e você quita para repor o cofre. Não é calote: calote é terminar o contrato devendo."],
  ["A taxa de garantia volta?", "Não. Os 8% de cada aluguel vão para o fundo que protege o proprietário se a caução acabar. A caução, sim, volta inteira no fim, com rendimento, menos danos aprovados."],
  ["Quem pode mexer no cofre?", "Só as regras do contrato, que qualquer pessoa pode conferir na Solana. Na demonstração, a chave de atualização do programa é da equipe; em produção fica num multisig."],
  ["Como a imobiliária entra?", "A imobiliária credenciada cria o contrato e convida o dono e o inquilino. O PDF assinado fica com ela; na Solana vai só a impressão digital."],
];

export default function Home() {
  return (
    <div className={s.pagina}>
      <header className={s.topo}>
        <Link href="/" className={s.logo}>Fiador<span>.sol</span></Link>
        <nav aria-label="Principal" className={s.nav}>
          <a href="#como">Como funciona</a>
          <Link href="/imobiliaria">Imobiliárias</Link>
          <Link href="/investidor">Investir no fundo</Link>
          <LinkBotao href="/inquilino" peq>Entrar</LinkBotao>
        </nav>
      </header>
      <main>
        <section className={s.hero}>
          <div>
            <h1 className={s.h1}>O fim do fiador.</h1>
            <p className={s.lede}>A caução vai por Pix para um cofre do contrato e rende. Se o aluguel atrasar, ela paga o proprietário assim que acabam os 5 dias de carência. No fim, volta para quem alugou.</p>
            <div className={s.acoes}>
              <LinkBotao href="/apresentacao">Ver funcionando ao vivo</LinkBotao>
              <LinkBotao href="/imobiliaria" tipo="secundario">Sou imobiliária</LinkBotao>
            </div>
            <dl className={s.numeros}>
              <div><dt>de carência; depois a caução paga o dono</dt><dd>5 dias</dd></div>
              <div><dt>de caução para quem tem 12 meses em dia em 2 contratos, em vez de 3</dt><dd>1 aluguel</dd></div>
              <div><dt>de taxa de garantia, que vai para o fundo e não volta</dt><dd>8%</dd></div>
            </dl>
          </div>
          <div className={s.celular}><iframe title="App da Ana, ao vivo na rede de teste" src="/inquilino" loading="lazy" /></div>
        </section>
        <div className={s.faixa}>
          <section id="como" className={s.secao}>
            <h2 className={s.h2}>O contrato é uma cartela. Cada mês ganha um carimbo.</h2>
            <div className={s.como}>
              <div style={{ padding: 18, borderRadius: 22, background: COR.mesa }}>
                <Cartela celulas={[
                  { mes: "ago", estado: "pago", data: "09/08" }, { mes: "set", estado: "quitado", data: "18/09" }, { mes: "out", estado: "pago", data: "08/10" },
                  { mes: "nov", estado: "pago", data: "08/11" }, { mes: "dez", estado: "atual", data: "vence 10/12" }, { mes: "jan", estado: "vazio" },
                  { mes: "fev", estado: "vazio" }, { mes: "mar", estado: "vazio" },
                ]} />
              </div>
              <ol className={s.passos}>
                <li><span><Carimbo txt="PAGO" cor={COR.verde} t={18} dupla={false} /></span><div><b>Pagou com Pix, ganhou o carimbo.</b><p>O aluguel vai direto ao proprietário. A taxa de garantia de 8% vai para o fundo que protege todos os contratos e não volta.</p></div></li>
                <li><span><Carimbo txt="CAUÇÃO" cor={COR.verm} t={18} rot={6} dupla={false} /></span><div><b>Atrasou? A caução paga por você.</b><p>Depois da carência, o cofre paga o proprietário. Você quita depois para recompor. Se a caução acabar, o fundo cobre até 3 aluguéis (no máximo R$ 15.000), desde que já tenham sido pagos 2 meses.</p></div></li>
                <li><span><Selo n={3} on t={64} /></span><div><b>Meses em dia viram selos.</b><p>Com 3, 6 e 12 meses em dia, selos que não podem ser vendidos. Com 6, o próximo contrato pede 2 aluguéis de caução em vez de 3. O histórico é seu.</p></div></li>
              </ol>
            </div>
          </section>
        </div>
        <section className={s.secao}>
          <h2 className={s.h2} style={{ fontSize: 40 }}>Para cada pessoa do aluguel</h2>
          <div className={s.publicos}>
            {PUBLICOS.map(([h, t, x, c]) => <Link key={t} href={h}><b>{t}</b><span>{x}</span><em>{c}</em></Link>)}
          </div>
        </section>
        <section className={s.seguranca} aria-labelledby="seg">
          <div><h2 id="seg">Segurança</h2><p>O que protege o seu dinheiro, sem letra miúda.</p></div>
          <div><Icone n="cofre" t={28} cor="#9FB0F2" /><b>Cofre com regras públicas</b><p>A caução só se move pelas regras do contrato, que qualquer pessoa pode conferir.</p></div>
          <div><Icone n="cadeado" t={28} cor="#9FB0F2" /><b>Chave de atualização</b><p>Na demonstração, é da equipe. Em produção, fica num multisig, com código verificado.</p></div>
          <div><Icone n="doc" t={28} cor="#9FB0F2" /><b>Seus dados fora da blockchain</b><p>Nome e CPF ficam com a imobiliária. Na Solana vão só códigos e valores.</p></div>
        </section>
        <section className={s.secao}>
          <h2 className={s.h2} style={{ fontSize: 40 }}>Perguntas frequentes</h2>
          <div className={s.faq}>
            {FAQ.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </section>
      </main>
      <footer className={s.rodape}>
        <div><span style={{ fontSize: 20, fontWeight: 800, color: COR.tinta }}>Fiador<span style={{ color: COR.caneta }}>.sol</span></span><span>Protótipo para o Crypto World&apos;s Fair da Colosseum, com a Superteam Brasil. Rede de teste, nenhum dinheiro real.</span></div>
        <div><b>Produto</b><a href="#como">Como funciona</a><Link href="/apresentacao">Demonstração ao vivo</Link><Link href="/investidor">Fundo de garantia</Link></div>
        <div><b>Pessoas</b><Link href="/inquilino">Quem aluga</Link><Link href="/proprietario">Quem é dono</Link><Link href="/imobiliaria">Imobiliárias</Link></div>
        <div><b>Código</b><a href="https://github.com/SauloEdu/fiador-sol" target="_blank" rel="noreferrer">GitHub</a><Link href="/demo">Console técnico</Link></div>
      </footer>
    </div>
  );
}
