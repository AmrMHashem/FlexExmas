// CareerDiagnostic.jsx — FlexExams Career Intelligence Assessment
// Full 50-question multi-domain exam with AI-powered career path analysis
import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// Question Bank — 50 questions across 7 domains
// ─────────────────────────────────────────────
const QUESTION_BANK = [
  // ── PROGRAMMING (8 questions) ──
  {
    id: "p1", domain: "Programming",
    q: "What is the time complexity of binary search on a sorted array of n elements?",
    opts: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correct: [1],
    type: "single",
    exp: "Binary search halves the search space each step, resulting in O(log n) complexity.",
  },
  {
    id: "p2", domain: "Programming",
    q: "Which of the following are valid object-oriented programming principles?",
    opts: ["Encapsulation", "Normalization", "Polymorphism", "Inheritance", "Defragmentation"],
    correct: [0, 2, 3],
    type: "multi",
    exp: "OOP pillars are Encapsulation, Polymorphism, Inheritance, and Abstraction. Normalization belongs to databases, Defragmentation to storage.",
  },
  {
    id: "p3", domain: "Programming",
    q: "What does the 'async/await' syntax in JavaScript primarily help with?",
    opts: ["Parallel CPU computation", "Managing asynchronous operations more readably", "Speeding up DOM rendering", "Strict type enforcement"],
    correct: [1],
    type: "single",
    exp: "async/await is syntactic sugar over Promises, making asynchronous code look and behave like synchronous code for readability.",
  },
  {
    id: "p4", domain: "Programming",
    q: "Which data structure uses LIFO (Last In, First Out) order?",
    opts: ["Queue", "Linked List", "Stack", "Heap"],
    correct: [2],
    type: "single",
    exp: "A Stack operates LIFO — the last item pushed is the first to be popped, like a stack of plates.",
  },
  {
    id: "p5", domain: "Programming",
    q: "In Python, what is a decorator?",
    opts: [
      "A function that modifies or extends another function's behavior",
      "A CSS-like styling module",
      "A data type for key-value storage",
      "A loop construct",
    ],
    correct: [0],
    type: "single",
    exp: "Decorators in Python are higher-order functions that wrap another function to extend its behavior without modifying it.",
  },
  {
    id: "p6", domain: "Programming",
    q: "What is the difference between '==' and '===' in JavaScript?",
    opts: [
      "'==' checks value only; '===' checks value and type",
      "'===' checks value only; '==' checks value and type",
      "They are identical",
      "'===' is used only in TypeScript",
    ],
    correct: [0],
    type: "single",
    exp: "'==' performs type coercion before comparing; '===' (strict equality) requires both value AND type to match.",
  },
  {
    id: "p7", domain: "Programming",
    q: "Which of these are examples of version control systems?",
    opts: ["Git", "Docker", "Mercurial", "SVN", "Kubernetes"],
    correct: [0, 2, 3],
    type: "multi",
    exp: "Git, Mercurial, and SVN are version control systems. Docker and Kubernetes are container/orchestration platforms.",
  },
  {
    id: "p8", domain: "Programming",
    q: "What does REST stand for in web development?",
    opts: [
      "Rapid Execution State Transfer",
      "Representational State Transfer",
      "Remote Endpoint Session Transfer",
      "Recursive Element Syntax Tree",
    ],
    correct: [1],
    type: "single",
    exp: "REST (Representational State Transfer) is an architectural style for distributed hypermedia systems, commonly used for APIs.",
  },

  // ── NETWORKING (7 questions) ──
  {
    id: "n1", domain: "Networking",
    q: "Which layer of the OSI model is responsible for routing packets between networks?",
    opts: ["Data Link (Layer 2)", "Network (Layer 3)", "Transport (Layer 4)", "Session (Layer 5)"],
    correct: [1],
    type: "single",
    exp: "Layer 3 (Network) handles logical addressing and routing. Routers operate at this layer using IP addresses.",
  },
  {
    id: "n2", domain: "Networking",
    q: "What is the primary purpose of DNS?",
    opts: [
      "Assign IP addresses dynamically",
      "Translate domain names to IP addresses",
      "Encrypt network traffic",
      "Route packets between subnets",
    ],
    correct: [1],
    type: "single",
    exp: "DNS (Domain Name System) translates human-readable domain names (google.com) into machine-readable IP addresses.",
  },
  {
    id: "n3", domain: "Networking",
    q: "Which of the following are valid private IP address ranges?",
    opts: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "8.8.8.0/24"],
    correct: [0, 1, 2],
    type: "multi",
    exp: "RFC 1918 defines three private IP ranges: 10.x.x.x, 172.16-31.x.x, and 192.168.x.x. 8.8.8.x is Google's public DNS.",
  },
  {
    id: "n4", domain: "Networking",
    q: "What does the TCP 3-way handshake consist of?",
    opts: ["SYN → SYN-ACK → ACK", "ACK → SYN → FIN", "SYN → ACK → FIN", "HELLO → OFFER → REQUEST"],
    correct: [0],
    type: "single",
    exp: "TCP establishes connections via SYN (client) → SYN-ACK (server) → ACK (client) — the 3-way handshake.",
  },
  {
    id: "n5", domain: "Networking",
    q: "Which protocol operates at the Application layer and is used for secure web browsing?",
    opts: ["FTP", "HTTPS", "ICMP", "ARP"],
    correct: [1],
    type: "single",
    exp: "HTTPS (HTTP Secure) runs at Layer 7 and uses TLS/SSL encryption for secure web communication.",
  },
  {
    id: "n6", domain: "Networking",
    q: "What is subnetting used for?",
    opts: [
      "Encrypting network traffic",
      "Dividing a large network into smaller logical segments",
      "Assigning MAC addresses",
      "Translating IPv4 to IPv6",
    ],
    correct: [1],
    type: "single",
    exp: "Subnetting divides a large IP network into smaller segments to improve performance, security, and address utilization.",
  },
  {
    id: "n7", domain: "Networking",
    q: "Which of these are valid network topologies?",
    opts: ["Star", "Mesh", "Ring", "Parallel", "Bus"],
    correct: [0, 1, 2, 4],
    type: "multi",
    exp: "Star, Mesh, Ring, and Bus are standard network topologies. 'Parallel' is a processing concept, not a topology.",
  },

  // ── DATA ANALYSIS (7 questions) ──
  {
    id: "d1", domain: "Data Analysis",
    q: "Which measure of central tendency is most affected by outliers?",
    opts: ["Median", "Mode", "Mean", "Range"],
    correct: [2],
    type: "single",
    exp: "The mean (average) is highly sensitive to extreme values (outliers). The median and mode are more robust.",
  },
  {
    id: "d2", domain: "Data Analysis",
    q: "What does a correlation coefficient of -0.95 indicate?",
    opts: [
      "No relationship between variables",
      "A weak positive relationship",
      "A strong negative relationship",
      "A perfect positive relationship",
    ],
    correct: [2],
    type: "single",
    exp: "A value near -1 indicates a strong negative correlation — as one variable increases, the other strongly decreases.",
  },
  {
    id: "d3", domain: "Data Analysis",
    q: "Which of the following are data visualization tools?",
    opts: ["Tableau", "Power BI", "Looker", "Jenkins", "Matplotlib"],
    correct: [0, 1, 2, 4],
    type: "multi",
    exp: "Tableau, Power BI, Looker, and Matplotlib are visualization tools. Jenkins is a CI/CD automation server.",
  },
  {
    id: "d4", domain: "Data Analysis",
    q: "What is the difference between structured and unstructured data?",
    opts: [
      "Structured data fits into tables; unstructured doesn't have a predefined format",
      "Unstructured data is always larger than structured data",
      "Structured data is always numerical",
      "There is no real difference",
    ],
    correct: [0],
    type: "single",
    exp: "Structured data (like databases) has a defined schema. Unstructured data (images, emails, video) has no predefined format.",
  },
  {
    id: "d5", domain: "Data Analysis",
    q: "What is the purpose of data normalization in preprocessing?",
    opts: [
      "Remove duplicate records",
      "Scale features to a similar range to prevent dominance by large-valued features",
      "Delete null values",
      "Convert data to JSON format",
    ],
    correct: [1],
    type: "single",
    exp: "Normalization scales numeric features (e.g., to 0–1) so no feature disproportionately influences ML algorithms.",
  },
  {
    id: "d6", domain: "Data Analysis",
    q: "Which SQL clause is used to filter grouped results?",
    opts: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
    correct: [1],
    type: "single",
    exp: "HAVING filters after GROUP BY aggregation. WHERE filters individual rows before grouping.",
  },
  {
    id: "d7", domain: "Data Analysis",
    q: "Which of these are key steps in the data analysis process?",
    opts: ["Data collection", "Data cleaning", "Visualization", "Deployment", "Interpretation"],
    correct: [0, 1, 2, 4],
    type: "multi",
    exp: "Core analysis steps: collect, clean, visualize, and interpret data. Deployment is a software engineering concern.",
  },

  // ── DATABASES (7 questions) ──
  {
    id: "db1", domain: "Databases",
    q: "What does ACID stand for in database transactions?",
    opts: [
      "Automated, Concurrent, Integrated, Durable",
      "Atomicity, Consistency, Isolation, Durability",
      "Asynchronous, Centralized, Indexed, Distributed",
      "Access, Control, Integrity, Distributed",
    ],
    correct: [1],
    type: "single",
    exp: "ACID properties (Atomicity, Consistency, Isolation, Durability) guarantee reliable database transactions.",
  },
  {
    id: "db2", domain: "Databases",
    q: "Which SQL command is used to retrieve data from a table?",
    opts: ["INSERT", "UPDATE", "SELECT", "DELETE"],
    correct: [2],
    type: "single",
    exp: "SELECT is the DML command used to query and retrieve data from database tables.",
  },
  {
    id: "db3", domain: "Databases",
    q: "Which of the following are NoSQL database types?",
    opts: ["Document", "Graph", "Key-Value", "Relational", "Column-Family"],
    correct: [0, 1, 2, 4],
    type: "multi",
    exp: "NoSQL types include Document (MongoDB), Graph (Neo4j), Key-Value (Redis), and Column-Family (Cassandra). Relational is SQL.",
  },
  {
    id: "db4", domain: "Databases",
    q: "What is a primary key in a relational database?",
    opts: [
      "A key used for encrypting data",
      "A column (or set of columns) that uniquely identifies each row",
      "The first column of any table",
      "A foreign reference to another table",
    ],
    correct: [1],
    type: "single",
    exp: "A primary key uniquely identifies each record in a table. It must be unique and not null.",
  },
  {
    id: "db5", domain: "Databases",
    q: "What is database indexing primarily used for?",
    opts: [
      "Encrypting sensitive columns",
      "Speeding up data retrieval operations",
      "Normalizing table relationships",
      "Backing up the database",
    ],
    correct: [1],
    type: "single",
    exp: "Indexes create a fast lookup structure, significantly speeding up SELECT queries at the cost of slightly slower writes.",
  },
  {
    id: "db6", domain: "Databases",
    q: "What is the difference between INNER JOIN and LEFT JOIN?",
    opts: [
      "INNER JOIN returns only matching rows; LEFT JOIN returns all left-table rows + matches",
      "They are identical in output",
      "LEFT JOIN returns only right-table rows",
      "INNER JOIN is faster always",
    ],
    correct: [0],
    type: "single",
    exp: "INNER JOIN returns rows with matches in both tables. LEFT JOIN returns ALL rows from the left table, with NULLs where no match exists on the right.",
  },
  {
    id: "db7", domain: "Databases",
    q: "Which of the following statements about database normalization are true?",
    opts: [
      "It reduces data redundancy",
      "It always improves query performance",
      "1NF requires atomic (indivisible) values in columns",
      "3NF eliminates transitive dependencies",
    ],
    correct: [0, 2, 3],
    type: "multi",
    exp: "Normalization reduces redundancy (true), enforces atomic values in 1NF, and removes transitive dependencies in 3NF. It can sometimes hurt performance (de-normalization is used in data warehouses).",
  },

  // ── UI/UX (7 questions) ──
  {
    id: "u1", domain: "UI/UX",
    q: "What is the primary goal of user-centered design (UCD)?",
    opts: [
      "Make the interface visually attractive",
      "Design around the needs, goals, and limitations of end users",
      "Minimize development time",
      "Maximize the number of features",
    ],
    correct: [1],
    type: "single",
    exp: "UCD is an iterative design process where user needs and characteristics drive all design decisions throughout the product lifecycle.",
  },
  {
    id: "u2", domain: "UI/UX",
    q: "Which of these are Nielsen's 10 Usability Heuristics?",
    opts: ["Visibility of system status", "Aesthetic minimalism", "User control and freedom", "Color theory compliance", "Error prevention"],
    correct: [0, 1, 2, 4],
    type: "multi",
    exp: "Visibility of system status, aesthetic minimalism, user control, and error prevention are among Nielsen's 10 heuristics. Color theory compliance is not.",
  },
  {
    id: "u3", domain: "UI/UX",
    q: "What is the purpose of wireframing in UI/UX design?",
    opts: [
      "Define the final visual styling and colors",
      "Create low-fidelity blueprints of layout and structure before visual design",
      "Write frontend code",
      "Test performance under load",
    ],
    correct: [1],
    type: "single",
    exp: "Wireframes are low-fidelity structural blueprints that define layout, content hierarchy, and user flows without visual styling.",
  },
  {
    id: "u4", domain: "UI/UX",
    q: "What does 'affordance' mean in UX design?",
    opts: [
      "The cost of a design project",
      "A design element's visual cue that suggests how it should be used",
      "The accessibility score of an interface",
      "The number of features a UI can support",
    ],
    correct: [1],
    type: "single",
    exp: "Affordance is the perceived property of an object that shows how it can be used — e.g., a button's raised style suggests it can be clicked.",
  },
  {
    id: "u5", domain: "UI/UX",
    q: "What is A/B testing in UX?",
    opts: [
      "Testing on Android and iOS platforms simultaneously",
      "Comparing two versions of a design to see which performs better with users",
      "Running accessibility tests on two browsers",
      "A method for testing database connections",
    ],
    correct: [1],
    type: "single",
    exp: "A/B testing shows two design variants to different user segments and measures which achieves better outcomes (clicks, conversions, etc.).",
  },
  {
    id: "u6", domain: "UI/UX",
    q: "Which color contrast ratio is recommended by WCAG 2.1 AA for normal text?",
    opts: ["2:1", "3:1", "4.5:1", "7:1"],
    correct: [2],
    type: "single",
    exp: "WCAG 2.1 AA requires a minimum 4.5:1 contrast ratio for normal text to ensure readability for people with visual impairments.",
  },
  {
    id: "u7", domain: "UI/UX",
    q: "Which of the following are common UX research methods?",
    opts: ["User interviews", "Usability testing", "Card sorting", "Code reviews", "Heatmap analysis"],
    correct: [0, 1, 2, 4],
    type: "multi",
    exp: "User interviews, usability testing, card sorting, and heatmaps are UX research methods. Code reviews are a software development practice.",
  },

  // ── TECHNICAL ENGLISH (7 questions) ──
  {
    id: "e1", domain: "Technical English",
    q: "What does the acronym 'API' stand for in software development?",
    opts: [
      "Application Processing Interface",
      "Application Programming Interface",
      "Automated Protocol Integration",
      "Advanced Program Instruction",
    ],
    correct: [1],
    type: "single",
    exp: "API (Application Programming Interface) defines how different software components communicate with each other.",
  },
  {
    id: "e2", domain: "Technical English",
    q: "Which sentence correctly uses 'implement' in a technical context?",
    opts: [
      "We need to implement the server so it crashes",
      "The team will implement the new authentication module next sprint",
      "Please implement the report by deleting all records",
      "Can you implement why this error occurs?",
    ],
    correct: [1],
    type: "single",
    exp: "'Implement' means to put a plan or system into effect. Correct usage: building or deploying a module/feature.",
  },
  {
    id: "e3", domain: "Technical English",
    q: "What does 'deprecated' mean in a software context?",
    opts: [
      "A feature that is newly released",
      "A feature that is discouraged/outdated and may be removed in future versions",
      "A feature that is encrypted",
      "A feature that is free to use",
    ],
    correct: [1],
    type: "single",
    exp: "Deprecated means a feature or method is still functional but discouraged — developers should migrate to the recommended replacement.",
  },
  {
    id: "e4", domain: "Technical English",
    q: "Which of the following terms correctly describe types of software documentation?",
    opts: ["API reference", "User manual", "Technical specification", "Source control", "Release notes"],
    correct: [0, 1, 2, 4],
    type: "multi",
    exp: "API references, user manuals, technical specs, and release notes are documentation types. Source control is version management.",
  },
  {
    id: "e5", domain: "Technical English",
    q: "What is the correct meaning of 'bandwidth' in networking?",
    opts: [
      "The physical width of a network cable",
      "The maximum data transfer rate of a network connection",
      "The number of devices on a network",
      "The encryption strength of a connection",
    ],
    correct: [1],
    type: "single",
    exp: "Bandwidth refers to the maximum data transfer capacity of a network, typically measured in Mbps or Gbps.",
  },
  {
    id: "e6", domain: "Technical English",
    q: "What does 'scalable' mean when describing a software architecture?",
    opts: [
      "The system can handle increasing workloads by adding resources",
      "The system has a small codebase",
      "The system is available 24/7",
      "The system has passed security audits",
    ],
    correct: [0],
    type: "single",
    exp: "Scalability means a system can handle growing demands — either vertically (bigger machines) or horizontally (more machines).",
  },
  {
    id: "e7", domain: "Technical English",
    q: "In a bug report, which of these are typically required fields?",
    opts: ["Steps to reproduce", "Expected behavior", "Actual behavior", "Developer's salary", "Environment details"],
    correct: [0, 1, 2, 4],
    type: "multi",
    exp: "Good bug reports include reproduction steps, expected vs. actual behavior, and environment details (OS, browser, version).",
  },

  // ── LOGICAL REASONING (7 questions) ──
  {
    id: "l1", domain: "Logical Reasoning",
    q: "If all A are B, and all B are C, which conclusion is valid?",
    opts: ["All C are A", "All A are C", "No A are C", "Some B are not A"],
    correct: [1],
    type: "single",
    exp: "By transitive logic: A→B and B→C means A→C. All A are necessarily C.",
  },
  {
    id: "l2", domain: "Logical Reasoning",
    q: "A pattern: 2, 6, 18, 54, ___. What is the next number?",
    opts: ["108", "162", "216", "108"],
    correct: [1],
    type: "single",
    exp: "Each number is multiplied by 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162.",
  },
  {
    id: "l3", domain: "Logical Reasoning",
    q: "Which of the following are logical fallacies?",
    opts: ["Ad hominem", "Straw man", "Deductive reasoning", "False dichotomy", "Modus ponens"],
    correct: [0, 1, 3],
    type: "multi",
    exp: "Ad hominem (attacking the person), straw man (misrepresenting an argument), and false dichotomy (false either/or) are fallacies. Deductive reasoning and modus ponens are valid logic forms.",
  },
  {
    id: "l4", domain: "Logical Reasoning",
    q: "If it rains, the ground is wet. The ground is wet. What can we conclude?",
    opts: [
      "It definitely rained",
      "It definitely did not rain",
      "We cannot conclude it rained (another cause could exist)",
      "It will rain tomorrow",
    ],
    correct: [2],
    type: "single",
    exp: "This is the fallacy of 'affirming the consequent'. The ground being wet doesn't prove it rained — a sprinkler could also cause wetness.",
  },
  {
    id: "l5", domain: "Logical Reasoning",
    q: "What is the minimum number of socks you must pick from a drawer (in the dark) with 5 red and 5 blue socks to guarantee a matching pair?",
    opts: ["2", "3", "6", "10"],
    correct: [1],
    type: "single",
    exp: "By the pigeonhole principle, with 2 colors, picking 3 socks guarantees at least 2 of the same color.",
  },
  {
    id: "l6", domain: "Logical Reasoning",
    q: "A store sells items for $10. After a 20% discount, what is the new price?",
    opts: ["$2", "$8", "$12", "$18"],
    correct: [1],
    type: "single",
    exp: "20% of $10 = $2. $10 - $2 = $8. Percentage discounts multiply the original price by (1 - rate).",
  },
  {
    id: "l7", domain: "Logical Reasoning",
    q: "Which statements correctly define deductive reasoning?",
    opts: [
      "Moving from general principles to specific conclusions",
      "The conclusion must be true if the premises are true",
      "It is based on probability and patterns",
      "It guarantees the conclusion if premises are valid",
    ],
    correct: [0, 1, 3],
    type: "multi",
    exp: "Deductive reasoning starts from general premises and derives specific conclusions with certainty if premises hold. Option 2 describes inductive reasoning.",
  },
];

