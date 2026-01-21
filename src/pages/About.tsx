import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Target, 
  Users, 
  Heart, 
  Zap,
  Linkedin,
  Twitter,
  Mail,
  ArrowRight
} from "lucide-react";
import team1 from "@/asset/1.jpeg";
import team2 from "@/asset/2.jpeg";
import team3 from "@/asset/3.jpeg";
import team4 from "@/asset/4.jpeg";

const teamMembers = [
  {
    name: "Adabah Micheal Jnr",
    role: "Founder & CEO",
    image: team1,
    bio: "Former KNUST student with a passion for connecting campus communities through technology.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Manasseh K. Kabutey",
    role: "Head of Product",
    image: team2,
    bio: "UG alumna who believes every student deserves access to affordable resources.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Kofi Mensah",
    role: "Lead Developer",
    image: team3,
    bio: "Tech enthusiast from Ashesi, building the future of campus commerce.",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Efua Darkwah",
    role: "Community Manager",
    image: team4,
    bio: "Cape Coast graduate dedicated to growing vibrant student seller communities.",
    linkedin: "#",
    twitter: "#",
  },
];

const values = [
  {
    icon: Target,
    title: "Student-First",
    description: "Every decision we make prioritizes the needs and safety of university students.",
  },
  {
    icon: Users,
    title: "Community",
    description: "We believe in the power of campus networks to create opportunities for everyone.",
  },
  {
    icon: Heart,
    title: "Trust",
    description: "Building a safe marketplace where students can buy and sell with confidence.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Constantly improving to make campus commerce faster, easier, and more accessible.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/30 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Empowering Campus
              <span className="block mt-2 text-white">Commerce in Ghana</span>
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8">
              OxiCampus is on a mission to connect every university student in Ghana, 
              making it easy to buy, sell, and discover amazing deals on campus.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button className="bg-white text-primary hover:bg-white/90">
                  Join OxiCampus
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Explore Listings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary font-medium mb-4 block">Our Story</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Born from Campus <span className="gradient-text">Necessity</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  OxiCampus started in 2023 when a group of university students realized 
                  how difficult it was to sell items or find affordable products on campus. 
                  Social media was cluttered, WhatsApp groups were chaotic, and there was 
                  no trusted platform dedicated to student commerce.
                </p>
                <p>
                  We built OxiCampus to solve this problem—a platform designed exclusively 
                  for Ghanaian university students, where you can list your items, reach 
                  thousands of buyers, and connect directly with sellers via WhatsApp or call.
                </p>
                <p>
                  Today, we serve students across 10+ universities in Ghana, with over 
                  5,000 active listings and a growing community of 20,000+ students. 
                  And we're just getting started.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-purple">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800"
                  alt="Students on campus"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-lg border border-border">
                <div className="font-display text-3xl font-bold gradient-text">20K+</div>
                <div className="text-muted-foreground text-sm">Students Trust Us</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Our <span className="gradient-text">Values</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              The principles that guide everything we do at OxiCampus
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-purple transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Meet the <span className="gradient-text">Team</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              The passionate individuals behind OxiCampus, all former university students ourselves
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-purple transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium text-sm mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
                  <div className="flex gap-3">
                    <a
                      href={member.linkedin}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a
                      href={member.twitter}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                    <a
                      href={`mailto:${member.name.toLowerCase().replace(' ', '.')}@oxicampus.com`}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-bg">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Join the Movement?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Become part of Ghana's fastest-growing student marketplace today.
          </p>
          <Link to="/auth?mode=signup">
            <Button className="bg-white text-primary hover:bg-white/90">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
