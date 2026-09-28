"use client";

import { useState, type CSSProperties } from "react";
import * as A from "@/lib/actions";
import { explorerTx } from "@/lib/constants";
import { fromUnits } from "@/lib/format";
import * as H from "@/lib/historia";
import { App, Autenticacao, Barra, Botao, Cartao, COR, Estado, H2, Linha, LinkBotao, Nota, Pad, Passos, reais, Txt, Valor } from "@/ui";
import { useProprietario } from "../dados";

type Etapa = "formulario" | "revisar" | "processando" | "feito" | "erro";

const rotulo: CSSProperties = { fontSize: 14, fontWeight: 650, color: COR.tinta };
const campo: CSSProperties = {
  width: "100%", minHeight: 48, borderRadius: 12, border: "1.5px solid #7A8496", background: "#fff",
  color: COR.tinta, fontSize: 17, padding: "10px 14px", fontFamily: "inherit",
};
const dica: CSSProperties = { fontSize: 13, color: COR.graf };

export default function Danos() {
  const x = useProprietario();
  const { l, d } = x;
  const [etapa, setEtapa] = useState<Etapa>("formulario");
  const [valorTxt, setValorTxt] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fotos, setFotos] = useState(0);
  const [tentou, setTentou] = useState(false);
  const [sig, setSig] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pedido, setPedido] = useState(0);

  const valor = Number(valorTxt.replace(",", "."));
  const maximo = x.cofre;
  const valorOk = valor > 0 && valor <= maximo;
  const descricaoOk = descricao.trim().length >= 5;

  async function registrar() {
    if (!d.kp || !d.lease) return;
    setEtapa("processando");
    setPedido(valor);
    const r = await d.executar(
      "Carlos", "Registrando o pedido de danos…",
      () => `Carlos pediu ${reais(valor)} da caução por danos: ${descricao.trim()}. A Imobiliária Sol vai decidir.`,
      () => A.openDispute(d.connection, d.kp!.proprietario, d.lease!, valor),
      { kind: "danos", valor }
    );
    if (r) { setSig(r); setEtapa("feito"); }
    else { setErro(d.eventos[0]?.tipo === "erro" ? d.eventos[0].texto : "A rede não confirmou a transação."); setEtapa("erro"); }
  }

  // Etapas que não dependem mais do estado do contrato (ele muda para "disputed" depois do pedido).
  if (etapa === "processando")
    return (
      <App>
        <Barra titulo="Processando" nivel="p" />
        <Estado girando titulo="Registrando o pedido na Solana" texto="Leva uns segundos. A tela avança sozinha." />
        <Pad style={{ marginTop: 22 }}>
          <Cartao pad="20px">
            <Passos itens={[
              [`Pedido de ${reais(pedido)} conferido`, "ok"],
              ["Caução travada no cofre até a decisão", "agora"],
              ["Imobiliária Sol avisada", ""],
            ]} />
          </Cartao>
        </Pad>
      </App>
    );

  if (etapa === "feito")
    return (
      <App>
        <Barra titulo="Pedido registrado" fechar="/proprietario" nivel="p" />
        <Estado ic="check" cor="#fff" fundo={COR.verde} titulo={`Pedido de ${reais(pedido)} registrado`}
          texto="A Imobiliária Sol vai analisar e decidir quanto sai da caução. Até lá, o dinheiro fica parado no cofre do contrato." />
        <Pad style={{ marginTop: 22 }}>
          <Cartao pad="18px 20px"><Autenticacao sig={sig ?? undefined} href={sig ? explorerTx(sig) : undefined} /></Cartao>
          <LinkBotao href="/proprietario">Voltar para o início</LinkBotao>
        </Pad>
      </App>
    );

  if (etapa === "erro")
    return (
      <App>
        <Barra titulo="Registrar danos" fechar="/proprietario" nivel="p" />
        <Estado ic="alerta" cor={COR.verm} fundo="#FBEAE8" titulo="Não conseguimos registrar o pedido"
          texto="Nada mudou no contrato. Se o prazo de vistoria ainda estiver aberto, você pode tentar de novo." />
        <Pad style={{ marginTop: 22 }}>
          {erro && <Nota ic="info">{erro}</Nota>}
          {x.janelaAberta && <Botao onClick={registrar}>Tentar de novo</Botao>}
          <LinkBotao href="/proprietario" tipo="secundario">Voltar para o início</LinkBotao>
        </Pad>
      </App>
    );

  // Formulário e revisão só existem com o contrato terminado e dentro da janela.
  if (!x.pronto || !l || !x.janelaAberta) {
    let titulo = "Lendo o contrato";
    let texto = "Conectando à Solana…";
    if (x.pronto && !l) { titulo = "Nenhum contrato ainda"; texto = "O pedido de danos só existe depois que um contrato termina."; }
    else if (l && (l.status === "pending" || l.status === "active" || l.status === "defaulted")) {
      const faltam = l.periods.filter((p) => p === "open").length;
      titulo = "Disponível no fim do contrato";
      texto = `Quando o contrato terminar, abre um prazo de vistoria para você registrar danos.${l.status === "pending" ? "" : ` Faltam ${faltam} ${faltam === 1 ? "mês" : "meses"} para receber.`}`;
    } else if (l && l.status === "ending") { titulo = "O prazo de vistoria acabou"; texto = "No acerto final, a caução volta para a Ana com o rendimento simulado."; }
    else if (l && l.status === "disputed") { titulo = "Pedido já registrado"; texto = `Você pediu ${reais(fromUnits(l.disputeAmount))}. A Imobiliária Sol está analisando.`; }
    else if (l && l.status === "closed") { titulo = "Contrato encerrado"; texto = "Não é mais possível registrar danos neste contrato."; }
    return (
      <App>
        <Barra titulo="Registrar danos" voltar="/proprietario" />
        <Pad>
          <Cartao pad="20px" gap={6}><H2>{titulo}</H2><Txt>{texto}</Txt></Cartao>
          <LinkBotao href="/proprietario" tipo="secundario">Voltar para o início</LinkBotao>
        </Pad>
      </App>
    );
  }

  const prazo = `Prazo de vistoria: ${H.mmss(x.fimJanela - x.agora)}`;

  if (etapa === "revisar")
    return (
      <App>
        <Barra titulo="Revise o pedido" voltar="/proprietario" sub={prazo} />
        <Pad>
          <Cartao pad="20px" gap={8}>
            <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Você vai pedir da caução</span>
            <Valor v={valor} t={44} />
            <div>
              <Linha k="Imóvel" v={H.IMOVEL.endereco} />
              <Linha k="Inquilina" v={H.PESSOAS.inquilino.nome} />
              <Linha k="Fotos" v={fotos ? `${fotos} ${fotos === 1 ? "foto" : "fotos"}` : "nenhuma"} />
              <Linha k="Quem decide" v={H.PESSOAS.imobiliaria.nome} />
            </div>
            <div style={{ padding: "10px 12px", borderRadius: 10, background: COR.mesa }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COR.graf }}>Descrição</span>
              <p style={{ margin: "4px 0 0", fontSize: 15, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{descricao.trim()}</p>
            </div>
          </Cartao>
          <Nota ic="cadeado" cor={COR.caneta} fundo="#E4E9FA">
            O pedido trava a caução no cofre até a decisão. A imobiliária pode aprovar o valor todo, uma parte ou nada.
          </Nota>
          <Botao onClick={registrar} disabled={!!d.ocupado}>Registrar pedido de {reais(valor)}</Botao>
          <Botao tipo="secundario" onClick={() => setEtapa("formulario")}>Corrigir</Botao>
        </Pad>
      </App>
    );

  // formulário
  return (
    <App>
      <Barra titulo="Registrar danos" voltar="/proprietario" sub={prazo} />
      <Pad>
        <Txt>Descreva o que encontrou na vistoria de saída. A Imobiliária Sol analisa e decide quanto sai da caução.</Txt>
        <form
          noValidate
          onSubmit={(ev) => { ev.preventDefault(); setTentou(true); if (valorOk && descricaoOk) setEtapa("revisar"); }}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="valor" style={rotulo}>Valor dos danos, em reais</label>
            <input id="valor" inputMode="decimal" autoComplete="off" placeholder="0,00" value={valorTxt}
              onChange={(e) => setValorTxt(e.target.value.replace(/[^\d,.]/g, ""))}
              aria-describedby="valor-dica" aria-invalid={tentou && !valorOk} style={campo} />
            <span id="valor-dica" style={{ ...dica, color: tentou && !valorOk ? COR.verm : COR.graf }}>
              {tentou && !valorOk ? `Digite um valor maior que zero e até ${reais(maximo)}, o que há no cofre.` : `Até ${reais(maximo)}, o que há no cofre.`}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="descricao" style={rotulo}>O que foi danificado</label>
            <textarea id="descricao" rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)}
              aria-describedby="descricao-dica" aria-invalid={tentou && !descricaoOk} style={{ ...campo, resize: "vertical" }} />
            <span id="descricao-dica" style={{ ...dica, color: tentou && !descricaoOk ? COR.verm : COR.graf }}>
              {tentou && !descricaoOk ? "Conte em poucas palavras o que foi danificado." : "Ex.: porta do banheiro quebrada, parede manchada na sala."}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="fotos" style={rotulo}>Fotos (opcional)</label>
            <input id="fotos" type="file" accept="image/*" multiple onChange={(e) => setFotos(e.target.files?.length ?? 0)}
              aria-describedby="fotos-dica" style={{ ...campo, fontSize: 15 }} />
            <span id="fotos-dica" style={dica}>
              As fotos vão só para a imobiliária, nunca para a blockchain. Na demonstração, ficam só neste aparelho.
            </span>
          </div>
          <Botao type="submit">Revisar o pedido</Botao>
        </form>
        <LinkBotao href="/proprietario" tipo="texto" style={{ alignSelf: "center" }}>Cancelar</LinkBotao>
      </Pad>
    </App>
  );
}
