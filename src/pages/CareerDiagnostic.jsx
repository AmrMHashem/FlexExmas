// CareerDiagnostic.jsx — FlexExams Career Intelligence Assessment v2
// UPGRADED: 10 domains · 70 questions · AI-powered analysis · Radar chart · Premium UI
import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// Question Bank — 70 questions across 10 domains
// ─────────────────────────────────────────────
const QUESTION_BANK = [
  // ── PROGRAMMING (8) ──
  { id:"p1",domain:"Programming",q:"What is the time complexity of binary search on a sorted array?",opts:["O(n)","O(log n)","O(n²)","O(1)"],correct:[1],type:"single",exp:"Binary search halves the search space each step → O(log n)." },
  { id:"p2",domain:"Programming",q:"Which are valid object-oriented programming principles?",opts:["Encapsulation","Normalization","Polymorphism","Inheritance","Defragmentation"],correct:[0,2,3],type:"multi",exp:"OOP pillars: Encapsulation, Polymorphism, Inheritance, Abstraction." },
  { id:"p3",domain:"Programming",q:"What does 'async/await' in JavaScript primarily help with?",opts:["Parallel CPU computation","Managing asynchronous operations readably","Speeding up DOM rendering","Strict type enforcement"],correct:[1],type:"single",exp:"async/await is syntactic sugar over Promises for cleaner async code." },
  { id:"p4",domain:"Programming",q:"Which data structure uses LIFO order?",opts:["Queue","Linked List","Stack","Heap"],correct:[2],type:"single",exp:"Stack = LIFO. Queue = FIFO." },
  { id:"p5",domain:"Programming",q:"In Python, what is a decorator?",opts:["A function that modifies another function's behavior","A CSS-like styling module","A data type for key-value storage","A loop construct"],correct:[0],type:"single",exp:"Decorators are higher-order functions that wrap another function to extend its behavior." },
  { id:"p6",domain:"Programming",q:"What is the difference between '==' and '===' in JavaScript?",opts:["'==' checks value only; '===' checks value and type","'===' checks value only","They are identical","'===' is only TypeScript"],correct:[0],type:"single",exp:"'===' (strict) requires both value AND type to match." },
  { id:"p7",domain:"Programming",q:"Which of these are version control systems?",opts:["Git","Docker","Mercurial","SVN","Kubernetes"],correct:[0,2,3],type:"multi",exp:"Git, Mercurial, and SVN are VCS. Docker/Kubernetes are containerization tools." },
  { id:"p8",domain:"Programming",q:"Which patterns are creational design patterns in OOP?",opts:["Singleton","Observer","Factory","Strategy","Abstract Factory"],correct:[0,2,4],type:"multi",exp:"Singleton, Factory, Abstract Factory are creational. Observer and Strategy are behavioral." },

  // ── NETWORKING (7) ──
  { id:"n1",domain:"Networking",q:"Which OSI layer handles routing packets between networks?",opts:["Data Link (Layer 2)","Network (Layer 3)","Transport (Layer 4)","Session (Layer 5)"],correct:[1],type:"single",exp:"Layer 3 (Network) handles logical addressing and routing via IP." },
  { id:"n2",domain:"Networking",q:"What is the primary purpose of DNS?",opts:["Assign IPs dynamically","Translate domain names to IP addresses","Encrypt network traffic","Route packets"],correct:[1],type:"single",exp:"DNS translates human-readable domain names into IP addresses." },
  { id:"n3",domain:"Networking",q:"Which are valid private IP address ranges (RFC 1918)?",opts:["10.0.0.0/8","172.16.0.0/12","192.168.0.0/16","8.8.8.0/24"],correct:[0,1,2],type:"multi",exp:"RFC 1918 private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x." },
  { id:"n4",domain:"Networking",q:"What does the TCP 3-way handshake consist of?",opts:["SYN → SYN-ACK → ACK","ACK → SYN → FIN","SYN → ACK → FIN","HELLO → OFFER → REQUEST"],correct:[0],type:"single",exp:"TCP: SYN (client) → SYN-ACK (server) → ACK (client)." },
  { id:"n5",domain:"Networking",q:"Which protocol is used for secure web browsing?",opts:["FTP","HTTPS","ICMP","ARP"],correct:[1],type:"single",exp:"HTTPS uses TLS/SSL encryption at Layer 7." },
  { id:"n6",domain:"Networking",q:"What is subnetting used for?",opts:["Encrypting traffic","Dividing a large network into smaller segments","Assigning MAC addresses","Translating IPv4 to IPv6"],correct:[1],type:"single",exp:"Subnetting divides large IP networks into smaller logical segments." },
  { id:"n7",domain:"Networking",q:"Which are valid network topologies?",opts:["Star","Mesh","Ring","Parallel","Bus"],correct:[0,1,2,4],type:"multi",exp:"Star, Mesh, Ring, Bus are topologies. Parallel is a processing concept." },

  // ── DATA ANALYSIS (7) ──
  { id:"d1",domain:"Data Analysis",q:"Which measure is most affected by outliers?",opts:["Median","Mode","Mean","Range"],correct:[2],type:"single",exp:"The mean is highly sensitive to extreme values." },
  { id:"d2",domain:"Data Analysis",q:"What does a correlation coefficient of -0.95 indicate?",opts:["No relationship","A weak positive relationship","A strong negative relationship","A perfect positive relationship"],correct:[2],type:"single",exp:"Near -1 = strong negative correlation." },
  { id:"d3",domain:"Data Analysis",q:"Which are data visualization tools?",opts:["Tableau","Power BI","Looker","Jenkins","Matplotlib"],correct:[0,1,2,4],type:"multi",exp:"Tableau, Power BI, Looker, Matplotlib are viz tools. Jenkins is CI/CD." },
  { id:"d4",domain:"Data Analysis",q:"What is the difference between structured and unstructured data?",opts:["Structured fits tables; unstructured has no predefined format","Unstructured is always larger","Structured is always numerical","No real difference"],correct:[0],type:"single",exp:"Structured = defined schema (DBs). Unstructured = images, emails, video." },
  { id:"d5",domain:"Data Analysis",q:"What is the purpose of data normalization in preprocessing?",opts:["Remove duplicates","Scale features to prevent dominance by large values","Delete null values","Convert to JSON"],correct:[1],type:"single",exp:"Normalization scales numeric features to 0–1 so no feature dominates ML algorithms." },
  { id:"d6",domain:"Data Analysis",q:"Which SQL clause filters grouped results?",opts:["WHERE","HAVING","GROUP BY","ORDER BY"],correct:[1],type:"single",exp:"HAVING filters after GROUP BY. WHERE filters before grouping." },
  { id:"d7",domain:"Data Analysis",q:"Which are key steps in data analysis?",opts:["Data collection","Data cleaning","Visualization","Deployment","Interpretation"],correct:[0,1,2,4],type:"multi",exp:"Core analysis: collect, clean, visualize, interpret. Deployment is engineering." },

  // ── DATABASES (7) ──
  { id:"db1",domain:"Databases",q:"What does ACID stand for in database transactions?",opts:["Automated, Concurrent, Integrated, Durable","Atomicity, Consistency, Isolation, Durability","Asynchronous, Centralized, Indexed, Distributed","Access, Control, Integrity, Distributed"],correct:[1],type:"single",exp:"ACID properties guarantee reliable database transactions." },
  { id:"db2",domain:"Databases",q:"Which SQL command retrieves data from a table?",opts:["INSERT","UPDATE","SELECT","DELETE"],correct:[2],type:"single",exp:"SELECT is the DML command for querying data." },
  { id:"db3",domain:"Databases",q:"Which are NoSQL database types?",opts:["Document","Graph","Key-Value","Relational","Column-Family"],correct:[0,1,2,4],type:"multi",exp:"Document (MongoDB), Graph (Neo4j), Key-Value (Redis), Column-Family (Cassandra)." },
  { id:"db4",domain:"Databases",q:"What is a primary key in a relational database?",opts:["A key for encrypting data","A column that uniquely identifies each row","The first column of any table","A foreign reference"],correct:[1],type:"single",exp:"Primary key uniquely identifies each record and must be unique and not null." },
  { id:"db5",domain:"Databases",q:"What is database indexing primarily used for?",opts:["Encrypting columns","Speeding up data retrieval","Normalizing relationships","Backing up"],correct:[1],type:"single",exp:"Indexes create fast lookup structures for SELECT queries." },
  { id:"db6",domain:"Databases",q:"What is the difference between INNER JOIN and LEFT JOIN?",opts:["INNER returns only matches; LEFT returns all left-table rows + matches","They are identical","LEFT returns only right-table rows","INNER is always faster"],correct:[0],type:"single",exp:"INNER JOIN = matching rows only. LEFT JOIN = all left rows + NULLs for no match." },
  { id:"db7",domain:"Databases",q:"Which statements about database normalization are true?",opts:["It reduces data redundancy","It always improves query performance","1NF requires atomic values in columns","3NF eliminates transitive dependencies"],correct:[0,2,3],type:"multi",exp:"Normalization reduces redundancy, enforces atomic values (1NF), removes transitive deps (3NF). Can hurt performance." },

  // ── UI/UX (7) ──
  { id:"u1",domain:"UI/UX",q:"What is the primary goal of user-centered design (UCD)?",opts:["Make the interface visually attractive","Design around needs, goals, and limitations of end users","Minimize development time","Maximize feature count"],correct:[1],type:"single",exp:"UCD drives all design decisions by user needs throughout the product lifecycle." },
  { id:"u2",domain:"UI/UX",q:"Which are Nielsen's 10 Usability Heuristics?",opts:["Visibility of system status","Aesthetic minimalism","User control and freedom","Color theory compliance","Error prevention"],correct:[0,1,2,4],type:"multi",exp:"Visibility, aesthetic minimalism, user control, error prevention are heuristics. Not color theory compliance." },
  { id:"u3",domain:"UI/UX",q:"What is wireframing used for?",opts:["Define final visual styling","Create low-fidelity layout blueprints before high-fidelity design","Write frontend code","Test backend performance"],correct:[1],type:"single",exp:"Wireframes are low-fidelity sketches to plan structure before visual design." },
  { id:"u4",domain:"UI/UX",q:"What does 'affordance' mean in UX design?",opts:["The color palette of an interface","A perceived action that an object suggests","The load time of a webpage","The accessibility score"],correct:[1],type:"single",exp:"Affordance: visual cues that suggest how an element should be used (e.g., a button looks clickable)." },
  { id:"u5",domain:"UI/UX",q:"What is A/B testing in UX?",opts:["Testing two versions of a design to compare user behavior","Alphabetically sorting navigation items","Testing accessibility on two devices","Running code tests A and B"],correct:[0],type:"single",exp:"A/B testing compares two design variants to determine which performs better with real users." },
  { id:"u6",domain:"UI/UX",q:"Which are common UX research methods?",opts:["User interviews","Usability testing","Heuristic evaluation","Code review","Card sorting"],correct:[0,1,2,4],type:"multi",exp:"Interviews, usability testing, heuristic evaluation, and card sorting are UX research methods." },
  { id:"u7",domain:"UI/UX",q:"What is the purpose of a design system?",opts:["To replace frontend developers","To provide reusable components, guidelines, and standards for consistency","To manage databases","To track user analytics"],correct:[1],type:"single",exp:"Design systems provide shared components and guidelines to maintain consistent UI across products." },

  // ── TECHNICAL ENGLISH (7) ──
  { id:"e1",domain:"Technical English",q:"What does 'refactor' mean in software development?",opts:["Rewrite code from scratch in a new language","Restructure existing code without changing external behavior","Delete unused code","Add new features to existing code"],correct:[1],type:"single",exp:"Refactoring improves internal code structure without changing its observable behavior." },
  { id:"e2",domain:"Technical English",q:"Which sentence uses 'implement' correctly?",opts:["We need to implement the server so it crashes","The team will implement the new authentication module next sprint","Please implement the report by deleting all records","Can you implement why this error occurs?"],correct:[1],type:"single",exp:"'Implement' means to put a system or plan into effect." },
  { id:"e3",domain:"Technical English",q:"What does 'deprecated' mean in software?",opts:["A newly released feature","A feature that is discouraged/outdated and may be removed","An encrypted feature","A free feature"],correct:[1],type:"single",exp:"Deprecated = still functional but discouraged; developers should migrate to the replacement." },
  { id:"e4",domain:"Technical English",q:"Which correctly describe types of software documentation?",opts:["API reference","User manual","Technical specification","Source control","Release notes"],correct:[0,1,2,4],type:"multi",exp:"API references, user manuals, technical specs, and release notes are documentation types." },
  { id:"e5",domain:"Technical English",q:"What is the correct meaning of 'bandwidth' in networking?",opts:["Physical width of a cable","Maximum data transfer rate of a connection","Number of devices on a network","Encryption strength"],correct:[1],type:"single",exp:"Bandwidth = maximum data transfer capacity, measured in Mbps or Gbps." },
  { id:"e6",domain:"Technical English",q:"What does 'scalable' mean in software architecture?",opts:["Can handle increasing workloads by adding resources","Has a small codebase","Available 24/7","Has passed security audits"],correct:[0],type:"single",exp:"Scalability = system can handle growing demands horizontally or vertically." },
  { id:"e7",domain:"Technical English",q:"In a bug report, which fields are typically required?",opts:["Steps to reproduce","Expected behavior","Actual behavior","Developer's salary","Environment details"],correct:[0,1,2,4],type:"multi",exp:"Good bug reports: reproduction steps, expected vs actual behavior, and environment details." },

  // ── LOGICAL REASONING (7) ──
  { id:"l1",domain:"Logical Reasoning",q:"If all A are B, and all B are C, which conclusion is valid?",opts:["All C are A","All A are C","No A are C","Some B are not A"],correct:[1],type:"single",exp:"Transitive logic: A→B and B→C means A→C." },
  { id:"l2",domain:"Logical Reasoning",q:"Pattern: 2, 6, 18, 54, ___. Next number?",opts:["108","162","216","108"],correct:[1],type:"single",exp:"Each number × 3: 54 × 3 = 162." },
  { id:"l3",domain:"Logical Reasoning",q:"Which of the following are logical fallacies?",opts:["Ad hominem","Straw man","Deductive reasoning","False dichotomy","Modus ponens"],correct:[0,1,3],type:"multi",exp:"Ad hominem, straw man, and false dichotomy are fallacies. Deductive reasoning and modus ponens are valid." },
  { id:"l4",domain:"Logical Reasoning",q:"If it rains, the ground is wet. The ground is wet. What can we conclude?",opts:["It definitely rained","It definitely did not rain","We cannot conclude it rained","It will rain tomorrow"],correct:[2],type:"single",exp:"Affirming the consequent fallacy — another cause (sprinkler) could wet the ground." },
  { id:"l5",domain:"Logical Reasoning",q:"Minimum socks (5 red + 5 blue, dark room) to guarantee a matching pair?",opts:["2","3","6","10"],correct:[1],type:"single",exp:"Pigeonhole principle: 2 colors → picking 3 guarantees at least 2 matching." },
  { id:"l6",domain:"Logical Reasoning",q:"An item costs $10. After a 20% discount, what is the price?",opts:["$2","$8","$12","$18"],correct:[1],type:"single",exp:"20% of $10 = $2. $10 - $2 = $8." },
  { id:"l7",domain:"Logical Reasoning",q:"Which correctly define deductive reasoning?",opts:["Moving from general principles to specific conclusions","The conclusion must be true if premises are true","Based on probability and patterns","Guarantees the conclusion if premises are valid"],correct:[0,1,3],type:"multi",exp:"Deductive: general→specific, conclusion guaranteed if premises hold. Option 2 describes inductive." },

  // ── CYBERSECURITY (7) ──
  { id:"cs1",domain:"Cybersecurity",q:"What type of attack intercepts communication between two parties without their knowledge?",opts:["DDoS attack","Man-in-the-Middle (MitM)","SQL Injection","Phishing"],correct:[1],type:"single",exp:"MitM attacks intercept communications, potentially reading or altering data in transit." },
  { id:"cs2",domain:"Cybersecurity",q:"What does 'principle of least privilege' mean?",opts:["Users should use the least secure password possible","Users should only have the minimum access rights needed for their role","All users share the same admin account","Security audits happen as rarely as possible"],correct:[1],type:"single",exp:"Least privilege limits access rights to only what is strictly required, reducing attack surface." },
  { id:"cs3",domain:"Cybersecurity",q:"Which are common types of malware?",opts:["Ransomware","Trojan","Worm","Firewall","Rootkit"],correct:[0,1,2,4],type:"multi",exp:"Ransomware, Trojan, Worm, and Rootkit are malware types. Firewalls are security tools." },
  { id:"cs4",domain:"Cybersecurity",q:"What is SQL injection?",opts:["A database optimization technique","An attack that inserts malicious SQL code into input fields to manipulate databases","A method for encrypting SQL queries","A database backup strategy"],correct:[1],type:"single",exp:"SQL injection exploits unsanitized input fields to manipulate or extract database data." },
  { id:"cs5",domain:"Cybersecurity",q:"What does HTTPS provide that HTTP does not?",opts:["Faster page loads","Encrypted communication and server authentication","Larger file transfer limits","Better SEO automatically"],correct:[1],type:"single",exp:"HTTPS uses TLS to encrypt data in transit and verify the server's identity via certificates." },
  { id:"cs6",domain:"Cybersecurity",q:"Which are components of the CIA Triad in security?",opts:["Confidentiality","Integrity","Authentication","Availability","Authorization"],correct:[0,1,3],type:"multi",exp:"CIA Triad = Confidentiality (data privacy), Integrity (data accuracy), Availability (accessible when needed)." },
  { id:"cs7",domain:"Cybersecurity",q:"What is a zero-day vulnerability?",opts:["A vulnerability that was fixed on day zero","A flaw exploited before the vendor is aware or has a patch","A daily security audit","A type of firewall rule"],correct:[1],type:"single",exp:"Zero-day = vulnerability unknown to the vendor, exploited before a patch exists." },

  // ── CLOUD COMPUTING (7) ──
  { id:"cl1",domain:"Cloud Computing",q:"What is the main difference between IaaS, PaaS, and SaaS?",opts:["They differ only in pricing","IaaS provides infrastructure; PaaS provides a development platform; SaaS provides complete software","They are all the same service model","IaaS is for individuals, PaaS for teams, SaaS for enterprises"],correct:[1],type:"single",exp:"IaaS (VMs/storage), PaaS (dev platforms), SaaS (ready-to-use applications like Gmail)." },
  { id:"cl2",domain:"Cloud Computing",q:"What is auto-scaling in cloud computing?",opts:["Automatically updating software versions","Dynamically adjusting compute resources based on current demand","Automatically backing up data","Scaling the physical data center"],correct:[1],type:"single",exp:"Auto-scaling adds/removes resources automatically to match workload demand, optimizing cost and performance." },
  { id:"cl3",domain:"Cloud Computing",q:"Which are major public cloud providers?",opts:["AWS","Google Cloud","Azure","Oracle DB","IBM Cloud"],correct:[0,1,2,4],type:"multi",exp:"AWS, Google Cloud, Azure, and IBM Cloud are major public cloud providers. Oracle DB is a database product." },
  { id:"cl4",domain:"Cloud Computing",q:"What is serverless computing?",opts:["Computing without any servers","A model where developers write code without managing server infrastructure","Computing on local machines only","A cloud service with guaranteed zero downtime"],correct:[1],type:"single",exp:"Serverless lets developers deploy code without provisioning servers; the provider handles all infrastructure." },
  { id:"cl5",domain:"Cloud Computing",q:"What does a Content Delivery Network (CDN) do?",opts:["Stores centralized databases","Distributes content from edge servers closest to users to reduce latency","Provides cloud storage","Manages domain name resolution"],correct:[1],type:"single",exp:"CDNs cache content at geographically distributed edge servers, reducing load times for users worldwide." },
  { id:"cl6",domain:"Cloud Computing",q:"Which are benefits of cloud computing?",opts:["Elasticity","Reduced capital expenditure","Pay-as-you-go pricing","Complete control over hardware","Global scalability"],correct:[0,1,2,4],type:"multi",exp:"Elasticity, reduced CapEx, pay-as-you-go, and global scalability are key cloud benefits." },
  { id:"cl7",domain:"Cloud Computing",q:"What is a Virtual Private Cloud (VPC)?",opts:["A cloud service only for private companies","An isolated virtual network within a public cloud provider","A type of VPN","A private data center"],correct:[1],type:"single",exp:"A VPC provides an isolated, logically separated network within a public cloud environment." },

  // ── AI & MACHINE LEARNING (6) ──
  { id:"ai1",domain:"AI & ML",q:"What is the difference between supervised and unsupervised learning?",opts:["Supervised uses labeled data; unsupervised finds patterns without labels","Supervised is faster; unsupervised is more accurate","Supervised is for images; unsupervised is for text","No practical difference"],correct:[0],type:"single",exp:"Supervised learning trains on labeled input-output pairs. Unsupervised discovers hidden patterns in unlabeled data." },
  { id:"ai2",domain:"AI & ML",q:"What is overfitting in machine learning?",opts:["The model performs well on training data but poorly on new data","The model is too simple to capture patterns","The model trains too slowly","The model uses too little data"],correct:[0],type:"single",exp:"Overfitting: model memorizes training data, failing to generalize to unseen examples." },
  { id:"ai3",domain:"AI & ML",q:"Which are common ML algorithms?",opts:["Linear Regression","Random Forest","Decision Tree","DNS","Neural Network"],correct:[0,1,2,4],type:"multi",exp:"Linear Regression, Random Forest, Decision Tree, and Neural Networks are ML algorithms. DNS is networking." },
  { id:"ai4",domain:"AI & ML",q:"What does a neural network's 'activation function' do?",opts:["Activates the neural network on startup","Introduces non-linearity, allowing the network to learn complex patterns","Selects which neurons to remove during training","Determines the learning rate"],correct:[1],type:"single",exp:"Activation functions (ReLU, sigmoid) introduce non-linearity, enabling networks to approximate complex functions." },
  { id:"ai5",domain:"AI & ML",q:"What is NLP (Natural Language Processing)?",opts:["A network protocol for language servers","A branch of AI focused on enabling machines to understand and generate human language","A programming language","A type of database query language"],correct:[1],type:"single",exp:"NLP enables computers to process, understand, and generate human language (text and speech)." },
  { id:"ai6",domain:"AI & ML",q:"Which metrics are commonly used to evaluate classification models?",opts:["Precision","Recall","F1-Score","Bandwidth","Accuracy"],correct:[0,1,2,4],type:"multi",exp:"Precision, Recall, F1-Score, and Accuracy are classification evaluation metrics. Bandwidth is networking." },
];

