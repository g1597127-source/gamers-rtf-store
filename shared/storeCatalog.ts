export type StoreCatalogItem = {
  id: number;
  name: string;
  subtitle: string;
  category: "Consoles" | "Jogos" | "Acessórios";
  unitPriceCents: number;
};

/**
 * Fonte de verdade do checkout. O servidor nunca aceita preço vindo do navegador.
 * Os valores estão em centavos de real para evitar erros de arredondamento.
 */
export const STORE_CATALOG: StoreCatalogItem[] = [
  { id: 1, name: "PlayStation 5 Slim + 2 controles", subtitle: "Edição com leitor • 2 controles DualSense", category: "Consoles", unitPriceCents: 320000 },
  { id: 2, name: "PlayStation 5 Pro", subtitle: "Ray tracing avançado • SSD de alta velocidade", category: "Consoles", unitPriceCents: 450000 },
  { id: 3, name: "Xbox Series S 512GB", subtitle: "Console digital • Controle sem fio", category: "Consoles", unitPriceCents: 300000 },
  { id: 4, name: "Grand Theft Auto VI", subtitle: "Xbox Series X|S • Mídia física", category: "Jogos", unitPriceCents: 44900 },
  { id: 5, name: "EA Sports FC 27", subtitle: "PS5 • Mídia física", category: "Jogos", unitPriceCents: 33900 },
  { id: 6, name: "Controle sem fio DualSense", subtitle: "PlayStation 5 • Preto", category: "Acessórios", unitPriceCents: 23900 },
];

export function getCatalogItem(id: number) {
  return STORE_CATALOG.find((item) => item.id === id);
}
