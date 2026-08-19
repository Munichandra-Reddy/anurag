export interface MCQQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

export const SOLIDWORKS_60_MCQS: MCQQuestion[] = [
  {
    question: "What is the main purpose of a sketch in SolidWorks?",
    options: ["To create materials", "To create the 2D profile used for modeling", "To render the model", "To create animations"],
    answerIndex: 1
  },
  {
    question: "Which environment is primarily used to create 2D geometry in SolidWorks?",
    options: ["Assembly", "Drawing", "Sketch", "Simulation"],
    answerIndex: 2
  },
  {
    question: "Which tool is used to create a straight line?",
    options: ["Circle", "Line", "Offset", "Spline"],
    answerIndex: 1
  },
  {
    question: "Which shortcut is commonly used to activate the Line tool?",
    options: ["L", "C", "R", "T"],
    answerIndex: 0
  },
  {
    question: "Which tool is used to create a circle?",
    options: ["Arc", "Circle", "Ellipse", "Spline"],
    answerIndex: 1
  },
  {
    question: "What does the center point of a circle represent?",
    options: ["Radius", "Diameter", "Center location", "Circumference"],
    answerIndex: 2
  },
  {
    question: "What is the main purpose of the Rectangle tool?",
    options: ["To create a four-sided polygon", "To create a circle", "To create an arc", "To trim entities"],
    answerIndex: 0
  },
  {
    question: "Which tool is used to create rounded corners in a 2D sketch?",
    options: ["Chamfer", "Fillet", "Trim", "Extend"],
    answerIndex: 2
  },
  {
    question: "Which tool can be used to create a polygon with a specified number of sides?",
    options: ["Rectangle", "Polygon", "Slot", "Chamfer"],
    answerIndex: 1
  },
  {
    question: "What is the purpose of the Arc tool?",
    options: ["To create curved geometry", "To create straight lines", "To create dimensions", "To delete geometry"],
    answerIndex: 0
  },
  {
    question: "Which tool is used to create a free-form curve?",
    options: ["Line", "Spline", "Rectangle", "Polygon"],
    answerIndex: 1
  },
  {
    question: "What is the purpose of the Point tool?",
    options: ["To create a reference point", "To create a circle", "To create an arc", "To create a dimension"],
    answerIndex: 0
  },
  {
    question: "What does the Origin represent in a sketch?",
    options: ["The center of the screen only", "The reference coordinate location", "The first sketch entity", "The model surface"],
    answerIndex: 1
  },
  {
    question: "What happens when sketch geometry is fully constrained?",
    options: ["It turns red", "It cannot be moved without changing dimensions/relations", "It is automatically deleted", "It becomes a 3D model"],
    answerIndex: 1
  },
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
    question: "Which pattern repeats geometry around a center point?",
    options: ["Linear Sketch Pattern", "Circular Sketch Pattern", "Offset", "Mirror"],
    answerIndex: 1
  },
  {
    question: "What is the purpose of Construction Geometry?",
    options: ["It is used only for reference and does not normally form the final profile", "It creates materials", "It automatically creates a solid", "It creates an assembly"],
    answerIndex: 0
  },
  {
    question: "How can normal sketch geometry be converted into construction geometry?",
    options: ["Using the Construction Geometry option", "Using Smart Dimension", "Using Trim", "Using Extrude"],
    answerIndex: 0
  },
  {
    question: "Construction geometry is generally displayed as:",
    options: ["Solid line", "Dashed line", "Thick red line", "Green surface"],
    answerIndex: 1
  },
  {
    question: "What is the function of the Slot tool?",
    options: ["Creates an elongated shape with rounded ends", "Creates a 3D cut", "Deletes lines", "Changes material"],
    answerIndex: 0
  },
  {
    question: "Which option in Trim Entities removes the inner or outer portion between two boundaries?",
    options: ["Trim to Closest / Power Trim", "Scale", "Offset", "Mirror"],
    answerIndex: 0
  },
  {
    question: "What does \"Fully Defined\" mean in a sketch?",
    options: ["The sketch has no dimensions", "All required degrees of freedom have been removed", "The sketch is 3D", "The sketch is deleted"],
    answerIndex: 1
  },
  {
    question: "What does \"Under Defined\" mean?",
    options: ["The sketch has remaining degrees of freedom", "The sketch is fully constrained", "The sketch is invalid", "The sketch contains no geometry"],
    answerIndex: 0
  },
  {
    question: "What does \"Over Defined\" mean?",
    options: ["There are insufficient dimensions", "Conflicting or redundant relations/dimensions exist", "The sketch is empty", "The sketch is fully defined"],
    answerIndex: 1
  },
  {
    question: "Which tool helps identify and solve sketch constraint problems?",
    options: ["SketchXpert", "Render Tools", "Motion Study", "Toolbox"],
    answerIndex: 0
  },
  {
    question: "What happens if unnecessary dimensions are added to a sketch?",
    options: ["It may become over-defined", "It automatically becomes 3D", "It is deleted", "Nothing can happen"],
    answerIndex: 0
  },
  {
    question: "Which relation can be used to keep the midpoint of a line on another entity?",
    options: ["Midpoint", "Tangent", "Equal", "Parallel"],
    answerIndex: 0
  },
  {
    question: "Which relation makes the endpoints of two lines connect?",
    options: ["Coincident", "Parallel", "Equal", "Horizontal"],
    answerIndex: 0
  },
  {
    question: "What is the purpose of the Centerline tool?",
    options: ["To create reference/construction center lines", "To create solid bodies", "To create dimensions", "To create fillets"],
    answerIndex: 0
  },
  {
    question: "Which entity is commonly used as a centerline for mirror operations?",
    options: ["Construction line", "Circle", "Spline", "Rectangle"],
    answerIndex: 0
  },
  {
    question: "What does the Sketch Fillet tool do?",
    options: ["Creates a rounded corner between sketch entities", "Creates a 3D fillet", "Deletes a corner", "Creates a circle only"],
    answerIndex: 0
  },
  {
    question: "What does Sketch Chamfer do?",
    options: ["Creates a beveled corner in sketch geometry", "Creates a 3D chamfer", "Creates a circle", "Creates a spline"],
    answerIndex: 0
  },
  {
    question: "If a circle has a diameter of 50 mm, what is its radius?",
    options: ["10 mm", "20 mm", "25 mm", "100 mm"],
    answerIndex: 2
  },
  {
    question: "If two lines are constrained as perpendicular, what is the angle between them?",
    options: ["30°", "45°", "90°", "180°"],
    answerIndex: 2
  },
  {
    question: "Which command is useful for moving or repositioning sketch entities?",
    options: ["Move Entities", "Trim Entities", "Offset Entities", "Convert Entities"],
    answerIndex: 0
  },
  {
    question: "Which command is used to rotate sketch entities?",
    options: ["Rotate Entities", "Extend Entities", "Mirror Entities", "Convert Entities"],
    answerIndex: 0
  },
  {
    question: "Before creating a well-defined sketch, what should you primarily consider?",
    options: ["Only the appearance", "Design intent, geometry, relations, and dimensions", "Rendering quality", "Material selection"],
    answerIndex: 1
  }
];
