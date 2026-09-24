import { Link } from "wouter";
import { MessageCircle, PackageSearch } from "lucide-react";

export default function StoreSupport() {
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;
  return <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2"><Link href="/pedido" className="flex items-center gap-2 rounded-full border border-white/10 bg-[#10141c]/95 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl backdrop-blur transition hover:border-[#6df4ff]/40"><PackageSearch className="h-4 w-4 text-[#6df4ff]" /> Rastrear pedido</Link>{whatsappNumber && <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá, Gamers RTF! Preciso de ajuda com meu pedido.")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3 text-xs font-black uppercase tracking-widest text-[#06270f] shadow-xl transition hover:brightness-110"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}</div>;
}
