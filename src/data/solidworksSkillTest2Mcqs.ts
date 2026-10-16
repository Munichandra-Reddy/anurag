export interface MCQQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

// First 20 MCQs for B1 Batch (and A1 Batch)
export const SOLIDWORKS_SKILL_TEST_2_SET1_MCQS: MCQQuestion[] = [
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
    question: "Which feature creates a solid by revolving a sketch profile around an axis?",
    options: [
      "Revolved Boss/Base",
      "Sweep",
      "Loft",
      "Fillet"
    ],
    answerIndex: 0
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

// Remaining 20 MCQs for B2 Batch (and A2 Batch)
export const SOLIDWORKS_SKILL_TEST_2_SET2_MCQS: MCQQuestion[] = [
  {
    question: "Which mate makes two planar faces lie in the same plane and face the same direction?",
    options: [
      "Concentric",
      "Coincident",
      "Tangent",
      "Width"
    ],
    answerIndex: 1
  },
  {
    question: "Which mate aligns the axes of two cylindrical components?",
    options: [
      "Parallel",
      "Distance",
      "Concentric",
      "Angle"
    ],
    answerIndex: 2
  },
  {
    question: "Which mate maintains a specified separation between two selected faces?",
    options: [
      "Distance",
      "Coincident",
      "Tangent",
      "Lock"
    ],
    answerIndex: 0
  },
  {
    question: "What does a floating component mean in an assembly?",
    options: [
      "It cannot be selected",
      "It has some freedom to move",
      "It is permanently fixed",
      "It has been deleted"
    ],
    answerIndex: 1
  },
  {
    question: "What is the purpose of Exploded View?",
    options: [
      "To remove components permanently",
      "To separate components visually to show assembly order or arrangement",
      "To convert the assembly into a surface",
      "To increase material thickness"
    ],
    answerIndex: 1
  },
  {
    question: "What happens when a component is suppressed in an assembly?",
    options: [
      "It is permanently deleted from the file",
      "It is temporarily excluded from the active assembly configuration",
      "It becomes a sketch",
      "It is automatically converted into a surface"
    ],
    answerIndex: 1
  },
  {
    question: "What is sheet metal design mainly used for?",
    options: [
      "Designing thin-walled components made from sheet material",
      "Designing only plastic injection moulds",
      "Creating only complex freeform surfaces",
      "Creating only assembly animations"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature creates a flange along a selected sheet metal edge?",
    options: [
      "Edge Flange",
      "Rib",
      "Sweep",
      "Surface Knit"
    ],
    answerIndex: 0
  },
  {
    question: "What is the purpose of the Flatten feature?",
    options: [
      "To increase sheet thickness",
      "To display the sheet metal part in its flat pattern state",
      "To create an assembly",
      "To create a thread"
    ],
    answerIndex: 1
  },
  {
    question: "Which feature creates a bend along a sketched line on a suitable sheet metal part?",
    options: [
      "Sketched Bend",
      "Revolved Boss",
      "Surface Loft",
      "Rib"
    ],
    answerIndex: 0
  },
  {
    question: "What is the purpose of Bend Relief?",
    options: [
      "To reduce unwanted tearing or material interference near bends",
      "To increase the number of assembly components",
      "To create a solid thread",
      "To create a surface pattern"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature is used to create a flange along an edge using a profile sketch?",
    options: [
      "Hem",
      "Miter Flange",
      "Swept Cut",
      "Boundary Surface"
    ],
    answerIndex: 1
  },
  {
    question: "What is the main difference between a surface body and a solid body?",
    options: [
      "A surface body has no enclosing solid volume by itself",
      "A surface body always has greater mass",
      "A solid body cannot contain curved faces",
      "There is no difference"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature creates a surface by extruding a sketch in a specified direction?",
    options: [
      "Extruded Surface",
      "Boss-Extrude",
      "Shell",
      "Rib"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature joins adjacent surface bodies into a single surface body when they meet appropriately?",
    options: [
      "Knit Surface",
      "Linear Pattern",
      "Shell",
      "Draft"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature extends a surface edge by adding more surface geometry?",
    options: [
      "Extend Surface",
      "Boss-Extrude",
      "Hole Wizard",
      "Fillet Edge"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature trims away unwanted portions of a surface using selected trimming geometry?",
    options: [
      "Trim Surface",
      "Rib",
      "Revolved Boss",
      "Shell"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature creates a surface between two or more boundary curves with control over boundary conditions?",
    options: [
      "Boundary Surface",
      "Extruded Cut",
      "Base Flange",
      "Linear Pattern"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature thickens a suitable surface to create a solid or a thickened body?",
    options: [
      "Thicken",
      "Trim Surface",
      "Split Line",
      "Extend Surface"
    ],
    answerIndex: 0
  },
  {
    question: "Which feature separates a part into multiple solid bodies using a cutting tool or surface?",
    options: [
      "Split",
      "Fillet",
      "Rib",
      "Dome"
    ],
    answerIndex: 0
  }
];

export const getSkillTest2McqsForBatch = (batch?: string): MCQQuestion[] => {
  const clean = (batch || '').toUpperCase().trim();
  if (clean.includes('B1') || clean.includes('A1') || clean.includes('MORNING')) {
    return SOLIDWORKS_SKILL_TEST_2_SET1_MCQS;
  }
  return SOLIDWORKS_SKILL_TEST_2_SET2_MCQS;
};

// Default export for backward compatibility
export const SOLIDWORKS_SKILL_TEST_2_MCQS: MCQQuestion[] = SOLIDWORKS_SKILL_TEST_2_SET2_MCQS;