// ─────────────────────────────────────────────
// Domain config
// ─────────────────────────────────────────────
const DOMAINS = {
  "Programming":       { color: "#6366f1", emoji: "💻", bg: "rgba(99,102,241,0.12)" },
  "Networking":        { color: "#0ea5e9", emoji: "🌐", bg: "rgba(14,165,233,0.12)" },
  "Data Analysis":     { color: "#10b981", emoji: "📊", bg: "rgba(16,185,129,0.12)" },
  "Databases":         { color: "#f59e0b", emoji: "🗄️",  bg: "rgba(245,158,11,0.12)"  },
  "UI/UX":             { color: "#ec4899", emoji: "🎨", bg: "rgba(236,72,153,0.12)" },
  "Technical English": { color: "#8b5cf6", emoji: "📝", bg: "rgba(139,92,246,0.12)" },
  "Logical Reasoning": { color: "#ef4444", emoji: "🧠", bg: "rgba(239,68,68,0.12)"  },
};

// Career mapping based on domain scores
const CAREERS = {
  "Software Engineer": {
    domains: ["Programming", "Databases", "Logical Reasoning"],
    salaryRange: "$70,000 – $150,000",
    growth: "22% (2023–2030)",
    icon: "💻",
    description: "Build software systems, applications, and platforms.",
  },
  "Data Scientist": {
    domains: ["Data Analysis", "Programming", "Logical Reasoning"],
    salaryRange: "$95,000 – $165,000",
    growth: "35% (2023–2030)",
    icon: "📈",
    description: "Extract insights from complex data using ML and statistics.",
  },
  "Network Engineer": {
    domains: ["Networking", "Databases", "Technical English"],
    salaryRange: "$65,000 – $130,000",
    growth: "5% (2023–2030)",
    icon: "🌐",
    description: "Design, implement, and manage computer networks.",
  },
  "Database Administrator": {
    domains: ["Databases", "Programming", "Logical Reasoning"],
    salaryRange: "$75,000 – $130,000",
    growth: "9% (2023–2030)",
    icon: "🗄️",
    description: "Manage, optimize, and secure database systems.",
  },
  "UX Designer": {
    domains: ["UI/UX", "Logical Reasoning", "Technical English"],
    salaryRange: "$65,000 – $130,000",
    growth: "16% (2023–2030)",
    icon: "🎨",
    description: "Create intuitive and accessible user experiences.",
  },
  "Technical Writer": {
    domains: ["Technical English", "UI/UX", "Programming"],
    salaryRange: "$55,000 – $100,000",
    growth: "7% (2023–2030)",
    icon: "✍️",
    description: "Create technical documentation, guides, and API references.",
  },
  "Business Analyst": {
    domains: ["Data Analysis", "Logical Reasoning", "Technical English"],
    salaryRange: "$60,000 – $120,000",
    growth: "14% (2023–2030)",
    icon: "📊",
    description: "Bridge the gap between business needs and technical solutions.",
  },
  "Full Stack Developer": {
    domains: ["Programming", "UI/UX", "Databases"],
    salaryRange: "$80,000 – $160,000",
    growth: "25% (2023–2030)",
    icon: "⚡",
    description: "Build both client-side and server-side web applications.",
  },
};

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
function computeResults(answers) {
  const domainScores = {};
  const domainTotals = {};

  QUESTION_BANK.forEach(q => {
    if (!domainTotals[q.domain]) { domainTotals[q.domain] = 0; domainScores[q.domain] = 0; }
    domainTotals[q.domain]++;
    const userAns = answers[q.id] || [];
    const isCorrect =
      userAns.length === q.correct.length &&
      q.correct.every(c => userAns.includes(c));
    if (isCorrect) domainScores[q.domain]++;
  });

  // Percentages per domain
  const domainPct = {};
  Object.keys(domainTotals).forEach(d => {
    domainPct[d] = Math.round((domainScores[d] / domainTotals[d]) * 100);
  });

  // Sort domains by score
  const sorted = Object.entries(domainPct).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 3).map(([d]) => d);
  const weaknesses = sorted.slice(-2).map(([d]) => d);

  // Overall score
  const correct = Object.values(domainScores).reduce((a, b) => a + b, 0);
  const total = QUESTION_BANK.length;
  const overall = Math.round((correct / total) * 100);

  // Career matching
  const careerScores = Object.entries(CAREERS).map(([name, info]) => {
    const avg = info.domains.reduce((sum, d) => sum + (domainPct[d] || 0), 0) / info.domains.length;
    return { name, ...info, matchScore: Math.round(avg) };
  }).sort((a, b) => b.matchScore - a.matchScore);

  return { domainPct, strengths, weaknesses, overall, careerScores, correct, total };
}

