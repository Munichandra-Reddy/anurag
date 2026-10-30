import { MUNI_A1_STUDENTS, MUNI_A2_STUDENTS, MUNI_B1_STUDENTS, MUNI_B2_STUDENTS } from './students';

export interface MCQQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export const SKILL_TEST_4_CONFIG = {
  examDate: '31-10-2026',
  dateDisplay: '31.10.2026',
  startTime: '09:00',
  endTime: '17:00',
  windowDisplay: '9:00 AM to 5:00 PM',
  targetBatches: ['B1', 'B2', 'A1', 'A2']
};

// Skill Test 4 MCQs for B1 and B2 Batches
export const SOLIDWORKS_SKILL_TEST_4_B_MCQS: MCQQuestion[] = [
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

// Backwards compatibility alias
export const SOLIDWORKS_SKILL_TEST_4_BASE_MCQS: MCQQuestion[] = SOLIDWORKS_SKILL_TEST_4_B_MCQS;

// Skill Test 4 MCQs for A1 and A2 Batches
export const SOLIDWORKS_SKILL_TEST_4_A_MCQS: MCQQuestion[] = [
  {
    question: "Which feature creates a bevel on an edge?",
    options: [
      "Fillet",
      "Chamfer",
      "Rib",
      "Shell"
    ],
    answerIndex: 1
  },
  {
    question: "Which feature makes a solid model hollow while maintaining a specified wall thickness?",
    options: [
      "Draft",
      "Shell",
      "Rib",
      "Mirror"
    ],
    answerIndex: 1
  },
  {
    question: "Which feature creates a thin supporting wall from a sketch?",
    options: [
      "Rib",
      "Dome",
      "Wrap",
      "Split Line"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature is commonly used to create a repeated arrangement of features in a straight direction?",
    options: [
      "Circular Pattern",
      "Linear Pattern",
      "Mirror",
      "Loft"
    ],
    answerIndex: 1
  },
  {
    question: "Which feature creates a tapered face at a specified angle?",
    options: [
      "Shell",
      "Draft",
      "Fillet",
      "Sweep"
    ],
    answerIndex: 1
  },
  {
    question: "Which feature is used to create internal or external threads on suitable cylindrical geometry?",
    options: [
      "Hole Wizard",
      "Thread",
      "Draft",
      "Split Line"
    ],
    answerIndex: 1
  },
  {
    question: "Which feature adds a raised logo or text by projecting sketch geometry onto a surface?",
    options: [
      "Wrap",
      "Shell",
      "Rib",
      "Draft"
    ],
    answerIndex: 0
  },
  {
    question: "What is the purpose of the FeatureManager Design Tree?",
    options: [
      "To display only drawing dimensions",
      "To manage and display the model's features, sketches and bodies",
      "To calculate assembly costs automatically",
      "To create presentation slides"
    ],
    answerIndex: 1
  },
  {
    question: "Which feature can duplicate selected features symmetrically across a reference plane?",
    options: [
      "Mirror",
      "Shell",
      "Sweep",
      "Draft"
    ],
    answerIndex: 0
  },
  {
    question: "What is the default state of the first component inserted into a new assembly?",
    options: [
      "Floating",
      "Fixed",
      "Suppressed",
      "Hidden"
    ],
    answerIndex: 1
  }
];

/**
 * Returns the 10 base MCQs for the given batch or student.
 * A1 and A2 batches receive SOLIDWORKS_SKILL_TEST_4_A_MCQS.
 * B1 and B2 batches receive SOLIDWORKS_SKILL_TEST_4_B_MCQS.
 */
export function getSkillTest4BaseQuestions(batch?: string, studentIdentifier?: string): MCQQuestion[] {
  const cleanBatch = (batch || '').replace(/batch/gi, '').trim().toUpperCase();
  if (cleanBatch.includes('A1') || cleanBatch.includes('A2') || cleanBatch === 'A') {
    return SOLIDWORKS_SKILL_TEST_4_A_MCQS;
  }
  if (cleanBatch.includes('B1') || cleanBatch.includes('B2') || cleanBatch === 'B') {
    return SOLIDWORKS_SKILL_TEST_4_B_MCQS;
  }

  // Auto-detect batch from student identifier if batch was not explicitly passed
  const cleanId = (studentIdentifier || '').toLowerCase().trim();
  if (cleanId) {
    const isAStudent = MUNI_A1_STUDENTS.some(s => s.email.toLowerCase() === cleanId || s.roll.toLowerCase() === cleanId) ||
                       MUNI_A2_STUDENTS.some(s => s.email.toLowerCase() === cleanId || s.roll.toLowerCase() === cleanId) ||
                       cleanId.includes('103a') || cleanId.includes('501a');
    if (isAStudent) {
      return SOLIDWORKS_SKILL_TEST_4_A_MCQS;
    }

    const isBStudent = MUNI_B1_STUDENTS.some(s => s.email.toLowerCase() === cleanId || s.roll.toLowerCase() === cleanId) ||
                       MUNI_B2_STUDENTS.some(s => s.email.toLowerCase() === cleanId || s.roll.toLowerCase() === cleanId) ||
                       cleanId.includes('103b') || cleanId.includes('503b');
    if (isBStudent) {
      return SOLIDWORKS_SKILL_TEST_4_B_MCQS;
    }
  }

  return SOLIDWORKS_SKILL_TEST_4_B_MCQS;
}

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
 * Each student gets their own question sequence and unique answer key.
 */
export function getJumbledSkillTest4Questions(studentIdentifier?: string, batch?: string): MCQQuestion[] {
  const baseQuestions = getSkillTest4BaseQuestions(batch, studentIdentifier);
  const cleanSeed = (studentIdentifier || '').toLowerCase().trim();
  const questionsCopy = baseQuestions.map(q => ({
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
 * Checks whether the current time is within the exam window.
 */
export function checkSkillTest4Window(currentTime = new Date(), batch?: string): {
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
  const start = new Date(2026, 9, 31, 9, 0, 0, 0);  // 31 Oct 2026 09:00:00
  const end = new Date(2026, 9, 31, 17, 0, 0, 0);    // 31 Oct 2026 17:00:00

  if (current.getTime() < start.getTime()) {
    return {
      isOpen: false,
      status: 'upcoming',
      message: 'Skill Test 4 will open on 31-10-2026 at 9:00 AM. Exam timing is 9:00 AM to 5:00 PM.'
    };
  }

  if (current.getTime() > end.getTime()) {
    return {
      isOpen: false,
      status: 'closed',
      message: 'Skill Test 4 assessment has closed. It was conducted on 31-10-2026 from 9:00 AM to 5:00 PM.'
    };
  }

  return {
    isOpen: true,
    status: 'open',
    message: 'Skill Test 4 is currently OPEN (9:00 AM to 5:00 PM).'
  };
}
