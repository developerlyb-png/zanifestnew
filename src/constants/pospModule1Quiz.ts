// Quiz bank for POSP Self-Onboarding Training — Module 1.
// Each question is [questionText, [option0, option1, option2, option3]].
// Option index 0 is always the correct answer (matches the source content).
export type QuizQuestion = [string, [string, string, string, string]];

export const MODULE1_SECTION_QUIZZES: Record<string, QuizQuestion[]> = {
  m1s1: [
    [
      "Insurance works mainly by which method?",
      [
        "Risk pooling among many exposed persons",
        "Investment return guarantee",
        "Preventing all accidents",
        "Replacing legal contracts",
      ],
    ],
    [
      "Which statement should a POSP avoid?",
      [
        "All claims will be paid once premium is paid",
        "Policy terms decide claim admissibility",
        "Insurance reduces financial impact",
        "Exclusions must be explained",
      ],
    ],
    [
      "Premium is best described as:",
      [
        "Contribution paid to create the risk pool",
        "Penalty paid after a loss",
        "Claim amount",
        "Discount from insurer",
      ],
    ],
    [
      "Which is an intangible insurable exposure?",
      ["Liability", "Vehicle", "House", "Furniture"],
    ],
    [
      "Why is expectation management important?",
      [
        "To ensure the customer understands cover, limits and exclusions",
        "To avoid explaining exclusions",
        "To make every claim cashless",
        "To reduce documentation",
      ],
    ],
  ],
  m1s2: [
    ["Which is a peril?", ["Fire", "Careless driving", "Low premium", "High IDV"]],
    [
      "Loose electrical wiring in a shop is a:",
      ["Physical hazard", "Risk", "Peril", "Claim"],
    ],
    [
      "Dishonestly hiding a past claim is:",
      ["Moral hazard", "Physical hazard", "Pure risk", "Reinsurance"],
    ],
    [
      "Insurance generally covers:",
      [
        "Uncertain loss as per policy terms",
        "Certain loss",
        "Speculative business profit",
        "Guaranteed market return",
      ],
    ],
    [
      "Why collect accurate risk information?",
      [
        "To support underwriting/pricing and avoid disputes",
        "To reduce training time",
        "To avoid proposal forms",
        "To guarantee approval",
      ],
    ],
  ],
  m1s3: [
    [
      "IRDAI is primarily responsible for:",
      [
        "Protecting policyholders and regulating insurance industry growth",
        "Running all insurance companies",
        "Selling policies directly",
        "Approving every claim",
      ],
    ],
    [
      "Which source should be used for current entity lists?",
      [
        "IRDAI registered entity lists",
        "Old PPT only",
        "Social media posts",
        "WhatsApp messages",
      ],
    ],
    [
      "A reinsurer primarily helps by:",
      [
        "Taking part of insurers' risk exposure",
        "Selling motor policies directly",
        "Issuing health cards",
        "Registering POSPs",
      ],
    ],
    [
      "Why avoid hard-coded insurer counts?",
      [
        "Entity lists change and must be checked officially",
        "Counts never change",
        "IRDAI publishes nothing",
        "POSPs need no market awareness",
      ],
    ],
    [
      "Product filing discipline matters because:",
      [
        "Products should be offered only as permitted",
        "Any product can be sold immediately",
        "Only POSPs approve products",
        "Customers write policy wording",
      ],
    ],
  ],
  m1s4: [
    [
      "A POSP can generally solicit:",
      [
        "Only permitted/pre-underwritten products as authorized",
        "All insurance products",
        "Only banking products",
        "Only claim services",
      ],
    ],
    [
      "Which intermediary places insurance under broker regulations?",
      ["Insurance broker", "TPA", "Surveyor", "Hospital"],
    ],
    [
      "A web aggregator primarily:",
      [
        "Provides online product information/comparison as permitted",
        "Settles claims",
        "Performs surgery",
        "Issues all policies itself",
      ],
    ],
    [
      "Which role should not be treated as a full underwriter?",
      ["POSP", "Actuary", "Underwriting manager", "Risk engineer"],
    ],
    [
      "A key POSP malpractice risk is:",
      [
        "Selling outside product authorization",
        "Explaining exclusions",
        "Selling authorized products",
        "Capturing consent",
      ],
    ],
  ],
  m1s5: [
    [
      "Bima Bharosa/IGMS is used for:",
      [
        "Registering and tracking insurance grievances",
        "Printing vehicle RC",
        "Paying income tax",
        "Renewing driving license",
      ],
    ],
    [
      "First level of complaint should generally be:",
      [
        "Insurance company grievance channel",
        "Social media post",
        "Unrelated broker",
        "Police for every issue",
      ],
    ],
    [
      "Policyholder protection requires:",
      [
        "Transparent information and escalation guidance",
        "Hiding exclusions",
        "Promising claim approval",
        "Avoiding written communication",
      ],
    ],
    [
      "Which training audit record should be maintained?",
      [
        "Module version, time spent, score, declaration and timestamp",
        "Only POSP name",
        "Only phone number",
        "Only certificate image",
      ],
    ],
    [
      "Why link official videos/readings?",
      [
        "To reinforce concepts with official material",
        "To replace all training",
        "To skip MCQs",
        "To avoid compliance review",
      ],
    ],
  ],
};

