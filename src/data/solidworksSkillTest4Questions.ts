export interface MCQQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export const SKILL_TEST_4_CONFIG = {
  examDate: '28-10-2026',
  dateDisplay: '28.10.2026',
  startTime: '09:00',
  endTime: '17:00',
  windowDisplay: '9:00 AM to 5:00 PM',
  targetBatches: ['B1', 'B2']
};

export const SOLIDWORKS_SKILL_TEST_4_BASE_MCQS: MCQQuestion[] = [
  {
    question: "What is the main purpose of Fully Defined Sketch?",
    options: [
      "To change the sketch colour",
      "To remove all dimensions",
      "To fix the sketch size and position by constraints and dimensions",
      "To convert the sketch into a surface"
    ],
    answerIndex: 2
  },
  {
    question: "Which colour generally indicates a fully defined sketch in the default SOLIDWORKS colour scheme?",
    options: [
      "Blue",
      "Yellow",
      "Red",
      "none of the above"
    ],
    answerIndex: 3
  },
  {
    question: "Which relation makes two lines meet at a common endpoint?",
    options: [
      "Parallel",
      "Horizontal",
      "Coincident",
      "Tangent"
    ],
    answerIndex: 2
  },
  {
    question: "Which command creates a sketch entity at a specified distance from an existing entity?",
    options: [
      "Offset Entities",
      "Convert Entities",
      "Split Entities",
      "Repair Sketch"
    ],
    answerIndex: 0
  },
  {
    question: "Which command projects existing model edges onto an active sketch?",
    options: [
      "Linear Pattern",
      "Convert Entities",
      "Fillet",
      "Draft"
    ],
    answerIndex: 1
  },
  {
    question: "What is the main purpose of construction geometry?",
    options: [
      "To create material directly",
      "To provide reference geometry for sketching",
      "To create assembly mates",
      "To assign material properties"
    ],
    answerIndex: 1
  },
  {
    question: "Which feature creates a solid by moving a profile along a specified path?",
    options: [
      "Loft",
      "Sweep",
      "Shell",
      "Fillet"
    ],
    answerIndex: 1
  },
  {
    question: "Which feature creates a solid by moving a profile along a specified path?",
    options: [
      "Loft",
      "Sweep",
      "Shell",
      "Fillet"
    ],
    answerIndex: 1
  },
  {
    question: "Which feature creates a solid by transitioning between multiple profiles?",
    options: [
      "Lofted Boss/Base",
      "Extruded Cut",
      "Draft",
      "Mirror"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature rounds sharp edges or corners?",
    options: [
      "Chamfer",
      "Draft",
      "Fillet",
      "Shell"
    ],
    answerIndex: 2
  }
];

// Simple deterministic hash to seed RNG per student
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seedRef: { value: number }): number {
  const x = Math.sin(seedRef.value++) * 10000;
  return x - Math.floor(x);
}

/**
 * Returns a deterministically jumbled copy of the 10 quiz questions
 * uniquely shuffled for the given student identifier (email or roll).
 */
export function getJumbledSkillTest4Questions(studentIdentifier?: string): MCQQuestion[] {
  const cleanSeed = (studentIdentifier || '').toLowerCase().trim();
  const questionsCopy = SOLIDWORKS_SKILL_TEST_4_BASE_MCQS.map(q => ({
    ...q,
    options: [...q.options]
  }));

  if (!cleanSeed) return questionsCopy;

  const seedRef = { value: stringToSeed(cleanSeed) || 42 };

  // Fisher-Yates deterministic shuffle
  for (let i = questionsCopy.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seedRef) * (i + 1));
    const temp = questionsCopy[i];
    questionsCopy[i] = questionsCopy[j];
    questionsCopy[j] = temp;
  }

  return questionsCopy;
}

/**
 * Checks whether the current time is within the exam window (28-10-2026 from 9:00 AM to 5:00 PM).
 */
export function checkSkillTest4Window(currentTime = new Date()): {
  isOpen: boolean;
  status: 'upcoming' | 'open' | 'closed';
  message: string;
} {
  // Allow explicit testing override if needed via localStorage or URL
  try {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('bypassTime=true') || localStorage.getItem('skillTest4_bypassTime') === 'true') {
        return {
          isOpen: true,
          status: 'open',
          message: 'Skill Test 4 is OPEN (Preview Mode).'
        };
      }
    }
  } catch (e) {}

  const current = new Date(currentTime);
  const start = new Date(2026, 9, 28, 9, 0, 0, 0);  // 28 Oct 2026 09:00:00
  const end = new Date(2026, 9, 28, 17, 0, 0, 0);    // 28 Oct 2026 17:00:00

  if (current.getTime() < start.getTime()) {
    return {
      isOpen: false,
      status: 'upcoming',
      message: 'Skill Test 4 will open on 28-10-2026 at 9:00 AM. Exam timing is 9:00 AM to 5:00 PM.'
    };
  }

  if (current.getTime() > end.getTime()) {
    return {
      isOpen: false,
      status: 'closed',
      message: 'Skill Test 4 assessment has closed. It was conducted on 28-10-2026 from 9:00 AM to 5:00 PM.'
    };
  }

  return {
    isOpen: true,
    status: 'open',
    message: 'Skill Test 4 is currently OPEN (9:00 AM to 5:00 PM).'
  };
}
