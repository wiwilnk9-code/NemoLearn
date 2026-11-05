export interface Topic {
  id: string;
  name: string;
  description?: string;
  subtopics: string[];
}

export interface Subject {
  id: string;
  name: string;
  category: "saintek" | "soshum" | "umum";
  icon: string;
  topics: Topic[];
}
