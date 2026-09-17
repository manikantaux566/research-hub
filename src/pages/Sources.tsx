import { Header } from "../components/layout/Header";
import { SourceSection } from "../components/entities/SourceEntity";

export function Sources() {
  return (
    <div className="pb-10">
      <Header
        title="Sources"
        subtitle="Everything you've consulted across your projects — papers, books, web pages, datasets and interviews."
        icon="sources"
      />
      <div className="px-6">
        <SourceSection />
      </div>
    </div>
  );
}
