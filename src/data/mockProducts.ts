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

export const mockProducts: Product[] = [
  {
    id: "1",
    title: "MacBook Pro 2021 - 14 inch M1 Pro",
    description: "Selling my MacBook Pro in excellent condition. Comes with original charger and box. Battery health at 95%. Perfect for programming, design, and content creation. No scratches or dents.",
    price: 8500,
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800",
    ],
    category: "Electronics",
    condition: "like-new",
    location: "East Legon",
    university: "University of Ghana",
    seller: {
      name: "Kofi Mensah",
      phone: "233241234567",
      isVerified: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
    isFeatured: true,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Organic Chemistry Textbook - 8th Edition",
    description: "McMurry Organic Chemistry textbook. Lightly used, no highlighting. Essential for CHM 201/202. Saving you money compared to bookstore prices!",
    price: 120,
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
    ],
    category: "Books",
    condition: "good",
    location: "Legon Campus",
    university: "University of Ghana",
    seller: {
      name: "Ama Serwaa",
      phone: "233551234567",
      isVerified: false,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
    isFeatured: false,
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    title: "iPhone 14 Pro Max - 256GB Space Black",
    description: "iPhone 14 Pro Max in perfect condition. Always used with case and screen protector. Battery health 98%. Includes original accessories and AppleCare+ until June 2025.",
    price: 6800,
    images: [
      "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=800",
    ],
    category: "Electronics",
    condition: "like-new",
    location: "KNUST Campus",
    university: "KNUST",
    seller: {
      name: "Kwame Asante",
      phone: "233201234567",
      isVerified: true,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
    isFeatured: true,
    createdAt: "2024-01-13",
  },
  {
    id: "4",
    title: "Graphic Design Services - Logos, Flyers, Social Media",
    description: "Professional graphic design services for students and businesses. I specialize in logos, flyers, social media content, and branding packages. Fast turnaround and student discounts available!",
    price: 50,
    images: [
      "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800",
    ],
    category: "Services",
    condition: "new",
    location: "Online",
    university: "Ashesi University",
    seller: {
      name: "Efua Darkwah",
      phone: "233541234567",
      isVerified: true,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    },
    isFeatured: true,
    createdAt: "2024-01-12",
  },
  {
    id: "5",
    title: "Samsung 27\" Curved Gaming Monitor",
    description: "Samsung Odyssey G5 gaming monitor. 144Hz refresh rate, 1ms response time. Perfect for gaming and productivity. Selling because I'm upgrading to 32\".",
    price: 1800,
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800",
    ],
    category: "Electronics",
    condition: "good",
    location: "Accra Central",
    university: "University of Professional Studies",
    seller: {
      name: "Yaw Boateng",
      phone: "233271234567",
      isVerified: false,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    },
    isFeatured: false,
    createdAt: "2024-01-11",
  },
  {
    id: "6",
    title: "Nike Air Force 1 - Size 43 (White)",
    description: "Brand new Nike Air Force 1 Low. Size EU 43 / US 9.5. Never worn, still in original box with receipt. Got as a gift but not my size.",
    price: 850,
    images: [
      "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800",
    ],
    category: "Clothing",
    condition: "new",
    location: "Tema",
    university: "Regional Maritime University",
    seller: {
      name: "Akosua Manu",
      phone: "233261234567",
      isVerified: false,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
    isFeatured: false,
    createdAt: "2024-01-10",
  },
];

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
