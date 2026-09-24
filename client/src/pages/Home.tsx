import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  Filter,
  Heart,
  Headphones,
  LockKeyhole,
  MapPin,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ACTIVE_COUPON, getCouponDiscountCents, normalizeCouponCode } from "@shared/checkoutConfig";
import CustomerCheckoutForm, { type CustomerFormData } from "@/components/CustomerCheckoutForm";

export type Product = {
  id: number;
  name: string;
  subtitle: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  image: string;
  gallery?: string[];
  tone: string;
};

type CartLine = Product & { quantity: number };

export const products: Product[] = [
  {
    id: 1,
    name: "PlayStation 5 Slim + 2 controles",
    subtitle: "Edição com leitor • 2 controles DualSense",
    category: "Consoles",
    price: 3200,
    oldPrice: 3599.9,
    rating: 5,
    reviews: 128,
    badge: "Mais vendido",
    image: "/products/ps5-slim/main.jpg",
    gallery: ["/products/ps5-slim/main.jpg", "/products/ps5-slim/alt-1.webp", "/products/ps5-slim/alt-2.webp", "/products/ps5-slim/alt-3.webp"],
    tone: "cyan",
  },
  {
    id: 2,
    name: "PlayStation 5 Pro",
    subtitle: "Ray tracing avançado • SSD de alta velocidade",
    category: "Consoles",
    price: 4500,
    oldPrice: 4999.9,
    rating: 5,
    reviews: 74,
    badge: "Lançamento",
    image: "/products/ps5-pro/main.jpg",
    gallery: ["/products/ps5-pro/main.jpg", "/products/ps5-pro/alt-1.jpg", "/products/ps5-pro/alt-2.jpg", "/products/ps5-pro/alt-3.jpg"],
    tone: "violet",
  },
  {
    id: 3,
    name: "Xbox Series S 512GB",
    subtitle: "Console digital • Controle sem fio",
    category: "Consoles",
    price: 3000,
    oldPrice: 3299.9,
    rating: 4.9,
    reviews: 51,
    badge: "Console em alta",
    image: "/products/xbox-series-s/main.jpg",
    gallery: ["/products/xbox-series-s/main.jpg", "/products/xbox-series-s/alt-1.jpg", "/products/xbox-series-s/alt-2.jpg", "/products/xbox-series-s/alt-3.jpg"],
    tone: "green",
  },
  {
    id: 4,
    name: "Grand Theft Auto VI",
    subtitle: "Xbox Series X|S • Mídia física",
    category: "Jogos",
    price: 449,
    oldPrice: 499.9,
    rating: 4.9,
    reviews: 86,
    badge: "Lançamento",
    image: "/products/gta-vi/main.jpg",
    gallery: ["/products/gta-vi/main.jpg", "/products/gta-vi/alt-1.jpg"],
    tone: "orange",
  },
  {
    id: 5,
    name: "EA Sports FC 27",
    subtitle: "PS5 • Mídia física",
    category: "Jogos",
    price: 339,
    oldPrice: 399.9,
    rating: 4.7,
    reviews: 29,
    badge: "Pré-venda",
    image: "/products/fc-27/main.jpg",
    gallery: ["/products/fc-27/main.jpg", "/products/fc-27/alt-1.avif"],
    tone: "orange",
  },
  {
    id: 6,
    name: "Controle sem fio DualSense",
    subtitle: "PlayStation 5 • Preto",
    category: "Acessórios",
    price: 239,
    oldPrice: 279.9,
    rating: 4.8,
    reviews: 63,
    badge: "Oferta RTF",
    image: "/products/dualsense/main.jpg",
    gallery: ["/products/dualsense/main.jpg", "/products/dualsense/alt-1.jpg"],
    tone: "pink",
  },
];

const categories = [
  { label: "Consoles", count: "03", icon: "◈" },
  { label: "Jogos", count: "02", icon: "✦" },
  { label: "Acessórios", count: "01", icon: "⌁" },
  { label: "Ofertas", count: "09", icon: "%" },
];

