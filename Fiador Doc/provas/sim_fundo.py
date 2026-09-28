# contrato 12 meses, aluguel R=1; calote: inquilina para de pagar no mes m (1..12) e nunca mais paga (LGD 100%)
def run(pd, dep, cap, T=12, prem=0.08, wait=2):
    # PD = prob anual de calote; momento uniforme em 1..T
    prem_tot=0; pool_loss=0; land_loss=0
    for m in range(1,T+1):
        paid=m-1; n=T-paid
        p=pd/T
        pool = min(cap, max(0,n-dep)) if paid>=wait else 0
        prem_tot += p*prem*paid; pool_loss += p*pool; land_loss += p*max(0,n-dep-pool)
    prem_tot += (1-pd)*prem*T
    return prem_tot, pool_loss, land_loss
print("cenario     tier dep cap  premio  perdaFundo  sinistralidade  retornoCapital(cap)  perdaDono")
for R,cap in [(1000,3),(5000,3),(10000,1.5)]:
  for pd in [0.03,0.08,0.15,0.30]:
    for dep in [3,1]:
      pr,pl,ll=run(pd,dep,cap)
      print(f"R={R:5d} pd={pd:.2f} dep={dep} cap={cap}: premio={pr:.3f}R perda={pl:.3f}R sin={pl/pr*100:5.1f}% ret={(pr-pl)/cap*100:5.1f}%/a perdaDono={ll:.3f}R")
# conluio: dono+inquilina, deposito 3R tier0, paga 2 meses (dinheiro volta ao dono), calote no resto
for dep in [3,1]:
  for R in [1000,5000,10000]:
    cap=min(3*R,15000); custo=2*0.08*R; ganho=cap
    print(f"conluio dep={dep} R={R}: ganho fundo {ganho:.0f}, custo premios {custo:.0f}, lucro {ganho-custo:.0f}, meses minimos {2+dep+3 if R<=5000 else 2+dep+2}")
# reserva de rendimento: 5000 a 10%/a -> quantas caucoes-ano
for dep_total in [3000,15000,30000,50000]:
  print("reserva 5000 cobre", round(5000/(dep_total*0.10),2), "anos de caucao total", dep_total)
