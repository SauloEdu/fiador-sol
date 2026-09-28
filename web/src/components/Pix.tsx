"use client";

import { useState } from "react";
import type { PublicKey } from "@solana/web3.js";
import { brl } from "@/lib/format";
import styles from "./demo.module.css";
import { apiPost } from "@/lib/api";

type Cobranca = { id: string; valor: number; copiaECola: string };

/** Pix simulado: gera um "copia e cola" e, ao confirmar, o servidor credita tBRL na carteira. */
export function Pix({
  carteira,
  sugerido,
  rotulo,
  onPago,
  disabled,
}: {
  carteira: PublicKey;
  sugerido: number;
  rotulo: string;
  onPago: (valor: number, sig: string) => void;
  disabled?: boolean;
}) {
  const [valor, setValor] = useState<number>(sugerido);
  const [cob, setCob] = useState<Cobranca | null>(null);
  const [estado, setEstado] = useState<"livre" | "gerando" | "confirmando">("livre");
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function gerar() {
    setErro(null);
    setEstado("gerando");
    const r = await apiPost("/api/pix/cobranca", { carteira: carteira.toBase58(), valor }).catch((e: Error) => ({ erro: e.message }));
    setEstado("livre");
    if (r.erro) return setErro(r.erro);
    setCob(r);
  }

  async function confirmar() {
    if (!cob) return;
    setEstado("confirmando");
    const r = await apiPost("/api/pix/confirmar", { id: cob.id }).catch((e: Error) => ({ erro: e.message }));
    setEstado("livre");
    if (r.erro) return setErro(r.erro);
    onPago(cob.valor, r.assinatura);
    setCob(null);
  }

  async function copiar() {
    if (!cob) return;
    try {
      await navigator.clipboard.writeText(cob.copiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* sem clipboard: o texto continua selecionável */
    }
  }

  if (cob) {
    return (
      <div className={styles.pix}>
        <div className={styles.pixHead}>
          <span className="tag t-accent">Pix · {brl(cob.valor, true)}</span>
          <span className="muted" style={{ fontSize: 12 }}>
            Simulação: nada é cobrado
          </span>
        </div>
        <code className={styles.pixCode}>{cob.copiaECola}</code>
        <div className="row">
          <button className="btn small" type="button" onClick={copiar}>
            {copiado ? "Copiado" : "Copiar código"}
          </button>
          <button className="btn small primary" type="button" onClick={confirmar} disabled={estado !== "livre"}>
            {estado === "confirmando" ? "Confirmando…" : "Já paguei"}
          </button>
          <button className="btn small ghost" type="button" onClick={() => setCob(null)}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <label className="field" style={{ flex: "1 1 120px" }}>
        Valor (R$)
        <input
          id={`pix-${carteira.toBase58().slice(0, 6)}`}
          type="number"
          min={1}
          step={100}
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
        />
      </label>
      <button className="btn" type="button" onClick={gerar} disabled={disabled || estado !== "livre" || !(valor > 0)}>
        {estado === "gerando" ? "Gerando…" : rotulo}
      </button>
      {erro && <p className={styles.erro}>{erro}</p>}
    </div>
  );
}
