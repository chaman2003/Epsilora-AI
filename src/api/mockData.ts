export const mockCourseProgress = [
  {
    id: 1,
    name: "Introduction to Programming",
    completedMilestones: 3,
    totalMilestones: 5
  },
  {
    id: 2,
    name: "Web Development Basics",
    completedMilestones: 4,
    totalMilestones: 6
  },
  {
    id: 3,
    name: "Data Structures",
    completedMilestones: 2,
    totalMilestones: 8
  },
  {
    id: 4,
    name: "Algorithms",
    completedMilestones: 1,
    totalMilestones: 7
  }
];

// Add test courses with realistic milestone dates
export const testCourses = [
  {
    _id: "1",
    name: "Introduction to Programming",
    description: "Learn the basics of programming",
    provider: "CodeAcademy",
    duration: "8 weeks",
    pace: "Self-paced",
    objectives: ["Learn basic syntax", "Understand control flow", "Work with functions"],
    deadline: "2025-01-30",
    milestones: [
      { 
        name: "Complete Basic Syntax Module", 
        deadline: "2024-12-10", // Past due date (last week)
        id: "m1",
        title: "Basic Syntax",
        description: "Learn basic programming syntax",
        priority: "High",
        completed: false
      },
      { 
        name: "Control Flow Assignment", 
        deadline: "2024-12-13", // This week
        id: "m2",
        title: "Control Flow",
        description: "Master if statements and loops",
        priority: "High",
        completed: false
      },
      { 
        name: "Functions Project", 
        deadline: "2024-12-21", // Next week
        id: "m3",
        title: "Functions",
        description: "Create reusable functions",
        priority: "Medium",
        completed: false
      }
    ],
    prerequisites: ["None"],
    mainSkills: ["Python", "Problem Solving"]
  },
  {
    _id: "2",
    name: "Web Development Basics",
    description: "Introduction to web development",
    provider: "Udemy",
    duration: "10 weeks",
    pace: "Structured",
    objectives: ["Learn HTML", "Master CSS", "Basic JavaScript"],
    deadline: "2025-02-28",
    milestones: [
      { 
        name: "HTML Fundamentals", 
        deadline: "2024-12-05", // Past due date (last week)
        id: "m4",
        title: "HTML Basics",
        description: "Learn HTML structure and elements",
        priority: "High",
        completed: false
      },
      { 
        name: "CSS Styling Project", 
        deadline: "2024-12-15", // This week
        id: "m5",
        title: "CSS Styling",
        description: "Create beautiful layouts with CSS",
        priority: "High",
        completed: false
      },
      { 
        name: "JavaScript Basics", 
        deadline: "2024-12-22", // Next week
        id: "m6",
        title: "JavaScript",
        description: "Learn JavaScript fundamentals",
        priority: "Medium",
        completed: false
      },
      { 
        name: "Responsive Design", 
        deadline: "2024-12-23", // Next week
        id: "m7",
        title: "Responsive Design",
        description: "Make websites work on all devices",
        priority: "High",
        completed: false
      }
    ],
    prerequisites: ["Basic computer skills"],
    mainSkills: ["HTML", "CSS", "JavaScript"]
  }
];
