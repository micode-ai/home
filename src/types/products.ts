export interface ProductLink {
  type: string;
  url: string;
  labelKey: string;
}

export interface CommunityStats {
  githubStars: number | null;
  npmWeeklyDownloads: number | null;
}

export interface ProductFaqItem {
  questionKey: string;
  answerKey: string;
}

export interface Product {
  id: string;
  nameKey: string;
  descriptionKey: string;
  detailedDescriptionKey?: string;
  imageAltKey?: string;
  pricingKey?: string;
  website?: string;
  features?: string[];
  links: ProductLink[];
  badge?: { label: string; icon: string };
  accentColor?: string;
  communityStats?: CommunityStats | null;
  langgraphDiagramId?: string;
  faq?: ProductFaqItem[];
}