// ─────────────────────────────────────────────
// Domain config
// ─────────────────────────────────────────────
const DOMAINS = {
  "Programming":       { color:"#6366f1", emoji:"💻", bg:"rgba(99,102,241,0.12)"  },
  "Networking":        { color:"#0ea5e9", emoji:"🌐", bg:"rgba(14,165,233,0.12)"  },
  "Data Analysis":     { color:"#10b981", emoji:"📊", bg:"rgba(16,185,129,0.12)"  },
  "Databases":         { color:"#f59e0b", emoji:"🗄️",  bg:"rgba(245,158,11,0.12)" },
  "UI/UX":             { color:"#ec4899", emoji:"🎨", bg:"rgba(236,72,153,0.12)"  },
  "Technical English": { color:"#8b5cf6", emoji:"📝", bg:"rgba(139,92,246,0.12)" },
  "Logical Reasoning": { color:"#ef4444", emoji:"🧠", bg:"rgba(239,68,68,0.12)"  },
  "Cybersecurity":     { color:"#f97316", emoji:"🔐", bg:"rgba(249,115,22,0.12)" },
  "Cloud Computing":   { color:"#06b6d4", emoji:"☁️",  bg:"rgba(6,182,212,0.12)"  },
  "AI & ML":           { color:"#a855f7", emoji:"🤖", bg:"rgba(168,85,247,0.12)" },
};

