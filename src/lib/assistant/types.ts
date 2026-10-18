export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  checkedAt: string | null;
  dataDate: string | null;
  needsVerification: boolean;
  sections: string[];
};
export type Passage = {
  id: string;
  district: string;
  districtName: string;
  section: string;
  title: string;
  text: string;
  guideUrl: string;
  updatedAt: string;
  sources: Source[];
};
export type ResearchInput = { question: string; districts: string[] };
export type ResearchAnswer = {
  mode: "local" | "claude";
  message: string;
  passages: Passage[];
  retrievedAt: string;
  question: string;
};
