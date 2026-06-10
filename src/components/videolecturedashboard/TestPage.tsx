"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/components/videolecturedashboard/Testpage.module.css";
import image1 from "@/assets/testdashboard/image1.png";
import image2 from "@/assets/testdashboard/image2.png";
import image3 from "@/assets/testdashboard/image3.png";
import image4 from "@/assets/testdashboard/image4.png";
import image5 from "@/assets/testdashboard/image5.png";
import image6 from "@/assets/testdashboard/image6.png";

import Image from "next/image";

/* ======================================================
   QUESTION SETS (5 SETS × 50 QUESTIONS)
====================================================== */
const QUESTION_SETS = [
  {
    set: 1,
    questions: [
      {
        id: 1,
        q: "Insurance is a mechanism for:",
        choices: [
          "Profit maximization",
          "Risk transfer",
          "Risk creation",
          "Increasing expenses",
        ],
        answer: 1,
      },
      {
        id: 2,
        q: "The regulator for insurance in India is:",
        choices: ["RBI", "SEBI", "IRDAI", "IBA"],
        answer: 0,
      },
      {
        id: 3,
        q: "A POSP can sell:",
        choices: [
          "Complex corporate insurance",
          "Pre-approved simple retail products",
          "Reinsurance contracts",
          "Life annuity products",
        ],
        answer: 2,
      },
      {
        id: 4,
        q: "The full form of KYC is:",
        choices: [
          "Know Your Customer",
          "Keep Your Card",
          "Know Your Commission",
          "Key Yearly Contribution",
        ],
        answer: 1,
      },
      {
        id: 5,
        q: "Proposal form is filled by the:",
        choices: ["Agent", "Insurer", "Prospect/customer", "IRDAI"],
        answer: 2,
      },
      {
        id: 6,
        q: "Motor insurance is mandatory under:",
        choices: [
          "Companies Act",
          "Motor Vehicles Act",
          "Consumer Protection Act",
          "Income Tax Act",
        ],
        answer: 0,
      },
      {
        id: 7,
        q: "The minimum mandatory motor cover is:",
        choices: [
          "Own Damage",
          "Third-Party Liability",
          "Personal Accident",
          "Zero Depreciation",
        ],
        answer: 1,
      },
      {
        id: 8,
        q: "Health insurance covers:",
        choices: [
          "Loss of job",
          "Medical expenses",
          "Buying medicines only",
          "Vehicle theft",
        ],
        answer: 2,
      },
      {
        id: 9,
        q: "In insurance, premium is:",
        choices: [
          "Fee paid for claim",
          "Price of insurance cover",
          "Bonus",
          "Interest",
        ],
        answer: 1,
      },
      {
        id: 10,
        q: "Underwriting means:",
        choices: [
          "Approving loans",
          "Assessing risk",
          "Conducting surveys",
          "Repairing vehicles",
        ],
        answer: 2,
      },

      {
        id: 11,
        q: "POSP must follow:",
        choices: [
          "Company ethics only",
          "IRDAI guidelines",
          "Customer instructions only",
          "Market trends",
        ],
        answer: 3,
      },
      {
        id: 12,
        q: "Policy period usually is:",
        choices: ["1 month", "1 year", "10 years", "Lifetime"],
        answer: 1,
      },
      {
        id: 13,
        q: "IDV in motor refers to:",
        choices: [
          "Insurance Depreciation Value",
          "Insured Declared Value",
          "Internal Damage Value",
          "Increased Driver Value",
        ],
        answer: 2,
      },
      {
        id: 14,
        q: "The free-look period in health is generally:",
        choices: ["5 days", "15 days", "1 year", "60 days"],
        answer: 2,
      },
      {
        id: 15,
        q: "A claim is payable only if:",
        choices: [
          "Customer wants it",
          "Policy is valid",
          "POSP approves",
          "Repairer consents",
        ],
        answer: 0,
      },
      {
        id: 16,
        q: "Travel insurance covers:",
        choices: [
          "Flight delay",
          "Property tax",
          "Brokerage fees",
          "Car maintenance",
        ],
        answer: 1,
      },
      {
        id: 17,
        q: "Mis-selling means:",
        choices: [
          "Selling correctly",
          "Selling without full disclosure",
          "Selling at discount",
          "Selling multiple products",
        ],
        answer: 2,
      },
      {
        id: 18,
        q: "Cooling-off period is also called:",
        choices: [
          "Free-look period",
          "Waiting period",
          "Grace period",
          "Underwriting period",
        ],
        answer: 1,
      },
      {
        id: 19,
        q: "Fire insurance covers:",
        choices: [
          "Health issues",
          "Loss/damage due to fire",
          "Theft of jewellery",
          "Motor accidents",
        ],
        answer: 0,
      },
      {
        id: 20,
        q: "TPA in health insurance stands for:",
        choices: [
          "Third Party Assistance",
          "Third Party Administrator",
          "Travel Protection Agency",
          "Taxpayer Authority",
        ],
        answer: 0,
      },

      {
        id: 21,
        q: "Grace period is available in:",
        choices: [
          "Health renewals",
          "Motor break-in",
          "New policy",
          "All claims",
        ],
        answer: 1,
      },
      {
        id: 22,
        q: "Endorsement means:",
        choices: [
          "Policy cancellation",
          "Policy modification",
          "Claim settlement",
          "Premium refund",
        ],
        answer: 3,
      },
      {
        id: 23,
        q: "Exclusions refer to:",
        choices: [
          "Covered items",
          "Not covered items",
          "Discounts",
          "Tax benefits",
        ],
        answer: 0,
      },
      {
        id: 24,
        q: "Insurance mitigates:",
        choices: [
          "Speculative risk",
          "Pure risk",
          "Gambling risk",
          "Political risk",
        ],
        answer: 1,
      },
      {
        id: 25,
        q: "POSP training duration as per IRDAI is:",
        choices: ["100 hours", "15 hours", "3 hours", "50 hours"],
        answer: 1,
      },
      {
        id: 26,
        q: "NCB in motor is given for:",
        choices: [
          "Raising claim",
          "No claim in previous year",
          "Theft",
          "Car modification",
        ],
        answer: 1,
      },
      {
        id: 27,
        q: "Health insurance waiting period applies to:",
        choices: ["Accidents", "Pre-existing diseases", "Fire claims", "Theft"],
        answer: 1,
      },
      {
        id: 28,
        q: "Premium depends on:",
        choices: [
          "Age, risk, product",
          "Weather",
          "Random choice",
          "Discount rates only",
        ],
        answer: 3,
      },
      {
        id: 29,
        q: "Proposal form should be signed by:",
        choices: ["POSP only", "Customer", "Mechanic", "Surveyor"],
        answer: 2,
      },
      {
        id: 30,
        q: "Add-on in motor refers to:",
        choices: [
          "Extra coverage",
          "Claim",
          "Deductible increase",
          "Policy cancellation",
        ],
        answer: 1,
      },

      {
        id: 31,
        q: "OD claim in motor refers to:",
        choices: [
          "Own Damage",
          "Other Damage",
          "Only Damage",
          "Outstanding Debt",
        ],
        answer: 2,
      },
      {
        id: 32,
        q: "POSP must avoid:",
        choices: [
          "Explaining clearly",
          "Mis-representation",
          "KYC",
          "Transparency",
        ],
        answer: 0,
      },
      {
        id: 33,
        q: "Cashless facility means:",
        choices: [
          "No premium paid",
          "No payment at hospital/garage",
          "No deductible",
          "Full refund immediately",
        ],
        answer: 1,
      },
      {
        id: 34,
        q: "TPL premium is decided by:",
        choices: ["POSP", "IRDAI", "Customer", "Surveyor"],
        answer: 0,
      },
      {
        id: 35,
        q: "Insurance contract requires:",
        choices: ["Insurable interest", "Friendship", "Hearsay", "Assumptions"],
        answer: 3,
      },
      {
        id: 36,
        q: "Proposal form is a:",
        choices: ["Legal document", "Greeting card", "Invoice", "Receipt"],
        answer: 1,
      },
      {
        id: 37,
        q: "POSP earns:",
        choices: [
          "Salary only",
          "Commission based on sales",
          "Claim amount",
          "Profit share",
        ],
        answer: 3,
      },
      {
        id: 38,
        q: "Health insurance claim types include:",
        choices: [
          "Cashless & reimbursement",
          "Only cashless",
          "Only reimbursement",
          "Telegraphic",
        ],
        answer: 1,
      },
      {
        id: 39,
        q: "Deductible means:",
        choices: [
          "Refund bonus",
          "Customer pays first part of claim",
          "Tax exemption",
          "Discount",
        ],
        answer: 1,
      },
      {
        id: 40,
        q: "KYC includes:",
        choices: [
          "PAN, Aadhaar, address proof",
          "Movie tickets",
          "Insurance card",
          "Driving license only",
        ],
        answer: 1,
      },

      {
        id: 41,
        q: "Lapse of policy means:",
        choices: [
          "Full cover",
          "Policy expired due to non-payment",
          "Claim paid",
          "Will never renew",
        ],
        answer: 1,
      },
      {
        id: 42,
        q: "Surveyor is appointed for:",
        choices: [
          "Motor OD claims",
          "Cashless health claims",
          "ID proof verification",
          "Sales process",
        ],
        answer: 2,
      },
      {
        id: 43,
        q: "Moral hazard refers to:",
        choices: [
          "Customer hiding facts",
          "Highway safety",
          "Natural disaster",
          "Termination",
        ],
        answer: 1,
      },
      {
        id: 44,
        q: "Material fact is:",
        choices: [
          "Irrelevant detail",
          "Important information affecting risk",
          "Sales pitch",
          "Customer opinion",
        ],
        answer: 2,
      },
      {
        id: 45,
        q: "Free-look applies to:",
        choices: [
          "First-time health policies",
          "Motor OD",
          "3rd party motor",
          "Marine policies",
        ],
        answer: 0,
      },
      {
        id: 46,
        q: "POSP appointment is given by:",
        choices: ["IRDAI", "Insurance Broker/Insurer", "Surveyor", "TPA"],
        answer: 2,
      },
      {
        id: 47,
        q: "Claim repudiation means:",
        choices: [
          "Claim paid",
          "Claim rejected",
          "Claim delayed",
          "Claim doubled",
        ],
        answer: 2,
      },
      {
        id: 48,
        q: "Insurance is based on the principle of:",
        choices: ["Utmost good faith", "Gambling", "Lottery", "Free choice"],
        answer: 3,
      },
      {
        id: 49,
        q: "Waiting period for maternity is usually:",
        choices: ["1 day", "9 months–4 years", "1 year", "10 years"],
        answer: 1,
      },
      {
        id: 50,
        q: "Contract comes into force after:",
        choices: [
          "Proposal submission",
          "Premium payment & acceptance",
          "POSP approval",
          "Medical test only",
        ],
        answer: 1,
      },
    ],
  },

  /* ================= SET 2 ================= */
  {
    set: 2,
    questions: [
      {
        id: 1,
        q: "The primary role of insurance is to:",
        choices: [
          "Eliminate risk",
          "Reduce and transfer risk",
          "Increase risk",
          "Encourage speculation",
        ],
        answer: 1,
      },
      {
        id: 2,
        q: "IRDAI stands for:",
        choices: [
          "Indian Regulatory Department of Account Information",
          "Insurance Regulatory and Development Authority of India",
          "International Risk Development Agency of India",
          "Insurance Review Department of India",
        ],
        answer: 2,
      },
      {
        id: 3,
        q: "POSP stands for:",
        choices: [
          "Point of Sales Procedure",
          "Person of Special Products",
          "Point of Sales Person",
          "Primary Operator Sales Person",
        ],
        answer: 3,
      },
      {
        id: 4,
        q: "A POSP is allowed to sell:",
        choices: [
          "Reinsurance",
          "High-risk corporate insurance",
          "Approved simple retail insurance products",
          "ULIPs",
        ],
        answer: 0,
      },
      {
        id: 5,
        q: "Insurance works on which principle?",
        choices: [
          "Contribution",
          "Utmost Good Faith",
          "Compensation",
          "All of the above",
        ],
        answer: 1,
      },

      {
        id: 6,
        q: "Fire insurance is an example of:",
        choices: [
          "Life insurance",
          "General insurance",
          "Mutual fund",
          "Banking product",
        ],
        answer: 0,
      },
      {
        id: 7,
        q: "A policyholder is:",
        choices: [
          "Person who buys the policy",
          "Insurance company",
          "POSP",
          "Surveyor",
        ],
        answer: 1,
      },
      {
        id: 8,
        q: "Claim is payable only when:",
        choices: [
          "Policy is active",
          "POSP approves",
          "Customer insists",
          "Garage requests",
        ],
        answer: 1,
      },
      {
        id: 9,
        q: "Third-party motor insurance is:",
        choices: [
          "Optional",
          "Mandatory by law",
          "Discretionary",
          "Not required for two-wheelers",
        ],
        answer: 0,
      },
      {
        id: 10,
        q: "Premium refers to:",
        choices: [
          "Insurance tax",
          "Payment for purchasing insurance",
          "Refund amount",
          "Commission",
        ],
        answer: 1,
      },

      {
        id: 11,
        q: "IRDAI mandates POSP training of:",
        choices: ["10 hours", "15 hours", "25 hours", "40 hours"],
        answer: 2,
      },
      {
        id: 12,
        q: "Health insurance waiting periods apply to:",
        choices: [
          "Accidents",
          "Pre-existing diseases",
          "Motor claims",
          "Fire claims",
        ],
        answer: 1,
      },
      {
        id: 13,
        q: "Proposal form contains:",
        choices: [
          "Financial background only",
          "Complete information about proposer",
          "Only health history",
          "POSP details",
        ],
        answer: 2,
      },
      {
        id: 14,
        q: "Underwriting is done by:",
        choices: ["Customer", "POSP", "Insurer", "TPA"],
        answer: 2,
      },
      {
        id: 15,
        q: "TPA helps in:",
        choices: [
          "Motor claims",
          "Health claims processing",
          "Home loan approval",
          "Fire safety checks",
        ],
        answer: 1,
      },

      {
        id: 16,
        q: "Insurance contract requires:",
        choices: [
          "Insurable interest",
          "Misrepresentation",
          "Hidden facts",
          "None",
        ],
        answer: 2,
      },
      {
        id: 17,
        q: "Free-look period is usually:",
        choices: ["5 days", "15 days", "60 days", "1 day"],
        answer: 0,
      },
      {
        id: 18,
        q: "In motor insurance, IDV means:",
        choices: [
          "Insurance Derived Value",
          "Insured Declared Value",
          "Internal Damage Value",
          "Input Depreciation Value",
        ],
        answer: 1,
      },
      {
        id: 19,
        q: "Insurance fraud includes:",
        choices: [
          "Giving accurate information",
          "Withholding facts intentionally",
          "Timely renewal",
          "Premium payment",
        ],
        answer: 2,
      },
      {
        id: 20,
        q: "Deductible means:",
        choices: [
          "Amount insurer pays first",
          "Amount customer pays first",
          "Bonus",
          "Zero depreciation add-on",
        ],
        answer: 0,
      },

      {
        id: 21,
        q: "NCB stands for:",
        choices: [
          "New Car Benefit",
          "No Claim Bonus",
          "National Car Burden",
          "Non-Claim Burden",
        ],
        answer: 1,
      },
      {
        id: 22,
        q: "POSP must disclose:",
        choices: [
          "Only positive information",
          "Only discounts",
          "All relevant information",
          "Nothing",
        ],
        answer: 3,
      },
      {
        id: 23,
        q: "Cooling-off period is same as:",
        choices: [
          "Grace period",
          "Free-look period",
          "Waiting period",
          "Renewed policy",
        ],
        answer: 1,
      },
      {
        id: 24,
        q: "Grace period applies to:",
        choices: [
          "Health renewals",
          "Motor expiry",
          "Fire policy",
          "All new policies",
        ],
        answer: 2,
      },
      {
        id: 25,
        q: "A cover note is:",
        choices: [
          "Proposal form",
          "Temporary insurance proof",
          "Claim form",
          "Receipt",
        ],
        answer: 3,
      },

      {
        id: 26,
        q: "Surveyor works in:",
        choices: [
          "OD motor claims",
          "Credit card processing",
          "Home loans",
          "Mall inspections",
        ],
        answer: 2,
      },
      {
        id: 27,
        q: "Reimbursement claim means:",
        choices: [
          "Customer pays upfront",
          "Hospital pays upfront",
          "POSP pays",
          "TPA pays first",
        ],
        answer: 1,
      },
      {
        id: 28,
        q: "Cashless claim means:",
        choices: [
          "No premium",
          "No payment at network hospital/garage",
          "Claim rejection",
          "Double payment",
        ],
        answer: 1,
      },
      {
        id: 29,
        q: "In motor insurance, add-ons include:",
        choices: [
          "Zero depreciation",
          "Room rent cap",
          "Maternity cover",
          "Travel delay",
        ],
        answer: 0,
      },
      {
        id: 30,
        q: "Moral hazard refers to:",
        choices: [
          "Natural disasters",
          "Customer behaving riskier after buying insurance",
          "Floods",
          "Riots",
        ],
        answer: 0,
      },

      {
        id: 31,
        q: "Policy schedule contains:",
        choices: [
          "Premium amount",
          "Coverage details",
          "Vehicle/insured details",
          "All of the above",
        ],
        answer: 1,
      },
      {
        id: 32,
        q: "Renewal is the process of:",
        choices: [
          "Buying new property",
          "Extending policy for next term",
          "Claim settlement",
          "Appealing to IRDAI",
        ],
        answer: 2,
      },
      {
        id: 33,
        q: "Material facts must be:",
        choices: ["Hidden", "Incorrect", "Fully disclosed", "Avoided"],
        answer: 1,
      },
      {
        id: 34,
        q: "Principle of indemnity means:",
        choices: [
          "Profit from insurance",
          "Restore insured to original position",
          "Guaranteed gain",
          "Double claim",
        ],
        answer: 0,
      },
      {
        id: 35,
        q: "POSP cannot:",
        choices: [
          "Provide incorrect promises",
          "Explain product benefits",
          "Help fill forms",
          "Guide during claim",
        ],
        answer: 3,
      },

      {
        id: 36,
        q: "A floater health policy covers:",
        choices: [
          "Multiple family members",
          "Only one person",
          "Only parents",
          "Only children",
        ],
        answer: 1,
      },
      {
        id: 37,
        q: "In travel insurance, exclusions include:",
        choices: [
          "Loss of baggage",
          "War",
          "Flight delay",
          "Emergency medical",
        ],
        answer: 1,
      },
      {
        id: 38,
        q: "Burglary insurance covers:",
        choices: [
          "Fire damage",
          "Theft by forced entry",
          "Earthquakes",
          "Road accidents",
        ],
        answer: 0,
      },
      {
        id: 39,
        q: "Insurance ombudsman deals with:",
        choices: [
          "Small claim disputes",
          "GST cases",
          "Stock market fraud",
          "Housing loans",
        ],
        answer: 3,
      },
      {
        id: 40,
        q: "POSP must follow:",
        choices: [
          "IRDAI code of conduct",
          "Personal opinion",
          "Customer pressure",
          "Market rumours",
        ],
        answer: 0,
      },

      {
        id: 41,
        q: "Documents for KYC include:",
        choices: ["Aadhaar", "Passport", "PAN", "All of these"],
        answer: 2,
      },
      {
        id: 42,
        q: "Travel insurance is needed for:",
        choices: [
          "Risk-free travel",
          "Medical emergency abroad",
          "Income tax",
          "Shopping discounts",
        ],
        answer: 1,
      },
      {
        id: 43,
        q: "Premium increases in health insurance due to:",
        choices: ["Age increase", "Lesser risk", "No claim", "Exercising"],
        answer: 0,
      },
      {
        id: 44,
        q: "The proposer is:",
        choices: [
          "Person applying for insurance",
          "Surveyor",
          "Doctor",
          "Insured always",
        ],
        answer: 2,
      },
      {
        id: 45,
        q: "Claim intimation should be:",
        choices: ["Delayed", "Immediate", "After 30 days", "Not required"],
        answer: 3,
      },

      {
        id: 46,
        q: "Insurance reduces:",
        choices: ["Uncertainty", "Premium", "Discounts", "Accidents"],
        answer: 1,
      },
      {
        id: 47,
        q: "Exclusions are:",
        choices: [
          "Losses not covered",
          "Losses covered",
          "Bonuses",
          "Payment modes",
        ],
        answer: 0,
      },
      {
        id: 48,
        q: "Zero depreciation add-on covers:",
        choices: [
          "Full cost of parts",
          "Only labour",
          "Engine failure",
          "Theft only",
        ],
        answer: 1,
      },
      {
        id: 49,
        q: "Health insurance pre-approval is required for:",
        choices: [
          "Cashless hospitalization",
          "Reimbursement",
          "Policy issuance",
          "Buying medicines",
        ],
        answer: 2,
      },
      {
        id: 50,
        q: "POSP authorization is issued by:",
        choices: ["IRDAI", "Insurance Broker/Insurer", "Bank", "Surveyor"],
        answer: 1,
      },
    ],
  },

  /* ================= SET 3 ================= */
  {
    set: 3,
    questions: [
      {
        id: 1,
        q: "Insurance is a contract between:",
        choices: [
          "POSP and surveyor",
          "Insurer and insured",
          "POSP and IRDAI",
          "Customer and TPA",
        ],
        answer: 1,
      },
      {
        id: 2,
        q: "The main purpose of general insurance is to cover:",
        choices: ["Life risks", "Pure risks", "Savings", "Investments"],
        answer: 3,
      },
      {
        id: 3,
        q: "POSP must complete ______ hours of training.",
        choices: ["10", "15", "20", "30"],
        answer: 1,
      },
      {
        id: 4,
        q: "Insurance contract begins when:",
        choices: [
          "Proposal submitted",
          "Insurer accepts and premium is paid",
          "POSP signs form",
          "ID proof submitted",
        ],
        answer: 1,
      },
      {
        id: 5,
        q: "Which of the following is NOT a principle of insurance?",
        choices: ["Contribution", "Subrogation", "Indemnity", "Deception"],
        answer: 2,
      },

      {
        id: 6,
        q: "In motor insurance, OD refers to:",
        choices: [
          "Owner’s Discount",
          "Over Draft",
          "Own Damage",
          "Outer Damage",
        ],
        answer: 3,
      },
      {
        id: 7,
        q: "The customer must disclose:",
        choices: [
          "All material facts",
          "Only name",
          "Only PAN",
          "Only past claims",
        ],
        answer: 1,
      },
      {
        id: 8,
        q: "IRDAI regulates:",
        choices: [
          "Banks",
          "Insurance companies",
          "Mutual funds",
          "Stock exchanges",
        ],
        answer: 0,
      },
      {
        id: 9,
        q: "POSP stands for:",
        choices: [
          "Point of Sales Person",
          "Post Office Sales Person",
          "Primary Official Sales Person",
          "Policy on Sales Process",
        ],
        answer: 2,
      },
      {
        id: 10,
        q: "A policy document includes:",
        choices: [
          "Terms & conditions",
          "Coverage",
          "Exclusions",
          "All of the above",
        ],
        answer: 0,
      },

      {
        id: 11,
        q: "Motor third-party insurance is:",
        choices: ["Optional", "Mandatory", "Seasonal", "Expensive add-on"],
        answer: 2,
      },
      {
        id: 12,
        q: "Health insurance covers:",
        choices: [
          "Regular clinic visits",
          "Hospitalization expenses",
          "Car repairs",
          "Property taxes",
        ],
        answer: 0,
      },
      {
        id: 13,
        q: "Free-look period allows:",
        choices: [
          "Editing policy wording",
          "Cancellation within allowed time",
          "Claim filing",
          "Discount removal",
        ],
        answer: 0,
      },
      {
        id: 14,
        q: "Fire insurance generally covers:",
        choices: [
          "Construction faults",
          "Loss due to fire",
          "Loss due to rain",
          "Loss due to medical emergency",
        ],
        answer: 1,
      },
      {
        id: 15,
        q: "Subrogation applies to:",
        choices: [
          "Life insurance",
          "General insurance",
          "All investments",
          "FDs",
        ],
        answer: 2,
      },

      {
        id: 16,
        q: "Proposal form is filled by:",
        choices: ["Insurer", "Customer", "Surveyor", "IRDAI"],
        answer: 3,
      },
      {
        id: 17,
        q: "POSP earns:",
        choices: [
          "Commission",
          "Salary from IRDAI",
          "Claim amount",
          "Tax benefit",
        ],
        answer: 1,
      },
      {
        id: 18,
        q: "In health insurance, TPA works as:",
        choices: [
          "Claim processor",
          "Policy creator",
          "Fire surveyor",
          "OD inspector",
        ],
        answer: 0,
      },
      {
        id: 19,
        q: "The term 'premium' refers to:",
        choices: [
          "Price of the insurance cover",
          "Claim amount",
          "GST rate",
          "Bonus",
        ],
        answer: 0,
      },
      {
        id: 20,
        q: "Proposal form is a ______ document.",
        choices: ["Temporary", "Mandatory", "Optional", "Duplicate"],
        answer: 1,
      },

      {
        id: 21,
        q: "No Claim Bonus (NCB) is given for:",
        choices: [
          "Filing claim",
          "Not filing claim",
          "Buying new vehicle",
          "Premium payment",
        ],
        answer: 3,
      },
      {
        id: 22,
        q: "Moral hazard refers to:",
        choices: [
          "Natural calamities",
          "Deliberate carelessness by customer",
          "Floods",
          "Fire",
        ],
        answer: 0,
      },
      {
        id: 23,
        q: "A deductible is:",
        choices: [
          "Premium discount",
          "Amount customer pays before insurer pays",
          "NCB",
          "Add-on cover",
        ],
        answer: 0,
      },
      {
        id: 24,
        q: "Add-ons in motor insurance:",
        choices: [
          "Increase coverage",
          "Reduce coverage",
          "Deny claims",
          "Stop policy",
        ],
        answer: 2,
      },
      {
        id: 25,
        q: "Insurance is based on ______ good faith.",
        choices: ["Limited", "Partial", "Utmost", "Divided"],
        answer: 1,
      },

      {
        id: 26,
        q: "Waiting period in health insurance applies to:",
        choices: [
          "Accidents",
          "Pre-existing conditions",
          "Tyre damage",
          "Fire accident",
        ],
        answer: 3,
      },
      {
        id: 27,
        q: "Travel insurance covers:",
        choices: [
          "Flight delay, lost luggage",
          "Building collapse",
          "Motor accident",
          "Car servicing",
        ],
        answer: 2,
      },
      {
        id: 28,
        q: "IDV affects:",
        choices: ["Claim amount", "Health coverage", "Travel premium", "None"],
        answer: 1,
      },
      {
        id: 29,
        q: "Insurance product sales must be:",
        choices: ["Fast", "Transparent", "Misleading", "Confusing"],
        answer: 0,
      },
      {
        id: 30,
        q: "POSP must ensure:",
        choices: [
          "Wrong information given",
          "Customer understands coverage",
          "Premium is unknown",
          "Hidden fees",
        ],
        answer: 3,
      },

      {
        id: 31,
        q: "Mis-selling means:",
        choices: [
          "Telling truth",
          "Hiding important details",
          "Giving brochure",
          "Claim settlement",
        ],
        answer: 2,
      },
      {
        id: 32,
        q: "Endorsement refers to:",
        choices: [
          "Claim settlement",
          "Policy modification",
          "Accident repair",
          "Free-look cancellation",
        ],
        answer: 1,
      },
      {
        id: 33,
        q: "KYC includes:",
        choices: [
          "PAN, Aadhaar, address proof",
          "Sports certificate",
          "Vehicle RC",
          "Salary slip",
        ],
        answer: 0,
      },
      {
        id: 34,
        q: "Health insurance claim types:",
        choices: [
          "Only cashless",
          "Only reimbursement",
          "Cashless and reimbursement",
          "None",
        ],
        answer: 2,
      },
      {
        id: 35,
        q: "Grace period is available for:",
        choices: [
          "Renewal of health insurance",
          "Buying new policy",
          "Filing claim",
          "Travel insurance",
        ],
        answer: 0,
      },

      {
        id: 36,
        q: "Burglary insurance covers:",
        choices: [
          "Theft with forced entry",
          "Accidents",
          "Natural disasters",
          "Medical bills",
        ],
        answer: 2,
      },
      {
        id: 37,
        q: "Surveyor is appointed for:",
        choices: [
          "Large motor OD claims",
          "Health cashless claims",
          "Life claims",
          "Tax filing",
        ],
        answer: 3,
      },
      {
        id: 38,
        q: "Health policy pre-authorization is needed for:",
        choices: [
          "Cashless admission",
          "Home treatment",
          "Renewal",
          "Buying medicines",
        ],
        answer: 1,
      },
      {
        id: 39,
        q: "POSP code is allotted by:",
        choices: ["IRDAI", "Broker/Insurance company", "TPA", "Government"],
        answer: 2,
      },
      {
        id: 40,
        q: "Renewal notice is sent to:",
        choices: ["Surveyor", "Customer", "IRDAI", "Mechanic"],
        answer: 3,
      },

      {
        id: 41,
        q: "Fire insurance excludes:",
        choices: [
          "Fire caused by accident",
          "Intentional fire",
          "Electrical short circuit",
          "Lightning",
        ],
        answer: 1,
      },
      {
        id: 42,
        q: "Health policy exclusion:",
        choices: ["Cosmetic surgery", "Accidents", "ICU stay", "Room rent"],
        answer: 1,
      },
      {
        id: 43,
        q: "Insurance ombudsman handles disputes related to:",
        choices: [
          "Insurance complaints",
          "Criminal cases",
          "Property tax",
          "Passport issues",
        ],
        answer: 0,
      },
      {
        id: 44,
        q: "Point of Sales Person must avoid:",
        choices: [
          "Ethical selling",
          "Misrepresentation",
          "Full disclosure",
          "Proper training",
        ],
        answer: 0,
      },
      {
        id: 45,
        q: "Policy cancellation may occur due to:",
        choices: [
          "Fraud",
          "Wrong information",
          "Non-payment of premium",
          "All of these",
        ],
        answer: 3,
      },

      {
        id: 46,
        q: "Insurance contract requires:",
        choices: [
          "Offer & acceptance",
          "Consideration",
          "Legal purpose",
          "All of these",
        ],
        answer: 2,
      },
      {
        id: 47,
        q: "Accidental hospitalization waiting period is:",
        choices: ["30 days", "Not applicable", "90 days", "1 year"],
        answer: 0,
      },
      {
        id: 48,
        q: "Third-party cover protects:",
        choices: [
          "Policyholder’s vehicle",
          "Policyholder’s injuries",
          "Other persons or property",
          "Tyres",
        ],
        answer: 1,
      },
      {
        id: 49,
        q: "KYC checks are done to prevent:",
        choices: ["Miscommunication", "Fraud", "Discounts", "Sales targets"],
        answer: 3,
      },
      {
        id: 50,
        q: "POSP must issue:",
        choices: [
          "Handwritten policy",
          "Verified and approved documents only",
          "Verbal promises",
          "Temporary notes without records",
        ],
        answer: 0,
      },
    ],
  },

  /* ================= SET 4 ================= */
  {
    set: 4,
    questions: [
      {
        id: 1,
        q: "Insurance protects individuals from:",
        choices: [
          "Speculative risks",
          "Pure risks",
          "Guaranteed profits",
          "Natural growth",
        ],
        answer: 2,
      },
      {
        id: 2,
        q: "A Point of Sales Person (POSP) can sell:",
        choices: [
          "Complex corporate insurance",
          "Reinsurance",
          "Pre-approved retail insurance products",
          "Mutual funds",
        ],
        answer: 3,
      },
      {
        id: 3,
        q: "IRDAI functions include:",
        choices: [
          "Regulating insurance industry",
          "Printing currency",
          "Issuing PAN cards",
          "Controlling banks",
        ],
        answer: 1,
      },
      {
        id: 4,
        q: "Proposal form is used to collect:",
        choices: [
          "Optional customer information",
          "Detailed customer information",
          "POSP details only",
          "Claim amount",
        ],
        answer: 0,
      },
      {
        id: 5,
        q: "Policy wording includes:",
        choices: ["Exclusions", "Coverages", "Conditions", "All of the above"],
        answer: 3,
      },

      {
        id: 6,
        q: "Fire insurance covers loss due to:",
        choices: [
          "Theft",
          "Intentional burning",
          "Accidental fire",
          "Wilful damage",
        ],
        answer: 0,
      },
      {
        id: 7,
        q: "Health insurance covers:",
        choices: [
          "Home repairs",
          "Hospitalization costs",
          "Car damage",
          "Life savings",
        ],
        answer: 1,
      },
      {
        id: 8,
        q: "Free-look period is applicable for:",
        choices: [
          "Health and life policies",
          "Motor third-party policies",
          "Fire policies",
          "All policies",
        ],
        answer: 3,
      },
      {
        id: 9,
        q: "Insurable interest means:",
        choices: [
          "A person benefits from loss",
          "A person suffers financial loss if event occurs",
          "A person buys policy for investment",
          "A person buys policy for fun",
        ],
        answer: 0,
      },
      {
        id: 10,
        q: "The proposer is:",
        choices: [
          "POSP",
          "Person who applies for insurance",
          "Hospital",
          "Surveyor",
        ],
        answer: 2,
      },

      {
        id: 11,
        q: "Underwriting is performed by:",
        choices: ["POSP", "Insurer", "TPA", "Broker"],
        answer: 2,
      },
      {
        id: 12,
        q: "Cashless facility is available at:",
        choices: [
          "Any hospital",
          "Network hospitals",
          "Grocery stores",
          "Non-network garages",
        ],
        answer: 1,
      },
      {
        id: 13,
        q: "In motor insurance, zero depreciation add-on removes:",
        choices: [
          "Depreciation on replaced parts",
          "Premium charges",
          "Inspection requirement",
          "Tyre wear and tear",
        ],
        answer: 1,
      },
      {
        id: 14,
        q: "Deductible means:",
        choices: [
          "Amount insurer pays",
          "Amount customer must pay before claim",
          "Mandatory waiting period",
          "Discount",
        ],
        answer: 0,
      },
      {
        id: 15,
        q: "Waiting period applies mostly to:",
        choices: [
          "Accidents",
          "Pre-existing diseases",
          "Life insurance",
          "Motor insurance",
        ],
        answer: 3,
      },

      {
        id: 16,
        q: "Policy renewal means:",
        choices: [
          "Increasing IDV",
          "Extending policy validity",
          "Claim settlement",
          "Buying new vehicle",
        ],
        answer: 2,
      },
      {
        id: 17,
        q: "Moral hazard arises when:",
        choices: [
          "Customer becomes more careless after buying insurance",
          "Earthquake occurs",
          "Flood damages",
          "Lightning strikes",
        ],
        answer: 3,
      },
      {
        id: 18,
        q: "No Claim Bonus is applicable to:",
        choices: ["Health", "Fire", "Motor OD", "Travel"],
        answer: 2,
      },
      {
        id: 19,
        q: "POSP must adhere to:",
        choices: [
          "IRDAI Code of Conduct",
          "Own rules",
          "Customer's personal expectations",
          "Market rumours",
        ],
        answer: 2,
      },
      {
        id: 20,
        q: "A third-party motor claim involves:",
        choices: [
          "Loss to policyholder",
          "Loss or injury to others",
          "Damage to tyres only",
          "Minor scratches",
        ],
        answer: 1,
      },

      {
        id: 21,
        q: "Sum insured in health insurance means:",
        choices: [
          "Maximum amount payable",
          "Minimum amount payable",
          "Daily allowance",
          "Discount amount",
        ],
        answer: 0,
      },
      {
        id: 22,
        q: "Surveyor involvement is required in:",
        choices: [
          "Small OD claims",
          "Large OD claims",
          "All health claims",
          "Free-look cancellations",
        ],
        answer: 2,
      },
      {
        id: 23,
        q: "Travel insurance covers:",
        choices: [
          "Home burglary",
          "Car theft",
          "Loss of baggage or medical emergencies abroad",
          "Tax filing",
        ],
        answer: 1,
      },
      {
        id: 24,
        q: "Fire insurance excludes:",
        choices: [
          "Damage due to arson",
          "Damage due to accidental fire",
          "Damage due to lightning",
          "Damage due to explosion",
        ],
        answer: 1,
      },
      {
        id: 25,
        q: "Endorsement means:",
        choices: [
          "Claim approval",
          "Change in policy terms",
          "Cancellation only",
          "Premium refund",
        ],
        answer: 0,
      },

      {
        id: 26,
        q: "POSP should not:",
        choices: [
          "Provide correct product details",
          "Mislead customer",
          "Help with documentation",
          "Explain exclusions",
        ],
        answer: 1,
      },
      {
        id: 27,
        q: "Health insurance may offer:",
        choices: [
          "Daycare procedures coverage",
          "Motor cover",
          "Fire property cover",
          "Garage repairs",
        ],
        answer: 3,
      },
      {
        id: 28,
        q: "Cooling-off period refers to:",
        choices: [
          "Waiting period",
          "Free-look period",
          "Grace period",
          "Claim period",
        ],
        answer: 1,
      },
      {
        id: 29,
        q: "Motor insurance inspection is required when:",
        choices: [
          "Renewal is done after policy has lapsed",
          "Customer buys new clothes",
          "Policy is active",
          "Policy is discounted",
        ],
        answer: 2,
      },
      {
        id: 30,
        q: "Contribution principle applies when:",
        choices: [
          "One insurer handles claim",
          "Multiple insurers cover same risk",
          "Policyholder owns no property",
          "POSP is confused",
        ],
        answer: 3,
      },

      {
        id: 31,
        q: "A claim form must be filled:",
        choices: [
          "Before purchase",
          "During renewal",
          "At the time of claim",
          "During free-look",
        ],
        answer: 1,
      },
      {
        id: 32,
        q: "Information mismatch in a proposal form leads to:",
        choices: [
          "Faster approval",
          "Claim rejection",
          "Premium reduction",
          "Bonus",
        ],
        answer: 1,
      },
      {
        id: 33,
        q: "Risk inspection is usually done in:",
        choices: [
          "Fire insurance",
          "Travel insurance",
          "Health insurance",
          "Life insurance",
        ],
        answer: 0,
      },
      {
        id: 34,
        q: "Premium depends on:",
        choices: [
          "Age (for health)",
          "IDV (for motor)",
          "Coverage",
          "All of the above",
        ],
        answer: 3,
      },
      {
        id: 35,
        q: "Insurance ombudsman resolves disputes up to:",
        choices: ["₹10,000", "₹30 lakh", "₹1 crore", "No limit"],
        answer: 1,
      },

      {
        id: 36,
        q: "Exclusions are:",
        choices: [
          "Covered risks",
          "Not covered risks",
          "Bonus items",
          "Discounts",
        ],
        answer: 2,
      },
      {
        id: 37,
        q: "A POSP must maintain:",
        choices: [
          "Confidentiality",
          "Transparency",
          "Ethical behavior",
          "All of the above",
        ],
        answer: 0,
      },
      {
        id: 38,
        q: "KYC is needed to prevent:",
        choices: ["Money laundering", "Bonuses", "Discounts", "Claims"],
        answer: 2,
      },
      {
        id: 39,
        q: "Premium payment receipt acts as:",
        choices: [
          "Policy document",
          "Payment proof",
          "Claim statement",
          "Add-on cover",
        ],
        answer: 0,
      },
      {
        id: 40,
        q: "The insurance policy schedule contains:",
        choices: [
          "Terms only",
          "Coverage only",
          "Specific policy details",
          "POSP code",
        ],
        answer: 1,
      },

      {
        id: 41,
        q: "Health insurance room rent limit affects:",
        choices: [
          "Claim eligibility",
          "IDV",
          "Policy wording",
          "Vehicle value",
        ],
        answer: 3,
      },
      {
        id: 42,
        q: "Personal accident cover provides:",
        choices: [
          "Compensation for accidental death or disability",
          "House rent",
          "Travel refunds",
          "Vehicle damages",
        ],
        answer: 1,
      },
      {
        id: 43,
        q: "POSP cannot promise:",
        choices: [
          "Guaranteed claim approval",
          "Product clarity",
          "Customer support",
          "Policy comparison",
        ],
        answer: 2,
      },
      {
        id: 44,
        q: "Proposal form must be signed:",
        choices: [
          "Only by POSP",
          "By customer/proposer",
          "By surveyor",
          "By mechanic",
        ],
        answer: 3,
      },
      {
        id: 45,
        q: "Insurance fraud includes:",
        choices: [
          "Providing correct documents",
          "Fake claims",
          "Accurate information",
          "Timely renewal",
        ],
        answer: 0,
      },

      {
        id: 46,
        q: "Premium increases in motor insurance due to:",
        choices: [
          "Vehicle age increase",
          "New tyres",
          "Clean driving history",
          "Premium discounts",
        ],
        answer: 1,
      },
      {
        id: 47,
        q: "TPA stands for:",
        choices: [
          "Third Party Administration",
          "Travel Protection Agency",
          "Total Premium Allowance",
          "Third Policy Agreement",
        ],
        answer: 2,
      },
      {
        id: 48,
        q: "Network hospitals offer:",
        choices: [
          "Cashless treatment",
          "Foreign exchange",
          "Discounted room rent",
          "Free treatment",
        ],
        answer: 3,
      },
      {
        id: 49,
        q: "Claim intimation should be done:",
        choices: [
          "Immediately",
          "After 6 months",
          "During renewal",
          "Only after discharge",
        ],
        answer: 0,
      },
      {
        id: 50,
        q: "POSP authorization validity is decided by:",
        choices: ["Customer", "IRDAI guidelines", "Mechanic", "TPA"],
        answer: 1,
      },
    ],
  },

  /* ================= SET 5 ================= */
  {
    set: 5,
    questions: [
      {
        id: 1,
        q: "What is the primary objective of insurance?",
        choices: [
          "Profit generation",
          "Risk transfer",
          "Wealth creation",
          "Tax saving",
        ],
        answer: 1,
      },
      {
        id: 2,
        q: "Which of the following is a general insurance product?",
        choices: [
          "Term life insurance",
          "Endowment plan",
          "Motor insurance",
          "ULIP",
        ],
        answer: 2,
      },
      {
        id: 3,
        q: "Motor third-party insurance is:",
        choices: [
          "Optional",
          "Mandatory by law",
          "Only for commercial vehicles",
          "Needed only after accidents",
        ],
        answer: 1,
      },
      {
        id: 4,
        q: "The IRDAI regulates:",
        choices: [
          "Banking sector",
          "Insurance industry",
          "Stock market",
          "Mutual funds",
        ],
        answer: 1,
      },
      {
        id: 5,
        q: "A Point of Sales Person (POSP) can sell:",
        choices: [
          "Complex corporate insurance",
          "Reinsurance products",
          "Simple pre-approved insurance products",
          "Investment-linked insurance",
        ],
        answer: 2,
      },

      {
        id: 6,
        q: "Premium for insurance is based on:",
        choices: [
          "Age and income",
          "Risk exposure",
          "Profit margins",
          "Customer relationship",
        ],
        answer: 1,
      },
      {
        id: 7,
        q: "Which document is mandatory during claim settlement?",
        choices: [
          "Aadhaar only",
          "KYC and policy document",
          "Electricity bill",
          "Bank passbook",
        ],
        answer: 1,
      },
      {
        id: 8,
        q: "Deductible in insurance means:",
        choices: [
          "Amount paid by insurer first",
          "Amount paid by policyholder first",
          "Full claim amount",
          "Agent commission",
        ],
        answer: 1,
      },
      {
        id: 9,
        q: "What is IDV in motor insurance?",
        choices: [
          "Insurer Declared Value",
          "Insurance Depreciated Value",
          "Insured Declared Value",
          "Internal Damage Value",
        ],
        answer: 2,
      },
      {
        id: 10,
        q: "Which is an example of a health insurance product?",
        choices: [
          "Crop insurance",
          "Fire insurance",
          "Individual Mediclaim",
          "Marine cargo",
        ],
        answer: 2,
      },

      {
        id: 11,
        q: "Lapsed policy means:",
        choices: [
          "Policy has been cancelled",
          "Premium not paid within grace period",
          "Policyholder died",
          "Claim approved",
        ],
        answer: 1,
      },
      {
        id: 12,
        q: "The solvency margin is maintained by:",
        choices: ["Customers", "Brokers", "Insurance companies", "POSPs"],
        answer: 2,
      },
      {
        id: 13,
        q: "Underwriting is related to:",
        choices: [
          "Claims processing",
          "Assessing risk",
          "Policy printing",
          "Customer onboarding",
        ],
        answer: 1,
      },
      {
        id: 14,
        q: "A cover note is:",
        choices: [
          "Legal notice",
          "Temporary proof of insurance",
          "Loan approval letter",
          "Medical report",
        ],
        answer: 1,
      },
      {
        id: 15,
        q: "Which of these affects motor insurance premiums?",
        choices: [
          "Vehicle color",
          "Vehicle age",
          "Owner’s caste",
          "Number of passengers",
        ],
        answer: 1,
      },

      {
        id: 16,
        q: "Health insurance pre-existing disease is a condition:",
        choices: [
          "Developed after buying policy",
          "Known before buying policy",
          "Never covered",
          "Only for senior citizens",
        ],
        answer: 1,
      },
      {
        id: 17,
        q: "In insurance, 'proposal form' is filled by:",
        choices: ["POSP", "Insurer", "Customer", "Regulator"],
        answer: 2,
      },
      {
        id: 18,
        q: "Free-look period allows:",
        choices: [
          "Premium revision",
          "Cancellation within 15 days",
          "Bonus benefits",
          "Loan facility",
        ],
        answer: 1,
      },
      {
        id: 19,
        q: "Personal Accident cover compensates for:",
        choices: [
          "Natural death",
          "Accident-only injuries/death",
          "Theft",
          "Fire damage",
        ],
        answer: 1,
      },
      {
        id: 20,
        q: "IRDAI stands for:",
        choices: [
          "Indian Risk Development Agency of India",
          "Insurance Regulatory and Development Authority of India",
          "Insurance Research and Data Authority of India",
          "Industrial Regulatory Department of India",
        ],
        answer: 1,
      },

      {
        id: 21,
        q: "A claim becomes 'repudiated' when:",
        choices: [
          "It is paid fully",
          "It is delayed",
          "It is rejected",
          "It is approved",
        ],
        answer: 2,
      },
      {
        id: 22,
        q: "Insurance contracts are based on:",
        choices: [
          "Maximum profit",
          "Utmost good faith",
          "Competition",
          "Secrecy",
        ],
        answer: 1,
      },
      {
        id: 23,
        q: "NCB (No Claim Bonus) is applicable in:",
        choices: [
          "Health insurance",
          "Motor insurance",
          "Life insurance",
          "Travel insurance",
        ],
        answer: 1,
      },
      {
        id: 24,
        q: "Which is NOT part of KYC?",
        choices: ["Photograph", "PAN", "Passport", "Favorite color"],
        answer: 3,
      },
      {
        id: 25,
        q: "Endorsement in insurance refers to:",
        choices: [
          "Claim rejection",
          "Policy modification",
          "Agent commission",
          "Premium payment",
        ],
        answer: 1,
      },

      {
        id: 26,
        q: "A floater health plan covers:",
        choices: [
          "Only one person",
          "Entire family under one sum insured",
          "Customer + POSP",
          "Non-family members",
        ],
        answer: 1,
      },
      {
        id: 27,
        q: "Fire insurance covers:",
        choices: [
          "Terrorism",
          "Accidental fire",
          "Volcano eruption",
          "Earthquake only",
        ],
        answer: 1,
      },
      {
        id: 28,
        q: "Marine insurance is applicable for:",
        choices: ["Trains", "Ships and cargo", "Cars", "Bicycles"],
        answer: 1,
      },
      {
        id: 29,
        q: "The term 'Grace period' applies to:",
        choices: [
          "Claim settlement",
          "Late premium payment",
          "Refund processing",
          "Loan disbursement",
        ],
        answer: 1,
      },
      {
        id: 30,
        q: "What is underwriting?",
        choices: [
          "Claim verification",
          "Risk assessment for issuing policy",
          "Investment analysis",
          "Customer verification",
        ],
        answer: 1,
      },

      {
        id: 31,
        q: "What is the primary benefit of travel insurance?",
        choices: [
          "Free vacations",
          "Protection against unexpected travel risks",
          "Investment returns",
          "Improving credit score",
        ],
        answer: 1,
      },
      {
        id: 32,
        q: "POSP certificate is issued after:",
        choices: [
          "Payment of fees",
          "15-hour training + exam",
          "Background verification only",
          "Only personal interview",
        ],
        answer: 1,
      },
      {
        id: 33,
        q: "A motor insurance policy expires on:",
        choices: [
          "Last day of the month",
          "Exactly on the expiry date mentioned",
          "15 days after its due date",
          "Automatically renewed",
        ],
        answer: 1,
      },
      {
        id: 34,
        q: "Surveyor’s role is to:",
        choices: [
          "Sell policies",
          "Assess losses during claims",
          "Provide financial advice",
          "Modify premiums",
        ],
        answer: 1,
      },
      {
        id: 35,
        q: "Risk in insurance refers to:",
        choices: ["Profit", "Uncertainty", "Government rule", "Guarantee"],
        answer: 1,
      },

      {
        id: 36,
        q: "Which is NOT a principle of insurance?",
        choices: ["Contribution", "Indemnity", "Subrogation", "Inflation"],
        answer: 3,
      },
      {
        id: 37,
        q: "Pre-policy health check-up is required mainly for:",
        choices: [
          "Young adults",
          "Senior citizens or high-risk individuals",
          "Children",
          "Government employees",
        ],
        answer: 1,
      },
      {
        id: 38,
        q: "Policy schedule contains:",
        choices: [
          "Medical reports",
          "Summary of coverage details",
          "Surveyor fees",
          "POSP marksheet",
        ],
        answer: 1,
      },
      {
        id: 39,
        q: "A claim form is filled by:",
        choices: ["Insurer", "Surveyor", "Customer/claimant", "POSP only"],
        answer: 2,
      },
      {
        id: 40,
        q: "Premium receipt is proof of:",
        choices: [
          "Claim payment",
          "Premium paid",
          "Loan sanction",
          "Aadhaar update",
        ],
        answer: 1,
      },

      {
        id: 41,
        q: "POSP should disclose:",
        choices: [
          "Only product price",
          "All key features, exclusions, and terms",
          "Only benefits",
          "Only claim process",
        ],
        answer: 1,
      },
      {
        id: 42,
        q: "Exclusions are:",
        choices: [
          "Tax benefits",
          "Events not covered under policy",
          "Premium discounts",
          "Renewal options",
        ],
        answer: 1,
      },
      {
        id: 43,
        q: "Renewable policy means:",
        choices: [
          "Can be extended after expiry",
          "Cannot be continued",
          "Must be cancelled yearly",
          "Has no validity",
        ],
        answer: 0,
      },
      {
        id: 44,
        q: "Insurable interest must exist at the time of:",
        choices: ["Claim", "Policy proposal", "Renewal", "Endorsement"],
        answer: 1,
      },
      {
        id: 45,
        q: "The insurer in a policy is the:",
        choices: ["Customer", "Selling agent", "Insurance company", "Surveyor"],
        answer: 2,
      },

      {
        id: 46,
        q: "A cashless claim means:",
        choices: [
          "Claim is denied",
          "No paperwork required",
          "Hospital bills are settled directly by insurer",
          "Customer pays full amount",
        ],
        answer: 2,
      },
      {
        id: 47,
        q: "POSP must maintain:",
        choices: [
          "Confidentiality of customer information",
          "Personal profit margin",
          "Loan details",
          "Competitor secrets",
        ],
        answer: 0,
      },
      {
        id: 48,
        q: "Fraud in insurance includes:",
        choices: [
          "Genuine claim",
          "Misrepresentation or false information",
          "Premium payment",
          "Adding nominee",
        ],
        answer: 1,
      },
      {
        id: 49,
        q: "The nominee in insurance receives:",
        choices: [
          "POSP commission",
          "Policy benefits after insured’s death",
          "Training certificate",
          "IRDAI license",
        ],
        answer: 1,
      },
      {
        id: 50,
        q: "POSP must ensure:",
        choices: [
          "Customer buys maximum products",
          "Ethical selling and compliance",
          "Hidden charges",
          "Misleading information",
        ],
        answer: 1,
      },
    ],
  },
];

