"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import m1 from "@/styles/components/assessmenttraining/Module1Training.module.css";
import styles from "@/styles/components/assessmenttraining/Testpage.module.css";
import image1 from "@/assets/testdashboard/image1.png";
import image2 from "@/assets/testdashboard/image2.png";
import image3 from "@/assets/testdashboard/image3.png";
import image4 from "@/assets/testdashboard/image4.png";
import image5 from "@/assets/testdashboard/image5.png";
import image6 from "@/assets/testdashboard/image6.png";

import Image from "next/image";

/* ======================================================
   QUESTION BANK — flat pool of every question (no sets). Sourced from
   "Corrected POSP_All_Questions_Answers(All Questions).csv" (Downloads) —
   Question/Option A-D/Correct Option columns, letter answers mapped to a
   0-indexed choice. A random 50 are drawn from here per test (see
   sampleQuestions below).
====================================================== */
const QUESTION_BANK_RAW = [
  { q: "What is cashless claim?", choices: ["Claim settled directly by insurer", "A claim settled through a barter system", "A policy that offers zero coverage for accidents", "A complete waiver of processing fees"], answer: 0 },
  { q: "What is indemnity?", choices: ["An added monetary benefit for surviving the policy term", "A structural penalty for premature termination", "Compensation for loss", "An investment return on equity-linked plans"], answer: 2 },
  { q: "What is subrogation?", choices: ["The absolute cancellation of the policy bond", "Transferring the policy to another insurance provider", "Insurer's right to recover", "The sharing of risks between multiple policyholders"], answer: 2 },
  { q: "Health policy waiting period?", choices: ["The timeline to submit pre-hospitalisation bills", "The gap between purchasing a policy and receiving the physical card", "Initial exclusion period", "The time period allowed to renew a policy without a gap"], answer: 2 },
  { q: "Add-on in motor refers to:", choices: ["Extra coverage", "Claim", "Deductible increase", "Policy cancellation"], answer: 0 },
  { q: "Cooling-off period is also called:", choices: ["Free-look period", "Waiting period", "Grace period", "Underwriting period"], answer: 0 },
  { q: "Health insurance claim types include:", choices: ["Cashless & reimbursement", "Only cashless", "Only reimbursement", "Telegraphic"], answer: 0 },
  { q: "Insurance is based on the principle of:", choices: ["Utmost good faith", "Gambling", "Lottery", "Free choice"], answer: 0 },
  { q: "OD claim in motor refers to:", choices: ["Own Damage", "Other Damage", "Only Damage", "Outstanding Debt"], answer: 0 },
  { q: "Proposal form is a:", choices: ["Legal document", "Greeting card", "Invoice", "Receipt"], answer: 0 },
  { q: "The full form of KYC is:", choices: ["Know Your Customer", "Keep Your Card", "Know Your Commission", "Key Yearly Contribution"], answer: 0 },
  { q: "In insurance, premium is:", choices: ["Fee paid for claim", "Price of insurance cover", "Bonus", "Interest"], answer: 1 },
  { q: "Insurance is a mechanism for:", choices: ["Profit maximization", "Risk transfer", "Risk creation", "Increasing expenses"], answer: 1 },
  { q: "Insurance mitigates:", choices: ["Speculative risk", "Pure risk", "Gambling risk", "Political risk"], answer: 1 },
  { q: "Lapse of policy means:", choices: ["Full cover", "Policy expired due to non-payment", "Claim paid", "Will never renew"], answer: 1 },
  { q: "Material fact is:", choices: ["Irrelevant detail", "Important information affecting risk", "Sales pitch", "Customer opinion"], answer: 1 },
  { q: "Motor insurance is mandatory under:", choices: ["Companies Act", "Motor Vehicles Act", "Consumer Protection Act", "Income Tax Act"], answer: 1 },
  { q: "NCB in motor is given for:", choices: ["Raising claim", "No claim in previous year", "Theft", "Car modification"], answer: 1 },
  { q: "Policy period usually is:", choices: ["1 month", "1 year", "10 years", "Lifetime"], answer: 1 },
  { q: "POSP must avoid:", choices: ["Explaining clearly", "Mis-representation", "KYC", "Transparency"], answer: 1 },
  { q: "The free-look period in health is generally:", choices: ["5 days", "1 year", "15 days", "60 days"], answer: 2 },
  { q: "TPA in health insurance stands for:", choices: ["Third Party Assistance", "Travel Protection Agency", "Third Party Administrator", "Taxpayer Authority"], answer: 2 },
  { q: "TPL premium is decided by:", choices: ["POSP", "Customer", "IRDAI", "Surveyor"], answer: 2 },
  { q: "Waiting period for maternity is usually:", choices: ["1 day", "1 year", "9 months4 years", "10 years"], answer: 2 },
  { q: "The regulator for insurance in India is:", choices: ["RBI", "SEBI", "IRDAI", "IBA"], answer: 2 },
  { q: "A claim is payable only if:", choices: ["Customer wants it", "Repairer consents", "POSP approves", "Policy is valid"], answer: 3 },
  { q: "Claim repudiation means:", choices: ["Claim paid", "Claim doubled", "Claim delayed", "Claim rejected"], answer: 3 },
  { q: "Contract comes into force after:", choices: ["Proposal submission", "Medical test only", "POSP approval", "Premium payment & acceptance"], answer: 3 },
  { q: "Health insurance waiting period applies to:", choices: ["Accidents", "Theft", "Fire claims", "Pre-existing diseases"], answer: 3 },
  { q: "IDV in motor refers to:", choices: ["Insurance Depreciation Value", "Increased Driver Value", "Internal Damage Value", "Insured Declared Value"], answer: 3 },
  { q: "A policyholder is:", choices: ["Person who buys the policy", "Insurance company", "POSP", "Surveyor"], answer: 0 },
  { q: "Claim is payable only when:", choices: ["Policy is active", "POSP approves", "Customer insists", "Garage requests"], answer: 0 },
  { q: "Grace period applies to:", choices: ["Health renewals", "Motor expiry", "Fire policy", "All new policies"], answer: 0 },
  { q: "In motor insurance, add-ons include:", choices: ["Zero depreciation", "Room rent cap", "Maternity cover", "Travel delay"], answer: 0 },
  { q: "Insurance ombudsman deals with:", choices: ["Small claim disputes", "GST cases", "Stock market fraud", "Housing loans"], answer: 0 },
  { q: "Insurance reduces:", choices: ["Uncertainty", "Premium", "Discounts", "Accidents"], answer: 0 },
  { q: "POSP cannot:", choices: ["Provide incorrect promises", "Explain product benefits", "Help fill forms", "Guide during claim"], answer: 0 },
  { q: "Premium increases in health insurance due to:", choices: ["Age increase", "Lesser risk", "No claim", "Exercising"], answer: 0 },
  { q: "Reimbursement claim means:", choices: ["Customer pays upfront", "Hospital pays upfront", "POSP pays", "TPA pays first"], answer: 0 },
  { q: "Surveyor works in:", choices: ["OD motor claims", "Credit card processing", "Home loans", "Mall inspections"], answer: 0 },
  { q: "Zero depreciation add-on covers:", choices: ["Full cost of parts", "Only labour", "Engine failure", "Theft only"], answer: 0 },
  { q: "In travel insurance, exclusions include:", choices: ["Loss of baggage", "War", "Flight delay", "Emergency medical"], answer: 1 },
  { q: "NCB stands for:", choices: ["New Car Benefit", "No Claim Bonus", "National Car Burden", "Non-Claim Burden"], answer: 1 },
  { q: "Premium refers to:", choices: ["Insurance tax", "Payment for purchasing insurance", "Refund amount", "Commission"], answer: 1 },
  { q: "Principle of indemnity means:", choices: ["Profit from insurance", "Restore insured to original position", "Guaranteed gain", "Double claim"], answer: 1 },
  { q: "Proposal form contains:", choices: ["Financial background only", "Complete information about proposer", "Only health history", "POSP details"], answer: 1 },
  { q: "Renewal is the process of:", choices: ["Buying new property", "Extending policy for next term", "Claim settlement", "Appealing to IRDAI"], answer: 1 },
  { q: "The primary role of insurance is to:", choices: ["Eliminate risk", "Increase risk", "Reduce and transfer risk", "Encourage speculation"], answer: 2 },
  { q: "TPA helps in:", choices: ["Motor claims", "Home loan approval", "Health claims processing", "Fire safety checks"], answer: 2 },
  { q: "Travel insurance is needed for:", choices: ["Risk-free travel", "Income tax", "Medical emergency abroad", "Shopping discounts"], answer: 2 },
  { q: "A POSP is allowed to sell:", choices: ["Reinsurance", "High-risk corporate insurance", "Approved simple retail insurance products", "ULIPs"], answer: 2 },
  { q: "Material facts must be:", choices: ["Hidden", "Incorrect", "Fully disclosed", "Avoided"], answer: 2 },
  { q: "POSP must disclose:", choices: ["Only positive information", "Only discounts", "All relevant information", "Nothing"], answer: 2 },
  { q: "Underwriting is done by:", choices: ["Customer", "POSP", "Insurer", "TPA"], answer: 2 },
  { q: "Cashless claim means:", choices: ["No premium", "Double payment", "Claim rejection", "No payment at network hospital/garage"], answer: 3 },
  { q: "Fire insurance is an example of:", choices: ["Life insurance", "Banking product", "Mutual fund", "General insurance"], answer: 3 },
  { q: "Free-look period is usually:", choices: ["5 days", "1 day", "60 days", "15 days"], answer: 3 },
  { q: "Health insurance pre-approval is required for:", choices: ["Cashless hospitalization", "Buying medicines", "Policy issuance", "Reimbursement"], answer: 3 },
  { q: "Documents for KYC include:", choices: ["Aadhaar", "Passport", "PAN", "All of these"], answer: 3 },
  { q: "Insurance works on which principle?", choices: ["Contribution", "Utmost Good Faith", "Compensation", "All of the above"], answer: 3 },
  { q: "IRDAI mandates POSP training of:", choices: ["10 hours", "40 hours", "25 hours", "15 hours"], answer: 3 },
  { q: "Burglary insurance covers:", choices: ["Theft with forced entry", "Accidents", "Natural disasters", "Medical bills"], answer: 0 },
  { q: "Health policy exclusion:", choices: ["Cosmetic surgery", "Accidents", "ICU stay", "Room rent"], answer: 0 },
  { q: "In health insurance, TPA works as:", choices: ["Claim processor", "Policy creator", "Fire surveyor", "OD inspector"], answer: 0 },
  { q: "Insurance contract requires:", choices: ["Offer & acceptance", "Consideration", "Legal purpose", "All of these"], answer: 0 },
  { q: "Insurance ombudsman handles disputes related to:", choices: ["Insurance complaints", "Criminal cases", "Property tax", "Passport issues"], answer: 0 },
  { q: "KYC includes:", choices: ["PAN, Aadhaar, address proof", "Sports certificate", "Vehicle RC", "Salary slip"], answer: 0 },
  { q: "POSP earns:", choices: ["Commission", "Salary from IRDAI", "Claim amount", "Tax benefit"], answer: 0 },
  { q: "POSP stands for:", choices: ["Point of Sales Person", "Post Office Sales Person", "Primary Official Sales Person", "Policy on Sales Process"], answer: 0 },
  { q: "Surveyor is appointed for:", choices: ["Large motor OD claims", "Health cashless claims", "Life claims", "Tax filing"], answer: 0 },
  { q: "The customer must disclose:", choices: ["All material facts", "Only name", "Only PAN", "Only past claims"], answer: 0 },
  { q: "The term 'premium' refers to:", choices: ["Price of the insurance cover", "Claim amount", "GST rate", "Bonus"], answer: 0 },
  { q: "Insurance contract begins when:", choices: ["Proposal submitted", "Insurer accepts and premium is paid", "POSP signs form", "ID proof submitted"], answer: 1 },
  { q: "Insurance is a contract between:", choices: ["POSP and surveyor", "Insurer and insured", "POSP and IRDAI", "Customer and TPA"], answer: 1 },
  { q: "Insurance product sales must be:", choices: ["Fast", "Transparent", "Misleading", "Confusing"], answer: 1 },
  { q: "IRDAI regulates:", choices: ["Banks", "Insurance companies", "Mutual funds", "Stock exchanges"], answer: 1 },
  { q: "KYC checks are done to prevent:", choices: ["Miscommunication", "Fraud", "Discounts", "Sales targets"], answer: 1 },
  { q: "Mis-selling means:", choices: ["Telling truth", "Hiding important details", "Giving brochure", "Claim settlement"], answer: 1 },
  { q: "Moral hazard refers to:", choices: ["Natural calamities", "Deliberate carelessness by customer", "Floods", "Fire"], answer: 1 },
  { q: "Point of Sales Person must avoid:", choices: ["Ethical selling", "Misrepresentation", "Full disclosure", "Proper training"], answer: 1 },
  { q: "POSP code is allotted by:", choices: ["IRDAI", "Broker/Insurance company", "TPA", "Government"], answer: 1 },
  { q: "Proposal form is a ______ document.", choices: ["Temporary", "Mandatory", "Optional", "Duplicate"], answer: 1 },
  { q: "Renewal notice is sent to:", choices: ["Surveyor", "Customer", "IRDAI", "Mechanic"], answer: 1 },
  { q: "Subrogation applies to:", choices: ["Life insurance", "All investments", "General insurance", "FDs"], answer: 2 },
  { q: "Waiting period in health insurance applies to:", choices: ["Accidents", "Tyre damage", "Pre-existing conditions", "Fire accident"], answer: 2 },
  { q: "In motor insurance, OD refers to:", choices: ["Owners Discount", "Over Draft", "Own Damage", "Outer Damage"], answer: 2 },
  { q: "Insurance is based on ______ good faith.", choices: ["Limited", "Partial", "Utmost", "Divided"], answer: 2 },
  { q: "Third-party cover protects:", choices: ["Policyholders vehicle", "Policyholders injuries", "Other persons or property", "Tyres"], answer: 2 },
  { q: "A deductible is:", choices: ["Premium discount", "Add-on cover", "NCB", "Amount customer pays before insurer pays"], answer: 3 },
  { q: "Accidental hospitalization waiting period is:", choices: ["30 days", "1 year", "90 days", "Not applicable"], answer: 3 },
  { q: "Fire insurance generally covers:", choices: ["Construction faults", "Loss due to medical emergency", "Loss due to rain", "Loss due to fire"], answer: 3 },
  { q: "A policy document includes:", choices: ["Terms & conditions", "Coverage", "Exclusions", "All of the above"], answer: 3 },
  { q: "IDV affects:", choices: ["Claim amount", "Health coverage", "Travel premium", "None"], answer: 3 },
  { q: "No Claim Bonus (NCB) is given for:", choices: ["Filing claim", "Not filing claim", "Buying new vehicle", "Premium payment"], answer: 3 },
  { q: "Policy cancellation may occur due to:", choices: ["Fraud", "Wrong information", "Non-payment of premium", "All of these"], answer: 3 },
  { q: "Claim intimation should be done:", choices: ["Immediately", "After 6 months", "During renewal", "Only after discharge"], answer: 0 },
  { q: "Health insurance may offer:", choices: ["Daycare procedures coverage", "Motor cover", "Fire property cover", "Garage repairs"], answer: 0 },
  { q: "Health insurance room rent limit affects:", choices: ["Claim eligibility", "IDV", "Policy wording", "Vehicle value"], answer: 0 },
  { q: "In motor insurance, zero depreciation add-on removes:", choices: ["Depreciation on replaced parts", "Premium charges", "Inspection requirement", "Tyre wear and tear"], answer: 0 },
  { q: "IRDAI functions include:", choices: ["Regulating insurance industry", "Printing currency", "Issuing PAN cards", "Controlling banks"], answer: 0 },
  { q: "KYC is needed to prevent:", choices: ["Money laundering", "Bonuses", "Discounts", "Claims"], answer: 0 },
  { q: "Motor insurance inspection is required when:", choices: ["Renewal is done after policy has lapsed", "Customer buys new clothes", "Policy is active", "Policy is discounted"], answer: 0 },
  { q: "Network hospitals offer:", choices: ["Cashless treatment", "Foreign exchange", "Discounted room rent", "Free treatment"], answer: 0 },
  { q: "Personal accident cover provides:", choices: ["Compensation for accidental death or disability", "House rent", "Travel refunds", "Vehicle damages"], answer: 0 },
  { q: "POSP cannot promise:", choices: ["Guaranteed claim approval", "Product clarity", "Customer support", "Policy comparison"], answer: 0 },
  { q: "POSP must adhere to:", choices: ["IRDAI Code of Conduct", "Own rules", "Customer's personal expectations", "Market rumours"], answer: 0 },
  { q: "Premium increases in motor insurance due to:", choices: ["Vehicle age increase", "New tyres", "Clean driving history", "Premium discounts"], answer: 0 },
  { q: "Risk inspection is usually done in:", choices: ["Fire insurance", "Travel insurance", "Health insurance", "Life insurance"], answer: 0 },
  { q: "Sum insured in health insurance means:", choices: ["Maximum amount payable", "Minimum amount payable", "Daily allowance", "Discount amount"], answer: 0 },
  { q: "Information mismatch in a proposal form leads to:", choices: ["Faster approval", "Claim rejection", "Premium reduction", "Bonus"], answer: 1 },
  { q: "Insurable interest means:", choices: ["A person benefits from loss", "A person who suffers financial loss if event occurs", "A person buys policy for investment", "A person buys policy for fun"], answer: 1 },
  { q: "Insurance fraud includes:", choices: ["Providing correct documents", "Fake claims", "Accurate information", "Timely renewal"], answer: 1 },
  { q: "Policy renewal means:", choices: ["Increasing IDV", "Extending policy validity", "Claim settlement", "Buying new vehicle"], answer: 1 },
  { q: "POSP authorization validity is decided by:", choices: ["Customer", "IRDAI guidelines", "Mechanic", "TPA"], answer: 1 },
  { q: "POSP should not:", choices: ["Provide correct product details", "Mislead customer", "Help with documentation", "Explain exclusions"], answer: 1 },
  { q: "Proposal form is used to collect:", choices: ["Optional customer information", "Detailed customer information", "POSP details only", "Claim amount"], answer: 1 },
  { q: "Surveyor involvement is required in:", choices: ["Small OD claims", "All health claims", "Large OD claims", "Free-look cancellations"], answer: 2 },
  { q: "The proposer is:", choices: ["POSP", "Hospital", "Person who applies for insurance", "Surveyor"], answer: 2 },
  { q: "Waiting period applies mostly to:", choices: ["Accidents", "Life insurance", "Pre-existing diseases", "Motor insurance"], answer: 2 },
  { q: "A claim form must be filled:", choices: ["Before purchase", "During renewal", "At the time of claim", "During free-look"], answer: 2 },
  { q: "Fire insurance covers loss due to:", choices: ["Theft", "Intentional burning", "Accidental fire", "Wilful damage"], answer: 2 },
  { q: "Insurance ombudsman resolves disputes up to:", choices: ["?10,000", "?1 crore", "?50 Lacs", "No limit"], answer: 2 },
  { q: "No Claim Bonus is applicable to:", choices: ["Health", "Fire", "Motor OD", "Travel"], answer: 2 },
  { q: "Travel insurance covers:", choices: ["Home burglary", "Car theft", "Loss of baggage or medical emergencies abroad", "Tax filing"], answer: 2 },
  { q: "A third-party motor claim involves:", choices: ["Loss to policyholder", "Minor scratches", "Damage to tyres only", "Loss or injury to others"], answer: 3 },
  { q: "Cashless facility is available at:", choices: ["Any hospital", "Non-network garages", "Grocery stores", "Network hospitals"], answer: 3 },
  { q: "Contribution principle applies when:", choices: ["One insurer handles claim", "POSP is confused", "Policyholder owns no property", "Multiple insurers cover same risk"], answer: 3 },
  { q: "Health insurance covers:", choices: ["Home repairs", "Life savings", "Car damage", "Hospitalization costs"], answer: 3 },
  { q: "A POSP must maintain:", choices: ["Confidentiality", "Transparency", "Ethical behavior", "All of the above"], answer: 3 },
  { q: "Free-look period is applicable for:", choices: ["Health and life policies", "Motor third-party policies", "Fire policies", "All policies"], answer: 3 },
  { q: "Policy wording includes:", choices: ["Exclusions", "Coverages", "Conditions", "All of the above"], answer: 3 },
  { q: "Premium depends on:", choices: ["Age (for health)", "IDV (for motor)", "Coverage", "All of the above"], answer: 3 },
  { q: "POSP must maintain:", choices: ["Confidentiality of customer information", "Personal profit margin", "Loan details", "Competitor secrets"], answer: 0 },
  { q: "Insurance contracts are based on:", choices: ["Maximum profit", "Utmost good faith", "Competition", "Secrecy"], answer: 1 },
  { q: "IRDAI stands for:", choices: ["Indian Risk Development Agency of India", "Insurance Regulatory and Development Authority of India", "Insurance Research and Data Authority of India", "Industrial Regulatory Department of India"], answer: 1 },
  { q: "Lapsed policy means:", choices: ["Policy has been cancelled", "Premium not paid within grace period", "Policyholder died", "Claim approved"], answer: 1 },
  { q: "Marine insurance is applicable for:", choices: ["Trains", "Ships and cargo", "Cars", "Bicycles"], answer: 1 },
  { q: "Motor third-party insurance is:", choices: ["Optional", "Mandatory by law", "Only for commercial vehicles", "Needed only after accidents"], answer: 1 },
  { q: "NCB (No Claim Bonus) is applicable in:", choices: ["Home Insurance", "Motor insurance", "Life insurance", "Travel insurance"], answer: 1 },
  { q: "Personal Accident cover compensates for:", choices: ["Natural death", "Accident-only injuries/death", "Theft", "Fire damage"], answer: 1 },
  { q: "Policy schedule contains:", choices: ["Medical reports", "Summary of coverage details", "Surveyor fees", "POSP marksheet"], answer: 1 },
  { q: "POSP certificate is issued after:", choices: ["Payment of fees", "15-hour training + exam", "Background verification only", "Only personal interview"], answer: 1 },
  { q: "POSP must ensure:", choices: ["Customer buys maximum products", "Ethical selling and compliance", "Hidden charges", "Misleading information"], answer: 1 },
  { q: "POSP should disclose:", choices: ["Only product price", "All key features, exclusions, and terms", "Only benefits", "Only claim process"], answer: 1 },
  { q: "Premium for insurance is based on:", choices: ["Age and income", "Risk exposure", "Profit margins", "Customer relationship"], answer: 1 },
  { q: "Premium receipt is proof of:", choices: ["Claim payment", "Premium paid", "Loan sanction", "Aadhaar update"], answer: 1 },
  { q: "Pre-policy health check-up is required mainly for:", choices: ["Young adults", "Senior citizens or high-risk individuals", "Children", "Government employees"], answer: 1 },
  { q: "Risk in insurance refers to:", choices: ["Profit", "Government rule", "Uncertainty", "Guarantee"], answer: 2 },
  { q: "Surveyors role is to:", choices: ["Sell policies", "Provide financial advice", "Assess losses during claims", "Modify premiums"], answer: 2 },
  { q: "The IRDAI regulates:", choices: ["Banking sector", "Stock market", "Insurance industry", "Mutual funds"], answer: 2 },
  { q: "The nominee in insurance receives:", choices: ["POSP commission", "Training certificate", "Policy benefits after insureds death", "IRDAI license"], answer: 2 },
  { q: "The term 'Grace period' applies to:", choices: ["Claim settlement", "Refund processing", "Late premium payment", "Loan disbursement"], answer: 2 },
  { q: "Underwriting is related to:", choices: ["Claims processing", "Policy printing", "Assessing risk", "Customer onboarding"], answer: 2 },
  { q: "What is the primary benefit of travel insurance?", choices: ["Free vacations", "Investment returns", "Protection against unexpected travel risks", "Improving credit score"], answer: 2 },
  { q: "Which document is mandatory during claim settlement?", choices: ["Aadhaar only", "Electricity bill", "KYC and policy document", "Bank passbook"], answer: 2 },
  { q: "Which of these affects motor insurance premiums?", choices: ["Vehicle color", "Owners caste", "Vehicle age", "Owners Height"], answer: 2 },
  { q: "A cashless claim means:", choices: ["Claim is denied", "No paperwork required", "Hospital bills are settled directly by insurer", "Customer pays full amount"], answer: 2 },
  { q: "A claim becomes 'repudiated' when:", choices: ["It is paid fully", "It is delayed", "It is rejected", "It is approved"], answer: 2 },
  { q: "A claim form is filled by:", choices: ["Insurer", "Surveyor", "Customer/claimant", "POSP only"], answer: 2 },
  { q: "A Point of Sales Person (POSP) can sell:", choices: ["Complex corporate insurance", "Reinsurance products", "Simple pre-approved insurance products", "Investment-linked insurance"], answer: 2 },
  { q: "In insurance, 'proposal form' is filled by:", choices: ["POSP", "Insurer", "Customer", "Regulator"], answer: 2 },
  { q: "The insurer in a policy is the:", choices: ["Customer", "Selling agent", "Insurance company", "Surveyor"], answer: 2 },
  { q: "The solvency margin is maintained by:", choices: ["Customers", "Brokers", "Insurance companies", "POSPs"], answer: 2 },
  { q: "Which is an example of a health insurance product?", choices: ["Crop insurance", "Fire insurance", "Individual Mediclaim", "Marine cargo"], answer: 2 },
  { q: "Which of the following is a general insurance product?", choices: ["Term life insurance", "Endowment plan", "Motor insurance", "ULIP"], answer: 2 },
  { q: "A floater health plan covers:", choices: ["Only one person", "Non-family members", "Customer + POSP", "Entire family under one sum insured"], answer: 3 },
  { q: "A motor insurance policy expires on:", choices: ["Last day of the month", "Automatically renewed", "15 days after its due date", "Exactly on the expiry date mentioned"], answer: 3 },
  { q: "Endorsement in insurance refers to:", choices: ["Claim rejection", "Premium payment", "Agent commission", "Policy modification"], answer: 3 },
  { q: "Exclusions are:", choices: ["Tax benefits", "Renewal options", "Premium discounts", "Events not covered under policy"], answer: 3 },
  { q: "Fraud in insurance includes:", choices: ["Genuine claim", "Adding nominee", "Premium payment", "Misrepresentation or false information"], answer: 3 },
  { q: "Free-look period allows:", choices: ["Premium revision", "Loan facility", "Bonus benefits", "Cancellation within 15 days"], answer: 3 },
  { q: "Health insurance pre-existing disease is a condition:", choices: ["Developed after buying policy", "Only for senior citizens", "Never covered", "Known before buying policy"], answer: 3 },
  { q: "Insurable interest must exist at the time of:", choices: ["Claim", "Policy Inception", "Renewal", "All of these"], answer: 3 },
  { q: "Which is NOT a principle of insurance?", choices: ["Contribution", "Indemnity", "Subrogation", "Inflation"], answer: 3 },
  { q: "Which is NOT part of KYC?", choices: ["Photograph", "PAN", "Passport", "Favorite color"], answer: 3 },
];