// ─────────────────────────────────────────────
// Career paths
// ─────────────────────────────────────────────
const CAREERS = {
  "Software Engineer":         { domains:["Programming","Databases","Logical Reasoning"],          salary:"$70K–$150K", growth:"22%", icon:"💻", desc:"Build software systems, applications, and platforms.", color:"#6366f1" },
  "Data Scientist":            { domains:["Data Analysis","Programming","AI & ML"],                salary:"$95K–$165K", growth:"35%", icon:"📈", desc:"Extract insights from complex data using ML and statistics.", color:"#10b981" },
  "Network Engineer":          { domains:["Networking","Cybersecurity","Cloud Computing"],         salary:"$65K–$130K", growth:"5%",  icon:"🌐", desc:"Design, implement, and manage enterprise networks.", color:"#0ea5e9" },
  "Database Administrator":    { domains:["Databases","Programming","Logical Reasoning"],          salary:"$75K–$130K", growth:"9%",  icon:"🗄️",  desc:"Manage, optimize, and secure database systems.", color:"#f59e0b" },
  "UX Designer":               { domains:["UI/UX","Logical Reasoning","Technical English"],        salary:"$65K–$130K", growth:"16%", icon:"🎨", desc:"Create intuitive and accessible user experiences.", color:"#ec4899" },
  "Cybersecurity Analyst":     { domains:["Cybersecurity","Networking","Logical Reasoning"],       salary:"$80K–$155K", growth:"33%", icon:"🔐", desc:"Protect systems and data from digital threats.", color:"#f97316" },
  "Cloud Solutions Architect": { domains:["Cloud Computing","Networking","Programming"],           salary:"$110K–$200K",growth:"28%", icon:"☁️",  desc:"Design and oversee cloud infrastructure and deployments.", color:"#06b6d4" },
  "AI/ML Engineer":            { domains:["AI & ML","Programming","Data Analysis"],                salary:"$120K–$210K",growth:"40%", icon:"🤖", desc:"Build and deploy machine learning models and AI systems.", color:"#a855f7" },
  "Full Stack Developer":      { domains:["Programming","UI/UX","Databases"],                     salary:"$80K–$160K", growth:"25%", icon:"⚡", desc:"Build client-side and server-side web applications.", color:"#8b5cf6" },
  "Technical Writer":          { domains:["Technical English","UI/UX","Programming"],              salary:"$55K–$100K", growth:"7%",  icon:"✍️", desc:"Create technical documentation, guides, and API references.", color:"#94a3b8" },
  "Business Analyst":          { domains:["Data Analysis","Logical Reasoning","Technical English"],salary:"$60K–$120K", growth:"14%", icon:"📊", desc:"Bridge the gap between business needs and technical solutions.", color:"#6ee7b7" },
};

