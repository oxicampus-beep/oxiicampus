// Ghana Tertiary Institutions
export const ghanaUniversities = [
  // Public Universities
  "University of Ghana",
  "Kwame Nkrumah University of Science and Technology (KNUST)",
  "University of Cape Coast",
  "University for Development Studies",
  "University of Education, Winneba",
  "University of Mines and Technology (UMaT)",
  "University of Health and Allied Sciences",
  "University of Energy and Natural Resources",
  "University of Professional Studies, Accra",
  "Ghana Institute of Management and Public Administration (GIMPA)",
  "Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development",
  "C.K. Tedam University of Technology and Applied Sciences",
  "SD Dombo University of Business and Integrated Development Studies",
  "University of Environment and Sustainable Development",
  
  // Private Universities
  "Ashesi University",
  "Central University",
  "Ghana Christian University College",
  "Methodist University College Ghana",
  "Valley View University",
  "Regent University College of Science and Technology",
  "Wisconsin International University College",
  "Zenith University College",
  "Lancaster University Ghana",
  "Webster University Ghana",
  "Academic City University College",
  "Pentecost University",
  "Ghana Technology University College",
  "All Nations University College",
  "Catholic University College of Ghana",
  "Presbyterian University College",
  "Islamic University College",
  "Jayee University College",
  "Ghana Baptist University College",
  "Evangelical Presbyterian University College",
  "Knutsford University College",
  "BlueCrest University College",
  "Data Link University College",
  "Spiritan University College",
  "Heritage Christian University College",
  "Garden City University College",
  "Perez University College",
  "Kings University College",
  "Christian Service University College",
  "Ghana Armed Forces Command and Staff College",
  
  // Technical Universities
  "Accra Technical University",
  "Kumasi Technical University",
  "Cape Coast Technical University",
  "Takoradi Technical University",
  "Ho Technical University",
  "Koforidua Technical University",
  "Sunyani Technical University",
  "Tamale Technical University",
  "Bolgatanga Technical University",
  "Wa Technical University",
  
  // Colleges of Education (Degree-Awarding)
  "Ada College of Education",
  "Bagabaga College of Education",
  "Dambai College of Education",
  "Enchi College of Education",
  "Foso College of Education",
  "Jasikan College of Education",
  "Kibi College of Education",
  "Mampong Technical College of Education",
  "Mount Mary College of Education",
  "Ola College of Education",
  "St. Francis College of Education",
  "St. John Bosco's College of Education",
  "St. Louis College of Education",
  "St. Monica's College of Education",
  "St. Teresa's College of Education",
  "Wesley College of Education",
  "Wiawso College of Education",
  "Akatsi College of Education",
  "Atebubu College of Education",
  "Berekum College of Education",
  "E.P. College of Education, Amedzofe",
  "E.P. College of Education, Bimbilla",
  "Gbewaa College of Education",
  "McCoy College of Education",
  "N.J. Ahmadiyya College of Education",
  "Nusrat Jahan Ahmadiyya College of Education",
  "OLA College of Education, Cape Coast",
  "Peki College of Education",
  "SDA College of Education",
  "St. Ambrose College of Education",
  "St. Joseph's College of Education",
  "St. Vincent College of Education",
  "Tumu College of Education",
  
  // Nursing & Midwifery Training Colleges
  "Nurses' and Midwifery Training College, Korle-Bu",
  "Nurses' and Midwifery Training College, Kumasi",
  "Nurses' and Midwifery Training College, Cape Coast",
  "Nurses' and Midwifery Training College, Tamale",
  "Nurses' and Midwifery Training College, Ho",
  
  // Specialized Institutions
  "Regional Maritime University",
  "Ghana Institute of Journalism",
  "Ghana School of Law",
  "National Film and Television Institute (NAFTI)",
  "Ghana Institute of Languages",
  
  // Other
  "Other",
];

// Categories for listings
export const categories = [
  "Electronics",
  "Books & Notes",
  "Services",
  "Clothing & Fashion",
  "Furniture",
  "Accessories",
  "Sports & Fitness",
  "Food & Beverages",
  "Beauty & Health",
  "Tickets & Events",
  "Accommodation",
  "Transportation",
  "Other",
];

// Conditions for items
export const conditions = [
  { value: "new", label: "Brand New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

// Listing statuses
export const listingStatuses = [
  { value: "available", label: "Available", color: "bg-green-500" },
  { value: "sold", label: "Sold", color: "bg-red-500" },
  { value: "unavailable", label: "Unavailable", color: "bg-yellow-500" },
];

// Plan limits
export const planLimits: Record<string, number> = {
  free: 1,
  pro: 10,
  premium: 50,
};
