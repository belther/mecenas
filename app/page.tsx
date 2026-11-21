export default function Home() {
  return <>
    <header><a className="wordmark" href="/" aria-label="Mecenas, início">mecenas<span>✳</span></a><span className="pill">Ilustração · demo em construção</span></header>
    <main>
      <section className="hero">
        <div><p className="eyebrow">FEITO POR GENTE. VALORIZADO POR VOCÊ.</p><h1>Você encomenda.<br />O artista <em>recebe.</em></h1><p className="intro">Uma ideia sua, o traço de um artista. Encomende ilustrações com um acordo claro e respeito por cada etapa da criação.</p><a className="button" href="#como-funciona">Conheça o caminho <span aria-hidden="true">↗</span></a><p className="fine">Zero taxa da plataforma para artistas.</p></div>
        <div className="art" role="img" aria-label="Composição abstrata original com formas de papel, sol e uma flor"><span className="sun"/><span className="arch"/><span className="stem"/><span className="flower">✳</span><span className="art-label">toda ideia merece ganhar forma.</span><span className="signature">M / 01</span></div>
      </section>
      <section id="como-funciona" className="steps"><div className="section-heading"><p className="eyebrow">DO PRIMEIRO TRAÇO À ENTREGA</p><h2>Um acordo que cuida<br />de quem cria.</h2></div><div className="cards">
        <article><span className="number">01</span><h3>Conte sua ideia</h3><p>O cliente descreve a ilustração e define o valor por artista. Artistas se candidatam, sem fazer testes grátis.</p></article>
        <article><span className="number">02</span><h3>Combine antes de criar</h3><p>A proposta aceita vem antes do trabalho. O fluxo previsto inclui Pix de teste e duas revisões.</p></article>
        <article><span className="number">03</span><h3>Aprove e receba</h3><p>Prévia com marca d’água, imagens do processo e licença de uso. A entrega final vem após a aprovação.</p></article>
      </div></section>
      <aside className="notice"><strong>Primeiros traços, por enquanto.</strong><p>Esta é a primeira versão do Mecenas. Cadastro, encomendas e pagamentos ainda não estão disponíveis. A demo usará somente dados sintéticos e pagamentos simulados.</p></aside>
    </main>
  </>;
}
