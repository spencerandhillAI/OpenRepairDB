import Link from "next/link";

const searchExamples = ["E-Nr. / Modellnummer", "PCB- oder Platinenkennung", "Bauteilnummer", "Fehlercode oder Symptom"];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/">OpenRepair<span>DB</span></Link>
        <nav><a href="#about">Projekt</a><a href="https://github.com/spencerandhillAI/OpenRepairDB" target="_blank" rel="noreferrer">GitHub ↗</a></nav>
      </header>

      <section className="hero">
        <p className="eyebrow">OPEN KNOWLEDGE · BETTER REPAIRS</p>
        <h1>Reparaturwissen.<br /><span>Zusammengeführt.</span></h1>
        <p className="intro">Finde technische Informationen nicht nur zu einem Gerät, sondern auch zu den Platinen, Bauteilen und Fehlern, die es mit anderen Geräten verbinden.</p>
        <form className="search" action="/search">
          <input name="q" aria-label="OpenRepairDB durchsuchen" placeholder="Modell, Platine, Bauteil oder Fehlercode suchen …" />
          <button type="submit">Suchen <span aria-hidden="true">→</span></button>
        </form>
        <div className="examples">{searchExamples.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className="pillars" id="about">
        <article><div className="number">01</div><h2>Geräte</h2><p>Modelle, Hersteller und eindeutige Produktkennungen an einem Ort.</p></article>
        <article><div className="number">02</div><h2>Platinen & Bauteile</h2><p>Verbindungen zwischen Baugruppen, Ersatzteilen und baugleichen Geräten.</p></article>
        <article><div className="number">03</div><h2>Reparaturwissen</h2><p>Fehlerbilder, Messwerte, Reparaturberichte und nachvollziehbare Quellen.</p></article>
      </section>

      <footer><span>OpenRepairDB</span><span>Offen. Nachvollziehbar. Geräteübergreifend.</span></footer>
    </main>
  );
}
