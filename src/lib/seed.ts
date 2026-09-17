import {
  claims,
  evidence,
  experiments,
  findings,
  gaps,
  hypotheses,
  insights,
  notes,
  projects,
  questions,
  sources,
  tags,
  writingNodes,
  writingProjects,
} from "./storage";

/**
 * Development-only sample data. Never called automatically for real users.
 * Produces clearly-labeled demo records so the UI can be exercised.
 */
export async function seedSampleData(): Promise<void> {
  const project = await projects.create({
    name: "Sample: Renewable Energy Adoption",
    description:
      "Demo project exploring why renewable energy adoption varies across regions.",
    status: "active",
    topic: "Energy policy",
  });

  const tag1 = await tags.create({
    name: "energy",
    color: "green",
  });
  const tag2 = await tags.create({
    name: "policy",
    color: "blue",
  });
  const tag3 = await tags.create({
    name: "solar",
    color: "amber",
  });

  await projects.update(project.id, {
    tagIds: [tag1.id, tag2.id],
  });

  const source = await sources.create({
    projectId: project.id,
    title: "World Energy Outlook 2025",
    author: "International Energy Agency",
    type: "report",
    publisher: "IEA",
    publicationDate: "2025-07-01",
    description:
      "Annual reference analysis of global energy trends. Loaded as demo data.",
    tagIds: [tag1.id],
  });

  const evidenceRecord = await evidence.create({
    projectId: project.id,
    sourceId: source.id,
    title: "Solar cost curve",
    type: "statistic",
    content:
      "Levelized cost of solar PV declined roughly 90% between 2010 and 2024 on a global average basis.",
    location: "Figure 3.4",
    interpretation:
      "Cost alone is no longer the primary barrier to solar adoption in many markets.",
    verificationStatus: "unverified",
    isAiGenerated: false,
    tagIds: [tag3.id],
  });

  const question = await questions.create({
    projectId: project.id,
    question:
      "Which factors best explain regional differences in renewable energy adoption rates?",
    status: "investigating",
    priority: "high",
    notes: "Central question for the demo project.",
    tagIds: [tag1.id],
  });

  await gaps.create({
    projectId: project.id,
    questionIds: [question.id],
    title: "Local policy effects are under-measured",
    description:
      "Existing datasets rarely separate grid constraints from policy incentives.",
    importance: "high",
    status: "identified",
    suggestedDirection: "Gather longitudinal policy data for 50+ regions.",
    tagIds: [tag2.id],
  });

  const hypothesis = await hypotheses.create({
    projectId: project.id,
    questionId: question.id,
    title: "Grid capacity limits solar adoption in developing regions",
    statement:
      "Grid capacity, not cost, is the limiting factor for solar adoption in developing regions.",
    rationale:
      "Where financing is subsidized, transmission constraints correlate with stalled projects.",
    status: "testing",
    tagIds: [tag3.id],
  });

  const experiment = await experiments.create({
    projectId: project.id,
    hypothesisId: hypothesis.id,
    questionId: question.id,
    title: "Correlate grid investment with adoption",
    objective:
      "Determine whether grid investment per capita predicts solar adoption rates.",
    methodology:
      "Compare 2018–2024 adoption growth against grid investment per capita across 30 regions.",
    procedure:
      "Collect grid investment data from IEA and World Bank. Calculate adoption growth rates. Run regression analysis.",
    variables: [
      { key: "grid_investment_per_capita", value: "USD", unit: "currency" },
      { key: "adoption_growth_rate", value: "%", unit: "percent" },
    ],
    expectedResult:
      "Regions with higher grid investment show higher adoption growth.",
    status: "completed",
    actualResult:
      "Correlation found at r=0.68 across 30 regions.",
    conclusion:
      "Grid investment is a strong predictor but policy environment moderates the effect.",
    limitations: "Small sample in Sub-Saharan Africa. Data gaps in 2020–2021.",
    evidenceIds: [evidenceRecord.id],
    findingIds: [],
    tagIds: [tag1.id],
  });

  const finding = await findings.create({
    projectId: project.id,
    questionId: question.id,
    experimentId: experiment.id,
    title: "Cost reductions tracked adoption gains",
    description:
      "Adoption of solar PV rose fastest during the period of steepest cost decline.",
    confidence: "medium",
    evidenceIds: [evidenceRecord.id],
    tagIds: [tag3.id],
  });

  await claims.create({
    projectId: project.id,
    claim:
      "This demo claim has deliberately no supporting evidence to show the unsupported state.",
    type: "opinion",
    verificationStatus: "unverified",
    evidenceIds: [],
    findingIds: [],
    expectedEvidenceCount: 2,
    expectedFindingCount: 1,
    notes: "Created by the sample data loader.",
  });

  await claims.create({
    projectId: project.id,
    claim: "Falling solar costs correlate with rising adoption in the demo data.",
    type: "fact",
    verificationStatus: "unverified",
    evidenceIds: [evidenceRecord.id],
    findingIds: [finding.id],
  });

  await insights.create({
    projectId: project.id,
    questionId: question.id,
    title: "Cost is necessary but not sufficient",
    description:
      "Affordability enables adoption, but what actually moves adoption is the local enabling environment.",
    findingIds: [finding.id],
    tagIds: [tag1.id],
  });

  await notes.create({
    projectId: project.id,
    title: "Reading queue",
    content:
      "Track down the IEA distributed PV modelling report. Demo note only.",
    tags: ["to-read", "demo"],
    tagIds: [tag1.id],
  });

  const wp = await writingProjects.create({
    projectId: project.id,
    title: "Energy Policy Review — Draft",
    type: "paper",
    status: "drafting",
    summary:
      "Working draft summarizing findings on renewable energy adoption barriers.",
    tagIds: [tag2.id],
  });

  const chapter1 = await writingNodes.create({
    projectId: project.id,
    writingProjectId: wp.id,
    kind: "chapter",
    title: "Introduction",
    content: "<p>This paper examines the factors behind regional variation in renewable energy adoption.</p>",
    order: 0,
    status: "draft",
    researchRefs: {
      questionIds: [question.id],
      sourceIds: [],
      evidenceIds: [],
      findingIds: [],
      insightIds: [],
      claimIds: [],
      gapIds: [],
      hypothesisIds: [],
      experimentIds: [],
    },
  });

  await writingNodes.create({
    projectId: project.id,
    writingProjectId: wp.id,
    parentId: chapter1.id,
    kind: "section",
    title: "Background",
    content: "<p>Global solar capacity has grown rapidly, but adoption remains uneven across regions.</p>",
    order: 0,
    status: "in-progress",
    researchRefs: {
      questionIds: [],
      sourceIds: [source.id],
      evidenceIds: [evidenceRecord.id],
      findingIds: [finding.id],
      insightIds: [],
      claimIds: [],
      gapIds: [],
      hypothesisIds: [],
      experimentIds: [],
    },
  });

  await writingNodes.create({
    projectId: project.id,
    writingProjectId: wp.id,
    kind: "chapter",
    title: "Methods",
    content: "<p>We conducted a cross-regional analysis of 30 regions over 6 years.</p>",
    order: 1,
    status: "draft",
    researchRefs: {
      questionIds: [],
      sourceIds: [],
      evidenceIds: [],
      findingIds: [],
      insightIds: [],
      claimIds: [],
      gapIds: [],
      hypothesisIds: [],
      experimentIds: [experiment.id],
    },
  });
}
