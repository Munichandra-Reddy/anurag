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
}

export const MUNI_PRE_ASSESSMENT_SET1: PreAssessmentData = {
  id: 'pre_muni_a1_set1',
  title: 'Pre-Assessment Test (Set 1)',
  targetBatch: 'A1',
  sectionA: [
    {
      question: "What is the main purpose of a sketch in SolidWorks?",
      options: [
        "To create materials",
        "To create the 2D profile used for modeling",
        "To render the model",
        "To create animations"
      ],
      answerIndex: 1
    },
    {
      question: "Which environment is primarily used to create 2D geometry in SolidWorks?",
      options: [
        "Assembly",
        "Drawing",
        "Sketch",
        "Simulation"
      ],
      answerIndex: 2
    },
    {
      question: "Which tool is used to create a straight line?",
      options: [
        "Circle",
        "Line",
        "Offset",
        "Spline"
      ],
      answerIndex: 1
    },
    {
      question: "Which shortcut is commonly used to activate the Line tool?",
      options: [
        "L",
        "C",
        "R",
        "T"
      ],
      answerIndex: 0
    },
    {
      question: "Which tool is used to create a circle?",
      options: [
        "Arc",
        "Circle",
        "Ellipse",
        "Spline"
      ],
      answerIndex: 1
    },
    {
      question: "What does the center point of a circle represent?",
      options: [
        "Radius",
        "Diameter",
        "Center location",
        "Circumference"
      ],
      answerIndex: 2
    },
    {
      question: "Which tool can be used to create a polygon with a specified number of sides?",
      options: [
        "Rectangle",
        "Polygon",
        "Slot",
        "Chamfer"
      ],
      answerIndex: 1
    },
    {
      question: "What is the purpose of the Arc tool?",
      options: [
        "To create curved geometry",
        "To create straight lines",
        "To create dimensions",
        "To delete geometry"
      ],
      answerIndex: 0
    },
    {
      question: "Which tool is used to create a free-form curve?",
      options: [
        "Line",
        "Spline",
        "Rectangle",
        "Polygon"
      ],
      answerIndex: 1
    },
    {
      question: "What is the purpose of the Point tool?",
      options: [
        "To create a reference point",
        "To create a circle",
        "To create an arc",
        "To create a dimension"
      ],
      answerIndex: 0
    },
    {
      question: "What does the Origin represent in a sketch?",
      options: [
        "The center of the screen only",
        "The reference coordinate location",
        "The first sketch entity",
        "The model surface"
      ],
      answerIndex: 1
    },
    {
      question: "What happens when sketch geometry is fully constrained?",
      options: [
        "It turns red",
        "It cannot be moved without changing dimensions/relations",
        "It is automatically deleted",
        "It becomes a 3D model"
      ],
      answerIndex: 1
    },
    {
      question: "What does CAD stand for?",
      options: [
        "Computer Aided Design",
        "Computer Automatic Drawing",
        "Computer Application Design",
        "Computer Architecture Drawing"
      ],
      answerIndex: 0
    },
    {
      question: "Which command is used to create a straight line in AutoCAD?",
      options: [
        "ARC",
        "LINE",
        "SPLINE",
        "POLYLINE"
      ],
      answerIndex: 1
    },
    {
      question: "Which command is used to remove an object?",
      options: [
        "CUT",
        "DELETE",
        "ERASE",
        "REMOVE"
      ],
      answerIndex: 2
    },
    {
      question: "Which command creates a parallel copy of an object at a specified distance?",
      options: [
        "OFFSET",
        "COPY",
        "MIRROR",
        "ARRAY"
      ],
      answerIndex: 0
    },
    {
      question: "Which command rotates an object around a base point?",
      options: [
        "TURN",
        "ROTATE",
        "SPIN",
        "ORBIT"
      ],
      answerIndex: 1
    },
    {
      question: "Which command creates a mirror image of an object?",
      options: [
        "REFLECT",
        "MIRROR",
        "FLIP",
        "SYMMETRY"
      ],
      answerIndex: 1
    },
    {
      question: "Fusion 360 is mainly used for:",
      options: [
        "Word processing",
        "CAD/CAM/CAE",
        "Video editing",
        "Web designing"
      ],
      answerIndex: 1
    },
    {
      question: "Which company develops Fusion 360?",
      options: [
        "Dassault Systèmes",
        "Autodesk",
        "Siemens",
        "Adobe"
      ],
      answerIndex: 1
    },
    {
      question: "What is the first step generally required to create a 3D solid in Fusion 360?",
      options: [
        "Rendering",
        "Creating a sketch",
        "Printing",
        "Animation"
      ],
      answerIndex: 1
    },
    {
      question: "Which feature adds material by extending a sketch into 3D?",
      options: [
        "Revolve",
        "Extrude",
        "Fillet",
        "Shell"
      ],
      answerIndex: 1
    },
    {
      question: "Engineering drawing is mainly used for:",
      options: [
        "Communication of technical information",
        "Entertainment",
        "Painting",
        "Photography"
      ],
      answerIndex: 0
    },
    {
      question: "Which instrument is used to draw circles?",
      options: [
        "Compass",
        "T-square",
        "Scale",
        "Set square"
      ],
      answerIndex: 0
    },
    {
      question: "Which instrument is used to measure angles?",
      options: [
        "Divider",
        "Compass",
        "Protractor",
        "T-square"
      ],
      answerIndex: 2
    },
    {
      question: "What is the purpose of a scale in engineering drawing?",
      options: [
        "To measure or represent dimensions proportionally",
        "To erase lines",
        "To create circles",
        "To add colour"
      ],
      answerIndex: 0
    },
    {
      question: "What does a continuous thick line generally represent?",
      options: [
        "Visible edges",
        "Hidden edges",
        "Center lines",
        "Dimension lines"
      ],
      answerIndex: 0
    },
    {
      question: "What type of line is generally used for hidden edges?",
      options: [
        "Continuous thick",
        "Dashed line",
        "Chain thick",
        "Freehand line"
      ],
      answerIndex: 1
    },
    {
      question: "What type of line is commonly used for center lines?",
      options: [
        "Continuous thick",
        "Dashed",
        "Chain thin",
        "Zigzag"
      ],
      answerIndex: 2
    },
    {
      question: "What is orthographic projection used for?",
      options: [
        "Representing different views of an object",
        "Rendering",
        "Animation",
        "Colouring"
      ],
      answerIndex: 0
    }
  ],
  sectionB: [],
  sectionC: [],
  sectionD: []
};
