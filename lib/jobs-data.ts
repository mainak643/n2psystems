export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: "Full-time" | "Contract" | "Part-time"
  mode: "Remote" | "Onsite" | "Hybrid"
  experience: string
  salary: string
  techStack: string[]
  domain: string
  postedDate: string
  description: string
  responsibilities: string[]
  requirements: string[]
}

export const jobs: Job[] = [
  {
    id: "senior-fullstack-engineer",
    title: "Senior Full-Stack Engineer",
    company: "Confidential - Series B Fintech",
    location: "Toronto, Canada",
    type: "Full-time",
    mode: "Hybrid",
    experience: "5+ years",
    salary: "$150K - $190K CAD",
    techStack: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
    domain: "Software Engineering",
    postedDate: "2 days ago",
    description:
      "Join a rapidly scaling fintech startup building the next generation of payment infrastructure. You will architect and implement core platform features, mentor junior developers, and drive technical decisions across the full stack.",
    responsibilities: [
      "Design and implement scalable microservices architecture",
      "Lead code reviews and establish engineering best practices",
      "Collaborate with product and design teams on feature development",
      "Optimize application performance and database queries",
      "Mentor junior engineers and contribute to hiring decisions",
    ],
    requirements: [
      "5+ years of professional software engineering experience",
      "Strong proficiency in React, Node.js, and TypeScript",
      "Experience with cloud infrastructure (AWS preferred)",
      "Understanding of relational databases and query optimization",
      "Excellent communication and collaboration skills",
    ],
  },
  {
    id: "ml-engineer",
    title: "Machine Learning Engineer",
    company: "FinovateAI",
    location: "New York, USA",
    type: "Full-time",
    mode: "Remote",
    experience: "3+ years",
    salary: "$160K - $200K USD",
    techStack: ["Python", "TensorFlow", "PyTorch", "Kubernetes", "GCP"],
    domain: "AI / Machine Learning",
    postedDate: "1 week ago",
    description:
      "Work on cutting-edge NLP and recommendation systems powering financial advisory platforms. You'll design, train, and deploy production ML models that serve millions of users.",
    responsibilities: [
      "Develop and deploy production-grade ML models",
      "Design feature engineering pipelines for NLP tasks",
      "Collaborate with data scientists on model experimentation",
      "Implement MLOps best practices for model monitoring",
      "Optimize model inference for latency-sensitive applications",
    ],
    requirements: [
      "3+ years of ML engineering experience",
      "Strong Python skills with TensorFlow or PyTorch",
      "Experience deploying models in production environments",
      "Familiarity with NLP techniques and transformer architectures",
      "Knowledge of cloud platforms (GCP preferred)",
    ],
  },
  {
    id: "cloud-architect",
    title: "Cloud Solutions Architect",
    company: "CloudScale Inc",
    location: "Bangalore, India",
    type: "Full-time",
    mode: "Onsite",
    experience: "7+ years",
    salary: "Competitive",
    techStack: ["AWS", "Terraform", "Kubernetes", "Docker", "Python"],
    domain: "DevOps & Cloud",
    postedDate: "3 days ago",
    description:
      "Lead cloud architecture design and implementation for enterprise clients across multiple industries. You'll define cloud strategies, design scalable solutions, and guide technical teams through complex migrations.",
    responsibilities: [
      "Design enterprise-grade cloud architectures on AWS",
      "Lead cloud migration planning and execution",
      "Implement infrastructure as code using Terraform",
      "Define security and compliance frameworks for cloud deployments",
      "Mentor engineering teams on cloud best practices",
    ],
    requirements: [
      "7+ years of experience in cloud architecture",
      "AWS Solutions Architect certification (Professional preferred)",
      "Deep expertise in Terraform and Kubernetes",
      "Experience with enterprise-scale cloud migrations",
      "Strong leadership and stakeholder management skills",
    ],
  },
  {
    id: "data-scientist",
    title: "Senior Data Scientist",
    company: "Quantum Analytics",
    location: "Toronto, Canada",
    type: "Full-time",
    mode: "Hybrid",
    experience: "4+ years",
    salary: "$130K - $165K CAD",
    techStack: ["Python", "R", "SQL", "Spark", "Tableau"],
    domain: "Data Science",
    postedDate: "5 days ago",
    description:
      "Drive data-driven decision making for a leading analytics consultancy. You'll build predictive models, create data visualizations, and translate complex analyses into actionable business insights for Fortune 500 clients.",
    responsibilities: [
      "Build predictive and prescriptive analytics models",
      "Create compelling data visualizations and dashboards",
      "Present findings and recommendations to executive stakeholders",
      "Develop and maintain ETL pipelines for large datasets",
      "Collaborate with cross-functional teams on data strategy",
    ],
    requirements: [
      "4+ years of data science experience",
      "Expert-level Python and SQL proficiency",
      "Experience with big data tools (Spark, Hadoop)",
      "Strong statistical modeling and machine learning skills",
      "Excellent presentation and communication abilities",
    ],
  },
  {
    id: "cybersecurity-engineer",
    title: "Cybersecurity Engineer",
    company: "SecureNet Systems",
    location: "New York, USA",
    type: "Full-time",
    mode: "Hybrid",
    experience: "4+ years",
    salary: "$140K - $175K USD",
    techStack: ["SIEM", "Splunk", "Python", "AWS Security", "Zero Trust"],
    domain: "Cybersecurity",
    postedDate: "1 week ago",
    description:
      "Protect enterprise systems and data assets for a cybersecurity firm serving Fortune 500 clients. You'll design security architectures, conduct threat analyses, and implement advanced security controls.",
    responsibilities: [
      "Design and implement enterprise security architectures",
      "Conduct threat modeling and vulnerability assessments",
      "Manage SIEM infrastructure and incident response",
      "Develop security automation and orchestration tools",
      "Advise clients on compliance and security best practices",
    ],
    requirements: [
      "4+ years of cybersecurity engineering experience",
      "CISSP, CEH, or equivalent certification",
      "Experience with SIEM tools (Splunk preferred)",
      "Knowledge of cloud security (AWS, Azure)",
      "Strong analytical and problem-solving skills",
    ],
  },
  {
    id: "director-of-product",
    title: "Director of Product",
    company: "Confidential - Enterprise SaaS",
    location: "Toronto, Canada",
    type: "Full-time",
    mode: "Onsite",
    experience: "8+ years",
    salary: "$180K - $220K CAD",
    techStack: ["Product Strategy", "Agile", "Data Analytics", "User Research"],
    domain: "Product Leadership",
    postedDate: "4 days ago",
    description:
      "Shape the product vision and roadmap for a market-leading enterprise SaaS platform. You'll lead a team of product managers, drive strategic initiatives, and collaborate with engineering leadership on execution.",
    responsibilities: [
      "Define and communicate product vision and strategy",
      "Lead and mentor a team of product managers",
      "Drive roadmap prioritization with data-informed decisions",
      "Partner with engineering, design, and sales leadership",
      "Represent the product organization to executive stakeholders",
    ],
    requirements: [
      "8+ years of product management experience",
      "3+ years in a product leadership role",
      "Track record of launching successful enterprise products",
      "Strong analytical skills and data-driven mindset",
      "Excellent cross-functional leadership abilities",
    ],
  },
]