// ─────────────────────────────────────────────
// Icons (inline SVG)
// ─────────────────────────────────────────────
function Icon({ type, size = 18, color = "currentColor" }) {
  const icons = {
    check: <polyline points="20 6 9 17 4 12" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    arrow: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    "arrow-left": <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    brain: <><path d="M12 2C8.1 2 5 5.1 5 9c0 2.4 1.1 4.5 2.8 5.9L7 20h10l-.8-5.1C17.9 13.5 19 11.4 19 9c0-3.9-3.1-7-7-7z" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></>,
    trophy: <><path d="M6 9H4a2 2 0 0 1-2-2V5h4" /><path d="M18 9h2a2 2 0 0 0 2-2V5h-4" /><path d="M12 17v4" /><path d="M8 21h8" /><path d="M6 5v7a6 6 0 0 0 12 0V5H6z" /></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[type] || null}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function CareerDiagnostic({ setPage, exams = [] }) {
  const [phase, setPhase] = useState("intro"); // intro | quiz | results
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [showNav, setShowNav] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [resultTab, setResultTab] = useState("overview"); // overview | careers | exams | courses
  const [animIn, setAnimIn] = useState(true);

  const containerRef = useRef();
  const q = QUESTION_BANK[current];
  const isRevealed = revealed[q?.id];

  // Save/load progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem("flexexams_diagnostic");
      if (saved) {
        const { answers: a, phase: p, current: c } = JSON.parse(saved);
        if (p === "quiz") { setAnswers(a || {}); setCurrent(c || 0); }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (phase === "quiz") {
      try { localStorage.setItem("flexexams_diagnostic", JSON.stringify({ answers, phase, current })); } catch {}
    }
  }, [answers, phase, current]);

  const handleSelect = useCallback((optIdx) => {
    if (isRevealed) return;
    const qid = q.id;
    if (q.type === "single") {
      setAnswers(prev => ({ ...prev, [qid]: [optIdx] }));
    } else {
      setAnswers(prev => {
        const cur = prev[qid] || [];
        return cur.includes(optIdx)
          ? { ...prev, [qid]: cur.filter(x => x !== optIdx) }
          : { ...prev, [qid]: [...cur, optIdx] };
      });
    }
  }, [q, isRevealed]);

  const handleReveal = () => {
    if (!answers[q.id]?.length) return;
    setRevealed(prev => ({ ...prev, [q.id]: true }));
  };

  const goTo = (idx) => {
    setAnimIn(false);
    setTimeout(() => { setCurrent(idx); setAnimIn(true); setShowNav(false); containerRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, 150);
  };

  const finishExam = async () => {
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 2200));
    const res = computeResults(answers);
    setResults(res);
    setAnalyzing(false);
    setPhase("results");
    localStorage.removeItem("flexexams_diagnostic");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / QUESTION_BANK.length) * 100);

  // ── Suggested exams based on strengths
  const suggestedExams = exams.filter(e => {
    if (!results) return false;
    const title = (e.title + (e.vendor || "") + (e.topic || "")).toLowerCase();
    return results.strengths.some(s => {
      const kw = { Programming: ["python","javascript","aws","azure","developer"], Networking: ["network","cisco","ccna","comptia","aws"], "Data Analysis": ["data","power bi","tableau","analyst"], Databases: ["sql","database","oracle","mongo"], "UI/UX": ["ux","design","adobe","figma"], "Technical English": ["english","communication","writing"], "Logical Reasoning": ["pmp","project","agile","scrum"] };
      return (kw[s] || []).some(k => title.includes(k));
    });
  }).slice(0, 4);

  // ── Recommended courses per domain
  const COURSES = {
    "Programming":       [{ name: "The Web Developer Bootcamp", platform: "Udemy", url: "#" }, { name: "CS50x", platform: "edX / Harvard", url: "#" }, { name: "Python for Everybody", platform: "Coursera", url: "#" }],
    "Networking":        [{ name: "CompTIA Network+ (N10-008)", platform: "Professor Messer", url: "#" }, { name: "CCNA 200-301", platform: "Cisco / Udemy", url: "#" }, { name: "AWS Networking Essentials", platform: "AWS Skill Builder", url: "#" }],
    "Data Analysis":     [{ name: "Google Data Analytics Certificate", platform: "Coursera", url: "#" }, { name: "Data Analysis with Python", platform: "freeCodeCamp", url: "#" }, { name: "Power BI Masterclass", platform: "Udemy", url: "#" }],
    "Databases":         [{ name: "SQL for Data Science", platform: "Coursera (UC Davis)", url: "#" }, { name: "MongoDB University M001", platform: "MongoDB Atlas", url: "#" }, { name: "Oracle SQL Fundamentals", platform: "Oracle Academy", url: "#" }],
    "UI/UX":             [{ name: "Google UX Design Certificate", platform: "Coursera", url: "#" }, { name: "UI / UX Design Bootcamp", platform: "Udemy", url: "#" }, { name: "Figma Essentials", platform: "Figma Community", url: "#" }],
    "Technical English": [{ name: "Technical Writing Fundamentals", platform: "Coursera", url: "#" }, { name: "English for IT Professionals", platform: "Coursera", url: "#" }, { name: "Grammarly for Developers", platform: "Grammarly", url: "#" }],
    "Logical Reasoning": [{ name: "Critical Thinking & Problem Solving", platform: "Coursera (Univ. of Michigan)", url: "#" }, { name: "Logical Reasoning Masterclass", platform: "Udemy", url: "#" }, { name: "PMP Exam Prep", platform: "PMI", url: "#" }],
  };

  // ─── INTRO SCREEN ───
  if (phase === "intro") return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <style>{`
        @keyframes floatUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .diag-intro-card { animation: floatUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .diag-domain-pill { transition: all 0.2s; cursor: default; }
        .diag-domain-pill:hover { transform: translateY(-2px); }
        .diag-start-btn { transition: all 0.22s; }
        .diag-start-btn:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(99,102,241,0.35) !important; }
      `}</style>
      <div className="diag-intro-card" style={{ maxWidth: 760, width: "100%", background: "var(--bg2)", border: "2px solid var(--border)", borderRadius: 28, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)", padding: "48px 40px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.08), transparent 70%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 100, padding: "6px 16px", marginBottom: 20, fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              ✦ Career Intelligence Assessment
            </div>
            <h1 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 14 }}>
              Discover Your Tech<br />Career Path
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, maxWidth: 500 }}>
              50 questions across 7 domains. Get a personalized skill map, career recommendations, salary insights, and a curated study plan.
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "36px 40px" }}>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
            {[
              { label: "Questions", value: "50", icon: "📋" },
              { label: "Domains", value: "7", icon: "🎯" },
              { label: "No Timer", value: "Relaxed", icon: "⏳" },
              { label: "Career Matches", value: "8+", icon: "💼" },
            ].map(s => (
              <div key={s.label} style={{ flex: "1 1 100px", background: "var(--bg3)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "16px", textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px" }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Domain pills */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Covered Domains</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {Object.entries(DOMAINS).map(([name, cfg]) => (
                <div key={name} className="diag-domain-pill" style={{ display: "flex", alignItems: "center", gap: 7, background: cfg.bg, border: `1.5px solid ${cfg.color}40`, borderRadius: 100, padding: "7px 14px", fontSize: 13, fontWeight: 600, color: cfg.color }}>
                  <span>{cfg.emoji}</span>{name}
                </div>
              ))}
            </div>
          </div>

          {/* What you'll get */}
          <div style={{ background: "var(--accent-soft)", border: "1.5px solid var(--accent3)", borderRadius: 14, padding: "18px 20px", marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>What You'll Receive</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {["📊 Domain-by-domain skill breakdown","🏆 Top strength identification","💼 Career path recommendations","💰 Salary ranges & growth data","📚 Curated certification exams","🎓 Course recommendations"].map(item => (
                <div key={item} style={{ fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", gap: 6 }}>{item}</div>
              ))}
            </div>
          </div>

          <button className="diag-start-btn" onClick={() => setPhase("quiz")}
            style={{ width: "100%", padding: "16px", borderRadius: 14, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff", fontSize: 16, fontWeight: 800, border: "none", cursor: "pointer", letterSpacing: "-0.3px", boxShadow: "0 8px 28px rgba(99,102,241,0.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            Begin Assessment <Icon type="arrow" size={18} color="#fff" />
          </button>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 12.5, color: "var(--text3)" }}>
            No account required · Progress auto-saved locally
          </div>
        </div>
      </div>
    </div>
  );

  // ─── ANALYZING SCREEN ───
  if (analyzing) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24, padding: 40 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes analyzeBar{from{width:0} to{width:100%}}`}</style>
      <div style={{ width: 72, height: 72, border: "4px solid var(--accent3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Analyzing Your Results</div>
        <div style={{ fontSize: 14, color: "var(--text3)" }}>Building your personalized career intelligence report...</div>
      </div>
      <div style={{ width: 260, height: 6, background: "var(--border)", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg,#6366f1,#ec4899)", borderRadius: 100, animation: "analyzeBar 2s cubic-bezier(0.16,1,0.3,1) both" }} />
      </div>
    </div>
  );

  // ─── RESULTS SCREEN ───
  if (phase === "results" && results) {
    const { domainPct, strengths, weaknesses, overall, careerScores, correct, total } = results;
    const topCareer = careerScores[0];
    const levelLabel = overall >= 80 ? "Advanced" : overall >= 60 ? "Intermediate" : overall >= 40 ? "Foundation" : "Beginner";
    const levelColor = overall >= 80 ? "#10b981" : overall >= 60 ? "#6366f1" : overall >= 40 ? "#f59e0b" : "#ef4444";

    const tabs = [
      { id: "overview", label: "📊 Overview" },
      { id: "careers", label: "💼 Career Paths" },
      { id: "exams", label: "📋 Exam Suggestions" },
      { id: "courses", label: "🎓 Courses" },
    ];

    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px clamp(16px,4vw,60px)" }}>
        <style>{`
          @keyframes floatUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
          @keyframes fillBar{from{width:0}to{width:var(--w)}}
          .res-card{animation:floatUp 0.5s ease both;}
          .res-tab{transition:all 0.2s;cursor:pointer;white-space:nowrap;}
          .career-card{transition:all 0.25s;}
          .career-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.12)!important;}
          .restart-btn{transition:all 0.2s;}
          .restart-btn:hover{transform:translateY(-2px);}
        `}</style>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* Header */}
          <div className="res-card" style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #ec4899 100%)", borderRadius: 24, padding: "40px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.1), transparent 60%)" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Career Intelligence Report</div>
                <h1 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, color: "#fff", letterSpacing: "-1px", marginBottom: 8 }}>Your Results Are In!</h1>
                <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                  You answered <strong>{correct}/{total}</strong> correctly · Overall Level: <strong>{levelLabel}</strong>
                </p>
                <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {strengths.slice(0, 3).map(s => (
                    <div key={s} style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 100, padding: "5px 14px", fontSize: 12.5, fontWeight: 700, color: "#fff" }}>
                      {DOMAINS[s].emoji} {s}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "4px solid rgba(255,255,255,0.35)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-2px" }}>{overall}%</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Score</div>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "#fff", background: levelColor, borderRadius: 100, padding: "4px 14px", display: "inline-block" }}>{levelLabel}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="res-card" style={{ animationDelay: "0.05s", display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
            {tabs.map(t => (
              <button key={t.id} className="res-tab" onClick={() => setResultTab(t.id)}
                style={{ padding: "10px 18px", borderRadius: 12, border: `2px solid ${resultTab === t.id ? "#6366f1" : "var(--border)"}`, background: resultTab === t.id ? "rgba(99,102,241,0.1)" : "var(--bg2)", color: resultTab === t.id ? "#6366f1" : "var(--text2)", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: OVERVIEW ── */}
          {resultTab === "overview" && (
            <div>
              <div className="res-card" style={{ animationDelay: "0.1s", background: "var(--bg2)", border: "2px solid var(--border)", borderRadius: 20, padding: "28px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>Domain Breakdown</div>
                {Object.entries(domainPct).sort((a, b) => b[1] - a[1]).map(([domain, pct], i) => {
                  const cfg = DOMAINS[domain];
                  return (
                    <div key={domain} style={{ marginBottom: 16, animationDelay: `${i * 0.06}s` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{domain}</span>
                          {strengths.includes(domain) && <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, background: cfg.bg, borderRadius: 100, padding: "2px 8px", border: `1px solid ${cfg.color}40` }}>★ Strength</span>}
                          {weaknesses.includes(domain) && <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 100, padding: "2px 8px", border: "1px solid rgba(239,68,68,0.3)" }}>↑ Improve</span>}
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: cfg.color }}>{pct}%</span>
                      </div>
                      <div style={{ height: 10, background: "var(--bg3)", borderRadius: 100, overflow: "hidden" }}>
                        <div style={{ "--w": `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}bb)`, borderRadius: 100, width: `${pct}%`, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Top career preview */}
              <div className="res-card" style={{ animationDelay: "0.2s", background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))", border: "2px solid rgba(99,102,241,0.3)", borderRadius: 20, padding: "24px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>🏆 Top Career Match</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 48 }}>{topCareer.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{topCareer.name}</div>
                    <div style={{ fontSize: 13.5, color: "var(--text2)", marginBottom: 8 }}>{topCareer.description}</div>
                    <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
                      <span style={{ color: "#10b981", fontWeight: 700 }}>💰 {topCareer.salaryRange}</span>
                      <span style={{ color: "#6366f1", fontWeight: 700 }}>📈 {topCareer.growth} growth</span>
                      <span style={{ color: "var(--text3)", fontWeight: 600 }}>Match: {topCareer.matchScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: CAREERS ── */}
          {resultTab === "careers" && (
            <div style={{ display: "grid", gap: 14 }}>
              {careerScores.map((career, i) => (
                <div key={career.name} className="career-card res-card" style={{ animationDelay: `${i * 0.06}s`, background: "var(--bg2)", border: i === 0 ? "2px solid #6366f1" : "2px solid var(--border)", borderRadius: 18, padding: "22px 24px", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", boxShadow: i === 0 ? "0 4px 24px rgba(99,102,241,0.12)" : "var(--card-shadow)", cursor: "default" }}>
                  {i === 0 && <div style={{ position: "absolute", top: 0, right: 0, background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 12px", borderRadius: "0 16px 0 10px", letterSpacing: "0.06em" }}>BEST MATCH</div>}
                  <div style={{ fontSize: 38, flexShrink: 0 }}>{career.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>{career.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: career.matchScore >= 70 ? "#10b981" : career.matchScore >= 50 ? "#f59e0b" : "#ef4444", background: career.matchScore >= 70 ? "rgba(16,185,129,0.1)" : career.matchScore >= 50 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", borderRadius: 100, padding: "2px 10px", border: `1px solid ${career.matchScore >= 70 ? "rgba(16,185,129,0.3)" : career.matchScore >= 50 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                        {career.matchScore}% match
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10 }}>{career.description}</div>
                    <div style={{ display: "flex", gap: 14, fontSize: 12.5, flexWrap: "wrap" }}>
                      <span style={{ color: "#10b981", fontWeight: 700 }}>💰 {career.salaryRange}</span>
                      <span style={{ color: "#6366f1", fontWeight: 700 }}>📈 Growth: {career.growth}</span>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {career.domains.map(d => (
                        <span key={d} style={{ fontSize: 11, fontWeight: 600, color: DOMAINS[d].color, background: DOMAINS[d].bg, borderRadius: 100, padding: "2px 9px", border: `1px solid ${DOMAINS[d].color}30` }}>{DOMAINS[d].emoji} {d}</span>
                      ))}
                    </div>
                  </div>
                  {/* Match bar */}
                  <div style={{ width: 60, textAlign: "center", flexShrink: 0 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: `conic-gradient(${i === 0 ? "#6366f1" : "#10b981"} ${career.matchScore * 3.6}deg, var(--bg3) 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "var(--text)" }}>
                        {career.matchScore}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB: EXAM SUGGESTIONS ── */}
          {resultTab === "exams" && (
            <div>
              <div className="res-card" style={{ animationDelay: "0.05s", background: "var(--accent-soft)", border: "1.5px solid var(--accent3)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, fontSize: 13.5, color: "var(--text2)", lineHeight: 1.6 }}>
                <Icon type="info" size={15} color="var(--accent)" /> Based on your strengths in <strong>{strengths.join(", ")}</strong>, here are the certifications that align best with your profile.
              </div>
              {suggestedExams.length > 0 ? (
                <div style={{ display: "grid", gap: 14 }}>
                  {suggestedExams.map((exam, i) => (
                    <div key={exam.id} className="career-card res-card" style={{ animationDelay: `${i * 0.07}s`, background: "var(--bg2)", border: "2px solid var(--border)", borderRadius: 16, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--card-shadow)", cursor: "pointer" }}
                      onClick={() => { if (setPage) setPage("exams"); }}>
                      {exam.image ? <img src={exam.image} alt={exam.title} style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 52, height: 52, borderRadius: 12, background: `${exam.color || "#6366f1"}15`, border: `2px solid ${exam.color || "#6366f1"}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>📋</div>}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{exam.title}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text3)" }}>{exam.totalQuestions || 0} questions · {exam.vendor || "Certification"}</div>
                      </div>
                      <div style={{ color: "#6366f1" }}><Icon type="arrow" size={18} color="#6366f1" /></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "var(--bg2)", border: "2px solid var(--border)", borderRadius: 20, padding: "40px", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Explore All Certifications</div>
                  <div style={{ fontSize: 13.5, color: "var(--text3)", marginBottom: 20 }}>Browse our full exam library to find certifications that match your career goals.</div>
                  <button onClick={() => setPage && setPage("exams")} style={{ padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Browse All Exams →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: COURSES ── */}
          {resultTab === "courses" && (
            <div>
              {strengths.map((domain, di) => (
                <div key={domain} className="res-card" style={{ animationDelay: `${di * 0.08}s`, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>{DOMAINS[domain].emoji}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{domain}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: DOMAINS[domain].color, background: DOMAINS[domain].bg, borderRadius: 100, padding: "2px 10px" }}>★ Your Strength</span>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {(COURSES[domain] || []).map((course, i) => (
                      <div key={i} style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{course.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>🎓 {course.platform}</div>
                        </div>
                        <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: DOMAINS[domain].color, background: DOMAINS[domain].bg, borderRadius: 100, padding: "5px 12px", border: `1px solid ${DOMAINS[domain].color}30`, whiteSpace: "nowrap" }}>
                          View Course →
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {/* Also show improvement domains */}
              {weaknesses.map((domain, di) => (
                <div key={domain} className="res-card" style={{ animationDelay: `${(strengths.length + di) * 0.08}s`, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 22 }}>{DOMAINS[domain].emoji}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{domain}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: 100, padding: "2px 10px" }}>↑ Growth Area</span>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {(COURSES[domain] || []).map((course, i) => (
                      <div key={i} style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{course.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>🎓 {course.platform}</div>
                        </div>
                        <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.08)", borderRadius: 100, padding: "5px 12px", border: "1px solid rgba(239,68,68,0.25)", whiteSpace: "nowrap" }}>
                          View Course →
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Restart button */}
          <div className="res-card" style={{ animationDelay: "0.3s", display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <button className="restart-btn" onClick={() => { setPhase("intro"); setCurrent(0); setAnswers({}); setRevealed({}); setResults(null); }}
              style={{ flex: 1, padding: "13px", borderRadius: 13, border: "2px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon type="refresh" size={15} color="currentColor" /> Retake Assessment
            </button>
            <button className="restart-btn" onClick={() => setPage && setPage("exams")}
              style={{ flex: 1, padding: "13px", borderRadius: 13, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon type="briefcase" size={15} color="#fff" /> Explore Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUIZ SCREEN ───
  const userAns = answers[q.id] || [];
  const domainCfg = DOMAINS[q.domain] || { color: "#6366f1", emoji: "📋", bg: "rgba(99,102,241,0.1)" };

  // Domain progress tracking
  const domainCounts = {};
  QUESTION_BANK.forEach(qq => { domainCounts[qq.domain] = (domainCounts[qq.domain] || 0) + 1; });
  const domainAnswered = {};
  Object.keys(answers).forEach(id => {
    const qq = QUESTION_BANK.find(x => x.id === id);
    if (qq) domainAnswered[qq.domain] = (domainAnswered[qq.domain] || 0) + 1;
  });

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes floatUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeQ{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
        .quiz-q{animation:fadeQ 0.2s ease both;}
        .opt-btn{transition:all 0.18s;cursor:pointer;text-align:left;}
        .opt-btn:hover{transform:translateX(4px);}
        .nav-q{transition:all 0.15s;cursor:pointer;font-weight:700;font-size:12px;border-radius:8px;}
        .nav-q:hover{transform:scale(1.1);}
        .reveal-btn{transition:all 0.2s;}
        .reveal-btn:hover{transform:translateY(-2px);}
        .next-btn{transition:all 0.2s;}
        .next-btn:hover{transform:translateY(-2px);}
      `}</style>

      {/* ── Top Bar ── */}
      <div style={{ position: "sticky", top: 68, zIndex: 50, background: "var(--bg-glass)", backdropFilter: "var(--nav-blur)", borderBottom: "1.5px solid var(--border)", padding: "12px clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{domainCfg.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: domainCfg.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{q.domain}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)" }}>{current + 1} / {QUESTION_BANK.length}</span>
              <button onClick={() => setShowNav(v => !v)} style={{ padding: "6px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg2)", color: "var(--text2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {showNav ? "✕ Close" : "⊞ Navigate"}
              </button>
              {answeredCount >= QUESTION_BANK.length && (
                <button onClick={finishExam} style={{ padding: "7px 16px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  Get Results →
                </button>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: "var(--bg3)", borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 100, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>
            <span>{answeredCount} answered</span>
            <span>{QUESTION_BANK.length - answeredCount} remaining</span>
          </div>
        </div>
      </div>

      {/* ── Nav Panel ── */}
      {showNav && (
        <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", margin: "0 clamp(16px,4vw,48px)", marginTop: 8, borderRadius: 16, padding: "20px", maxWidth: 860, marginLeft: "auto", marginRight: "auto", width: "calc(100% - clamp(32px,8vw,96px))" }}>
          {Object.entries(DOMAINS).map(([domain, cfg]) => {
            const qs = QUESTION_BANK.filter(x => x.domain === domain);
            const ans = qs.filter(x => answers[x.id]).length;
            return (
              <div key={domain} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  {cfg.emoji} {domain} <span style={{ color: "var(--text3)", fontWeight: 600 }}>({ans}/{qs.length})</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {qs.map(qq => {
                    const idx = QUESTION_BANK.findIndex(x => x.id === qq.id);
                    const isAns = !!answers[qq.id];
                    const isRev = !!revealed[qq.id];
                    const isCur = idx === current;
                    return (
                      <button key={qq.id} className="nav-q" onClick={() => goTo(idx)}
                        style={{ width: 32, height: 32, border: `2px solid ${isCur ? cfg.color : isAns ? (isRev ? cfg.color : "var(--border)") : "var(--border)"}`, background: isCur ? cfg.color : isRev ? `${cfg.color}25` : isAns ? "var(--accent-soft)" : "var(--bg3)", color: isCur ? "#fff" : isRev ? cfg.color : "var(--text2)", fontFamily: "inherit" }}>
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Question Card ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px clamp(16px,4vw,48px) 60px" }}>
        <div key={q.id} className="quiz-q" style={{ width: "100%", maxWidth: 760 }}>

          {/* Domain badge + question number */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ background: domainCfg.bg, border: `1.5px solid ${domainCfg.color}40`, borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{domainCfg.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: domainCfg.color }}>{q.domain}</span>
            </div>
            {q.type === "multi" && (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1.5px solid rgba(245,158,11,0.35)", borderRadius: 100, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, color: "#f59e0b" }}>
                ✓ Select all that apply
              </div>
            )}
          </div>

          {/* Question text */}
          <div style={{ fontSize: "clamp(16px,2.5vw,20px)", fontWeight: 700, color: "var(--text)", lineHeight: 1.55, marginBottom: 24, padding: "0 4px" }}>
            {q.q}
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {q.opts.map((opt, idx) => {
              const isSelected = userAns.includes(idx);
              const isCorrect = q.correct.includes(idx);
              let bg = "var(--bg2)", border = "2px solid var(--border)", color = "var(--text)";

              if (isRevealed) {
                if (isCorrect) { bg = "rgba(16,185,129,0.1)"; border = "2px solid #10b981"; color = "#065f46"; }
                else if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.08)"; border = "2px solid #ef4444"; color = "#991b1b"; }
              } else if (isSelected) {
                bg = domainCfg.bg; border = `2px solid ${domainCfg.color}`; color = domainCfg.color;
              }

              return (
                <button key={idx} className="opt-btn" onClick={() => handleSelect(idx)}
                  style={{ background: bg, border, borderRadius: 14, padding: "14px 18px", color, fontSize: 14.5, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: q.type === "multi" ? 7 : "50%", border: `2px solid ${isRevealed ? (isCorrect ? "#10b981" : isSelected ? "#ef4444" : "var(--border)") : isSelected ? domainCfg.color : "var(--border)"}`, background: isRevealed ? (isCorrect ? "#10b981" : isSelected ? "#ef4444" : "transparent") : isSelected ? domainCfg.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                    {isRevealed && isCorrect && <Icon type="check" size={13} color="#fff" />}
                    {isRevealed && isSelected && !isCorrect && <Icon type="x" size={13} color="#fff" />}
                    {!isRevealed && isSelected && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <span style={{ flex: 1 }}>{String.fromCharCode(65 + idx)}. {opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {isRevealed && (
            <div style={{ background: "rgba(16,185,129,0.08)", border: "2px solid rgba(16,185,129,0.3)", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>💡 Explanation</div>
              <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7 }}>{q.exp}</div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {current > 0 && (
              <button className="next-btn" onClick={() => goTo(current - 1)}
                style={{ padding: "11px 20px", borderRadius: 12, border: "2px solid var(--border)", background: "var(--bg2)", color: "var(--text2)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7 }}>
                <Icon type="arrow-left" size={15} color="currentColor" /> Back
              </button>
            )}

            {userAns.length > 0 && !isRevealed && (
              <button className="reveal-btn" onClick={handleReveal}
                style={{ padding: "11px 20px", borderRadius: 12, border: `2px solid ${domainCfg.color}`, background: domainCfg.bg, color: domainCfg.color, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Check Answer
              </button>
            )}

            {current < QUESTION_BANK.length - 1 && (
              <button className="next-btn" onClick={() => goTo(current + 1)}
                style={{ marginLeft: "auto", padding: "11px 22px", borderRadius: 12, border: "none", background: userAns.length > 0 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "var(--bg3)", color: userAns.length > 0 ? "#fff" : "var(--text3)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
                Next <Icon type="arrow" size={15} color={userAns.length > 0 ? "#fff" : "var(--text3)"} />
              </button>
            )}

            {current === QUESTION_BANK.length - 1 && answeredCount >= Math.floor(QUESTION_BANK.length * 0.7) && (
              <button className="next-btn" onClick={finishExam}
                style={{ marginLeft: "auto", padding: "11px 22px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                🎯 Get My Career Report
              </button>
            )}
          </div>

          {/* Bottom progress hint */}
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
            {QUESTION_BANK.map((qq, idx) => (
              <div key={qq.id} onClick={() => goTo(idx)} style={{ width: 8, height: 8, borderRadius: "50%", cursor: "pointer", background: idx === current ? "#6366f1" : answers[qq.id] ? (revealed[qq.id] ? DOMAINS[qq.domain].color : "#10b981") : "var(--border)", transition: "all 0.15s", transform: idx === current ? "scale(1.5)" : "scale(1)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}