const trustItems = [
  { icon: ShieldCheck, title: "Compra protegida", text: "Pagamento seguro e nota fiscal" },
  { icon: Truck, title: "Envio rastreado", text: "Despacho em até 24 horas" },
  { icon: RotateCcw, title: "7 dias para trocar", text: "Você compra sem preocupação" },
  { icon: Headphones, title: "Suporte de verdade", text: "Atendimento com gente que joga" },
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [cep, setCep] = useState("");
  const [shippingOptions, setShippingOptions] = useState<Array<{ service: "PAC" | "SEDEX"; label: string; priceCents: number; deliveryDays: number | null }>>([]);
  const [selectedShipping, setSelectedShipping] = useState<"PAC" | "SEDEX" | "">("");
  const [checkoutFormOpen, setCheckoutFormOpen] = useState(false);

  const createCheckout = trpc.checkout.createPreference.useMutation({
    onSuccess: (data) => {
      const checkoutUrl = data.sandboxInitPoint ?? data.initPoint;
      if (checkoutUrl) window.location.assign(checkoutUrl);
      else showNotice("O Mercado Pago não retornou o endereço do checkout.");
    },
    onError: (error) => {
      console.error("[Checkout]", error);
      showNotice("Configure as credenciais do Mercado Pago para continuar.");
    },
  });

  const quoteShipping = trpc.checkout.quoteShipping.useMutation({
    onSuccess: (data) => {
      setShippingOptions(data.options);
      setSelectedShipping(data.options[0]?.service ?? "");
      showNotice(data.configured ? "Opções dos Correios atualizadas." : data.message);
    },
    onError: () => showNotice("Confira o CEP informado e tente novamente."),
  });

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const visibleProducts = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return products.filter((product) => {
      const categoryMatch = selectedCategory === "Todos" || product.category === selectedCategory;
      const searchMatch =
        !normalized || `${product.name} ${product.subtitle}`.toLowerCase().includes(normalized);
      return categoryMatch && searchMatch;
    });
  }, [query, selectedCategory]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const subtotalCents = Math.round(cartTotal * 100);
  const discountCents = couponApplied ? getCouponDiscountCents(subtotalCents, ACTIVE_COUPON.code) : 0;
  const selectedShippingOption = shippingOptions.find((option) => option.service === selectedShipping);
  const shippingCents = selectedShippingOption?.priceCents ?? 0;
  const checkoutTotalCents = subtotalCents - discountCents + shippingCents;

  const applyCoupon = () => {
    if (normalizeCouponCode(couponCode) !== ACTIVE_COUPON.code) {
      setCouponApplied(false);
      showNotice("Cupom inválido. Use SHELBY20.");
      return;
    }
    setCouponApplied(true);
    setCouponCode(ACTIVE_COUPON.code);
    showNotice("Cupom SHELBY20 aplicado: 20% de desconto.");
  };

  const calculateShipping = () => {
    if (cart.length === 0) return showNotice("Adicione um produto antes de calcular o frete.");
    quoteShipping.mutate({ items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })), cep });
  };

  const submitCustomerData = (customer: CustomerFormData) => {
    createCheckout.mutate({
      items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
      couponCode: couponApplied ? ACTIVE_COUPON.code : undefined,
      customer,
    });
  };

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
    showNotice(`${product.name} entrou no seu carrinho.`);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const toggleFavorite = (id: number) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const scrollToProducts = () => document.getElementById("ofertas")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="site-shell min-h-screen overflow-x-hidden bg-[#08090d] text-white">
      <div className="announcement-bar">
        <div className="container flex items-center justify-center gap-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#d6e8ff] sm:text-[11px]">
          <Sparkles className="h-3.5 w-3.5 text-[#6df4ff]" /> Frete grátis para todo o Brasil <span className="hidden text-white/35 sm:inline">•</span> <span className="hidden text-white/60 sm:inline">Cupom SHELBY20: 20% OFF</span>
        </div>
      </div>

      <header className="site-header sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090d]/80 backdrop-blur-2xl">
        <div className="container flex h-[76px] items-center justify-between gap-5">
          <a href="#inicio" className="brand-mark group flex shrink-0 items-center gap-3" aria-label="Gamers RTF início">
            <span className="brand-icon relative grid h-10 w-10 place-items-center overflow-hidden rounded-[13px] border border-[#6df4ff]/40 bg-[#0d1e28] shadow-[0_0_28px_rgba(109,244,255,0.17)]">
              <span className="absolute h-6 w-6 rotate-45 rounded-[7px] border border-[#6df4ff]" />
              <span className="relative text-[13px] font-black tracking-[-0.08em] text-[#6df4ff]">RTF</span>
            </span>
            <span className="hidden sm:block">
              <span className="block text-[17px] font-black leading-none tracking-[-0.04em] text-white">GAMERS <em className="not-italic text-[#6df4ff]">RTF</em></span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.25em] text-white/40">Play beyond limits</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
            {[
              ["Início", "#inicio"],
              ["Consoles", "#ofertas"],
              ["Jogos", "#ofertas"],
              ["Acessórios", "#ofertas"],
              ["Por que RTF?", "#manifesto"],
            ].map(([label, href]) => (
              <a key={label} href={href} className="nav-link text-[12px] font-bold tracking-wide text-white/60 transition-colors hover:text-white">{label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSearchOpen((value) => !value)} className="icon-button" aria-label="Buscar produtos"><Search className="h-[18px] w-[18px]" /></button>
            <button type="button" onClick={() => setCartOpen(true)} className="cart-trigger group relative flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 text-sm font-bold transition hover:border-[#6df4ff]/50 hover:bg-[#6df4ff]/10" aria-label="Abrir carrinho">
              <ShoppingBag className="h-[18px] w-[18px] text-[#6df4ff]" />
              <span className="hidden sm:inline">Carrinho</span>
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#6df4ff] px-1 text-[10px] font-black text-[#071017]">{cartCount}</span>
            </button>
            <button type="button" onClick={() => setMobileMenu((value) => !value)} className="icon-button lg:hidden" aria-label="Abrir menu"><Menu className="h-[18px] w-[18px]" /></button>
          </div>
        </div>
        {searchOpen && (
          <div className="border-t border-white/[0.07] bg-[#0b0d12] px-4 py-3">
            <div className="container relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6df4ff]" />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por console, jogo ou acessório..." className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#6df4ff]/50" />
            </div>
          </div>
        )}
        {mobileMenu && (
          <div className="border-t border-white/[0.07] bg-[#0b0d12] px-4 py-5 lg:hidden">
            <div className="container grid gap-1">
              {[["Início", "#inicio"], ["Consoles", "#ofertas"], ["Jogos", "#ofertas"], ["Acessórios", "#ofertas"], ["Por que RTF?", "#manifesto"]].map(([label, href]) => <a onClick={() => setMobileMenu(false)} key={label} href={href} className="rounded-xl px-3 py-3 text-sm font-bold text-white/70 hover:bg-white/5 hover:text-white">{label}</a>)}
            </div>
          </div>
        )}
      </header>

      <main>
        <section id="inicio" className="hero-section relative isolate overflow-hidden">
          <div className="hero-grid" />
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="container relative z-10 grid min-h-[650px] items-center gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
            <div className="max-w-[590px] animate-fade-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#6df4ff]/20 bg-[#6df4ff]/[0.07] px-3 py-2 text-[10px] font-black uppercase tracking-[0.23em] text-[#8ff7ff]"><span className="live-dot" /> Seu próximo nível começa aqui</div>
              <h1 className="display-heading max-w-[650px] text-[clamp(3.6rem,7vw,6.65rem)] font-black leading-[0.86] tracking-[-0.075em] text-white">Jogue no <span className="gradient-text">seu máximo.</span></h1>
              <p className="mt-7 max-w-[510px] text-[16px] leading-7 text-white/55 sm:text-[18px]">PS5, jogos e acessórios escolhidos por quem entende de gameplay. Tecnologia premium, preço justo e entrega que chega no ritmo da sua próxima partida.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={scrollToProducts} className="primary-button group flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#6df4ff] px-6 text-sm font-black uppercase tracking-[0.12em] text-[#071017] transition hover:-translate-y-1 hover:bg-[#9cf8ff]">Explorar produtos <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
                <a href="#manifesto" className="secondary-button flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 text-sm font-black uppercase tracking-[0.12em] text-white/75 transition hover:border-white/30 hover:text-white">Por que a RTF? <ChevronRight className="h-4 w-4" /></a>
              </div>
              <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#6df4ff]" /> Loja verificada</span>
                <span className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-[#6df4ff]" /> Envio seguro</span>
                <span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[#6df4ff]" /> Compra protegida</span>
              </div>
            </div>

            <div className="hero-art relative mx-auto h-[450px] w-full max-w-[620px] lg:h-[570px]">
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="hero-panel absolute right-[5%] top-[8%] w-[188px] rounded-[22px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl sm:right-[3%] sm:w-[215px]">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-white/40"><span>Setup RTF</span><Zap className="h-3.5 w-3.5 text-[#ffba5c]" /></div>
                <div className="mt-3 flex items-end gap-2"><span className="text-2xl font-black tracking-[-0.05em] text-white">4.9</span><span className="mb-1 text-[10px] text-white/45">/ 5.0</span></div>
                <div className="mt-2 flex gap-0.5 text-[#ffba5c]">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-3 w-3 fill-current" />)}</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[93%] rounded-full bg-gradient-to-r from-[#6df4ff] to-[#8f7cff]" /></div>
                <div className="mt-2 text-[10px] text-white/35">+ 2.4k gamers satisfeitos</div>
              </div>
              <div className="hero-console-shadow absolute bottom-[11%] left-[11%] h-[50px] w-[75%] rounded-[50%] bg-[#000]/70 blur-2xl" />
              <div className="hero-console absolute bottom-[14%] left-[22%] h-[245px] w-[45%] -skew-y-3 rounded-[28px] border border-white/30 bg-gradient-to-r from-[#e9f0f4] via-[#ffffff] to-[#b4c4cf] shadow-[24px_25px_55px_rgba(0,0,0,.58)] sm:h-[290px] sm:rounded-[34px]">
                <div className="absolute -left-[17%] top-[3%] h-[94%] w-[30%] rounded-l-[30px] bg-gradient-to-br from-[#c9d7e0] via-[#f8fbfd] to-[#91a9b7] shadow-[-10px_0_20px_rgba(255,255,255,.2)]" />
                <div className="absolute right-[10%] top-[5%] h-[90%] w-[7px] rounded-full bg-[#111922]/20 shadow-[3px_0_5px_rgba(255,255,255,.5)]" />
                <div className="absolute left-[53%] top-[39%] h-[47px] w-[6px] rounded-full bg-[#111922]/40" />
                <div className="absolute left-[53%] top-[57%] h-[5px] w-[22px] rounded-full bg-[#111922]/40" />
                <div className="absolute bottom-[7%] left-[22%] h-[7px] w-[36px] rounded-full bg-[#6df4ff] shadow-[0_0_16px_#6df4ff]" />
              </div>
              <div className="hero-controller absolute bottom-[9%] right-[3%] h-[120px] w-[240px] rotate-[17deg] rounded-[48%] border border-[#dfe7ed]/30 bg-gradient-to-br from-[#f8fbfd] via-[#d7e2e9] to-[#8096a4] shadow-[15px_25px_32px_rgba(0,0,0,.5)] sm:h-[150px] sm:w-[290px]">
                <div className="absolute left-[26%] top-[32%] h-5 w-5 rounded-full border-4 border-[#a9bac5] bg-[#25313b]" /><div className="absolute right-[26%] top-[27%] grid h-10 w-10 place-items-center rounded-full bg-[#c2d0d8] text-[12px] font-black text-[#24313a]">✦</div>
                <div className="absolute left-1/2 top-[31%] h-[27%] w-[2px] -translate-x-1/2 rounded-full bg-[#7d909d]" /><div className="absolute left-1/2 top-[31%] h-[2px] w-[27%] -translate-x-1/2 rounded-full bg-[#7d909d]" />
                <div className="absolute bottom-[15%] left-1/2 h-1.5 w-[28%] -translate-x-1/2 rounded-full bg-[#6df4ff] shadow-[0_0_12px_#6df4ff]" />
              </div>
              <div className="floating-tag tag-left absolute left-[3%] top-[38%] rounded-2xl border border-white/10 bg-[#10151d]/80 px-4 py-3 backdrop-blur-xl"><div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Latência</div><div className="mt-1 text-lg font-black text-[#6df4ff]">0.01ms</div></div>
              <div className="floating-tag tag-bottom absolute bottom-[1%] left-[3%] flex items-center gap-3 rounded-2xl border border-white/10 bg-[#10151d]/80 px-4 py-3 backdrop-blur-xl"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#8f7cff]/15 text-[#a69cff]"><Sparkles className="h-4 w-4" /></span><div><div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Curadoria RTF</div><div className="mt-1 text-xs font-bold text-white">Só o que vale seu tempo.</div></div></div>
            </div>
          </div>
        </section>

        <section className="trust-strip border-y border-white/[0.07] bg-[#0d1016]">
          <div className="container grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map(({ icon: Icon, title, text }, index) => <div key={title} className={`flex items-center gap-3 border-white/[0.07] py-5 lg:px-6 ${index > 0 ? "sm:border-l" : ""}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#6df4ff]/15 bg-[#6df4ff]/[0.06] text-[#6df4ff]"><Icon className="h-[18px] w-[18px]" /></span><div><div className="text-[12px] font-black text-white">{title}</div><div className="mt-1 text-[11px] text-white/40">{text}</div></div></div>)}
          </div>
        </section>

        <section id="ofertas" className="container scroll-mt-28 py-24 lg:py-32">
          <div className="mb-11 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><div className="eyebrow"><span /> Curadoria da semana</div><h2 className="section-heading mt-3 max-w-[600px] text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">Escolha seu <span className="gradient-text">próximo game.</span></h2><p className="mt-4 max-w-[560px] text-[15px] leading-6 text-white/45">Produtos selecionados para melhorar sua experiência — do primeiro boot ao momento em que você esquece do relógio.</p></div>
            <button type="button" onClick={() => { setSelectedCategory("Todos"); setQuery(""); }} className="group flex items-center gap-2 self-start text-xs font-black uppercase tracking-[0.15em] text-[#6df4ff] transition hover:text-white md:self-auto">Ver catálogo completo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
          </div>
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {["Todos", ...categories.map((category) => category.label)].map((category) => <button type="button" key={category} onClick={() => setSelectedCategory(category)} className={`category-pill whitespace-nowrap rounded-full border px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.13em] transition ${selectedCategory === category ? "border-[#6df4ff] bg-[#6df4ff] text-[#071017]" : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white"}`}>{category}</button>)}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} isFavorite={favorites.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} onAdd={() => addToCart(product)} />)}
          </div>
          {visibleProducts.length === 0 && <div className="rounded-[28px] border border-dashed border-white/15 px-6 py-16 text-center"><Search className="mx-auto h-7 w-7 text-white/30" /><h3 className="mt-4 text-lg font-black text-white">Nada encontrado por aqui</h3><p className="mt-2 text-sm text-white/45">Tente outra busca ou volte para todos os produtos.</p><button type="button" onClick={() => { setQuery(""); setSelectedCategory("Todos"); }} className="mt-6 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15">Limpar filtros</button></div>}
        </section>

        <section id="avaliacoes" className="border-y border-white/[0.07] bg-[#0a0d13] py-20 lg:py-24"><div className="container"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="eyebrow"><span /> Experiências RTF</div><h2 className="mt-4 text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">Quem joga, recomenda.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/45">Opiniões da comunidade sobre a experiência de comprar na Gamers RTF.</p></div><div className="flex items-center gap-2 rounded-full border border-[#ffbd64]/20 bg-[#ffbd64]/[0.06] px-4 py-2 text-xs font-black text-[#ffbd64]"><Star className="h-4 w-4 fill-current" /> 4,9/5 na comunidade</div></div><div className="mt-10 grid gap-4 md:grid-cols-3">{[["Lucas M.", "Chegou rápido e o PS5 veio muito bem protegido. O atendimento também foi direto ao ponto."], ["Mariana S.", "Gostei da clareza do checkout e do cupom. A compra foi simples e sem complicação."], ["Rafael G.", "O controle chegou lacrado e exatamente como anunciado. Já estou de olho no próximo jogo."]].map(([name, text]) => <article key={name} className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-[#6df4ff]/25"><div className="flex items-center justify-between"><div className="flex gap-1 text-[#ffbd64]">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current" />)}</div><span className="rounded-full bg-[#7df5a6]/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#7df5a6]">Cliente RTF</span></div><p className="mt-5 text-sm leading-6 text-white/65">“{text}”</p><div className="mt-5 text-xs font-black uppercase tracking-widest text-white">{name}</div></article>)}</div></div></section>

        <section id="manifesto" className="manifesto-section relative overflow-hidden border-y border-white/[0.07] bg-[#0d1016] py-24 lg:py-32">
          <div className="manifesto-line" /><div className="manifesto-orb" />
          <div className="container relative z-10 grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div><div className="eyebrow"><span /> O jeito RTF de jogar</div><h2 className="mt-4 max-w-[430px] text-4xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-5xl">Não vendemos só produtos. <span className="gradient-text">Entregamos momentos.</span></h2><p className="mt-6 max-w-[440px] text-[15px] leading-7 text-white/45">A Gamers RTF nasceu para deixar sua jornada gamer mais simples, segura e muito mais divertida. Sem enrolação. Sem produto genérico. Só o que faz sentido para você.</p><button type="button" onClick={() => showNotice("Em breve: conheça a história completa da Gamers RTF.")} className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-[#6df4ff]">Conheça a nossa história <ArrowRight className="h-4 w-4" /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[["01", "Curadoria sem ruído", "A gente testa, pesquisa e compara para você comprar com confiança."], ["02", "Preço que faz sentido", "Ofertas reais, condições transparentes e zero pegadinha no checkout."], ["03", "Pós-venda humano", "Se deu qualquer dúvida, você fala com quem realmente entende do assunto."], ["04", "Comunidade primeiro", "Cada compra ajuda a construir uma comunidade que joga junto."]].map(([number, title, text]) => <div key={number} className="manifesto-card group rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-[#6df4ff]/30 hover:bg-white/[0.06]"><div className="flex items-start justify-between"><span className="text-[11px] font-black tracking-[0.2em] text-[#6df4ff]">{number}</span><ArrowRight className="h-4 w-4 text-white/20 transition group-hover:translate-x-1 group-hover:text-[#6df4ff]" /></div><h3 className="mt-9 text-lg font-black tracking-[-0.03em] text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-white/40">{text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="container py-20 lg:py-24"><div className="rounded-[32px] border border-white/[0.08] bg-white/[0.025] p-7 sm:p-10"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="eyebrow"><span /> Pagamento seguro</div><h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">Escolha como pagar.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">No Checkout Pro, o Mercado Pago apresenta as opções elegíveis para cada compra e perfil de cliente.</p></div><ShieldCheck className="h-8 w-8 text-[#6df4ff]" /></div><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{["Pix", "Cartão de crédito", "Cartão de débito", "Boleto bancário", "Conta Mercado Pago", "Linha de Crédito"].map((method) => <div key={method} className="flex min-h-20 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/15 px-3 text-center text-xs font-black text-white/70 transition hover:border-[#6df4ff]/30 hover:text-white">{method}</div>)}</div><p className="mt-5 text-[10px] leading-5 text-white/30">A disponibilidade, parcelamento, limites e aprovação dependem da análise do Mercado Pago, da conta do comprador e da região. A loja não armazena dados do cartão.</p><div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#6df4ff]/15 bg-[#6df4ff]/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-black uppercase tracking-widest text-[#6df4ff]">Parcelamento no boleto</div><p className="mt-1 text-xs leading-5 text-white/50">Consulte condições e disponibilidade diretamente pelo WhatsApp da Gamers RTF.</p></div><span className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70">Atendimento RTF</span></div></div></section>

        <section className="container py-24 lg:py-32">
          <div className="newsletter-card relative overflow-hidden rounded-[32px] border border-[#6df4ff]/20 bg-gradient-to-br from-[#112c38] via-[#101a28] to-[#171129] p-8 sm:p-12 lg:p-16"><div className="newsletter-grid" /><div className="relative z-10 max-w-[600px]"><div className="eyebrow"><span /> Drop semanal</div><h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">Fique à frente do próximo lançamento.</h2><p className="mt-4 text-[15px] leading-6 text-white/50">Ofertas relâmpago, lançamentos e dicas para melhorar seu setup — direto na sua caixa de entrada.</p><div className="mt-8 flex max-w-[490px] flex-col gap-3 sm:flex-row"><input aria-label="Seu melhor e-mail" placeholder="seu@email.com" className="h-13 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#6df4ff]/50" /><button type="button" onClick={() => showNotice("Inscrição realizada. Bem-vindo ao drop semanal RTF!")} className="h-13 rounded-xl bg-white px-5 text-xs font-black uppercase tracking-[0.12em] text-[#081017] transition hover:bg-[#6df4ff]">Quero receber</button></div><div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30"><LockKeyhole className="h-3 w-3" /> Sem spam. Só conteúdo que vale seu tempo.</div></div><div className="newsletter-symbol absolute -right-12 -top-16 hidden h-[300px] w-[300px] rounded-full border border-[#6df4ff]/20 lg:block" /></div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] bg-[#06070a] py-10"><div className="container flex flex-col justify-between gap-8 md:flex-row md:items-center"><div><div className="text-[17px] font-black tracking-[-0.04em] text-white">GAMERS <span className="text-[#6df4ff]">RTF</span></div><p className="mt-2 text-xs text-white/35">Play beyond limits. © 2026 Gamers RTF.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-bold uppercase tracking-[0.13em] text-white/40"><Link href="/legal/termos" className="hover:text-white">Termos</Link><Link href="/legal/privacidade" className="hover:text-white">Privacidade</Link><Link href="/legal/trocas" className="hover:text-white">Trocas</Link><Link href="/pedido" className="hover:text-white">Rastrear pedido</Link><a href="#manifesto" className="hover:text-white">Atendimento</a><span className="flex items-center gap-1.5 text-[#6df4ff]"><MapPin className="h-3.5 w-3.5" /> Brasil</span></div></div></footer>

      {cartOpen && <div className="fixed inset-0 z-50"><button type="button" aria-label="Fechar carrinho" onClick={() => setCartOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" /><aside className="cart-drawer absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-white/10 bg-[#0d1016] shadow-[-20px_0_60px_rgba(0,0,0,.45)]"><div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5"><div><div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6df4ff]">Seu inventário</div><h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-white">Carrinho <span className="text-white/30">({cartCount})</span></h2></div><button type="button" onClick={() => setCartOpen(false)} className="icon-button" aria-label="Fechar carrinho"><X className="h-5 w-5" /></button></div><div className="flex-1 overflow-y-auto px-6 py-6">{cart.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><span className="grid h-20 w-20 place-items-center rounded-[28px] border border-[#6df4ff]/20 bg-[#6df4ff]/[0.06] text-[#6df4ff]"><ShoppingBag className="h-8 w-8" /></span><h3 className="mt-6 text-lg font-black text-white">Seu carrinho está vazio</h3><p className="mt-2 max-w-[230px] text-sm leading-6 text-white/40">Adicione um produto e deixe seu próximo setup começar.</p><button type="button" onClick={() => { setCartOpen(false); scrollToProducts(); }} className="mt-7 rounded-xl bg-[#6df4ff] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#071017]">Explorar produtos</button></div> : <div className="space-y-4">{cart.map((item) => <div key={item.id} className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3"><div className={`product-thumb tone-${item.tone}`}><img src={item.image} alt="" /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-black text-white">{item.name}</div><div className="mt-1 text-xs text-white/40">{item.subtitle}</div><div className="mt-3 flex items-center justify-between"><span className="text-sm font-black text-[#6df4ff]">{formatPrice(item.price)}</span><div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 p-1"><button type="button" onClick={() => updateQuantity(item.id, -1)} className="grid h-5 w-5 place-items-center rounded text-white/50 hover:bg-white/10 hover:text-white"><Minus className="h-3 w-3" /></button><span className="w-4 text-center text-xs font-bold text-white">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.id, 1)} className="grid h-5 w-5 place-items-center rounded text-white/50 hover:bg-white/10 hover:text-white"><Plus className="h-3 w-3" /></button></div></div></div></div>)}</div>}</div>{cart.length > 0 && <div className="border-t border-white/[0.08] bg-[#0a0c11] px-6 py-5"><div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#6df4ff]">Cupom especial</div><div className="mt-1 text-xs text-white/45">Use SHELBY20 e ganhe 20% OFF</div></div><Zap className="h-4 w-4 text-[#ffc76b]" /></div><div className="mt-3 flex gap-2"><input value={couponCode} onChange={(event) => { setCouponCode(event.target.value); setCouponApplied(false); }} placeholder="SHELBY20" aria-label="Cupom de desconto" className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-xs font-bold uppercase text-white outline-none placeholder:text-white/25 focus:border-[#6df4ff]/50" /><button type="button" onClick={applyCoupon} className="rounded-xl bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#6df4ff] hover:text-[#071017]">Aplicar</button></div>{couponApplied && <div className="mt-2 text-[10px] font-bold text-[#7df5a6]">Cupom aplicado: -20%</div>}</div><div className="mt-3 rounded-2xl border border-[#7df5a6]/20 bg-[#7df5a6]/[0.06] p-4"><div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#7df5a6]">Frete grátis nacional</div><div className="mt-1 text-xs text-white/45">Entrega grátis para todo o Brasil durante a fase de testes.</div></div><Truck className="h-4 w-4 text-[#7df5a6]" /></div></div><div className="mt-4 space-y-2 text-sm text-white/45"><div className="flex items-center justify-between"><span>Subtotal</span><span>{formatPrice(subtotalCents / 100)}</span></div>{discountCents > 0 && <div className="flex items-center justify-between text-[#7df5a6]"><span>Desconto SHELBY20</span><span>- {formatPrice(discountCents / 100)}</span></div>}<div className="flex items-center justify-between text-[#7df5a6]"><span>Frete grátis</span><span>R$ 0,00</span></div><div className="flex items-center justify-between border-t border-white/[0.08] pt-3"><span>Total</span><span className="text-lg font-black text-white">{formatPrice(checkoutTotalCents / 100)}</span></div></div><button type="button" disabled={createCheckout.isPending} onClick={() => setCheckoutFormOpen(true)} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#6df4ff] text-xs font-black uppercase tracking-[0.13em] text-[#071017] transition hover:bg-[#9cf8ff] disabled:cursor-not-allowed disabled:opacity-50">{createCheckout.isPending ? "Abrindo Mercado Pago..." : "Ir para checkout"} <ArrowRight className="h-4 w-4" /></button><div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/25"><CreditCard className="h-3.5 w-3.5" /> Pix, cartão ou boleto</div></div>}</aside></div>}
      {checkoutFormOpen && <CustomerCheckoutForm onCancel={() => setCheckoutFormOpen(false)} onSubmit={submitCustomerData} isPending={createCheckout.isPending} error={createCheckout.error?.message} />}
      {notice && <div className="toast-notice fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#6df4ff]/25 bg-[#101a22]/95 px-4 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#6df4ff] text-[#071017]"><BadgeCheck className="h-4 w-4" /></span>{notice}</div>}
    </div>
  );
}

function ProductCard({ product, index, isFavorite, onFavorite, onAdd }: { product: Product; index: number; isFavorite: boolean; onFavorite: () => void; onAdd: () => void }) {
  return <article className="product-card group" style={{ animationDelay: `${index * 70}ms` }}>
    <div className={`product-image tone-${product.tone}`}><div className="product-noise" /><div className="product-badge">{product.badge}</div><button type="button" onClick={onFavorite} className={`favorite-button ${isFavorite ? "is-favorite" : ""}`} aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}><Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} /></button><img src={product.image} alt={product.name} loading="lazy" /><Link href={`/produto/${product.id}`} className="product-quickview" aria-label={`Ver mais detalhes de ${product.name}`}><span>Ver mais detalhes</span><ChevronRight className="h-4 w-4" /></Link></div>
    <div className="pt-5"><div className="flex items-center gap-1 text-[10px] font-black tracking-[0.08em] text-[#ffbd64]"><Star className="h-3 w-3 fill-current" /> {product.rating} <span className="font-medium text-white/30">({product.reviews})</span></div><Link href={`/produto/${product.id}`} className="mt-2 block text-[18px] font-black tracking-[-0.04em] text-white transition hover:text-[#6df4ff]">{product.name}</Link><p className="mt-1 text-[12px] text-white/40">{product.subtitle}</p><div className="mt-5 flex items-end justify-between gap-3"><div><div className="text-[11px] text-white/30 line-through">{product.oldPrice ? formatPrice(product.oldPrice) : ""}</div><div className="text-[21px] font-black tracking-[-0.05em] text-white">{formatPrice(product.price)}</div></div><button type="button" onClick={onAdd} className="add-button grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#6df4ff] text-[#071017] transition hover:scale-105 hover:bg-[#a0f9ff]" aria-label={`Adicionar ${product.name} ao carrinho`}><Plus className="h-5 w-5" /></button></div><Link href={`/produto/${product.id}`} className="product-detail-link mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/30 transition hover:text-[#6df4ff]"><Clock3 className="h-3.5 w-3.5 text-[#6df4ff]" /> Pronta entrega <span className="ml-auto">Ver detalhes <ArrowRight className="inline h-3 w-3" /></span></Link></div>
  </article>;
}
