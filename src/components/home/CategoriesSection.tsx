import { Link } from "react-router-dom";
import { 
  Laptop, 
  BookOpen, 
  Wrench, 
  Shirt, 
  Sofa, 
  Watch,
  ArrowRight
} from "lucide-react";
import { useCategoryCounts } from "@/hooks/useCategoryCounts";

const categories = [
  {
    name: "Electronics",
    icon: Laptop,
    color: "from-purple-500 to-purple-700",
    description: "Laptops, phones, gadgets & more"
  },
  {
    name: "Books",
    icon: BookOpen,
    color: "from-blue-500 to-blue-700",
    description: "Textbooks, novels & study materials"
  },
  {
    name: "Services",
    icon: Wrench,
    color: "from-green-500 to-green-700",
    description: "Tutoring, design, repairs & more"
  },
  {
    name: "Clothing",
    icon: Shirt,
    color: "from-pink-500 to-pink-700",
    description: "Fashion, shoes & accessories"
  },
  {
    name: "Furniture",
    icon: Sofa,
    color: "from-orange-500 to-orange-700",
    description: "Desks, chairs & dorm essentials"
  },
  {
    name: "Accessories",
    icon: Watch,
    color: "from-accent to-gold-light",
    description: "Watches, bags & personal items"
  },
];

const CategoriesSection = () => {
  const { counts } = useCategoryCounts();

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Browse by <span className="gradient-text">Category</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Find exactly what you need from our wide range of categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/category/${category.name.toLowerCase()}`}
              className="group"
            >
              <div className="bg-card rounded-2xl border border-border p-6 text-center transition-all duration-300 hover:shadow-purple hover:border-primary/30 hover:-translate-y-1">
                <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                  {category.description}
                </p>
                <span className="text-xs font-medium text-primary">
                  {counts[category.name] || 0} listings
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
          >
            View All Categories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