const QUESTION_BANK = QUESTION_BANK_RAW.map((question, i) => ({ ...question, id: i + 1 }));

const QUESTIONS_PER_TEST = 50;
const PASSING_PERCENT = 0.7; // 70% — 35 correct out of 50

// Most questions in the bank happen to have their correct choice sitting in
// position B or C — shuffling each question's own choice order (and
// remapping which index is now correct) breaks that pattern instead of
// handing it to anyone who notices.
function shuffleChoiceOrder(q: (typeof QUESTION_BANK)[number]) {
  const order = q.choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer) };
}

function sampleQuestions(pool: typeof QUESTION_BANK, count: number) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(shuffleChoiceOrder);
}

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

  const router = useRouter();
  const [currentSet, setCurrentSet] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const testProgress = currentSet
  ? Math.round(((index + 1) / currentSet.questions.length) * 100)
  : 0;

  const handleLogout = async () => {
    try {
      await fetch("/api/agent/logout", { method: "POST", credentials: "include" });
      localStorage.removeItem("agentName");
      localStorage.removeItem("agentTestPassed");
      localStorage.removeItem("training_currentVideo");
      localStorage.removeItem("training_completed");
      localStorage.removeItem("training_testStarted");
      router.replace("/agentlogin");
    } catch (err) {
      console.error(err);
    }
  };

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
     RANDOM 50-QUESTION DRAW FROM THE FULL BANK
  =============================== */
  useEffect(() => {
    setCurrentSet({ questions: sampleQuestions(QUESTION_BANK, QUESTIONS_PER_TEST) });

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
    <div className={m1.root}>
      <header className={m1.topbar}>
        <div className={m1.brandRow}>
          <span className={m1.brandName}>Zanifest</span>
          <div className={m1.brand}>
            <strong>POSP Onboarding Journey</strong>
          </div>
        </div>
        <button type="button" className={m1.logout} onClick={handleLogout}>
          Log out
        </button>
      </header>

      <section className={m1.journey} aria-label="Onboarding progress">
        <div className={`${m1.journeyItem} ${m1.complete}`}>
          <span className={m1.journeyDot}>✓</span>
          <div>
            <b>Profile &amp; KYC</b>
            <small>Step completed</small>
          </div>
        </div>
        <span className={`${m1.journeyLine} ${m1.complete}`} />
        <div className={`${m1.journeyItem} ${m1.complete}`}>
          <span className={m1.journeyDot}>✓</span>
          <div>
            <b>Training</b>
            <small>3 modules completed</small>
          </div>
        </div>
        <span className={`${m1.journeyLine} ${m1.complete}`} />
        <div className={`${m1.journeyItem} ${m1.active}`}>
          <span className={m1.journeyDot}>3</span>
          <div>
            <b>Assessment</b>
            <small>Final evaluation</small>
          </div>
        </div>
        <span className={m1.journeyLine} />
        <div className={m1.journeyItem}>
          <span className={m1.journeyDot}>4</span>
          <div>
            <b>Certificate</b>
            <small>Get certified</small>
          </div>
        </div>
      </section>

      <main className={m1.pageShell}>
        {!showResult ? (
          <>
            <section className={m1.trainingHead}>
              <div>
                <p className={m1.stepLabel}>Step 3: Assessment</p>
                <p className={m1.muted}>
                  Passing Marks: {Math.ceil(questions.length * PASSING_PERCENT)} · Question {index + 1} of {questions.length} · Mandatory
                </p>
              </div>
              <span className={m1.statusPill}>⏱ {formatTime(timeLeft)}</span>
            </section>

            <div className={m1.progressRow}>
              <span>Test in Progress</span>
              <span>
                Question {index + 1} of {questions.length}
              </span>
            </div>
            <div className={m1.progressTrack}>
              <div style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
            </div>

            <section className={m1.heroCard}>
              <h1>Agent Certification Test</h1>
              <p>IRDAI POSP Certification Practice Test</p>
              <small>
                {questions.length} Questions · Time limit: 60 minutes · Passing marks:{" "}
                {Math.ceil(questions.length * PASSING_PERCENT)}
              </small>
            </section>

            <section className={m1.card}>
              <div className={styles.questionCardTitle}>
                <h2>
                  Q{index + 1}. {questions[index].q}
                </h2>
              </div>
              <div className={m1.cardBody}>
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
                    className={m1.secondary}
                  >
                    Previous
                  </button>

                  {index < questions.length - 1 ? (
                    <button onClick={() => setIndex(index + 1)} className={m1.primary}>
                      Next
                    </button>
                  ) : (
                    <button onClick={submitTest} className={m1.primary}>
                      Submit Test
                    </button>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <Result
            score={score}
            total={questions.length}
            onClose={onClose}
            onResultVisible={onResultVisible} // ✅ ADD
          />
        )}
      </main>
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

  const pass = score >= total * PASSING_PERCENT; // 70% passing threshold (35/50)

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
                onClick={() => window.location.replace("/assessmenttraining")}
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
