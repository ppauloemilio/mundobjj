import { HomeHero } from "@/components/home-hero";
import { SearchPanel } from "@/components/search-panel";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <HomeHero />
      <SearchPanel />
    </main>
  );
}
