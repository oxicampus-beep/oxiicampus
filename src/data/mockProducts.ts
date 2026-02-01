// Product type kept for backwards compatibility with any remaining components
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: "new" | "like-new" | "good" | "fair";
  location: string;
  university: string;
  seller: {
    name: string;
    phone: string;
    isVerified: boolean;
    avatar: string;
  };
  isFeatured: boolean;
  createdAt: string;
}

// Mock products removed - using real database data now
export const mockProducts: Product[] = [];

export const categories = [
  "All",
  "Electronics",
  "Books",
  "Services",
  "Clothing",
  "Furniture",
  "Accessories",
];

export const universities = [
  "All Universities",
  "University of Ghana",
  "KNUST",
  "Ashesi University",
  "University of Cape Coast",
  "University of Professional Studies",
  "Regional Maritime University",
];
