import { QuizQuestion } from "./pospModule1Quiz";

export interface Module2Section {
  title: string;
  time: string;
  blocks: [string, string][];
  note?: string;
  activity: string;
  resources: string[];
  quiz: QuizQuestion[];
}

export const MODULE2_SECTIONS: Module2Section[] = [
  {
    title: "Section 1 — Insurance Contract and Valid Consent",
    time: "Estimated review time: 55 minutes",
    blocks: [
      [
        "Insurance as a Contract",
        "An insurance policy is a legal contract between the insurer and the insured. A proposal gives information and makes an offer; the insurer may accept, reject or accept with modified terms. Premium is the consideration paid for the insurer's promise to cover eligible losses.",
      ],
      [
        "Consent and Customer Understanding",
        "Free consent means the customer should not be forced, misled or pressured. The customer must understand the product, key terms, exclusions and what the premium includes.",
      ],
    ],
    note:
      "Never hide exclusions or important policy assumptions. Do not use another person's mobile number, email, PAN, Aadhaar or bank details. Do not submit documents without customer consent.",
    activity:
      "Self-learning activity: Prepare a checklist of customer details that must be verified before submitting any proposal.",
    resources: [
      "Insurance Institute of India - IC-38 study material",
      "Policyholder portal - Buy with care",
      "IRDAI Connects policyholder education",
    ],
    quiz: [
      [
        "An insurance policy is best described as:",
        ["A legal contract", "Only a receipt", "Only a marketing brochure", "A guaranteed claim approval"],
      ],
      [
        "Who generally makes the proposal in insurance?",
        ["Surveyor", "Proposer/customer", "Repair garage", "Hospital"],
      ],
      [
        "Premium is:",
        ["Claim payment", "Consideration paid by the insured for coverage", "Penalty for complaint", "Survey fee"],
      ],
      [
        "Free consent means customer is:",
        [
          "Forced to buy",
          "Clearly informed and not misled/pressured",
          "Not allowed to read documents",
          "Promised guaranteed claim",
        ],
      ],
      [
        "A POSP should submit proposal details based on:",
        [
          "Guesswork",
          "Customer-provided and verified information",
          "Competitor suggestion",
          "Old policy data without checking",
        ],
      ],
    ],
  },
  {
    title: "Section 2 — Core Insurance Principles",
    time: "Estimated review time: 60 minutes",
    blocks: [
      [
        "Insurable Interest",
        "Insurable interest means the insured must have a legally recognized financial interest in the subject matter. A person must suffer a financial loss if the insured event occurs.",
      ],
      [
        "Utmost Good Faith",
        "Both parties should disclose all material facts. The proposer must disclose facts that may influence the insurer's decision, premium or terms.",
      ],
      [
        "Indemnity, Subrogation and Contribution",
        "Indemnity aims to restore the insured to the financial position before the loss, without profit. Subrogation allows the insurer, after paying a claim, to recover from a responsible third party. Contribution may apply when multiple policies cover the same subject matter.",
      ],
      [
        "Proximate Cause",
        "Proximate cause is the dominant effective cause of loss and helps decide whether the loss falls within covered perils or exclusions.",
      ],
    ],
    activity:
      "Self-learning activity: For each case, identify the applicable principle: hiding diabetes, insuring a neighbour's car, claiming from two insurers for one loss, or recovery from a negligent third party.",
    resources: [
      "Insurance Institute of India - IC-38 study material",
      "Policyholder portal - Consumer affairs booklet",
      "IRDAI Connects YouTube videos",
    ],
    quiz: [
      [
        "Insurable interest means:",
        ["Legal/financial interest in the subject matter", "Low premium", "High commission", "Only a document"],
      ],
      [
        "Hiding a pre-existing disease violates:",
        ["Utmost good faith", "Contribution only", "Subrogation only", "No principle"],
      ],
      [
        "Indemnity aims to:",
        [
          "Create profit from loss",
          "Restore financial position subject to policy terms",
          "Guarantee investment return",
          "Avoid documents",
        ],
      ],
      [
        "Subrogation means:",
        [
          "Insurer steps into insured's recovery rights after claim payment",
          "Customer gets double claim",
          "Premium refund always",
          "Policy cancellation",
        ],
      ],
      [
        "Proximate cause helps decide:",
        ["Dominant cause of loss and claim coverage", "Customer age only", "Broker commission", "GST rate"],
      ],
    ],
  },
  {
    title: "Section 3 — Proposal, Policy Documents, Premium and Rebating",
    time: "Estimated review time: 60 minutes",
    blocks: [
      [
        "Proposal Form and Sales Information",
        "The proposal form captures information needed by the insurer to assess risk. A POSP should ensure customer details, declarations, previous insurance and material facts are correct.",
      ],
      [
        "Policy Schedule, Wording, Endorsement and Warranty",
        "The policy schedule shows key policy information. Policy wording explains coverage, exclusions and conditions. Endorsements amend the policy after issue; warranties and conditions must be understood and followed.",
      ],
      [
        "Premium Payment Discipline and Section 64VB Concept",
        "Insurance risk should not be assumed unless premium is received in advance or is permitted by law/regulation. A POSP should not promise policy start before successful payment confirmation and should provide valid receipts.",
      ],
      [
        "Rebating and False Inducement",
        "Do not offer unauthorized rebate, discount, cash-back or commission-sharing to induce a customer to buy or renew. Do not use false statements or suggest guaranteed claim outcomes.",
      ],
    ],
    note:
      'Never say: "I will give you part of my commission", "claim is guaranteed", "no need to disclose old illness", or "policy will start even if payment fails".',
    activity:
      "Self-learning activity: Prepare a sample policy schedule and identify policyholder, period, premium, sum insured, deductibles, nominees, add-ons, exclusions and claim contact details.",
    resources: [
      "IRDAI consolidated regulations",
      "Policyholder portal - Buy with care",
      "Insurance Institute of India - IC-38",
    ],
    quiz: [
      [
        "The proposal form is important because it:",
        ["Helps the insurer assess risk", "Is only decorative", "Replaces policy wording", "Guarantees all claims"],
      ],
      [
        "An endorsement is used to:",
        ["Make formal changes to a policy", "Pay hospital bills directly", "Avoid premium", "Hide customer details"],
      ],
      [
        "Section 64VB concept broadly relates to:",
        ["Premium before assumption of risk", "Surveyor fee only", "Vehicle registration only", "Nominee change"],
      ],
      [
        "Offering part of commission as inducement is:",
        ["Good service", "Rebating/inducement risk", "Mandatory", "Claim support"],
      ],
      [
        "POSP should collect premium:",
        ["Through authorized payment channels only", "In personal account always", "After claim", "Only in cash"],
      ],
    ],
  },
  {
    title: "Section 4 — Claim Process and Documentation",
    time: "Estimated review time: 55 minutes",
    blocks: [
      [
        "Claim Intimation",
        "A claim starts when the insured event occurs and the policyholder informs the insurer through the prescribed channel. Intimation should be prompt and include basic details such as policy number, insured name, date/time/place of loss, nature of loss and contact details.",
      ],
      [
        "Documents and Evidence",
        "Documents vary by product. Typical records may include policy, ID, claim form, photos, estimates, FIR where applicable, medical records, bills, discharge summary, prescriptions, investigation reports and KYC.",
      ],
      [
        "Survey, Assessment and Settlement",
        "For eligible general insurance claims, the insurer may appoint a surveyor/assessor. A POSP should guide the customer to cooperate, provide truthful documents and avoid influencing or fabricating evidence.",
      ],
      [
        "Your Role During Claims",
        "Guide the customer to the insurer's claim channel, explain required documentation, do not promise approval or amount, do not interfere with independent survey and keep communication factual and transparent.",
      ],
    ],
    activity:
      "Self-learning activity: Create three claim checklists: motor accidental damage, health hospitalization and personal accident death/disablement.",
    resources: [
      "Policyholder portal - Consumer affairs booklet",
      "IRDAI Connects videos",
      "Insurance Institute of India - IC-38",
    ],
    quiz: [
      [
        "Claim intimation should be:",
        ["Delayed deliberately", "Prompt and through prescribed channel", "Only verbal to friend", "Avoided if small loss"],
      ],
      [
        "A POSP may help customer by:",
        ["Creating false bills", "Guiding on documents", "Guaranteeing claim amount", "Influencing surveyor"],
      ],
      [
        "FIR may be required in cases such as:",
        ["Theft or major accident", "Every premium payment", "Every address change", "Every policy download"],
      ],
      [
        "Cashless health claim means:",
        [
          "Guaranteed full payment always",
          "Subject to authorization and policy terms",
          "No documents needed",
          "Premium waived forever",
        ],
      ],
      [
        "Surveyor's role is to:",
        ["Assess loss where applicable", "Sell policies", "Collect commission", "Change customer age"],
      ],
    ],
  },
  {
    title: "Section 5 — Grievance, AML/KYC and POSP Conduct",
    time: "Estimated review time: 55 minutes",
    blocks: [
      [
        "Grievance Redressal",
        "If a customer has a complaint, guide them to the insurer's official support/grievance channel. If unresolved, they may use Bima Bharosa/IGMS or other permitted escalation routes. Your role is to guide transparently, not suppress complaints.",
      ],
      [
        "AML/KYC Awareness",
        "KYC helps identify the customer and reduce misuse of insurance for illegal purposes. A POSP should only use genuine documents, verify identity, and report unusual or suspicious activity through official channels.",
      ],
      [
        "Data Privacy and Communication",
        "Customer KYC, health, financial and policy documents are sensitive. Do not share them publicly or with unauthorized persons. Use official and secure channels.",
      ],
      [
        "POSP Do's and Don'ts",
        "Explain benefits, exclusions and customer duties. Use authorized products and channels. Capture correct KYC/proposal data. Never promise claim approval, offer unauthorized rebates, use fake documents or guide customers to hide material information.",
      ],
    ],
    activity:
      "Self-learning activity: Read Bima Bharosa/IGMS guidance and write the steps you would explain to a customer unhappy with claim delay.",
    resources: [
      "Bima Bharosa integrated grievance system",
      "Policyholder portal - Buy with care",
      "IRDAI Connects YouTube videos",
    ],
    quiz: [
      [
        "If a customer has a complaint, first guide them to:",
        ["Ignore grievance channel", "Insurer grievance registration/tracking", "Social media only", "Repair garage"],
      ],
      [
        "Bima Bharosa/IGMS is used for:",
        [
          "Insurance grievance registration/tracking",
          "Vehicle fuel payment",
          "Hospital appointment booking",
          "Tax filing",
        ],
      ],
      [
        "KYC helps with:",
        ["Customer identification and misuse prevention", "Claim guarantee", "Commission increase", "Skipping proposal"],
      ],
      [
        "Customer documents should be stored/shared:",
        [
          "Only through authorized secure channels",
          "On public WhatsApp groups",
          "With unrelated vendors",
          "In personal social media",
        ],
      ],
      [
        "A POSP should not:",
        ["Explain exclusions", "Offer unauthorized rebate", "Guide on documents", "Use official channels"],
      ],
    ],
  },
];

