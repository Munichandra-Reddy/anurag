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

export const MUNI_PRE_ASSESSMENT_SET3: PreAssessmentData = {
  id: 'pre_muni_b1_set3',
  title: 'Pre-Assessment Test (Set 3)',
  targetBatch: 'B1',
  isLaunched: true,
  sectionA: [
    {
      question: "What is the purpose of Smart Dimension?",
      options: ["To create 3D features", "To define numerical dimensions in a sketch", "To apply materials", "To create assemblies"],
      answerIndex: 1
    },
    {
      question: "Which dimension controls the size of a circle?",
      options: ["Length", "Radius or Diameter", "Angle only", "Height only"],
      answerIndex: 1
    },
    {
      question: "What symbol is commonly used to represent diameter?",
      options: ["R", "Ø", "L", "A"],
      answerIndex: 1
    },
    {
      question: "What does the letter \"R\" represent in a dimension?",
      options: ["Rectangle", "Radius", "Relation", "Reference"],
      answerIndex: 1
    },
    {
      question: "What type of dimension controls the angle between two lines?",
      options: ["Linear", "Angular", "Radial", "Diameter"],
      answerIndex: 1
    },
    {
      question: "Which tool is used to remove a portion of sketch geometry?",
      options: ["Trim Entities", "Offset Entities", "Mirror Entities", "Convert Entities"],
      answerIndex: 0
    },
    {
      question: "What is the main purpose of Extend Entities?",
      options: ["To shorten geometry", "To extend geometry until it reaches another entity", "To duplicate geometry", "To rotate geometry"],
      answerIndex: 1
    },
    {
      question: "What does Offset Entities do?",
      options: ["Creates a parallel copy of selected geometry", "Deletes geometry", "Rotates geometry", "Changes the material"],
      answerIndex: 0
    },
    {
      question: "Which tool is used to create a symmetrical copy of sketch geometry?",
      options: ["Mirror Entities", "Offset Entities", "Trim Entities", "Convert Entities"],
      answerIndex: 0
    },
    {
      question: "What is required to perform a sketch mirror?",
      options: ["Mirror line/axis", "Material", "Plane only", "Dimension only"],
      answerIndex: 0
    },
    {
      question: "Which tool creates repeated copies of sketch geometry?",
      options: ["Pattern", "Trim", "Offset", "Convert"],
      answerIndex: 0
    },
    {
      question: "Which pattern repeats geometry in a straight direction?",
      options: ["Circular Sketch Pattern", "Linear Sketch Pattern", "Mirror", "Radial Pattern"],
      answerIndex: 1
    },
    {
      question: "Which command is used to change the size of an object proportionally?",
      options: ["SCALE", "STRETCH", "SIZE", "RESIZE"],
      answerIndex: 0
    },
    {
      question: "What is the shortcut key for saving a drawing?",
      options: ["Ctrl + S", "Ctrl + D", "Ctrl + A", "Ctrl + W"],
      answerIndex: 0
    },
    {
      question: "What is the default AutoCAD drawing file extension?",
      options: [".DOC", ".DWG", ".CAD", ".DXF"],
      answerIndex: 1
    },
    {
      question: "What does OSNAP help with?",
      options: ["Rendering", "Accurate object selection points", "Printing", "Colour editing"],
      answerIndex: 1
    },
    {
      question: "Which object snap identifies the center of a circle?",
      options: ["ENDPOINT", "MIDPOINT", "CENTER", "NODE"],
      answerIndex: 2
    },
    {
      question: "Which command creates a closed polyline from a rectangle?",
      options: ["BOX", "RECTANGLE", "SQUARE", "FRAME"],
      answerIndex: 1
    },
    {
      question: "What is the purpose of constraints in Fusion 360 sketches?",
      options: ["To add colours", "To control geometry relationships", "To render the model", "To create materials"],
      answerIndex: 1
    },
    {
      question: "Which constraint makes two objects the same size?",
      options: ["Equal", "Similar", "Same", "Match"],
      answerIndex: 0
    },
    {
      question: "What does a fully constrained sketch mean?",
      options: ["It has no geometry", "All required degrees of freedom are controlled", "It is 3D", "It is ready for rendering only"],
      answerIndex: 1
    },
    {
      question: "Which feature is useful for creating a shape along a path?",
      options: ["Sweep", "Shell", "Fillet", "Chamfer"],
      answerIndex: 0
    },
    {
      question: "What is a sectional view used to show?",
      options: ["Internal features", "External colour", "Surface texture only", "Perspective only"],
      answerIndex: 0
    },
    {
      question: "What are hatching lines used for in sectional drawings?",
      options: ["Indicating cut surfaces", "Showing hidden edges", "Showing dimensions", "Showing center lines"],
      answerIndex: 0
    },
    {
      question: "What is an isometric drawing?",
      options: ["A pictorial representation of a 3D object", "A 2D sectional drawing only", "A freehand sketch only", "A dimension table"],
      answerIndex: 0
    },
    {
      question: "In an isometric drawing, the three principal axes are separated by approximately:",
      options: ["30°", "60°", "120°", "180°"],
      answerIndex: 2
    },
    {
      question: "Which angle is commonly used for isometric axes from the horizontal?",
      options: ["15°", "30°", "45°", "90°"],
      answerIndex: 1
    },
    {
      question: "What is a title block?",
      options: ["Information area containing drawing details", "Hidden line area", "Section area", "Dimension area"],
      answerIndex: 0
    },
    {
      question: "Which information is normally found in a title block?",
      options: ["Drawing name and scale", "Only colour", "Only material", "Only dimensions"],
      answerIndex: 0
    },
    {
      question: "Machine drawing mainly deals with:",
      options: ["Machine components and assemblies", "Building architecture only", "Electrical circuits only", "Maps"],
      answerIndex: 0
    }
  ],
  sectionB: [],
  sectionC: [],
  sectionD: []
};
