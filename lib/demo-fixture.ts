// Synthetic demo data for iteration 007. Every name and text below is fictitious.
export type DemoAccountKey = 'cliente' | 'iara' | 'tomas' | 'bento' | 'revisor';
export type DemoCommissionKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export const DEMO_ACCOUNTS: Record<DemoAccountKey, { username: string; displayName: string; role: 'artist' | 'client'; bio: string }> = {
  cliente: { username: 'demo-cliente', displayName: 'Marina Costa (fictícia)', role: 'client', bio: 'Cliente fictícia da demonstração. Encomenda ilustrações para projetos do bairro.' },
  iara: { username: 'demo-artista-iara', displayName: 'Iara Lins (fictícia)', role: 'artist', bio: 'Artista fictícia. Aquarela digital, retratos de animais e cartazes coloridos.' },
  tomas: { username: 'demo-artista-tomas', displayName: 'Tomás Reis (fictício)', role: 'artist', bio: 'Artista fictício. Mapas ilustrados, rótulos e traço em nanquim.' },
  bento: { username: 'demo-artista-bento', displayName: 'Bento Alves (fictício)', role: 'artist', bio: 'Artista fictício. Personagens, mascotes e capas com formas geométricas.' },
  revisor: { username: 'demo-revisor', displayName: 'Revisão Mecenas (fictícia)', role: 'client', bio: 'Conta fictícia da revisão da plataforma. Não faz encomendas.' },
};

type Commission = {
  title: string; description: string; priceCents: number;
  /** Artists who applied, in order. The first one gets the offer when there is one. */
  applicants: DemoAccountKey[];
  state: 'open' | 'pendingOffer' | 'awaitingPayment' | 'review' | 'approved' | 'disputed';
  revisionNote?: string; disputeReason?: string;
};

export const DEMO_COMMISSIONS: Record<DemoCommissionKey, Commission> = {
  A: { title: 'Capa para zine de poesia urbana', priceCents: 8000, applicants: ['iara', 'bento'], state: 'open',
    description: 'Capa em formato A5 para um zine de poesia sobre a cidade. Gosto de cores fortes e de prédios desenhados à mão.' },
  B: { title: 'Pôster para festa junina do bairro', priceCents: 5000, applicants: ['iara', 'tomas'], state: 'pendingOffer',
    description: 'Pôster vertical com bandeirinhas, fogueira e espaço para a data. Vai ser impresso em A3 e colado no comércio local.' },
  C: { title: 'Rótulo ilustrado para café especial', priceCents: 12000, applicants: ['tomas'], state: 'awaitingPayment',
    description: 'Rótulo para um pacote de 250 g de café fictício. Quero um pé de café em nanquim, com uma montanha ao fundo.' },
  D: { title: 'Retrato ilustrado da cachorra Pipoca', priceCents: 15000, applicants: ['iara'], state: 'review',
    description: 'Retrato da cachorra Pipoca, vira-lata caramelo, sentada no sofá. Estilo aquarela, para emoldurar na sala.' },
  E: { title: 'Mapa ilustrado da feira de domingo', priceCents: 20000, applicants: ['tomas'], state: 'approved',
    revisionNote: 'Pode incluir a barraca de pastel na esquina e deixar os nomes das ruas maiores?',
    description: 'Mapa ilustrado das barracas da feira de domingo, para o folheto da associação de feirantes.' },
  F: { title: 'Mascote para feira de ciências da escola', priceCents: 9000, applicants: ['bento'], state: 'disputed',
    disputeReason: 'As etapas do processo não parecem corresponder à imagem final. Peço a análise da plataforma.',
    description: 'Mascote amigável para a feira de ciências: um átomo com rosto e tênis. Será usado em camisetas e faixas.' },
};

/** Versions each seeded delivery has; the last one is the current version. */
export const DEMO_DELIVERY_VERSIONS: Partial<Record<DemoCommissionKey, number>> = { D: 1, E: 2, F: 1 };
export const DEMO_PALETTES: Record<DemoCommissionKey, [string, string, string]> = {
  A: ['#2d3a8c', '#f2b134', '#ef6f53'], B: ['#c0392b', '#f4d03f', '#27ae60'], C: ['#3e2723', '#a1887f', '#7cb342'],
  D: ['#d98e4a', '#5d4037', '#f6e3c5'], E: ['#00796b', '#ffca28', '#e64a19'], F: ['#6a1b9a', '#26c6da', '#ffee58'],
};