export const MODULE1_FINAL_QUIZ: QuizQuestion[] = [
  [
    "Insurance is best described as:",
    [
      "A risk transfer and pooling mechanism",
      "A way to prevent loss",
      "A guaranteed investment",
      "A discount scheme",
    ],
  ],
  [
    "Which POSP statement is incorrect?",
    [
      "Claim is guaranteed for every loss",
      "Coverage depends on policy wording",
      "Exclusions must be checked",
      "Customer facts must be accurate",
    ],
  ],
  ["A flood damaging a shop is a:", ["Peril", "Premium", "Commission", "Endorsement"]],
  [
    "Poor housekeeping in a factory is a:",
    ["Physical hazard", "Moral hazard", "Claim form", "Reinsurance"],
  ],
  [
    "Hiding vehicle commercial use is:",
    [
      "Material misrepresentation risk",
      "Good sales practice",
      "Valid discount method",
      "Always allowed",
    ],
  ],
  [
    "IRDAI's role includes:",
    [
      "Protecting policyholders and regulating industry growth",
      "Repairing cars",
      "Running hospitals",
      "Approving each commission",
    ],
  ],
  [
    "Official source for current insurer lists:",
    ["IRDAI website", "Old screenshot", "Random blog", "WhatsApp forward"],
  ],
  [
    "A reinsurer helps:",
    [
      "Insurers manage transferred risk",
      "Customers buy groceries",
      "Hospitals issue policies",
      "Surveyors sell products",
    ],
  ],
  [
    "POSP can solicit:",
    [
      "Only authorized permitted products",
      "All financial products",
      "Any product requested",
      "Only after claim",
    ],
  ],
  [
    "A POSP should avoid:",
    [
      "Selecting unauthorized products",
      "Viewing training",
      "Reading policy wording",
      "Taking MCQs",
    ],
  ],
  [
    "A broker broadly acts as:",
    [
      "Insurance intermediary under broker regulations",
      "Hospital",
      "Only claim settler",
      "Insurer replacement",
    ],
  ],
  [
    "A TPA generally supports:",
    [
      "Health claim servicing/cashless coordination",
      "Driving licences",
      "FDI approval",
      "Tax filing",
    ],
  ],
  [
    "Bima Bharosa helps with:",
    [
      "Insurance grievance registration/tracking",
      "Fuel payment",
      "Bank opening",
      "Stock trading",
    ],
  ],
  [
    "Which should be captured after training?",
    [
      "Time spent, score and declaration",
      "Only selfie",
      "Only browser type",
      "Only IP address",
    ],
  ],
  [
    "Check-answer interaction is used to:",
    [
      "Encourage attempt before answer viewing",
      "Hide training",
      "Reduce content",
      "Disable review",
    ],
  ],
  [
    "Which is a moral hazard?",
    ["Dishonest claim behaviour", "Flood", "Fire", "Earthquake"],
  ],
  [
    "Insurance does not normally cover:",
    [
      "Known intentional loss outside policy terms",
      "Uncertain covered losses",
      "Motor accidents as per policy",
      "Hospitalization as per policy",
    ],
  ],
  [
    "Why disclose product limits?",
    [
      "To prevent mis-selling and set expectations",
      "To avoid consent",
      "To guarantee approval",
      "To eliminate claims",
    ],
  ],
  [
    "Annual reports are useful because they:",
    [
      "Provide official sector information and trends",
      "Replace policy wording",
      "Guarantee claims",
      "Remove training need",
    ],
  ],
  [
    "Final assessment should be:",
    [
      "Randomized and auditable where possible",
      "Optional only",
      "Answers visible before attempt",
      "Untracked",
    ],
  ],
];