const COURSES = {
  "Programming":       [{ name:"CS50: Introduction to Programming",platform:"Harvard (edX)" },{ name:"Complete Python Bootcamp",platform:"Udemy" },{ name:"JavaScript: The Complete Guide",platform:"Udemy" }],
  "Networking":        [{ name:"CompTIA Network+ (N10-008)",platform:"Professor Messer" },{ name:"CCNA 200-301",platform:"Cisco / Udemy" },{ name:"AWS Networking Essentials",platform:"AWS Skill Builder" }],
  "Data Analysis":     [{ name:"Google Data Analytics Certificate",platform:"Coursera" },{ name:"Data Analysis with Python",platform:"freeCodeCamp" },{ name:"Power BI Masterclass",platform:"Udemy" }],
  "Databases":         [{ name:"SQL for Data Science",platform:"Coursera (UC Davis)" },{ name:"MongoDB University M001",platform:"MongoDB Atlas" },{ name:"Oracle SQL Fundamentals",platform:"Oracle Academy" }],
  "UI/UX":             [{ name:"Google UX Design Certificate",platform:"Coursera" },{ name:"UI/UX Design Bootcamp",platform:"Udemy" },{ name:"Figma Essentials",platform:"Figma Community" }],
  "Technical English": [{ name:"Technical Writing Fundamentals",platform:"Coursera" },{ name:"English for IT Professionals",platform:"Coursera" },{ name:"Grammarly for Developers",platform:"Grammarly" }],
  "Logical Reasoning": [{ name:"Critical Thinking & Problem Solving",platform:"Coursera (U of Michigan)" },{ name:"Logical Reasoning Masterclass",platform:"Udemy" },{ name:"GMAT Logical Reasoning Prep",platform:"Magoosh" }],
  "Cybersecurity":     [{ name:"CompTIA Security+ (SY0-701)",platform:"CompTIA" },{ name:"Google Cybersecurity Certificate",platform:"Coursera" },{ name:"Ethical Hacking Bootcamp",platform:"Udemy" }],
  "Cloud Computing":   [{ name:"AWS Solutions Architect Associate",platform:"AWS Training" },{ name:"Google Cloud Professional Certification",platform:"Google Cloud Skills" },{ name:"AZ-900: Azure Fundamentals",platform:"Microsoft Learn" }],
  "AI & ML":           [{ name:"Machine Learning Specialization",platform:"Coursera (Andrew Ng)" },{ name:"Deep Learning Specialization",platform:"Coursera (deeplearning.ai)" },{ name:"Practical Deep Learning for Coders",platform:"fast.ai" }],
};

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
function computeResults(answers) {
  const domainScores = {}, domainTotals = {};
  QUESTION_BANK.forEach(q => {
    if (!domainTotals[q.domain]) { domainTotals[q.domain] = 0; domainScores[q.domain] = 0; }
    domainTotals[q.domain]++;
    const ua = answers[q.id] || [];
    if (ua.length === q.correct.length && q.correct.every(c => ua.includes(c))) domainScores[q.domain]++;
  });
  const domainPct = {};
  Object.keys(domainTotals).forEach(d => { domainPct[d] = Math.round((domainScores[d] / domainTotals[d]) * 100); });
  const sorted = Object.entries(domainPct).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 3).map(([d]) => d);
  const weaknesses = sorted.slice(-3).map(([d]) => d);
  const correct = Object.values(domainScores).reduce((a, b) => a + b, 0);
  const overall = Math.round((correct / QUESTION_BANK.length) * 100);
  const careerScores = Object.entries(CAREERS).map(([name, info]) => {
    const avg = info.domains.reduce((s, d) => s + (domainPct[d] || 0), 0) / info.domains.length;
    return { name, ...info, matchScore: Math.round(avg) };
  }).sort((a, b) => b.matchScore - a.matchScore);
  return { domainPct, strengths, weaknesses, overall, careerScores, correct, total: QUESTION_BANK.length };
}

