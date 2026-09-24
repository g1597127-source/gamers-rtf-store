import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
} from "lucide-react";
import { products } from "./Home";
import CustomerCheckoutForm, { type CustomerFormData } from "@/components/CustomerCheckoutForm";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const specsByCategory: Record<string, { label: string; value: string }[]> = {
  Consoles: [
    { label: "Categoria", value: "Console de nova geração" },
    { label: "Armazenamento", value: "SSD de alta velocidade" },
    { label: "Resolução", value: "Até 8K / 120Hz" },
    { label: "Conectividade", value: "Wi-Fi 6 • Bluetooth 5.1" },
  ],
  Acessórios: [
    { label: "Categoria", value: "Acessório oficial / premium" },
    { label: "Compatibilidade", value: "PlayStation 5 e PC" },
    { label: "Conexão", value: "Sem fio e USB-C" },
    { label: "Garantia", value: "12 meses Gamers RTF" },
  ],
  Jogos: [
    { label: "Plataforma", value: "PlayStation 5" },
    { label: "Mídia", value: "Mídia física" },
    { label: "Classificação", value: "Consulte a embalagem" },
    { label: "Idioma", value: "Português disponível" },
  ],
};

const detailHighlights = [
  { icon: ShieldCheck, title: "Compra protegida", text: "Produto conferido e nota fiscal" },
  { icon: Truck, title: "Envio em até 24h", text: "Rastreio enviado por e-mail" },
  { icon: RotateCcw, title: "7 dias para trocar", text: "Você compra tranquilo" },
];

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const [, navigate] = useLocation();
  const product = useMemo(() => products.find((item) => item.id === Number(params?.id)), [params?.id]);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [checkoutFormOpen, setCheckoutFormOpen] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [params?.id]);
  const createCheckout = trpc.checkout.createPreference.useMutation({
    onSuccess: (data) => {
      const checkoutUrl = data.sandboxInitPoint ?? data.initPoint;
      if (checkoutUrl) window.location.assign(checkoutUrl);
      else showNotice("O Mercado Pago não retornou o endereço do checkout.");
    },
    onError: () => showNotice("Configure as credenciais do Mercado Pago para continuar."),
  });

  if (!product) {
    return (
      <div className="site-shell flex min-h-screen items-center justify-center bg-[#08090d] px-6 text-center text-white">
        <div>
          <div className="text-7xl font-black text-[#6df4ff]">404</div>
          <h1 className="mt-5 text-2xl font-black">Produto não encontrado</h1>
          <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#6df4ff] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#071017]">Voltar para a loja <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    );
  }

  const related = products.filter((item) => item.id !== product.id).slice(0, 3);
  const specs = product.name.includes("GTA")
    ? [
        { label: "Plataforma", value: "Xbox Series X|S" },
        { label: "Mídia", value: "Mídia física" },
        { label: "Classificação", value: "Consulte a embalagem" },
        { label: "Desenvolvedora", value: "Rockstar Games" },
      ]
    : product.name.includes("FC")
      ? [
          { label: "Plataforma", value: "PlayStation 5" },
          { label: "Mídia", value: "Mídia física" },
          { label: "Classificação", value: "Consulte a embalagem" },
          { label: "Desenvolvedora", value: "EA Sports" },
        ]
      : specsByCategory[product.category] ?? specsByCategory.Acessórios;
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const gallery = product.gallery?.length ? product.gallery : [product.image];

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const addToCart = () => showNotice(`${quantity}x ${product.name} adicionado ao carrinho.`);
  const submitCustomerData = (customer: CustomerFormData) => {
    createCheckout.mutate({ items: [{ productId: product.id, quantity }], customer });
  };

  return (
    <div className="site-shell min-h-screen overflow-x-hidden bg-[#08090d] text-white">
      <div className="announcement-bar"><div className="container flex items-center justify-center gap-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#d6e8ff] sm:text-[11px]"><span className="text-[#6df4ff]">✦</span> Frete grátis para todo o Brasil <span className="hidden text-white/35 sm:inline">•</span> <span className="hidden text-white/60 sm:inline">Cupom SHELBY20: 20% OFF</span></div></div>
      <header className="site-header sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090d]/85 backdrop-blur-2xl">
        <div className="container flex h-[76px] items-center justify-between gap-5">
          <Link href="/" className="brand-mark group flex shrink-0 items-center gap-3"><span className="brand-icon relative grid h-10 w-10 place-items-center overflow-hidden rounded-[13px] border border-[#6df4ff]/40 bg-[#0d1e28] shadow-[0_0_28px_rgba(109,244,255,0.17)]"><span className="absolute h-6 w-6 rotate-45 rounded-[7px] border border-[#6df4ff]" /><span className="relative text-[13px] font-black tracking-[-0.08em] text-[#6df4ff]">RTF</span></span><span className="hidden sm:block"><span className="block text-[17px] font-black leading-none tracking-[-0.04em] text-white">GAMERS <em className="not-italic text-[#6df4ff]">RTF</em></span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.25em] text-white/40">Play beyond limits</span></span></Link>
          <div className="flex items-center gap-3"><Link href="/" className="hidden items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/50 transition hover:text-[#6df4ff] sm:flex"><ArrowLeft className="h-4 w-4" /> Voltar para loja</Link><button type="button" onClick={() => showNotice("Seu carrinho está pronto para receber este produto.")} className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-bold transition hover:border-[#6df4ff]/50 hover:bg-[#6df4ff]/10"><ShoppingBag className="h-[18px] w-[18px] text-[#6df4ff]" /><span className="hidden sm:inline">Carrinho</span><span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#6df4ff] px-1 text-[10px] font-black text-[#071017]">0</span></button></div>
        </div>
      </header>

      <main>
        <div className="container pt-8"><nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-white/30"><Link href="/" className="transition hover:text-[#6df4ff]">Loja</Link><ChevronRight className="h-3 w-3" /><Link href="/#ofertas" className="transition hover:text-[#6df4ff]">{product.category}</Link><ChevronRight className="h-3 w-3" /><span className="truncate text-white/60">{product.name}</span></nav></div>
        <section className="container grid gap-12 py-10 lg:grid-cols-[1.03fr_.97fr] lg:gap-20 lg:py-16">
          <div className="product-detail-gallery">
            <div className={`detail-main-image tone-${product.tone}`}><div className="detail-image-glow" /><img src={gallery[activeImage]} alt={product.name} /><span className="detail-badge">{product.badge}</span><button type="button" onClick={() => setFavorite((value) => !value)} className={`detail-favorite ${favorite ? "is-favorite" : ""}`} aria-label="Favoritar produto"><Heart className={`h-5 w-5 ${favorite ? "fill-current" : ""}`} /></button></div>
            <div className="mt-4 grid grid-cols-3 gap-3">{gallery.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => setActiveImage(index)} className={`detail-thumb tone-${product.tone} ${activeImage === index ? "is-active" : ""}`}><img src={image} alt={`${product.name} visual ${index + 1}`} /></button>)}</div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="eyebrow"><span /> {product.category} • edição selecionada</div>
            <h1 className="mt-5 max-w-[610px] text-4xl font-black leading-[0.95] tracking-[-0.065em] text-white sm:text-6xl">{product.name}</h1>
            <p className="mt-5 text-lg text-white/50">{product.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4"><div className="flex items-center gap-1 text-sm font-black text-[#ffbd64]">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-current" />)} <span className="ml-1 text-white">{product.rating}</span><span className="font-medium text-white/35">({product.reviews} avaliações)</span></div><span className="rounded-full border border-[#6df4ff]/20 bg-[#6df4ff]/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#6df4ff]">Em estoque</span></div>
            <div className="my-8 h-px bg-white/[0.08]" />
            <div className="flex items-end gap-3"><div><div className="text-sm text-white/30 line-through">{product.oldPrice ? formatPrice(product.oldPrice) : ""}</div><div className="text-4xl font-black tracking-[-0.07em] text-white">{formatPrice(product.price)}</div></div>{discount > 0 && <span className="mb-1 rounded-lg bg-[#7df5a6]/10 px-2.5 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#7df5a6]">-{discount}% hoje</span>}</div>
            <div className="mt-3 flex items-center gap-2 text-sm text-white/45"><span className="font-bold text-[#7df5a6]">ou em até 12x</span> sem juros no cartão</div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><div className="flex h-14 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 sm:w-[150px]"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"><Minus className="h-4 w-4" /></button><span className="text-sm font-black">{quantity}</span><button type="button" onClick={() => setQuantity((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"><Plus className="h-4 w-4" /></button></div><button type="button" onClick={addToCart} className="primary-button flex h-14 flex-1 items-center justify-center gap-3 rounded-2xl bg-[#6df4ff] px-6 text-sm font-black uppercase tracking-[0.12em] text-[#071017] transition hover:-translate-y-1 hover:bg-[#9cf8ff]">Adicionar ao carrinho <ShoppingBag className="h-4 w-4" /></button></div>
            <button type="button" disabled={createCheckout.isPending} onClick={() => setCheckoutFormOpen(true)} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-[0.12em] text-white/65 transition hover:border-white/25 hover:text-white disabled:cursor-wait disabled:opacity-60">Comprar agora <ArrowRight className="h-4 w-4" /></button>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">{detailHighlights.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3"><Icon className="h-4 w-4 text-[#6df4ff]" /><div className="mt-3 text-[11px] font-black text-white">{title}</div><div className="mt-1 text-[10px] leading-4 text-white/35">{text}</div></div>)}</div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-[#0d1016] py-20"><div className="container grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><div className="eyebrow"><span /> Detalhes do produto</div><h2 className="mt-4 max-w-[390px] text-3xl font-black tracking-[-0.06em] text-white sm:text-4xl">Tudo que você precisa saber antes do <span className="gradient-text">próximo nível.</span></h2><p className="mt-5 max-w-[400px] text-sm leading-6 text-white/45">Cada item passa por uma seleção rigorosa da RTF para que você receba exatamente o que espera da sua experiência gamer.</p><div className="mt-7 flex items-center gap-3 text-xs font-bold text-white/50"><PackageCheck className="h-5 w-5 text-[#6df4ff]" /> Produto conferido pela equipe Gamers RTF</div></div><div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 sm:p-8"><div className="grid gap-0 sm:grid-cols-2">{specs.map((spec, index) => <div key={spec.label} className={`border-white/[0.08] py-5 ${index >= 2 ? "border-t" : ""} ${index % 2 === 1 ? "sm:pl-7 sm:border-l" : "sm:pr-7"}`}><div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6df4ff]">{spec.label}</div><div className="mt-2 text-sm font-bold text-white/75">{spec.value}</div></div>)}</div></div></div></section>

        <section className="container py-20 lg:py-28"><div className="mb-9 flex items-end justify-between gap-5"><div><div className="eyebrow"><span /> Você também pode curtir</div><h2 className="mt-3 text-3xl font-black tracking-[-0.06em] text-white">Complete seu setup.</h2></div><Link href="/#ofertas" className="hidden items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6df4ff] sm:flex">Ver todos <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-5 md:grid-cols-3">{related.map((item) => <Link href={`/produto/${item.id}`} key={item.id} className="related-product group rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-3 transition hover:-translate-y-1 hover:border-[#6df4ff]/30"><div className={`related-image tone-${item.tone}`}><img src={item.image} alt={item.name} /></div><div className="p-3"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{item.category}</div><div className="mt-2 text-lg font-black tracking-[-0.04em] text-white">{item.name}</div><div className="mt-3 flex items-center justify-between"><span className="text-sm font-black text-[#6df4ff]">{formatPrice(item.price)}</span><span className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.08] text-white/50 transition group-hover:bg-[#6df4ff] group-hover:text-[#071017]"><ArrowRight className="h-4 w-4" /></span></div></div></Link>)}</div></section>
      </main>

      <footer className="border-t border-white/[0.07] bg-[#06070a] py-10"><div className="container flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><div className="text-[17px] font-black tracking-[-0.04em] text-white">GAMERS <span className="text-[#6df4ff]">RTF</span></div><p className="mt-2 text-xs text-white/35">Play beyond limits. © 2026 Gamers RTF.</p></div><div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-[0.13em] text-white/35"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-[#6df4ff]" /> Suporte RTF</span><span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-[#6df4ff]" /> Loja verificada</span></div></div></footer>
      {checkoutFormOpen && <CustomerCheckoutForm onCancel={() => setCheckoutFormOpen(false)} onSubmit={submitCustomerData} isPending={createCheckout.isPending} error={createCheckout.error?.message} />}
      {notice && <div className="toast-notice fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#6df4ff]/25 bg-[#101a22]/95 px-4 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#6df4ff] text-[#071017]"><BadgeCheck className="h-4 w-4" /></span>{notice}<button type="button" onClick={() => setNotice("")} aria-label="Fechar aviso"><X className="h-4 w-4 text-white/40" /></button></div>}
    </div>
  );
}
