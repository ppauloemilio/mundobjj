import { SearchPanel } from "@/components/search-panel";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm font-semibold tracking-[0.18em] text-[var(--accent-2)] uppercase">
            Jiu-Jitsu
          </p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Mundo BJJ
          </h1>
          <p className="max-w-xl text-base leading-7 text-[#f3eadf]">
            Ache uma academia para treinar na sua cidade ou na viagem. Veja o
            professor, o horário e quem aceita visitante.
          </p>
        </div>
      </section>
      <SearchPanel />
    </main>
  );
}
