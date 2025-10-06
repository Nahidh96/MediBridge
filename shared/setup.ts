export type PracticeType = 'private_practice' | 'dispensary' | 'channeling_center';

export interface SetupAnswers {
  name: string;
  specialty: string;
  practiceType: PracticeType;
  centreName?: string;
  location?: string;
  password?: string;
  modules: string[];
}

export interface ModuleMeta {
  key: string;
  name: string;
  description: string;
  icon: string;
  recommendedFor: PracticeType[];
  defaultEnabled: boolean;
}
