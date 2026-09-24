import { Link, useRoute } from "wouter";
import { ArrowRight, Check, Clock3, ShieldAlert, ShoppingBag } from "lucide-react";

const states = {
  sucesso: {
    eyebrow: "Pagamento recebido",
    title: "Seu pedido entrou no próximo nível.",
    text: "Recebemos a confirmação do Mercado Pago. O status definitivo do pedido será atualizado pelo webhook e você poderá acompanhar as próximas etapas por e-mail.",
    icon: Check,
    color: "#7df5a6",
  },
  pendente: {
    eyebrow: "Pagamento em análise",
    title: "Estamos aguardando a confirmação.",
    text: "O Mercado Pago ainda está processando o pagamento. Não precisa refazer o pedido: assim que o status mudar, o sistema atualizará o pedido automaticamente.",
    icon: Clock3,
    color: "#ffbd64",
  },
  falhou: {
    eyebrow: "Pagamento não concluído",
    title: "Vamos tentar de outro jeito.",
    text: "O pagamento não foi aprovado ou foi cancelado. Seus produtos continuam disponíveis para você voltar ao checkout e escolher outra forma de pagamento.",
    icon: ShieldAlert,
    color: "#ff7f9b",
  },
} as const;

export default function PaymentResult() {
  const [, params] = useRoute("/pagamento/:status");
  const state = states[(params?.status ?? "falhou") as keyof typeof states] ?? states.falhou;
  const Icon = state.icon;

  return <div className="site-shell flex min-h-screen flex-col bg-[#08090d] text-white"><div className="announcement-bar"><div className="container flex items-center justify-center gap-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#d6e8ff]">✦ Gamers RTF • Compra protegida pelo Mercado Pago</div></div><main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-20"><div className="hero-grid" /><div className="hero-glow hero-glow-one" /><div className="relative z-10 w-full max-w-[650px] text-center"><div className="mx-auto grid h-24 w-24 place-items-center rounded-[30px] border" style={{ color: state.color, borderColor: `${state.color}55`, backgroundColor: `${state.color}12`, boxShadow: `0 0 70px ${state.color}20` }}><Icon className="h-10 w-10" /></div><div className="eyebrow mt-9 justify-center"><span /> {state.eyebrow} <span /></div><h1 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl">{state.title}</h1><p className="mx-auto mt-6 max-w-[560px] text-base leading-7 text-white/50">{state.text}</p><div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#6df4ff] px-6 text-xs font-black uppercase tracking-[0.13em] text-[#071017] transition hover:bg-[#9cf8ff]">Voltar para a loja <ArrowRight className="h-4 w-4" /></Link><Link href="/#ofertas" className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 text-xs font-black uppercase tracking-[0.13em] text-white/65 transition hover:border-white/25 hover:text-white"><ShoppingBag className="h-4 w-4" /> Ver produtos</Link></div><div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-white/25"><ShieldAlert className="h-3.5 w-3.5 text-[#6df4ff]" /> Não compartilhe seus dados de pagamento com ninguém</div></div></main></div>;
}
