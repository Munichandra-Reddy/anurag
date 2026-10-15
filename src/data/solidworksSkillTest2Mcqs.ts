export interface MCQQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export const SOLIDWORKS_SKILL_TEST_2_MCQS: MCQQuestion[] = [
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
  },
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

export { SOLIDWORKS_SKILL_TEST_2_A2_MCQS } from './solidworksSkillTest2A2Mcqs';
