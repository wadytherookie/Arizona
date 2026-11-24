export type Result<T> = {
  data: T;
  updated: string;
  error?: string;
  partial?: boolean;
};
export type Trial = {
  id: string;
  title: string;
  status: string;
  phase: string[];
  summary: string;
  eligibility: string;
  sex: string;
  minimumAge: string;
  sites: {
    name: string;
    city: string;
    country: string;
    status?: string;
    lat?: number;
    lon?: number;
  }[];
};
export type Treatment = {
  id: string;
  name: string;
  route: string;
  warnings: string;
  indication: string;
  application: string;
  url: string;
  approvalYear?: string;
  approvalUrl?: string;
  warningTopics?: string[];
};
export type Paper = {
  id: string;
  title: string;
  journal: string;
  date: string;
  url: string;
};
