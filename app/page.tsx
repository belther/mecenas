const accounts: [string, string][] = [
  ['demo-cliente', 'Cliente: escolhe artistas, avalia entregas e baixa a ilustração com licença.'],
  ['demo-artista-iara', 'Artista: responde a uma oferta e acompanha uma entrega em avaliação.'],
  ['demo-artista-tomas', 'Artista: está na fila de reserva e tem uma entrega aprovada.'],
  ['demo-artista-bento', 'Artista: tem uma entrega contestada por uso de IA.'],
  ['demo-revisor', 'Plataforma: decide a contestação de uso de IA.'],
];

export default function Home() {
  return <>
    <header><a className="wordmark" href="/" aria-label="Mecenas, início">mecenas<span>✳</span></a><span className="pill">Ilustração · Hack Brasil 2026</span></header>
    <main>
      <section className="hero">
        <div><p className="eyebrow">FEITO POR GENTE. VALORIZADO POR VOCÊ.</p><h1>Você encomenda.<br />O artista <em>recebe.</em></h1><p className="intro">Uma ideia sua, o traço de um artista. Encomende ilustrações com um acordo claro e respeito por cada etapa da criação.</p><a className="button" href="#como-funciona">Conheça o caminho <span aria-hidden="true">↗</span></a><p className="fine">Zero taxa da plataforma para artistas.</p></div>
        <div className="art" role="img" aria-label="Composição abstrata original com formas de papel, sol e uma flor"><span className="sun"/><span className="arch"/><span className="stem"/><span className="flower">✳</span><span className="art-label">toda ideia merece ganhar forma.</span><span className="signature">M / 01</span></div>
      </section>
      <section id="como-funciona" className="steps"><div className="section-heading"><p className="eyebrow">DO PRIMEIRO TRAÇO À ENTREGA</p><h2>Um acordo que cuida<br />de quem cria.</h2></div><div className="cards">
        <article><span className="number">01</span><h3>Conte sua ideia</h3><p>O cliente descreve a ilustração e define o valor por artista. Artistas se candidatam, sem fazer testes grátis. O cliente escolhe e monta uma fila de reserva.</p></article>
        <article><span className="number">02</span><h3>Combine antes de criar</h3><p>O artista aceita ou recusa a oferta em 24 horas. Ao aceitar, o cliente paga um Pix em modo de teste antes do primeiro traço. Nesta demonstração, a reserva do valor e o repasse ao artista são simulados.</p></article>
        <article><span className="number">03</span><h3>Aprove e receba</h3><p>Prévia com marca d’água, imagens do processo e duas revisões. Sem resposta em 72 horas, a entrega é aprovada. Contestação de IA passa por revisão humana.</p></article>
      </div></section>
      <aside className="notice"><strong>Ateliê de demonstração aberto para avaliação.</strong><p>Entre com uma das contas fictícias abaixo. A senha está no formulário de inscrição do Hack Brasil. Todos os dados são fictícios. Os pagamentos são de demonstração e o repasse ao artista é simulado: nenhum dinheiro real é movimentado.</p>
        <ul className="accounts">{accounts.map(([name, role]) => <li key={name}><code>{name}</code> <span>{role}</span></li>)}</ul>
        <a className="button" href="/painel">Abrir o ateliê <span aria-hidden="true">↗</span></a></aside>
    </main>
  </>;
}
