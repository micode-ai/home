export interface ProductLink {
  type: string;
  url: string;
  labelKey: string;
}

export interface Product {
  id: string;
  nameKey: string;
  descriptionKey: string;
  detailedDescriptionKey?: string;
  pricingKey?: string;
  website?: string;
  features?: string[];
  links: ProductLink[];
  badge?: { label: string; icon: string };
  accentColor?: string;
}
