import { useState } from "react";
import { Link } from "wouter";
import { Search, PackageCheck, ArrowLeft, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

const labels: Record<string, string> = {
  pending: "Aguardando pagamento",
  in_process: "Pagamento em análise",
  approved: "Pagamento aprovado",
  rejected: "Pagamento recusado",
  cancelled: "Pedido cancelado",
  refunded: "Pagamento estornado",
  unknown: "Em atualização",
};

export default function OrderTracking() {
  const [reference, setReference] = useState("");
  const [searched, setSearched] = useState("");
  const query = trpc.orders.track.useQuery({ externalReference: searched }, { enabled: searched.length >= 8 });
  return <div className="site-shell min-h-screen bg-[#08090d] text-white"><header className="border-b border-white/10"><div className="container flex h-20 items-center justify-between"><Link href="/" className="font-black tracking-tight text-white">GAMERS <span className="text-[#6df4ff]">RTF</span></Link><Link href="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/55 hover:text-white"><ArrowLeft className="h-4 w-4" /> Loja</Link></div></header><main className="container max-w-3xl py-20"><div className="eyebrow"><span /> Rastreio RTF</div><h1 className="mt-5 text-4xl font-black tracking-[-0.06em] sm:text-6xl">Acompanhe seu pedido.</h1><p className="mt-5 max-w-xl leading-7 text-white/50">Digite a referência recebida após iniciar o checkout para consultar o status do pagamento e do pedido.</p><form onSubmit={(event) => { event.preventDefault(); setSearched(reference.trim()); }} className="mt-10 flex flex-col gap-3 sm:flex-row"><input required minLength={8} value={reference} onChange={(event) => setReference(event.target.value)} className="form-input h-14 flex-1" placeholder="Ex.: GRTF-xxxxxxxx" /><button className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#6df4ff] px-6 text-xs font-black uppercase tracking-[0.12em] text-[#071017]"><Search className="h-4 w-4" /> Consultar</button></form>{searched && <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">{query.isLoading && <p className="text-white/50">Consultando pedido...</p>}{query.isError && <p className="text-[#ff9ba8]">Não foi possível consultar agora. Tente novamente.</p>}{!query.isLoading && !query.isError && !query.data && <p className="text-white/60">Nenhum pedido encontrado com essa referência.</p>}{query.data && <div><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6df4ff]">Pedido localizado</div><h2 className="mt-2 font-black text-white">{query.data.order.externalReference}</h2></div><PackageCheck className="h-7 w-7 text-[#6df4ff]" /></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div><div className="text-[10px] uppercase tracking-widest text-white/35">Status</div><div className="mt-1 font-bold text-white">{labels[query.data.order.status] ?? labels.unknown}</div></div><div><div className="text-[10px] uppercase tracking-widest text-white/35">Total</div><div className="mt-1 font-bold text-white">R$ {(query.data.order.totalAmountCents / 100).toFixed(2).replace('.', ',')}</div></div><div><div className="text-[10px] uppercase tracking-widest text-white/35">Itens</div><div className="mt-1 font-bold text-white">{query.data.items.reduce((sum, item) => sum + item.quantity, 0)}</div></div></div><div className="mt-6 flex items-center gap-2 text-xs text-white/40"><ShieldCheck className="h-4 w-4 text-[#6df4ff]" /> Atualizado automaticamente pelo Mercado Pago</div></div>}</div>}</main></div>;
}
