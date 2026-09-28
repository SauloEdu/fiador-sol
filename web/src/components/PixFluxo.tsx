"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicKey } from "@solana/web3.js";
import { Botao, Cartao, COR, Icone, Linha, Nota, Txt, Valor } from "@/ui";
import { apiPost } from "@/lib/api";

type Cobranca = { id: string; valor: number; copiaECola: string };

/** Desenho de QR ilustrativo (o Pix é simulado na demonstração). */
function QR({ semente, t = 170 }: { semente: string; t?: number }) {
  const celulas = useMemo(() => {
    let h = 0;
    for (const c of semente) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) / 2 ** 32);
    const out: [number, number][] = [];
    for (let y = 0; y < 25; y++)
      for (let x = 0; x < 25; x++) {
        const f = [[0, 0], [18, 0], [0, 18]].find(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
        const on = f ? (() => { const a = x - f[0], b = y - f[1]; return a === 0 || a === 6 || b === 0 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4); })() : rnd() < 0.48;
        if (on) out.push([x, y]);
      }
    return out;
  }, [semente]);
  return (
    <svg width={t} height={t} viewBox="-1 -1 27 27" role="img" aria-label="QR Code do Pix (ilustrativo na demonstração)">
      <rect x="-1" y="-1" width="27" height="27" fill={COR.papel} />
      <g fill={COR.tinta}>{celulas.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" />)}</g>
    </svg>
  );
}

/**
 * Pix no padrão dos bancos: valor, para quem, validade, "Copiar código" em destaque e QR recolhido.
 * "Já paguei" confirma a cobrança simulada: o servidor credita reais digitais de teste na conta.
 */
export function PixFluxo({ carteira, valor, linhas, onPago, onCancelar }: {
  carteira: PublicKey;
  valor: number;
  linhas: [string, string][];
  onPago: (assinaturaPix: string) => void;
  onCancelar?: () => void;
}) {
  const [cob, setCob] = useState<Cobranca | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [inicio] = useState(() => Date.now());
  const [, tick] = useState(0);

  useEffect(() => {
    let vivo = true;
    apiPost("/api/pix/cobranca", { carteira: carteira.toBase58(), valor })
      .then((r) => { if (vivo) (r.erro ? setErro(r.erro) : setCob(r)); })
      .catch(() => vivo && setErro("Não consegui gerar o Pix. Tente de novo."));
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => { vivo = false; clearInterval(t); };
  }, [carteira, valor]);

  const restante = Math.max(0, 15 * 60 - (Date.now() - inicio) / 1000);

  async function copiar() {
    if (!cob) return;
    try {
      await navigator.clipboard.writeText(cob.copiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch { /* o código continua visível e selecionável */ }
  }

  async function confirmar() {
    if (!cob) return;
    setConfirmando(true);
    setErro(null);
    const r = await apiPost("/api/pix/confirmar", { id: cob.id })
      .catch((e: Error) => ({ erro: e.message || "Sem resposta do servidor" }));
    setConfirmando(false);
    if (r.erro) return setErro(r.erro);
    onPago(r.assinatura);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Cartao pad="20px" gap={8}>
        <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Valor do Pix</span>
        <Valor v={valor} t={42} />
        <div>{linhas.map(([k, v]) => <Linha key={k} k={k} v={v} />)}</div>
        <div role="timer" style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: COR.graf }}>O código expira em</span>
            <b style={{ fontVariantNumeric: "tabular-nums" }}>{Math.floor(restante / 60)}:{String(Math.floor(restante % 60)).padStart(2, "0")}</b>
          </div>
          <div aria-hidden="true" style={{ height: 6, borderRadius: 3, background: "#D9DFE8", overflow: "hidden" }}>
            <div style={{ width: `${(restante / 900) * 100}%`, height: "100%", background: COR.caneta, transition: "width 1s linear" }} />
          </div>
        </div>
      </Cartao>
      <Botao onClick={copiar} disabled={!cob}>
        <Icone n={copiado ? "check" : "copiar"} t={20} e={2} />{copiado ? "Código copiado" : "Copiar código Pix"}
      </Botao>
      <Txt>Abra o app do seu banco, escolha Pix Copia e Cola e cole o código. O pagamento aparece aqui sozinho.</Txt>
      {cob && (
        <details style={{ background: "#fff", borderRadius: 16, padding: "4px 16px" }}>
          <summary style={{ minHeight: 44, display: "flex", alignItems: "center", fontSize: 15, fontWeight: 650, cursor: "pointer", color: COR.caneta }}>
            Pagar com QR Code de outro aparelho
          </summary>
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 16px" }}><QR semente={cob.id} /></div>
        </details>
      )}
      <div role="status" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, color: COR.graf, padding: "0 4px" }}>
        <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: COR.caneta }} />
        {confirmando ? "Confirmando o Pix…" : "Aguardando o Pix"}
      </div>
      {erro && <Nota ic="alerta" cor={COR.verm} fundo="#FBEAE8">{erro}</Nota>}
      <Botao tipo="secundario" onClick={confirmar} disabled={!cob || confirmando}>
        {confirmando ? "Confirmando…" : "Simular: já paguei"}
      </Botao>
      {onCancelar && <Botao tipo="texto" onClick={onCancelar} style={{ alignSelf: "center" }}>Cancelar</Botao>}
      <Txt peq style={{ textAlign: "center" }}>Demonstração em rede de teste. Nenhum valor real é cobrado.</Txt>
    </div>
  );
}
