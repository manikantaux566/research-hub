import { Header } from "../components/layout/Header";
import { FindingSection } from "../components/entities/FindingEntity";

export function Findings() {
  return (
    <div className="pb-10">
      <Header
        title="Findings"
        subtitle="What your evidence currently establishes, with its confidence level."
        icon="findings"
      />
      <div className="px-6">
        <FindingSection />
      </div>
    </div>
  );
}