// ─────────────────────────────────────────────
// Radar Chart Component
// ─────────────────────────────────────────────
function RadarChart({ domainPct }) {
  const domains = Object.keys(domainPct);
  const n = domains.length;
  const cx = 200, cy = 200, r = 150;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, scale) => ({
    x: cx + r * scale * Math.cos(angle(i)),
    y: cy + r * scale * Math.sin(angle(i)),
  });

  const polyPoints = domains.map((d, i) => {
    const pct = (domainPct[d] || 0) / 100;
    const p = point(i, pct);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 400 400" style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }}>
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.08" />
        </radialGradient>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Grid levels */}
      {levels.map((lv, li) => {
        const pts = domains.map((_, i) => { const p = point(i, lv); return `${p.x},${p.y}`; }).join(" ");
        return <polygon key={li} points={pts} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />;
      })}
      {/* Spokes */}
      {domains.map((_, i) => {
        const p = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(99,102,241,0.2)" strokeWidth="1" />;
      })}
      {/* Data polygon */}
      <polygon points={polyPoints} fill="url(#radarGrad)" stroke="#8b5cf6" strokeWidth="2.5" filter="url(#radarGlow)" />
      {/* Data dots */}
      {domains.map((d, i) => {
        const pct = (domainPct[d] || 0) / 100;
        const p = point(i, pct);
        const cfg = DOMAINS[d];
        return (
          <g key={d}>
            <circle cx={p.x} cy={p.y} r="6" fill={cfg.color} stroke="#fff" strokeWidth="2" />
          </g>
        );
      })}
      {/* Labels */}
      {domains.map((d, i) => {
        const p = point(i, 1.22);
        const cfg = DOMAINS[d];
        return (
          <text key={d} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fontWeight="700" fill={cfg.color} fontFamily="system-ui, sans-serif">
            {cfg.emoji} {d.split(" ")[0]}
          </text>
        );
      })}
      {/* Center score */}
      <circle cx={cx} cy={cy} r="28" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="2" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// AI Analysis via Anthropic API
// ─────────────────────────────────────────────
async function fetchAIAnalysis(results) {
  const { domainPct, strengths, weaknesses, overall, careerScores } = results;
  const domainSummary = Object.entries(domainPct).map(([d, p]) => `${d}: ${p}%`).join(", ");
  const prompt = `You are a tech career counselor. A student completed a 70-question tech career diagnostic covering 10 domains.

Results:
- Overall score: ${overall}%
- Domain scores: ${domainSummary}
- Top strengths: ${strengths.join(", ")}
- Areas to improve: ${weaknesses.join(", ")}
- Top career match: ${careerScores[0]?.name} (${careerScores[0]?.matchScore}% match)

Write a personalized career intelligence analysis in JSON with these exact keys:
{
  "headline": "A powerful 1-sentence career headline (e.g. 'You show strong signals of a natural Systems Architect')",
  "profile": "2-3 sentence personalized profile summary based on their scores",
  "superpower": "Their biggest technical strength in one bold sentence",
  "blindspot": "Their key growth area explained encouragingly in one sentence",
  "careerInsight": "1-2 sentences on why their top career match fits them specifically",
  "roadmapStep1": "First actionable step to take this week (specific, practical)",
  "roadmapStep2": "Second actionable step for next month",
  "roadmapStep3": "Third actionable step for next 3 months",
  "motivationalClose": "One powerful closing sentence to inspire them"
}

Return ONLY valid JSON, no markdown, no preamble.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Icon Component
// ─────────────────────────────────────────────
function Icon({ type, size = 18, color = "currentColor" }) {
  const icons = {
    check: <polyline points="20 6 9 17 4 12" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    arrow: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    "arrow-left": <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></>,
    refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>,
    map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></>,
    brain: <path d="M12 2C8.1 2 5 5.1 5 9c0 2.4 1.1 4.5 2.8 5.9L7 20h10l-.8-5.1C17.9 13.5 19 11.4 19 9c0-3.9-3.1-7-7-7z" />,
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
  const [phase, setPhase]         = useState("intro");
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState({});
  const [revealed, setRevealed]   = useState({});
  const [showNav, setShowNav]     = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults]     = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [resultTab, setResultTab] = useState("overview");
  const containerRef = useRef();

  const q = QUESTION_BANK[current];
  const isRevealed = revealed[q?.id];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / QUESTION_BANK.length) * 100);

  // Persist progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem("flexexams_diagnostic_v2");
      if (saved) {
        const { answers: a, phase: p, current: c } = JSON.parse(saved);
        if (p === "quiz") { setAnswers(a || {}); setCurrent(c || 0); }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (phase === "quiz") {
      try { localStorage.setItem("flexexams_diagnostic_v2", JSON.stringify({ answers, phase, current })); } catch {}
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
        return { ...prev, [qid]: cur.includes(optIdx) ? cur.filter(x => x !== optIdx) : [...cur, optIdx] };
      });
    }
  }, [q, isRevealed]);

  const handleReveal = () => setRevealed(prev => ({ ...prev, [q.id]: true }));

  const goTo = (idx) => {
    setCurrent(idx);
    setShowNav(false);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finishExam = async () => {
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 2200));
    const res = computeResults(answers);
    setResults(res);
    setPhase("results");
    setAnalyzing(false);
    try { localStorage.removeItem("flexexams_diagnostic_v2"); } catch {}
    // Fetch AI analysis
    setAiLoading(true);
    try {
      const ai = await fetchAIAnalysis(res);
      setAiAnalysis(ai);
    } catch {}
    setAiLoading(false);
  };

  // ─────────────────── INTRO ───────────────────
  if (phase === "intro") return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px" }}>
      <style>{`
        @keyframes floatUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmerSlide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
        @keyframes pulseDot{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
        @keyframes rotateSlow{to{transform:rotate(360deg)}}
        .diag-intro{animation:floatUp 0.7s cubic-bezier(0.16,1,0.3,1) both}
        .domain-pill-intro{transition:all 0.22s;cursor:default}
        .domain-pill-intro:hover{transform:translateY(-3px) scale(1.04)}
        .start-cta{transition:all 0.25s}
        .start-cta:hover{transform:translateY(-3px);box-shadow:0 24px 60px rgba(99,102,241,0.4)!important}
        .stat-box{transition:all 0.2s}
        .stat-box:hover{transform:translateY(-2px)}
      `}</style>
      <div className="diag-intro" style={{ maxWidth:800, width:"100%", background:"var(--bg2)", border:"2px solid var(--border)", borderRadius:32, overflow:"hidden", boxShadow:"0 40px 100px rgba(0,0,0,0.18)" }}>

        {/* Hero banner */}
        <div style={{ background:"linear-gradient(135deg,#1e1b4b 0%,#4c1d95 35%,#6d28d9 60%,#be185d 100%)", padding:"52px 44px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.07), transparent 65%)", pointerEvents:"none" }} />
          {/* Decorative orbits */}
          <div style={{ position:"absolute", top:-60, right:-60, width:250, height:250, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.06)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", top:-30, right:-30, width:160, height:160, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.08)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:-40, left:-40, width:200, height:200, borderRadius:"50%", border:"1.5px solid rgba(255,255,255,0.05)", pointerEvents:"none" }} />

          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.14)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.22)", borderRadius:100, padding:"6px 18px", marginBottom:22, fontSize:11.5, fontWeight:800, color:"#e9d5ff", letterSpacing:"0.14em", textTransform:"uppercase" }}>
              ✦ Career Intelligence Assessment v2
            </div>
            <h1 style={{ fontSize:"clamp(28px,5vw,48px)", fontWeight:900, color:"#fff", letterSpacing:"-2px", lineHeight:1.08, marginBottom:16 }}>
              Discover Your<br /><span style={{ background:"linear-gradient(135deg,#c4b5fd,#f9a8d4)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Tech Career Path</span>
            </h1>
            <p style={{ fontSize:16, color:"rgba(255,255,255,0.80)", lineHeight:1.72, maxWidth:520 }}>
              70 questions across <strong style={{ color:"#c4b5fd" }}>10 domains</strong>. Receive an AI-powered skill map, career intelligence report, personalized roadmap, and curated study plan — completely free.
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:"36px 44px" }}>
          {/* Stats */}
          <div style={{ display:"flex", gap:12, marginBottom:32, flexWrap:"wrap" }}>
            {[
              { v:"70",   l:"Questions",      i:"📋" },
              { v:"10",   l:"Domains",         i:"🎯" },
              { v:"11+",  l:"Career Paths",    i:"💼" },
              { v:"No timer", l:"Relaxed",     i:"⏳" },
              { v:"AI",   l:"Analysis",        i:"🤖" },
            ].map(s => (
              <div key={s.l} className="stat-box" style={{ flex:"1 1 90px", background:"var(--bg3)", border:"1.5px solid var(--border)", borderRadius:16, padding:"16px 12px", textAlign:"center", minWidth:90 }}>
                <div style={{ fontSize:22, marginBottom:5 }}>{s.i}</div>
                <div style={{ fontSize:20, fontWeight:900, color:"var(--text)", letterSpacing:"-0.5px" }}>{s.v}</div>
                <div style={{ fontSize:10.5, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.09em" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Domains */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:11.5, fontWeight:700, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>10 Covered Domains</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:9 }}>
              {Object.entries(DOMAINS).map(([name, cfg]) => (
                <div key={name} className="domain-pill-intro" style={{ display:"flex", alignItems:"center", gap:6, background:cfg.bg, border:`1.5px solid ${cfg.color}35`, borderRadius:100, padding:"6px 13px", fontSize:12.5, fontWeight:700, color:cfg.color }}>
                  <span>{cfg.emoji}</span>{name}
                </div>
              ))}
            </div>
          </div>

          {/* What you get */}
          <div style={{ background:"linear-gradient(135deg, rgba(99,102,241,0.07), rgba(168,85,247,0.05))", border:"1.5px solid rgba(99,102,241,0.2)", borderRadius:18, padding:"20px 24px", marginBottom:28 }}>
            <div style={{ fontSize:11.5, fontWeight:800, color:"#8b5cf6", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>🎁 What You'll Receive</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:9 }}>
              {[
                "📊 10-domain skill breakdown",
                "🤖 AI-powered career analysis",
                "🏆 Top strength identification",
                "💼 11 career path matches",
                "💰 Salary ranges & growth data",
                "🗺️ Personalized 3-step roadmap",
                "📚 Curated certification paths",
                "🎓 Course recommendations",
                "📡 Radar skill visualization",
              ].map(item => (
                <div key={item} style={{ fontSize:13, color:"var(--text2)", display:"flex", alignItems:"center", gap:7, fontWeight:500 }}>{item}</div>
              ))}
            </div>
          </div>

          <button className="start-cta" onClick={() => setPhase("quiz")}
            style={{ width:"100%", padding:"18px", borderRadius:16, background:"linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7)", color:"#fff", fontSize:17, fontWeight:900, border:"none", cursor:"pointer", letterSpacing:"-0.3px", boxShadow:"0 12px 36px rgba(99,102,241,0.35)", display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
            Begin Assessment <Icon type="arrow" size={20} color="#fff" />
          </button>
          <div style={{ textAlign:"center", marginTop:13, fontSize:12.5, color:"var(--text3)", fontWeight:500 }}>
            No account required · Progress auto-saved · Takes ~25 minutes
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────── ANALYZING ───────────────────
  if (analyzing) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:28, padding:40 }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes analyzeBar{from{width:0}to{width:100%}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .analyze-step{animation:fadeIn 0.6s ease both}
      `}</style>
      {/* Animated rings */}
      <div style={{ position:"relative", width:100, height:100 }}>
        <div style={{ position:"absolute", inset:0, border:"3px solid rgba(99,102,241,0.15)", borderRadius:"50%" }} />
        <div style={{ position:"absolute", inset:0, border:"3px solid transparent", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
        <div style={{ position:"absolute", inset:12, border:"3px solid transparent", borderTopColor:"#a855f7", borderRadius:"50%", animation:"spin 1.4s linear infinite reverse" }} />
        <div style={{ position:"absolute", inset:24, border:"3px solid transparent", borderTopColor:"#ec4899", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🧠</div>
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:26, fontWeight:900, color:"var(--text)", marginBottom:10, letterSpacing:"-0.5px" }}>Analyzing Your Profile</div>
        <div style={{ fontSize:14, color:"var(--text3)", fontWeight:500 }}>Building your personalized career intelligence report...</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:280 }}>
        {[
          { label:"Scoring 10 domains", delay:"0s" },
          { label:"Mapping career alignments", delay:"0.5s" },
          { label:"Generating personalized roadmap", delay:"1s" },
          { label:"Preparing AI analysis", delay:"1.5s" },
        ].map((s, i) => (
          <div key={s.label} className="analyze-step" style={{ animationDelay:s.delay, display:"flex", alignItems:"center", gap:10, background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 16px", fontSize:13, fontWeight:600, color:"var(--text2)" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1", animation:`spin 1s ${s.delay} linear infinite` }} />
            {s.label}
          </div>
        ))}
      </div>
      <div style={{ width:280, height:6, background:"var(--border)", borderRadius:100, overflow:"hidden" }}>
        <div style={{ height:"100%", background:"linear-gradient(90deg,#6366f1,#a855f7,#ec4899)", borderRadius:100, animation:"analyzeBar 2s cubic-bezier(0.16,1,0.3,1) both" }} />
      </div>
    </div>
  );

  // ─────────────────── RESULTS ───────────────────
  if (phase === "results" && results) {
    const { domainPct, strengths, weaknesses, overall, careerScores, correct, total } = results;
    const topCareer = careerScores[0];
    const levelLabel = overall >= 80 ? "Advanced" : overall >= 60 ? "Intermediate" : overall >= 40 ? "Foundation" : "Beginner";
    const levelColors = { Advanced:"#10b981", Intermediate:"#6366f1", Foundation:"#f59e0b", Beginner:"#ef4444" };
    const lc = levelColors[levelLabel];

    const tabs = [
      { id:"overview",  label:"📊 Overview"     },
      { id:"ai",        label:"🤖 AI Analysis"   },
      { id:"careers",   label:"💼 Career Paths"  },
      { id:"roadmap",   label:"🗺️ Roadmap"       },
      { id:"courses",   label:"🎓 Courses"       },
    ];

    return (
      <div style={{ minHeight:"100vh", background:"var(--bg)", padding:"40px clamp(16px,4vw,60px)" }}>
        <style>{`
          @keyframes floatUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
          @keyframes fillBar{from{width:0}to{width:var(--target-w)}}
          @keyframes countUp{from{opacity:0}to{opacity:1}}
          .res-card{animation:floatUp 0.5s ease both}
          .res-tab{transition:all 0.2s;cursor:pointer;white-space:nowrap}
          .career-card{transition:all 0.25s;cursor:default}
          .career-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,0.14)!important}
          .action-btn{transition:all 0.2s}
          .action-btn:hover{transform:translateY(-2px)}
          .animated-bar{animation:fillBar 1.2s cubic-bezier(0.16,1,0.3,1) both}
        `}</style>
        <div style={{ maxWidth:960, margin:"0 auto" }}>

          {/* Results Header */}
          <div className="res-card" style={{ background:"linear-gradient(135deg,#1e1b4b 0%,#4c1d95 40%,#be185d 100%)", borderRadius:28, padding:"44px 48px", marginBottom:24, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 85% 20%, rgba(255,255,255,0.09), transparent 60%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:-50, right:-50, width:220, height:220, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.06)", pointerEvents:"none" }} />
            <div style={{ position:"relative", zIndex:1, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:24 }}>
              <div style={{ flex:1, minWidth:280 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.65)", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:10 }}>Career Intelligence Report</div>
                <h1 style={{ fontSize:"clamp(22px,4vw,38px)", fontWeight:900, color:"#fff", letterSpacing:"-1px", marginBottom:10, lineHeight:1.1 }}>Your Results Are In! 🎉</h1>
                <p style={{ fontSize:14.5, color:"rgba(255,255,255,0.82)", lineHeight:1.65, marginBottom:18 }}>
                  You answered <strong style={{ color:"#c4b5fd" }}>{correct} / {total}</strong> correctly · Level: <strong style={{ color:lc }}>{levelLabel}</strong>
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {strengths.map(s => (
                    <div key={s} style={{ background:"rgba(255,255,255,0.16)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.28)", borderRadius:100, padding:"5px 14px", fontSize:12, fontWeight:700, color:"#fff" }}>
                      {DOMAINS[s].emoji} {s}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <div style={{ width:110, height:110, borderRadius:"50%", background:"rgba(255,255,255,0.12)", border:"3px solid rgba(255,255,255,0.3)", backdropFilter:"blur(10px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ fontSize:32, fontWeight:900, color:"#fff", letterSpacing:"-2px", lineHeight:1 }}>{overall}%</div>
                  <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Score</div>
                </div>
                <div style={{ background:lc, color:"#fff", fontSize:12, fontWeight:800, borderRadius:100, padding:"5px 16px", letterSpacing:"0.05em" }}>{levelLabel}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="res-card" style={{ animationDelay:"0.05s", display:"flex", gap:6, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
            {tabs.map(t => (
              <button key={t.id} className="res-tab" onClick={() => setResultTab(t.id)}
                style={{ padding:"10px 18px", borderRadius:12, border:`2px solid ${resultTab === t.id ? "#6366f1" : "var(--border)"}`, background:resultTab === t.id ? "rgba(99,102,241,0.1)" : "var(--bg2)", color:resultTab === t.id ? "#6366f1" : "var(--text2)", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: OVERVIEW ── */}
          {resultTab === "overview" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:16 }}>
              {/* Domain bars */}
              <div className="res-card" style={{ animationDelay:"0.1s", background:"var(--bg2)", border:"2px solid var(--border)", borderRadius:22, padding:"28px" }}>
                <div style={{ fontSize:12, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:22 }}>Domain Breakdown</div>
                {Object.entries(domainPct).sort((a, b) => b[1] - a[1]).map(([domain, pct], i) => {
                  const cfg = DOMAINS[domain];
                  return (
                    <div key={domain} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ fontSize:16 }}>{cfg.emoji}</span>
                          <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{domain}</span>
                          {strengths.includes(domain) && <span style={{ fontSize:9.5, fontWeight:800, color:cfg.color, background:cfg.bg, borderRadius:100, padding:"2px 7px" }}>★</span>}
                          {weaknesses.includes(domain) && <span style={{ fontSize:9.5, fontWeight:800, color:"#ef4444", background:"rgba(239,68,68,0.1)", borderRadius:100, padding:"2px 7px" }}>↑</span>}
                        </div>
                        <span style={{ fontSize:14, fontWeight:900, color:cfg.color }}>{pct}%</span>
                      </div>
                      <div style={{ height:8, background:"var(--bg3)", borderRadius:100, overflow:"hidden" }}>
                        <div className="animated-bar" style={{ "--target-w":`${pct}%`, height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${cfg.color},${cfg.color}99)`, borderRadius:100, animationDelay:`${i * 0.07}s` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Radar chart */}
              <div className="res-card" style={{ animationDelay:"0.15s", background:"var(--bg2)", border:"2px solid var(--border)", borderRadius:22, padding:"28px", display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ fontSize:12, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:16 }}>Skill Radar</div>
                <RadarChart domainPct={domainPct} />
                <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap", justifyContent:"center" }}>
                  {[{ label:"Strength", color:"#10b981" }, { label:"Growth Area", color:"#ef4444" }].map(l => (
                    <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11.5, fontWeight:600, color:"var(--text3)" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:l.color }} />{l.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top career preview */}
              <div className="res-card" style={{ animationDelay:"0.2s", gridColumn:"1 / -1", background:`linear-gradient(135deg, ${topCareer.color}12, ${topCareer.color}06)`, border:`2px solid ${topCareer.color}40`, borderRadius:22, padding:"28px" }}>
                <div style={{ fontSize:11.5, fontWeight:800, color:topCareer.color, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14 }}>🏆 Top Career Match</div>
                <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
                  <div style={{ fontSize:52, flexShrink:0 }}>{topCareer.icon}</div>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontSize:24, fontWeight:900, color:"var(--text)", marginBottom:6, letterSpacing:"-0.5px" }}>{topCareer.name}</div>
                    <div style={{ fontSize:14, color:"var(--text2)", marginBottom:12, lineHeight:1.6 }}>{topCareer.desc}</div>
                    <div style={{ display:"flex", gap:18, fontSize:13, flexWrap:"wrap" }}>
                      <span style={{ color:"#10b981", fontWeight:700 }}>💰 {topCareer.salary}</span>
                      <span style={{ color:topCareer.color, fontWeight:700 }}>📈 {topCareer.growth} growth</span>
                      <span style={{ color:"var(--text3)", fontWeight:600 }}>Match: <strong style={{ color:topCareer.color }}>{topCareer.matchScore}%</strong></span>
                    </div>
                  </div>
                  {/* Mini match bar */}
                  <div style={{ flexShrink:0, textAlign:"center" }}>
                    <div style={{ width:80, height:80, borderRadius:"50%", border:`5px solid ${topCareer.color}40`, display:"flex", alignItems:"center", justifyContent:"center", background:topCareer.color + "15", position:"relative" }}>
                      <svg style={{ position:"absolute", inset:0 }} viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="35" fill="none" stroke={topCareer.color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${topCareer.matchScore * 2.2} 220`} transform="rotate(-90 40 40)" opacity="0.85" />
                      </svg>
                      <span style={{ fontSize:16, fontWeight:900, color:topCareer.color }}>{topCareer.matchScore}%</span>
                    </div>
                    <div style={{ fontSize:10.5, fontWeight:700, color:"var(--text3)", marginTop:7, textTransform:"uppercase", letterSpacing:"0.07em" }}>Match</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: AI ANALYSIS ── */}
          {resultTab === "ai" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {aiLoading && (
                <div className="res-card" style={{ background:"var(--bg2)", border:"2px solid var(--border)", borderRadius:22, padding:"48px", textAlign:"center" }}>
                  <div style={{ fontSize:36, marginBottom:16 }}>🤖</div>
                  <div style={{ fontSize:18, fontWeight:700, color:"var(--text)", marginBottom:8 }}>AI is analyzing your results...</div>
                  <div style={{ fontSize:13, color:"var(--text3)" }}>Generating personalized career intelligence</div>
                  <div style={{ width:200, height:4, background:"var(--border)", borderRadius:100, margin:"20px auto 0", overflow:"hidden" }}>
                    <div style={{ height:"100%", background:"linear-gradient(90deg,#6366f1,#a855f7)", borderRadius:100, animation:"analyzeBar 2s ease infinite alternate", width:"60%" }} />
                  </div>
                </div>
              )}
              {!aiLoading && aiAnalysis && (
                <>
                  {/* Headline */}
                  <div className="res-card" style={{ background:"linear-gradient(135deg,#1e1b4b,#4c1d95)", borderRadius:22, padding:"32px 36px" }}>
                    <div style={{ fontSize:11, fontWeight:800, color:"rgba(196,181,253,0.8)", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:12 }}>🤖 AI Career Intelligence</div>
                    <div style={{ fontSize:"clamp(18px,3vw,26px)", fontWeight:900, color:"#fff", lineHeight:1.3, letterSpacing:"-0.5px" }}>"{aiAnalysis.headline}"</div>
                  </div>

                  {/* Profile + Superpower */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14 }}>
                    <div className="res-card" style={{ animationDelay:"0.1s", background:"var(--bg2)", border:"2px solid var(--border)", borderRadius:20, padding:"24px" }}>
                      <div style={{ fontSize:11, fontWeight:800, color:"#6366f1", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>📊 Your Profile</div>
                      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.75, margin:0 }}>{aiAnalysis.profile}</p>
                    </div>
                    <div className="res-card" style={{ animationDelay:"0.15s", background:"rgba(16,185,129,0.06)", border:"2px solid rgba(16,185,129,0.25)", borderRadius:20, padding:"24px" }}>
                      <div style={{ fontSize:11, fontWeight:800, color:"#10b981", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>⚡ Your Superpower</div>
                      <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.75, fontWeight:600, margin:0 }}>{aiAnalysis.superpower}</p>
                    </div>
                    <div className="res-card" style={{ animationDelay:"0.2s", background:"rgba(245,158,11,0.06)", border:"2px solid rgba(245,158,11,0.25)", borderRadius:20, padding:"24px" }}>
                      <div style={{ fontSize:11, fontWeight:800, color:"#f59e0b", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>🎯 Growth Area</div>
                      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.75, margin:0 }}>{aiAnalysis.blindspot}</p>
                    </div>
                    <div className="res-card" style={{ animationDelay:"0.25s", background:`rgba(${topCareer.color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0.07)`, border:`2px solid ${topCareer.color}30`, borderRadius:20, padding:"24px" }}>
                      <div style={{ fontSize:11, fontWeight:800, color:topCareer.color, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>💼 Career Insight</div>
                      <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.75, margin:0 }}>{aiAnalysis.careerInsight}</p>
                    </div>
                  </div>

                  {/* Motivational close */}
                  <div className="res-card" style={{ animationDelay:"0.3s", background:"linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.06))", border:"2px solid rgba(99,102,241,0.2)", borderRadius:20, padding:"24px 28px", textAlign:"center" }}>
                    <div style={{ fontSize:28, marginBottom:12 }}>🚀</div>
                    <p style={{ fontSize:16, fontWeight:700, color:"var(--text)", lineHeight:1.7, margin:0, fontStyle:"italic" }}>"{aiAnalysis.motivationalClose}"</p>
                  </div>
                </>
              )}
              {!aiLoading && !aiAnalysis && (
                <div className="res-card" style={{ background:"var(--bg2)", border:"2px solid var(--border)", borderRadius:22, padding:"40px", textAlign:"center", color:"var(--text3)" }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
                  <div style={{ fontSize:15, fontWeight:600 }}>AI analysis unavailable. Check the Overview tab for your detailed results.</div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: CAREERS ── */}
          {resultTab === "careers" && (
            <div style={{ display:"grid", gap:14 }}>
              {careerScores.map((career, i) => (
                <div key={career.name} className="career-card res-card" style={{ animationDelay:`${i * 0.05}s`, background:"var(--bg2)", border:i === 0 ? `2px solid ${career.color}` : "2px solid var(--border)", borderRadius:20, padding:"22px 26px", display:"flex", gap:18, alignItems:"center", flexWrap:"wrap", position:"relative", overflow:"hidden", boxShadow:i === 0 ? `0 6px 28px ${career.color}22` : "none" }}>
                  {i === 0 && <div style={{ position:"absolute", top:0, right:0, background:career.color, color:"#fff", fontSize:10, fontWeight:900, padding:"4px 14px", borderRadius:"0 18px 0 12px", letterSpacing:"0.07em" }}>BEST MATCH</div>}
                  <div style={{ fontSize:40, flexShrink:0 }}>{career.icon}</div>
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5, flexWrap:"wrap" }}>
                      <span style={{ fontSize:17, fontWeight:900, color:"var(--text)", letterSpacing:"-0.3px" }}>{career.name}</span>
                      <span style={{ fontSize:11, fontWeight:800, color:career.color, background:`${career.color}18`, borderRadius:100, padding:"2px 10px" }}>#{i + 1} Match</span>
                    </div>
                    <div style={{ fontSize:13, color:"var(--text2)", marginBottom:10, lineHeight:1.5 }}>{career.desc}</div>
                    <div style={{ display:"flex", gap:14, fontSize:12.5, flexWrap:"wrap" }}>
                      <span style={{ color:"#10b981", fontWeight:700 }}>💰 {career.salary}</span>
                      <span style={{ color:career.color, fontWeight:700 }}>📈 {career.growth} growth</span>
                    </div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:"center" }}>
                    <div style={{ position:"relative", width:64, height:64 }}>
                      <svg viewBox="0 0 64 64" style={{ position:"absolute", inset:0 }}>
                        <circle cx="32" cy="32" r="28" fill="none" stroke={`${career.color}22`} strokeWidth="5" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke={career.color} strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${career.matchScore * 1.76} 176`} transform="rotate(-90 32 32)" />
                      </svg>
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:career.color }}>{career.matchScore}%</div>
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color:"var(--text3)", marginTop:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>Match</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TAB: ROADMAP ── */}
          {resultTab === "roadmap" && (
            <div>
              {/* AI roadmap if available */}
              {aiAnalysis && (
                <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:24 }}>
                  <div className="res-card" style={{ fontSize:12, fontWeight:800, color:"#a855f7", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>🤖 AI-Personalized Roadmap</div>
                  {[
                    { step:1, label:"This Week",        content:aiAnalysis.roadmapStep1, color:"#6366f1", icon:"🎯" },
                    { step:2, label:"Next Month",       content:aiAnalysis.roadmapStep2, color:"#10b981", icon:"📈" },
                    { step:3, label:"Next 3 Months",    content:aiAnalysis.roadmapStep3, color:"#a855f7", icon:"🚀" },
                  ].map((s, i) => (
                    <div key={s.step} className="res-card" style={{ animationDelay:`${i * 0.1}s`, display:"flex", gap:16, alignItems:"flex-start" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                        <div style={{ width:44, height:44, borderRadius:"50%", background:`${s.color}18`, border:`2px solid ${s.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{s.icon}</div>
                        {i < 2 && <div style={{ width:2, height:36, background:`${s.color}30`, marginTop:6 }} />}
                      </div>
                      <div style={{ flex:1, background:"var(--bg2)", border:"2px solid var(--border)", borderRadius:18, padding:"18px 22px" }}>
                        <div style={{ fontSize:11, fontWeight:800, color:s.color, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:7 }}>Step {s.step} · {s.label}</div>
                        <div style={{ fontSize:14, color:"var(--text)", lineHeight:1.7, fontWeight:500 }}>{s.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Domain-level roadmap */}
              <div className="res-card" style={{ background:"var(--bg2)", border:"2px solid var(--border)", borderRadius:22, padding:"28px" }}>
                <div style={{ fontSize:12, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:20 }}>📚 Focus Areas by Priority</div>
                {Object.entries(domainPct).sort((a, b) => a[1] - b[1]).map(([domain, pct], i) => {
                  const cfg = DOMAINS[domain];
                  const priority = pct < 40 ? "High Priority" : pct < 65 ? "Medium Priority" : "Maintain";
                  const pColors = { "High Priority":"#ef4444", "Medium Priority":"#f59e0b", "Maintain":"#10b981" };
                  return (
                    <div key={domain} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:i < Object.keys(domainPct).length - 1 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize:20 }}>{cfg.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{domain}</span>
                          <span style={{ fontSize:11, fontWeight:800, color:pColors[priority], background:`${pColors[priority]}18`, borderRadius:100, padding:"2px 10px" }}>{priority}</span>
                        </div>
                        <div style={{ height:6, background:"var(--bg3)", borderRadius:100, marginTop:7, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:cfg.color, borderRadius:100 }} />
                        </div>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:cfg.color, minWidth:38, textAlign:"right" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB: COURSES ── */}
          {resultTab === "courses" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {/* Strengths first */}
              {strengths.map((domain, di) => (
                <div key={domain} className="res-card" style={{ animationDelay:`${di * 0.08}s` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                    <span style={{ fontSize:22 }}>{DOMAINS[domain].emoji}</span>
                    <span style={{ fontSize:16, fontWeight:800, color:"var(--text)" }}>{domain}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:DOMAINS[domain].color, background:DOMAINS[domain].bg, borderRadius:100, padding:"3px 10px" }}>★ Strength</span>
                  </div>
                  <div style={{ display:"grid", gap:10 }}>
                    {(COURSES[domain] || []).map((course, i) => (
                      <div key={i} style={{ background:"var(--bg2)", border:"1.5px solid var(--border)", borderRadius:14, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:3 }}>{course.name}</div>
                          <div style={{ fontSize:12, color:"var(--text3)", fontWeight:600 }}>🎓 {course.platform}</div>
                        </div>
                        <div style={{ flexShrink:0, fontSize:12, fontWeight:700, color:DOMAINS[domain].color, background:DOMAINS[domain].bg, borderRadius:100, padding:"5px 12px", border:`1px solid ${DOMAINS[domain].color}30`, whiteSpace:"nowrap" }}>
                          View →
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {/* Weaknesses */}
              {weaknesses.map((domain, di) => (
                <div key={domain} className="res-card" style={{ animationDelay:`${(strengths.length + di) * 0.08}s` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                    <span style={{ fontSize:22 }}>{DOMAINS[domain].emoji}</span>
                    <span style={{ fontSize:16, fontWeight:800, color:"var(--text)" }}>{domain}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"#ef4444", background:"rgba(239,68,68,0.1)", borderRadius:100, padding:"3px 10px" }}>↑ Growth Area</span>
                  </div>
                  <div style={{ display:"grid", gap:10 }}>
                    {(COURSES[domain] || []).map((course, i) => (
                      <div key={i} style={{ background:"var(--bg2)", border:"1.5px solid var(--border)", borderRadius:14, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:3 }}>{course.name}</div>
                          <div style={{ fontSize:12, color:"var(--text3)", fontWeight:600 }}>🎓 {course.platform}</div>
                        </div>
                        <div style={{ flexShrink:0, fontSize:12, fontWeight:700, color:"#ef4444", background:"rgba(239,68,68,0.08)", borderRadius:100, padding:"5px 12px", border:"1px solid rgba(239,68,68,0.25)", whiteSpace:"nowrap" }}>
                          View →
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="res-card" style={{ animationDelay:"0.35s", display:"flex", gap:12, marginTop:24, flexWrap:"wrap" }}>
            <button className="action-btn" onClick={() => { setPhase("intro"); setCurrent(0); setAnswers({}); setRevealed({}); setResults(null); setAiAnalysis(null); setResultTab("overview"); }}
              style={{ flex:1, padding:"14px", borderRadius:14, border:"2px solid var(--border)", background:"var(--bg2)", color:"var(--text)", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8, minWidth:140 }}>
              <Icon type="refresh" size={15} color="currentColor" /> Retake Assessment
            </button>
            <button className="action-btn" onClick={() => setPage && setPage("exams")}
              style={{ flex:2, padding:"14px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8, minWidth:180 }}>
              <Icon type="briefcase" size={15} color="#fff" /> Explore Recommended Exams →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────── QUIZ ───────────────────
  const userAns = answers[q.id] || [];
  const domainCfg = DOMAINS[q.domain] || { color:"#6366f1", emoji:"📋", bg:"rgba(99,102,241,0.1)" };
  const domainCounts = {};
  QUESTION_BANK.forEach(qq => { domainCounts[qq.domain] = (domainCounts[qq.domain] || 0) + 1; });
  const domainAnswered = {};
  Object.keys(answers).forEach(id => {
    const qq = QUESTION_BANK.find(x => x.id === id);
    if (qq) domainAnswered[qq.domain] = (domainAnswered[qq.domain] || 0) + 1;
  });

  return (
    <div ref={containerRef} style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes fadeQ{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes floatUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .quiz-q{animation:fadeQ 0.22s ease both}
        .opt-btn{transition:all 0.18s;cursor:pointer;text-align:left}
        .opt-btn:hover{transform:translateX(5px)}
        .nav-q{transition:all 0.15s;cursor:pointer;font-weight:700;font-size:12px;border-radius:8px}
        .nav-q:hover{transform:scale(1.12)}
        .quiz-action-btn{transition:all 0.2s}
        .quiz-action-btn:hover{transform:translateY(-2px)}
      `}</style>

      {/* Top Bar */}
      <div style={{ position:"sticky", top:68, zIndex:50, background:"var(--bg-glass)", backdropFilter:"var(--nav-blur)", borderBottom:"1.5px solid var(--border)", padding:"12px clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:10, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ background:domainCfg.bg, border:`1.5px solid ${domainCfg.color}40`, borderRadius:10, padding:"5px 12px", display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:16 }}>{domainCfg.emoji}</span>
                <span style={{ fontSize:12, fontWeight:700, color:domainCfg.color, textTransform:"uppercase", letterSpacing:"0.07em" }}>{q.domain}</span>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"var(--text3)" }}>{current + 1} / {QUESTION_BANK.length}</span>
              <button onClick={() => setShowNav(v => !v)} style={{ padding:"6px 13px", borderRadius:10, border:"1.5px solid var(--border)", background:"var(--bg2)", color:"var(--text2)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {showNav ? "✕ Close" : "⊞ Navigate"}
              </button>
              {answeredCount >= Math.floor(QUESTION_BANK.length * 0.7) && (
                <button onClick={finishExam} style={{ padding:"7px 16px", borderRadius:10, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"#fff", border:"none", fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit" }}>
                  Get Results →
                </button>
              )}
            </div>
          </div>
          {/* Progress */}
          <div style={{ height:6, background:"var(--bg3)", borderRadius:100, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${domainCfg.color},#8b5cf6)`, borderRadius:100, transition:"width 0.4s ease" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:5, fontSize:11, color:"var(--text3)", fontWeight:600 }}>
            <span>{answeredCount} answered · {progress}%</span>
            <span>{QUESTION_BANK.length - answeredCount} remaining</span>
          </div>
        </div>
      </div>

      {/* Nav panel */}
      {showNav && (
        <div style={{ background:"var(--bg2)", border:"1.5px solid var(--border)", margin:"8px clamp(16px,4vw,48px)", borderRadius:18, padding:"20px", maxWidth:860, width:"calc(100% - clamp(32px,8vw,96px))", marginLeft:"auto", marginRight:"auto" }}>
          {Object.entries(DOMAINS).map(([domain, cfg]) => {
            const qs = QUESTION_BANK.filter(x => x.domain === domain);
            const ans = qs.filter(x => answers[x.id]).length;
            return (
              <div key={domain} style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:cfg.color, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                  {cfg.emoji} {domain} <span style={{ color:"var(--text3)", fontWeight:600 }}>({ans}/{qs.length})</span>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {qs.map(qq => {
                    const idx = QUESTION_BANK.findIndex(x => x.id === qq.id);
                    const isAns = !!answers[qq.id], isRev = !!revealed[qq.id], isCur = idx === current;
                    return (
                      <button key={qq.id} className="nav-q" onClick={() => goTo(idx)}
                        style={{ width:32, height:32, border:`2px solid ${isCur ? cfg.color : isAns ? "var(--border)" : "var(--border)"}`, background:isCur ? cfg.color : isRev ? `${cfg.color}25` : isAns ? "var(--accent-soft)" : "var(--bg3)", color:isCur ? "#fff" : isRev ? cfg.color : "var(--text2)", fontFamily:"inherit" }}>
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

      {/* Question */}
      <div style={{ flex:1, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"32px clamp(16px,4vw,48px) 80px" }}>
        <div key={q.id} className="quiz-q" style={{ width:"100%", maxWidth:780 }}>

          {/* Domain badge */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:22 }}>
            <div style={{ background:domainCfg.bg, border:`1.5px solid ${domainCfg.color}40`, borderRadius:14, padding:"9px 16px", display:"flex", alignItems:"center", gap:9 }}>
              <span style={{ fontSize:18 }}>{domainCfg.emoji}</span>
              <span style={{ fontSize:13, fontWeight:800, color:domainCfg.color }}>{q.domain}</span>
            </div>
            {q.type === "multi" && (
              <div style={{ background:"rgba(245,158,11,0.1)", border:"1.5px solid rgba(245,158,11,0.35)", borderRadius:100, padding:"5px 13px", fontSize:11.5, fontWeight:700, color:"#f59e0b" }}>
                ✓ Select all that apply
              </div>
            )}
          </div>

          {/* Question */}
          <div style={{ fontSize:"clamp(17px,2.5vw,21px)", fontWeight:800, color:"var(--text)", lineHeight:1.55, marginBottom:26, padding:"0 4px", letterSpacing:"-0.3px" }}>
            {q.q}
          </div>

          {/* Options */}
          <div style={{ display:"flex", flexDirection:"column", gap:11, marginBottom:26 }}>
            {q.opts.map((opt, idx) => {
              const isSelected = userAns.includes(idx);
              const isCorrect = q.correct.includes(idx);
              let bg = "var(--bg2)", border = "2px solid var(--border)", color = "var(--text)";
              if (isRevealed) {
                if (isCorrect) { bg = "rgba(16,185,129,0.09)"; border = "2px solid #10b981"; color = "#065f46"; }
                else if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.07)"; border = "2px solid #ef4444"; color = "#991b1b"; }
              } else if (isSelected) {
                bg = domainCfg.bg; border = `2px solid ${domainCfg.color}`; color = domainCfg.color;
              }
              return (
                <button key={idx} className="opt-btn" onClick={() => handleSelect(idx)}
                  style={{ background:bg, border, borderRadius:16, padding:"15px 20px", color, fontSize:14.5, fontFamily:"inherit", display:"flex", alignItems:"center", gap:13 }}>
                  <div style={{ width:28, height:28, borderRadius:q.type === "multi" ? 8 : "50%", border:`2px solid ${isRevealed ? (isCorrect ? "#10b981" : isSelected ? "#ef4444" : "var(--border)") : isSelected ? domainCfg.color : "var(--border)"}`, background:isRevealed ? (isCorrect ? "#10b981" : isSelected ? "#ef4444" : "transparent") : isSelected ? domainCfg.color : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                    {isRevealed && isCorrect && <Icon type="check" size={13} color="#fff" />}
                    {isRevealed && isSelected && !isCorrect && <Icon type="x" size={13} color="#fff" />}
                    {!isRevealed && isSelected && <div style={{ width:10, height:10, borderRadius:"50%", background:"#fff" }} />}
                  </div>
                  <span style={{ flex:1, fontWeight:isSelected || (isRevealed && isCorrect) ? 600 : 400 }}>{String.fromCharCode(65 + idx)}. {opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {isRevealed && (
            <div style={{ background:"rgba(16,185,129,0.07)", border:"2px solid rgba(16,185,129,0.28)", borderRadius:16, padding:"18px 22px", marginBottom:22 }}>
              <div style={{ fontSize:12, fontWeight:900, color:"#065f46", textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:8 }}>💡 Explanation</div>
              <div style={{ fontSize:14, color:"var(--text2)", lineHeight:1.75 }}>{q.exp}</div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {current > 0 && (
              <button className="quiz-action-btn" onClick={() => goTo(current - 1)}
                style={{ padding:"12px 20px", borderRadius:13, border:"2px solid var(--border)", background:"var(--bg2)", color:"var(--text2)", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:7 }}>
                <Icon type="arrow-left" size={15} color="currentColor" /> Back
              </button>
            )}
            {userAns.length > 0 && !isRevealed && (
              <button className="quiz-action-btn" onClick={handleReveal}
                style={{ padding:"12px 20px", borderRadius:13, border:`2px solid ${domainCfg.color}`, background:domainCfg.bg, color:domainCfg.color, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                Check Answer
              </button>
            )}
            {current < QUESTION_BANK.length - 1 && (
              <button className="quiz-action-btn" onClick={() => goTo(current + 1)}
                style={{ marginLeft:"auto", padding:"12px 24px", borderRadius:13, border:"none", background:userAns.length > 0 ? `linear-gradient(135deg,${domainCfg.color},#8b5cf6)` : "var(--bg3)", color:userAns.length > 0 ? "#fff" : "var(--text3)", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:9, transition:"all 0.2s" }}>
                Next <Icon type="arrow" size={15} color={userAns.length > 0 ? "#fff" : "var(--text3)"} />
              </button>
            )}
            {current === QUESTION_BANK.length - 1 && answeredCount >= Math.floor(QUESTION_BANK.length * 0.7) && (
              <button className="quiz-action-btn" onClick={finishExam}
                style={{ marginLeft:"auto", padding:"12px 24px", borderRadius:13, border:"none", background:"linear-gradient(135deg,#10b981,#059669)", color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:9 }}>
                🎯 Get My Career Report
              </button>
            )}
          </div>

          {/* Dot progress */}
          <div style={{ marginTop:28, display:"flex", justifyContent:"center", gap:4, flexWrap:"wrap" }}>
            {QUESTION_BANK.map((qq, idx) => (
              <div key={qq.id} onClick={() => goTo(idx)}
                style={{ width:7, height:7, borderRadius:"50%", cursor:"pointer", background:idx === current ? "#6366f1" : answers[qq.id] ? (revealed[qq.id] ? DOMAINS[qq.domain].color : "#10b981") : "var(--border)", transition:"all 0.15s", transform:idx === current ? "scale(1.6)" : "scale(1)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}