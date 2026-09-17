import { Header } from "../components/layout/Header";
import { InsightSection } from "../components/entities/InsightEntity";

export function Insights() {
  return (
    <div className="pb-10">
      <Header
        title="Insights"
        subtitle="Synthesis of what your findings mean — the conclusions you can defend."
        icon="insights"
      />
      <div className="px-6">
        <InsightSection />
      </div>
    </div>
  );
}
