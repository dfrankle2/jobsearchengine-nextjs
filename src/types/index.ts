export interface UserPreferences {
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salary?: string;
  technologies?: string;
  companySize?: string;
}

export interface Job {
  id: string;
  title: string;
  url: string;
  company: string;
  location: string;
  salary?: string;
  experienceLevel?: string;
  jobType?: string;
  skills?: string;
  content: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Search {
  id: string;
  query: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salary?: string;
  technologies?: string;
  companySize?: string;
  createdAt: Date;
  updatedAt: Date;
  jobs: Job[];
}

export interface SavedJob {
  id: string;
  jobId: string;
  job: Job;
  notes?: string;
  status: 'interested' | 'applied' | 'interviewing' | 'rejected' | 'offer';
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchFormData {
  query: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salary?: string;
  technologies?: string;
  companySize?: string;
  numResults?: number;
  findSimilar?: boolean;
}