/* ======================================================
   TEST PAGE
====================================================== */
export default function TestPage({
  onClose,
  onProgressChange,
  onResultVisible, // ✅ ADD
}: {
  onClose: () => void;
  onProgressChange: (p: number) => void;
  onResultVisible: (v: boolean) => void;
}) {

  const [currentSet, setCurrentSet] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const testProgress = currentSet
  ? Math.round(((index + 1) / currentSet.questions.length) * 100)
  : 0;

useEffect(() => {
  if (currentSet) {
    onProgressChange(testProgress);
  }
}, [testProgress, currentSet]);

  useEffect(() => {
    if (showResult) return;

    if (timeLeft <= 0) {
      submitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  /* ===============================
     RANDOM SET PICK
  =============================== */
  useEffect(() => {
    const random = Math.floor(Math.random() * QUESTION_SETS.length);
    setCurrentSet(QUESTION_SETS[random]);

    fetch("/api/agent/save-training-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ testStarted: true }),
    });
  }, []);

  if (!currentSet) return null;

  const questions = currentSet.questions;
  const optionLabels = ["A", "B", "C", "D"];

  function selectChoice(qid: number, idx: number) {
    setAnswers((p) => ({ ...p, [qid]: idx }));
  }

  function submitTest() {
    let s = 0;
    questions.forEach((q: any) => {
      if (answers[q.id] === q.answer) s++;
    });
    setScore(s);
    setShowResult(true);
      onResultVisible(true); // ✅ ADD

  }
  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  return (
    <div className={styles.testWrap}>
      {!showResult ? (
        <div className={styles.testCenterColumn}>
          {/* ===== HEADER ===== */}
          <div className={styles.testPageHeaderRow}>
            <div className={styles.leftInfo}>
              Passing Marks: <b>25</b>
            </div>

            <div className={styles.testPageTitleWrap}>
              <div className={styles.testPageTitle}>
                Agent Certification Test
              </div>
              <div className={styles.testPageSub}>
                Question {index + 1} of 50 · Mandatory
              </div>
            </div>

            <div className={styles.timerBox}>⏱ {formatTime(timeLeft)}</div>
          </div>

          {/* ===== CARD ===== */}
          <div className={styles.card}>
            <div className={styles.setInfo}>
              Test Set : <span>Set {currentSet.set}</span>
            </div>

            <div className={styles.questionBox}>
              Q{index + 1}. {questions[index].q}
            </div>

            <div className={styles.answersGrid}>
              {questions[index].choices.map((c: string, i: number) => (
                <button
                  key={i}
                  className={`${styles.choiceBtn} ${
                    answers[questions[index].id] === i ? styles.selected : ""
                  }`}
                  onClick={() => selectChoice(questions[index].id, i)}
                >
                  <span className={styles.optionLabel}>{optionLabels[i]}</span>
                  <span className={styles.optionText}>{c}</span>
                </button>
              ))}
            </div>

            <div className={styles.navRow}>
              <button
                disabled={index === 0}
                onClick={() => setIndex(index - 1)}
                className={styles.navBtn}
              >
                Previous
              </button>

              {index < questions.length - 1 ? (
                <button
                  onClick={() => setIndex(index + 1)}
                  className={styles.navBtn}
                >
                  Next
                </button>
              ) : (
                <button onClick={submitTest} className={styles.submitBtn}>
                  Submit Test
                </button>
              )}
            </div>
          </div>

          {/* ===== PROGRESS ===== */}
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${((index + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
<Result
  score={score}
  total={questions.length}
  onClose={onClose}
  onResultVisible={onResultVisible} // ✅ ADD
/>
      )}
    </div>
  );
}

/* ======================================================
   RESULT
====================================================== */
function Result({
  score,
  total,
  onClose,
  onResultVisible, // ✅ ADD
}: {
  score: number;
  total: number;
  onClose: () => void;
  onResultVisible: (v: boolean) => void;
}) {

  const pass = score >= total / 2;

  async function handlePass() {
    await fetch("/api/agent/complete-training", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({
    score,
    total,
  }),
});


    await fetch("/api/agent/save-training-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ testCompleted: true }),
    });

    window.location.href = "/agentpage";
  }

  if (!pass) {
    return (
<div className={styles.resultWrap}>
  <div className={styles.failCard}>

    {/* DECORATIVE BACK IMAGE (image6) */}
    <Image
      src={image6}
      alt="decorative bg"
      className={styles.failCardBg}
      priority
    />

    {/* TOP FLOATING ICONS */}
<div className={styles.failTopIcons}>
  <Image
    src={image4}
    alt="sad"
    className={styles.failSadIcon}
    priority
  />

  <Image
    src={image5}
    alt="warning"
    className={styles.failWarningIcon}
    priority
  />
</div>



    {/* CARD CONTENT */}
    <div className={styles.failOverlay}>
      <h2 className={styles.failTitle}>Unfortunately...</h2>

      <p className={styles.failScore}>
        You scored <span>{score}</span> out of <span>{total}</span>.
      </p>

      <p className={styles.failSub}>
        You did not pass the agent certification test.
      </p>

      <div className={styles.failActions}>
        <button
          className={styles.retryBtn}
          onClick={() => window.location.reload()}
        >
          Retake Test
        </button>

       <button
  className={styles.greyBtn}
  onClick={() => {
    onResultVisible(false); // ✅ ADD
    onClose();
  }}
>
  Close
</button>

      </div>
    </div>

  </div>
</div>



    );
  }

  return (
    <div className={styles.resultWrap}>
      {/* CONFETTI BACKGROUND */}
      <Image
        src={image3}
        alt="confetti background"
        className={styles.confettiBg}
        width={300}
        height={300}
        priority
      />

      {/* CARD + MEDAL WRAPPER */}
      <div className={styles.imageBox}>
        {/* MEDAL AT TOP CENTER */}
        <Image
          src={image2}
          alt="medal"
          className={styles.medalTop}
          width={220}
          height={120}
          priority
        />


        {/* WHITE CARD */}
        <Image
          src={image1}
          alt="card background"
          className={styles.resultBackground}
          // width={520}
          // height={420}
          priority
        />

        {/* ===== TEXT OVER CARD ===== */}
        <div className={styles.overlayContent}>
          <h2 className={styles.congrats}>Congratulations!</h2>

          <p className={styles.resultText}>
            You scored{" "}
            <span>
              {score} out of {total}
            </span>
          </p>

          <p className={styles.resultSub}>
            You have successfully completed the agent certification test.
          </p>

          <div className={styles.finalScore}>
            {score} / {total}
          </div>

          <div className={styles.actions}>
            {pass ? (
              <button className={styles.linkBtn} onClick={handlePass}>
                Go to Dashboard →
              </button>
            ) : (
              <button
                className={styles.linkBtn}
                onClick={() => window.location.replace("/videolectures")}
              >
                Return to Training
              </button>
            )}

           <button
  className={styles.greyBtn}
  onClick={() => {
    onResultVisible(false); // ✅ ADD
    onClose();
  }}
>
  Close
</button>

          </div>
        </div>
      </div>
    </div>
  );
}