export const MODULE2_FINAL_QUIZ: QuizQuestion[] = [
  ["Insurance policy is generally a:", ["Contract", "Lottery ticket", "Hospital card only", "Repair bill"]],
  [
    "Proposal accuracy matters because:",
    ["It affects underwriting and claims", "It has no effect", "It replaces premium", "It avoids consent"],
  ],
  [
    "Utmost good faith requires:",
    ["Truthful disclosure of material facts", "Hiding illness", "False NCB", "Skipping declarations"],
  ],
  ["Indemnity prevents:", ["Profit from insured loss", "Policy issue", "Premium payment", "Customer communication"]],
  [
    "Subrogation allows insurer to:",
    [
      "Recover from responsible third party after paying claim",
      "Give commission rebate",
      "Change DOB",
      "Issue PUC",
    ],
  ],
  ["Proximate cause means:", ["Dominant effective cause of loss", "Premium amount", "Policy number", "Customer age"]],
  ["A policy endorsement is:", ["Formal policy change", "Claim guarantee", "Cash discount", "KYC document"]],
  ["64VB concept is linked to:", ["Premium before risk assumption", "Grievance video", "Hospital network", "FIR"]],
  ["Rebating means:", ["Unauthorized rebate/inducement", "Reading policy", "Collecting KYC", "Explaining deductibles"]],
  [
    "Cashless claim is:",
    ["Subject to authorization and policy terms", "Guaranteed full claim", "No document claim", "Policy cancellation"],
  ],
  ["FIR may be needed in:", ["Theft or major accident", "Every quote", "Every email", "Every premium receipt"]],
  ["Surveyor assesses:", ["Loss cause/extent where applicable", "POSP exam", "Customer salary", "Broker website"]],
  ["KYC supports:", ["Customer identification and AML controls", "Claim guarantee", "NCB transfer", "Commission"]],
  [
    "Customer documents should be handled:",
    ["Privately and securely", "With unrelated sellers", "Without consent", "Generally on public platforms"],
  ],
  ["Bima Bharosa helps with:", ["Insurance grievances", "Fuel payment", "Policy printing only", "Vehicle servicing"]],
  ["POSP should avoid saying:", ["Claim guaranteed", "Read exclusions", "Use official channel", "Submit documents"]],
  ["Customer consent should be:", ["Clear and informed", "Forced", "Assumed always", "Skipped"]],
  [
    "Material fact is one that can affect:",
    ["Insurer's decision/premium/terms", "Only tax rate", "Only logo", "Only website color"],
  ],
  [
    "POSP can guide claims by:",
    ["Explaining document requirements", "Creating false bills", "Influencing surveyor", "Changing cause of loss"],
  ],
  [
    "Ethical POSP conduct includes:",
    ["Transparency and customer-first communication", "Rebating", "False declarations", "Document misuse"],
  ],
];
