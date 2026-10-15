export interface MCQQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export const SOLIDWORKS_SKILL_TEST_2_A2_MCQS: MCQQuestion[] = [
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
