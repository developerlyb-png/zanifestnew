"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import styles from "@/styles/components/videolecturedashboard/Module1Training.module.css";
import { MODULE3_SECTION_QUIZZES, MODULE3_FINAL_QUIZ } from "@/constants/pospModule3Quiz";
import QuizBlock from "./QuizBlock";

interface Module3TrainingProps {
  onComplete?: () => void;
}

const Module3Training: React.FC<Module3TrainingProps> = ({ onComplete }) => {
  const router = useRouter();
  const [declared, setDeclared] = useState(false);
  const [moduleCompleted, setModuleCompleted] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post("/api/agent/logout", {}, { withCredentials: true });
      localStorage.removeItem("agentName");
      localStorage.removeItem("agentTestPassed");
      router.replace("/agentlogin");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitModule = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${window.location.pathname}:module3Completed`, "1");
    }
    setModuleCompleted(true);
    onComplete?.();
  };

  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <div className={styles.brandRow}>
          <img src="/logo.png" alt="Zanifest" className={styles.brandLogo} />
          <div className={styles.brand}>
            <span className={styles.brandKicker}>Zanifest</span>
            <strong>POSP Onboarding Journey</strong>
          </div>
        </div>
        <button type="button" className={styles.logout} onClick={handleLogout}>
          Log out
        </button>
      </header>

      <section className={styles.journey} aria-label="Onboarding progress">
        <div className={`${styles.journeyItem} ${styles.complete}`}>
          <span className={styles.journeyDot}>✓</span>
          <div>
            <b>Profile &amp; KYC</b>
            <small>Step completed</small>
          </div>
        </div>
        <span className={`${styles.journeyLine} ${styles.complete}`} />
        <div className={`${styles.journeyItem} ${styles.active}`}>
          <span className={styles.journeyDot}>2</span>
          <div>
            <b>Training</b>
            <small>Module learning</small>
          </div>
        </div>
        <span className={styles.journeyLine} />
        <div className={styles.journeyItem}>
          <span className={styles.journeyDot}>3</span>
          <div>
            <b>Assessment</b>
            <small>Final evaluation</small>
          </div>
        </div>
        <span className={styles.journeyLine} />
        <div className={styles.journeyItem}>
          <span className={styles.journeyDot}>4</span>
          <div>
            <b>Certificate</b>
            <small>Get certified</small>
          </div>
        </div>
      </section>

      <main className={styles.pageShell}>
        <section className={styles.trainingHead}>
          <div>
            <p className={styles.stepLabel}>Step 2: Training</p>
            <p className={styles.muted}>3 Modules · POSP self-onboarding learning</p>
          </div>
          <span className={styles.statusPill}>{moduleCompleted ? "Module 3 complete" : "100% complete"}</span>
        </section>

        <div className={styles.moduleTabs}>
          <span>Module 1</span>
          <span>Module 2</span>
          <span className={styles.active}>Module 3</span>
        </div>

        <div className={styles.progressRow}>
          <span>Training in Progress</span>
          <span>Module 3 of 3</span>
        </div>
        <div className={styles.progressTrack}>
          <div style={{ width: "100%" }} />
        </div>

        <section className={styles.heroCard}>
          <h1>POSP Self-Onboarding Training — Module 3</h1>
          <p>General Insurance, Health Insurance and POSP Product Learning</p>
          <small>Duration: 5 Hours · Mode: POSP self-onboarding digital learning with interactive checks</small>
        </section>

        <div className={styles.sectionNav}>
          <a href="#m3s1">1. Product Scope</a>
          <a href="#m3s2">2. Motor</a>
          <a href="#m3s3">3. Health</a>
          <a href="#m3s4">4. PA, Travel &amp; Home</a>
          <a href="#m3s5">5. Rural Products</a>
          <a href="#final">Final Assessment</a>
        </div>

        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <h2>Module 3 Overview</h2>
            <small>Duration: 5 hours</small>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.overviewGrid}>
              <div className={`${styles.overviewBox} ${styles.blue}`}>
                <b>Module objective</b>
                <p>
                  Understand key POSP-allowed general and health insurance product categories, coverage basics,
                  exclusions, disclosure and claim cautions.
                </p>
              </div>
              <div className={`${styles.overviewBox} ${styles.green}`}>
                <b>Assessment pattern</b>
                <p>5 MCQs after every section and a final 20-MCQ assessment.</p>
              </div>
              <div className={`${styles.overviewBox} ${styles.orange}`}>
                <b>Completion expectation</b>
                <p>Read product notes, open official resources, complete activities and assessments.</p>
              </div>
            </div>

            <h3>5-Hour Learning Plan</h3>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Learning Component</th>
                    <th>Estimated Time</th>
                    <th>Expected Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Section 1: POSP product scope and customer disclosure</td>
                    <td>45 min</td>
                    <td>Read product boundary and authorized product discipline.</td>
                  </tr>
                  <tr>
                    <td>Section 2: Motor insurance</td>
                    <td>60 min</td>
                    <td>Study third-party, own-damage, package policy, IDV, NCB and add-ons.</td>
                  </tr>
                  <tr>
                    <td>Section 3: Health insurance</td>
                    <td>70 min</td>
                    <td>Study hospitalization, cashless, waiting periods, PED and exclusions.</td>
                  </tr>
                  <tr>
                    <td>Section 4: Personal accident, travel and home insurance</td>
                    <td>65 min</td>
                    <td>Review benefits, exclusions and customer communication.</td>
                  </tr>
                  <tr>
                    <td>Section 5: Rural/agriculture products and ethics</td>
                    <td>45 min</td>
                    <td>Study crop, livestock, weather products and rural documentation.</td>
                  </tr>
                  <tr>
                    <td>Final assessment</td>
                    <td>15 min</td>
                    <td>Attempt 20 MCQs and submit declaration.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>Learning Outcomes</h3>
            <ul className={styles.outcomeList}>
              <li>Explain basic product features without making claim guarantees.</li>
              <li>Identify important disclosures for motor, health, travel, home, PA and rural products.</li>
              <li>Understand waiting periods, exclusions, deductibles, IDV, NCB and add-ons.</li>
              <li>Identify unauthorized or misleading product statements.</li>
              <li>Use official sources to verify product terms and availability.</li>
            </ul>
          </div>
        </section>

        <section className={styles.card} id="m3s1">
          <div className={styles.cardTitle}>
            <h2>Section 1 — POSP Product Scope and Customer Disclosure</h2>
            <small>Estimated learner time: 45 minutes</small>
          </div>
          <div className={`${styles.cardBody} ${styles.sectionContent}`}>
            <h4>1. POSP Product Boundary</h4>
            <p>
              A POSP should solicit only products permitted and authorized for that POSP code. Product availability
              may depend on insurer, intermediary, product filing, internal authorization and customer eligibility.
            </p>
            <h4>2. Product Explanation Discipline</h4>
            <p>
              Explain benefits, exclusions, customer declarations, claim process and documents in simple language.
              Do not provide legal, medical, tax or underwriting advice beyond approved product material.
            </p>
            <div className={styles.warning}>
              Never promise claim approval, full reimbursement, cashless approval, lowest premium, guaranteed
              renewal or assured policy issuance.
            </div>
            <h4>3. Product Disclosure Script</h4>
            <div className={styles.successNote}>
              I will explain the key benefits and important limitations. Please read the policy schedule, wording,
              exclusions, waiting periods and claim requirements. Final claim admissibility is decided by the
              insurer according to policy terms.
            </div>
            <div className={styles.activity}>
              <b>
                Self-learning activity: Read the POSP guideline PDFs and write three things you may do and three
                things you must avoid while explaining products.
              </b>
            </div>
            <div className={styles.resourceBox}>
              <strong>Required section readings / videos</strong>
              <a href="#">IRDAI POSP Guidelines – Non-Life &amp; Health</a>
              <a href="#">IRDAI revision in POSP Guidelines</a>
              <a href="#">Policyholder portal – Available products</a>
            </div>
            <h3>Knowledge Check — 5 MCQs</h3>
            <QuizBlock quizKey="m3s1" questions={MODULE3_SECTION_QUIZZES.m3s1} />
          </div>
        </section>

        <section className={styles.card} id="m3s2">
          <div className={styles.cardTitle}>
            <h2>Section 2 — Motor Insurance</h2>
            <small>Estimated learner time: 60 minutes</small>
          </div>
          <div className={`${styles.cardBody} ${styles.sectionContent}`}>
            <h4>1. Motor Insurance Basics</h4>
            <p>
              Motor insurance protects against legal liability and/or vehicle damage depending on policy type.
              Third-party liability is mandatory for vehicles on public roads. Own-damage protection requires
              suitable coverage such as package or standalone own-damage policy.
            </p>
            <h4>2. Key Motor Terms</h4>
            <div className={styles.tableWrap}>
              <table className={styles.infoTable}>
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Meaning</th>
                    <th>POSP caution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>IDV</td>
                    <td>Insured Declared Value used for premium and total-loss basis.</td>
                    <td>Very low IDV can reduce premium but affect claim basis.</td>
                  </tr>
                  <tr>
                    <td>NCB</td>
                    <td>No Claim Bonus for claim-free years.</td>
                    <td>Incorrect declaration may affect claim or recovery.</td>
                  </tr>
                  <tr>
                    <td>Deductible</td>
                    <td>Amount borne by insured in claim.</td>
                    <td>Explain out-of-pocket cost.</td>
                  </tr>
                  <tr>
                    <td>Add-ons</td>
                    <td>Extra covers such as zero depreciation, engine protect or roadside assistance.</td>
                    <td>Explain conditions and limits.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h4>3. Common Motor Disclosures</h4>
            <ul className={styles.outcomeList}>
              <li>Correct registration, make, model, variant and fuel type.</li>
              <li>Private or commercial use and permit usage.</li>
              <li>Previous policy, NCB and prior claims.</li>
              <li>Hypothecation, CNG/LPG kit, modifications and accessories.</li>
            </ul>
            <div className={styles.activity}>
              <b>
                Self-learning activity: Create a motor renewal checklist covering TP, OD, IDV, NCB, deductible,
                add-ons, exclusions and claim documents.
              </b>
            </div>
            <div className={styles.resourceBox}>
              <strong>Required section readings / videos</strong>
              <a href="#">Policyholder portal – Motor insurance</a>
              <a href="#">IRDAI Connects motor videos</a>
              <a href="#">Policyholder portal – Buy with care</a>
            </div>
            <h3>Knowledge Check — 5 MCQs</h3>
            <QuizBlock quizKey="m3s2" questions={MODULE3_SECTION_QUIZZES.m3s2} />
          </div>
        </section>

        <section className={styles.card} id="m3s3">
          <div className={styles.cardTitle}>
            <h2>Section 3 — Health Insurance</h2>
            <small>Estimated learner time: 70 minutes</small>
          </div>
          <div className={`${styles.cardBody} ${styles.sectionContent}`}>
            <h4>1. Health Insurance Basics</h4>
            <p>
              Health insurance may cover hospitalization, day-care treatment, specified pre- and post-hospitalization
              expenses, ambulance, cashless facility and other benefits depending on policy wording.
            </p>
            <h4>2. Important Terms</h4>
            <div className={styles.tableWrap}>
              <table className={styles.infoTable}>
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Meaning</th>
                    <th>POSP caution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Waiting period</td>
                    <td>Period during which certain claims are not payable.</td>
                    <td>Never say all diseases are covered from day one.</td>
                  </tr>
                  <tr>
                    <td>Pre-existing disease</td>
                    <td>Known disease/condition before policy start.</td>
                    <td>Must be disclosed truthfully.</td>
                  </tr>
                  <tr>
                    <td>Cashless</td>
                    <td>Insurer/TPA settles approved eligible bills with network hospital.</td>
                    <td>Subject to authorization and policy terms.</td>
                  </tr>
                  <tr>
                    <td>Room-rent limit</td>
                    <td>Limit on room category or amount.</td>
                    <td>May affect admissible claim.</td>
                  </tr>
                  <tr>
                    <td>Co-pay/deductible</td>
                    <td>Part of claim borne by insured.</td>
                    <td>Explain out-of-pocket share.</td>
                  </tr>
                  <tr>
                    <td>Portability</td>
                    <td>Transfer of continuity benefits as per rules.</td>
                    <td>Customer must follow timelines and conditions.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h4>3. Common Health Disclosures</h4>
            <ul className={styles.outcomeList}>
              <li>Age, occupation and lifestyle facts.</li>
              <li>Existing disease, surgery, medication and symptoms.</li>
              <li>Previous claims, policies and rejected applications.</li>
              <li>Preferred hospitals, budget, co-pay and room category expectations.</li>
            </ul>
            <div className={styles.warning}>
              Health selling caution: Do not advise a customer to hide diabetes, blood pressure, surgery, ongoing
              medication or previous claim history.
            </div>
            <div className={styles.activity}>
              <b>
                Self-learning activity: Prepare a simple health insurance discussion checklist for a family of four
                with one senior parent.
              </b>
            </div>
            <div className={styles.resourceBox}>
              <strong>Required section readings / videos</strong>
              <a href="#">Policyholder portal – What health insurance to buy</a>
              <a href="#">Registered health insurers</a>
              <a href="#">IRDAI Connects health videos</a>
              <a href="#">Policyholder consumer booklet</a>
            </div>
            <h3>Knowledge Check — 5 MCQs</h3>
            <QuizBlock quizKey="m3s3" questions={MODULE3_SECTION_QUIZZES.m3s3} />
          </div>
        </section>

        <section className={styles.card} id="m3s4">
          <div className={styles.cardTitle}>
            <h2>Section 4 — Personal Accident, Travel and Home Insurance</h2>
            <small>Estimated learner time: 65 minutes</small>
          </div>
          <div className={`${styles.cardBody} ${styles.sectionContent}`}>
            <h4>1. Personal Accident Insurance</h4>
            <p>
              Personal accident policies usually pay fixed benefits for accidental death, permanent total
              disability, permanent partial disability and sometimes temporary total disability, subject to terms.
            </p>
            <h4>2. Travel Insurance</h4>
            <p>
              Travel insurance may cover emergency medical expenses while travelling, baggage loss/delay, passport
              loss, personal accident, travel delay and trip cancellation depending on plan.
            </p>
            <h4>3. Home Insurance</h4>
            <p>
              Home insurance may cover building and/or contents against specified perils such as fire, natural
              catastrophe, burglary and other insured risks. Sum insured basis and exclusions must be explained.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.infoTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Explain clearly</th>
                    <th>Avoid saying</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Personal accident</td>
                    <td>Accidental death/disability benefits, period and exclusions.</td>
                    <td>All medical bills are covered.</td>
                  </tr>
                  <tr>
                    <td>Travel</td>
                    <td>Geography, trip duration, emergency, baggage/passport limits.</td>
                    <td>All travel problems are covered.</td>
                  </tr>
                  <tr>
                    <td>Home</td>
                    <td>Building/contents, insured perils, exclusions and sum insured.</td>
                    <td>Everything inside the home is automatically covered.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={styles.activity}>
              <b>
                Self-learning activity: Prepare three customer scripts, one each for PA, travel and home insurance,
                with one benefit, one exclusion and one claim-document caution.
              </b>
            </div>
            <div className={styles.resourceBox}>
              <strong>Required section readings / videos</strong>
              <a href="#">Policyholder portal – Why buy travel insurance</a>
              <a href="#">Policyholder portal – Available products</a>
              <a href="#">IRDAI Connects videos</a>
              <a href="#">Policyholder consumer booklet</a>
            </div>
            <h3>Knowledge Check — 5 MCQs</h3>
            <QuizBlock quizKey="m3s4" questions={MODULE3_SECTION_QUIZZES.m3s4} />
          </div>
        </section>

        <section className={styles.card} id="m3s5">
          <div className={styles.cardTitle}>
            <h2>Section 5 — Rural / Agriculture Products and Product-Selling Ethics</h2>
            <small>Estimated learner time: 45 minutes</small>
          </div>
          <div className={`${styles.cardBody} ${styles.sectionContent}`}>
            <h4>1. Crop and Weather-Based Insurance</h4>
            <p>
              Crop products may protect farmers against specified production losses based on scheme rules, crop,
              area, season, assessment method and notified causes.
            </p>
            <h4>2. Livestock, Poultry and Agricultural Pump-set</h4>
            <p>
              Livestock insurance may cover death due to specified accidents or disease subject to identification,
              veterinary certification, agreed valuation and exclusions. Agricultural pump-set insurance may protect
              specified equipment according to policy terms.
            </p>
            <h4>3. Rural Product Cautions</h4>
            <ul className={styles.outcomeList}>
              <li>Explain scheme and geographic eligibility.</li>
              <li>Ensure correct land, crop, animal or equipment identification.</li>
              <li>Do not promise payment before official assessment.</li>
              <li>Preserve documents, certificates and evidence.</li>
              <li>Avoid guaranteed-output or guaranteed-claim language.</li>
            </ul>
            <div className={styles.activity}>
              <b>
                Self-learning activity: Create a rural insurance checklist covering livestock and pump-set
                eligibility, identification, documents, claim triggers and exclusions.
              </b>
            </div>
            <div className={styles.resourceBox}>
              <strong>Required section readings / videos</strong>
              <a href="#">PMFBY official portal</a>
              <a href="#">Know PMFBY</a>
              <a href="#">IRDAI POSP Guidelines</a>
              <a href="#">Policyholder portal – Available products</a>
            </div>
            <h3>Knowledge Check — 5 MCQs</h3>
            <QuizBlock quizKey="m3s5" questions={MODULE3_SECTION_QUIZZES.m3s5} />
          </div>
        </section>

        <section className={styles.card} id="final">
          <div className={styles.cardTitle}>
            <h2>Final Module Assessment</h2>
            <small>20 MCQs covering all sections</small>
          </div>
          <div className={styles.cardBody}>
            <p>Attempt all questions after completing all sections and required readings.</p>
            <QuizBlock quizKey="final" questions={MODULE3_FINAL_QUIZ} />
          </div>
        </section>

        <section className={styles.completionBox}>
          <h3>Completion Declaration</h3>
          <label>
            <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} /> I confirm
            that I completed Module 3 and understand POSP general and health product boundaries, disclosures and
            customer-protection expectations.
          </label>
        </section>

        <section className={`${styles.card} ${styles.referenceCard}`}>
          <div className={styles.cardTitle}>
            <h2>Reference Library</h2>
            <small>Official product learning resources</small>
          </div>
          <div className={`${styles.cardBody} ${styles.resources}`}>
            <a href="#">IRDAI POSP Guidelines – Non-Life &amp; Health</a>
            <a href="#">IRDAI revision in POSP Guidelines</a>
            <a href="#">IRDAI Annual Reports</a>
            <a href="#">Policyholder portal – Motor insurance</a>
            <a href="#">Policyholder portal – What health insurance to buy</a>
            <a href="#">Policyholder portal – Why buy travel insurance</a>
            <a href="#">PMFBY official portal</a>
            <a href="#">IRDAI Connects videos</a>
          </div>
        </section>

        <div className={styles.moduleSwitch}>
          <span className={styles.locked}>← Back to Module 2</span>
          <a className={styles.primaryLink} href="#final">
            Go to Final Assessment
          </a>
        </div>

        <footer>
          <p>POSP Self-Onboarding Training Module 3</p>
          <button
            type="button"
            id="submitModule"
            disabled={!declared || moduleCompleted}
            onClick={handleSubmitModule}
          >
            {moduleCompleted ? "Module Completed ✓" : declared ? "Complete Module" : "In Progress..."}
          </button>
        </footer>
      </main>
    </div>
  );
};

export default Module3Training;
