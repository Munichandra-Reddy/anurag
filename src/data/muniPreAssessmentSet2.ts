export interface TheoryQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export interface PreAssessmentData {
  id: string;
  title: string;
  sectionA: TheoryQuestion[];
  sectionB: TheoryQuestion[];
  sectionC: TheoryQuestion[];
  sectionD: string[];
  targetBatch?: string;
  isLaunched?: boolean;
}

export const MUNI_PRE_ASSESSMENT_SET2: PreAssessmentData = {
  id: 'pre_muni_a2_set2',
  title: 'Pre-Assessment Test (Set 2)',
  targetBatch: 'A2',
  isLaunched: true,
  sectionA: [
    {
      question: "What color generally indicates fully defined sketch geometry in SolidWorks?",
      options: ["Blue", "Red", "Black", "Green"],
      answerIndex: 2
    },
    {
      question: "What color generally indicates under-defined sketch geometry?",
      options: ["Blue", "Black", "Green", "Yellow"],
      answerIndex: 0
    },
    {
      question: "What does a sketch relation do?",
      options: ["Changes the material", "Controls the geometric relationship between entities", "Creates a rendering", "Creates an assembly"],
      answerIndex: 1
    },
    {
      question: "Which relation makes two lines meet at 90°?",
      options: ["Parallel", "Coincident", "Perpendicular", "Tangent"],
      answerIndex: 2
    },
    {
      question: "Which relation makes two lines remain in the same direction?",
      options: ["Parallel", "Horizontal", "Vertical", "Equal"],
      answerIndex: 0
    },
    {
      question: "Which relation makes a line horizontal?",
      options: ["Parallel", "Horizontal", "Coincident", "Tangent"],
      answerIndex: 1
    },
    {
      question: "Which relation makes a line vertical?",
      options: ["Vertical", "Perpendicular", "Parallel", "Equal"],
      answerIndex: 0
    },
    {
      question: "What does a Coincident relation do?",
      options: ["Makes two entities equal in size", "Places two points/entities at the same location", "Makes two lines parallel", "Makes two lines perpendicular"],
      answerIndex: 1
    },
    {
      question: "What does the Tangent relation do?",
      options: ["Makes entities touch smoothly", "Makes lines perpendicular", "Makes circles equal", "Fixes an entity"],
      answerIndex: 0
    },
    {
      question: "What does the Equal relation do?",
      options: ["Makes entities the same size", "Makes entities parallel", "Makes entities horizontal", "Makes entities coincident"],
      answerIndex: 0
    },
    {
      question: "What is the purpose of the Fix relation?",
      options: ["Deletes an entity", "Locks the position of geometry", "Creates a dimension", "Creates a circle"],
      answerIndex: 1
    },
    {
      question: "Which relation can be applied between two circles to make their sizes equal?",
      options: ["Tangent", "Equal", "Horizontal", "Coincident"],
      answerIndex: 1
    },
    {
      question: "Which command is used to trim unwanted portions of objects?",
      options: ["CUT", "BREAK", "TRIM", "EXTEND"],
      answerIndex: 2
    },
    {
      question: "Which command is used to lengthen an object up to another boundary?",
      options: ["LENGTH", "EXTEND", "STRETCH", "OFFSET"],
      answerIndex: 1
    },
    {
      question: "Which command is used to create a rectangular pattern of objects?",
      options: ["ARRAY", "COPY", "PATTERN", "MULTICOPY"],
      answerIndex: 0
    },
    {
      question: "Which command is used to create rounded corners?",
      options: ["CHAMFER", "FILLET", "ROUND", "CURVE"],
      answerIndex: 1
    },
    {
      question: "Which command creates a beveled corner?",
      options: ["FILLET", "CHAMFER", "OFFSET", "TRIM"],
      answerIndex: 1
    },
    {
      question: "Which command is commonly used to move an object?",
      options: ["MOVE", "SHIFT", "DRAG", "TRANSFER"],
      answerIndex: 0
    },
    {
      question: "Which feature creates a solid by rotating a sketch around an axis?",
      options: ["Sweep", "Revolve", "Extrude", "Loft"],
      answerIndex: 1
    },
    {
      question: "Which feature creates rounded edges?",
      options: ["Chamfer", "Fillet", "Shell", "Offset"],
      answerIndex: 1
    },
    {
      question: "Which feature creates a beveled edge?",
      options: ["Fillet", "Chamfer", "Round", "Draft"],
      answerIndex: 1
    },
    {
      question: "Which tool is used to create a thin-walled hollow object?",
      options: ["Shell", "Hollow", "Offset", "Thin"],
      answerIndex: 0
    },
    {
      question: "The front view of an object is also called:",
      options: ["Elevation", "Plan", "Side view", "Section"],
      answerIndex: 0
    },
    {
      question: "The top view is commonly called:",
      options: ["Elevation", "Plan", "End view", "Section"],
      answerIndex: 1
    },
    {
      question: "What is projection?",
      options: ["Method of representing a 3D object on a 2D plane", "Method of colouring", "Method of printing", "Method of dimensioning only"],
      answerIndex: 0
    },
    {
      question: "In first-angle projection, the object is located:",
      options: ["Behind the plane of projection", "Between observer and plane", "Above the plane only", "Below the plane only"],
      answerIndex: 1
    },
    {
      question: "In third-angle projection, the plane of projection is:",
      options: ["Between observer and object", "Behind the object", "Below the object", "Above the object"],
      answerIndex: 0
    },
    {
      question: "Which symbol represents first-angle projection?",
      options: ["Cone and circle symbol", "Square only", "Triangle only", "Circle only"],
      answerIndex: 0
    },
    {
      question: "What is dimensioning used for?",
      options: ["Providing the size and location information", "Adding colour", "Creating shadows", "Creating textures"],
      answerIndex: 0
    },
    {
      question: "What does a dimension line normally indicate?",
      options: ["Size of a feature", "Hidden edge", "Center", "Section area"],
      answerIndex: 0
    }
  ],
  sectionB: [],
  sectionC: [],
  sectionD: []
};
