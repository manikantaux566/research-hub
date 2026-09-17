import { Header } from "../components/layout/Header";
import { QuestionSection } from "../components/entities/QuestionEntity";

export function Questions() {
  return (
    <div className="pb-10">
      <Header
        title="Research questions"
        subtitle="The open questions driving your inquiry, and where each one stands."
        icon="questions"
      />
      <div className="px-6">
        <QuestionSection />
      </div>
    </div>
  );
}
