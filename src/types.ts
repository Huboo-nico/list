export interface Company {
  id: string;
  name: string;
  sector: string;
  ecommerce: "Sí" | "No";
  model: "B2B" | "B2C" | "B2B y B2C";
  website: string;
  phone: string;
  email: string;
  linkedin: string;
  inSpain: boolean;
  flagCode: string; // e.g., 'es', 'nl'
  brandColor: string; // HEX color
  summary: string;
  logoIconName: string; // Lucide icon reference representing the company's sector/character
  note?: string; // e.g. disclaimers or observations
}

export interface ResearchReport {
  companyId: string;
  companyName: string;
  report: string;
  sources: Array<{ title: string; url: string }>;
  timestamp: string;
}
