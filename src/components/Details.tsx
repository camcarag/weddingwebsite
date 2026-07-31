export default function Details() {
  return (
    <section className="relative bg-neutral-950 px-6 py-32 text-white">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/60">Save the Date</p>
        <h2 className="mb-8 font-serif text-4xl md:text-6xl">Cam &amp; Partner</h2>
        <p className="mb-2 text-2xl md:text-3xl">Month DD, YYYY</p>
        <p className="mb-10 text-lg text-white/70">City, State · Formal invitation to follow</p>
        <a
          href="#"
          className="inline-block rounded-full border border-white/40 px-8 py-3 text-sm uppercase tracking-widest transition-colors hover:bg-white hover:text-black"
        >
          More details soon
        </a>
      </div>
    </section>
  );
}
