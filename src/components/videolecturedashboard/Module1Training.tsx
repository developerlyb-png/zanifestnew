"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import styles from "@/styles/components/videolecturedashboard/Module1Training.module.css";
import { MODULE1_SECTION_QUIZZES, MODULE1_FINAL_QUIZ } from "@/constants/pospModule1Quiz";
import QuizBlock from "./QuizBlock";

interface Module1TrainingProps {
  onComplete?: () => void;
}

const Module1Training: React.FC<Module1TrainingProps> = ({ onComplete }) => {
  const router = useRouter();
  const [declared, setDeclared] = useState(false);
  const [moduleCompleted, setModuleCompleted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setModuleCompleted(window.localStorage.getItem(`${window.location.pathname}:module1Completed`) === "1");
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/agent/logout", {}, { withCredentials: true });
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

  const handleSubmitModule = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${window.location.pathname}:module1Completed`, "1");
    }
    setModuleCompleted(true);
    onComplete?.();
  };

  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandKicker}>Zanifest</span>
          <strong>POSP Onboarding Journey</strong>
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
          <span className={styles.statusPill}>{moduleCompleted ? "Module 1 complete" : "33% complete"}</span>
        </section>

        <div className={styles.moduleTabs}>
          <span className={styles.active}>Module 1</span>
          <span className={styles.locked} title="Coming soon">
            Module 2
          </span>
          <span className={styles.locked} title="Coming soon">
            Module 3
          </span>
        </div>

        <div className={styles.progressRow}>
          <span>Training in Progress</span>
          <span>Module 1 of 3</span>
        </div>
        <div className={styles.progressTrack}>
          <div style={{ width: "33%" }} />
        </div>

        <section className={styles.heroCard}>
          <h1>POSP Self-Onboarding Training — Module 1</h1>
          <p>Introduction to Insurance and Indian Insurance Market</p>
          <small>Duration: 5 Hours · Mode: POSP self-onboarding digital learning with interactive checks</small>
        </section>

        <div className={styles.sectionNav}>
          <a href="#m1s1">1. Insurance Basics</a>
          <a href="#m1s2">2. Risk, Peril &amp; Hazard</a>
          <a href="#m1s3">3. Indian Market</a>
          <a href="#m1s4">4. POSP Role</a>
          <a href="#m1s5">5. Protection</a>
          <a href="#final">Final Assessment</a>
        </div>

        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <h2>Module 1 Overview</h2>
            <small>Duration: 5 hours</small>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.overviewGrid}>
              <div className={`${styles.overviewBox} ${styles.blue}`}>
                <b>Module objective</b>
                <p>
                  Build foundational understanding of insurance, the Indian insurance market, POSP role
                  boundaries and customer-protection expectations.
                </p>
              </div>
              <div className={`${styles.overviewBox} ${styles.green}`}>
                <b>Assessment pattern</b>
                <p>5 MCQs after every section and 20 final MCQs. Use Check Answers to evaluate responses.</p>
              </div>
              <div className={`${styles.overviewBox} ${styles.orange}`}>
                <b>Completion expectation</b>
                <p>
                  Read the module, open required references, complete activities and score the required
                  pass mark.
                </p>
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
                    <td>Section 1: Concept, purpose and need of insurance</td>
                    <td>55 min</td>
                    <td>Read concepts, complete activity, open customer education links and attempt MCQs.</td>
                  </tr>
                  <tr>
                    <td>Section 2: Risk, peril and hazard</td>
                    <td>55 min</td>
                    <td>Classify practical insurance scenarios and attempt MCQs.</td>
                  </tr>
                  <tr>
                    <td>Section 3: Indian insurance market</td>
                    <td>65 min</td>
                    <td>Review market structure and official IRDAI sources.</td>
                  </tr>
                  <tr>
                    <td>Section 4: Intermediaries and POSP role</td>
                    <td>65 min</td>
                    <td>Study POSP boundaries, authorization and conduct.</td>
                  </tr>
                  <tr>
                    <td>Section 5: Regulatory awareness and policyholder protection</td>
                    <td>45 min</td>
                    <td>Understand grievance flow and customer protection.</td>
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
              <li>Explain insurance as risk pooling and risk transfer, not guaranteed prevention of loss.</li>
              <li>Differentiate risk, peril and hazard using practical examples.</li>
              <li>Understand the Indian insurance ecosystem and identify official sources.</li>
              <li>Explain POSP product and conduct boundaries.</li>
              <li>Guide customers on disclosure, policy documents and grievance escalation.</li>
            </ul>
          </div>
        </section>

        <section className={styles.card} id="m1s1">
          <div className={styles.cardTitle}>
            <h2>Section 1 — Concept, Purpose and Need of Insurance</h2>
            <small>Estimated learner time: 55 minutes</small>
          </div>
          <div className={`${styles.cardBody} ${styles.sectionContent}`}>
            <h4>1. What is Insurance?</h4>
            <p>
              Insurance is a contract-based financial arrangement through which many people exposed to
              similar uncertain losses contribute premium into a common pool. Eligible claims are paid
              according to the policy schedule, wording, conditions, exclusions, deductibles and
              documentation.
            </p>
            <h4>2. Why Insurance is Needed</h4>
            <p>
              Insurance reduces the financial impact of covered events such as hospitalization, accident,
              fire, theft, flood, liability and travel emergencies. It supports household and business
              continuity but does not prevent the underlying loss.
            </p>
            <h4>3. POSP Conduct Points</h4>
            <ul className={styles.outcomeList}>
              <li>Explain benefits and limitations in simple language.</li>
              <li>Never promise that every claim will be paid.</li>
              <li>Capture customer details truthfully.</li>
              <li>Ask the customer to review the policy schedule and wording.</li>
              <li>Avoid fear, pressure or unsuitable selling.</li>
            </ul>
            <div className={styles.warning}>
              Coverage is always subject to policy terms, conditions, exclusions and successful
              underwriting or issuance.
            </div>
            <div className={styles.activity}>
              <b>
                Self-learning activity: Prepare a 60-second explanation for a two-wheeler buyer, a family
                buying health insurance, a shopkeeper and a farmer.
              </b>
            </div>
            <div className={styles.resourceBox}>
              <strong>Required section readings / videos</strong>
              <a href="#">IRDAI – What We Do</a>
              <a href="#">Policyholder portal – Available products</a>
              <a href="#">IRDAI Connects education videos</a>
              <a href="#">Insurance Institute of India – IC-38 material</a>
            </div>
            <h3>Knowledge Check — 5 MCQs</h3>
            <QuizBlock quizKey="m1s1" questions={MODULE1_SECTION_QUIZZES.m1s1} />
          </div>
        </section>

        <section className={styles.card} id="m1s2">
          <div className={styles.cardTitle}>
            <h2>Section 2 — Risk, Peril and Hazard</h2>
            <small>Estimated learner time: 55 minutes</small>
          </div>
          <div className={`${styles.cardBody} ${styles.sectionContent}`}>
            <h4>1. Risk</h4>
            <p>
              Risk is the possibility of financial loss due to uncertainty. Insurance generally focuses on
              pure risk, where there may be a loss or no loss.
            </p>
            <h4>2. Peril</h4>
            <p>Peril is the direct cause of loss, such as fire, accident, flood, theft, cyclone or disease.</p>
            <h4>3. Hazard</h4>
            <p>
              A hazard increases the probability or severity of loss. Physical hazards include unsafe
              wiring. Moral hazards involve dishonesty, while morale hazards involve careless behaviour
              because a person feels protected.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.infoTable}>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Risk</th>
                    <th>Peril</th>
                    <th>Hazard</th>
                    <th>POSP Learning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Private car used as taxi but declared private</td>
                    <td>Motor loss/liability</td>
                    <td>Accident</td>
                    <td>Wrong usage declaration</td>
                    <td>Capture actual use.</td>
                  </tr>
                  <tr>
                    <td>Shop with old wiring and combustible storage</td>
                    <td>Property damage</td>
                    <td>Fire</td>
                    <td>Unsafe electrical/storage condition</td>
                    <td>Do not ignore visible risk facts.</td>
                  </tr>
                  <tr>
                    <td>Customer hides diabetes</td>
                    <td>Claim dispute</td>
                    <td>Illness/hospitalization</td>
                    <td>Non-disclosure</td>
                    <td>Explain material disclosure.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={styles.activity}>
              <b>Self-learning activity: Write ten daily-life examples and classify each as risk, peril or hazard.</b>
            </div>
            <div className={styles.resourceBox}>
              <strong>Required section readings / videos</strong>
              <a href="#">Insurance Institute of India – IC-38 material</a>
              <a href="#">Policyholder portal – Consumer affairs booklet</a>
              <a href="#">IRDAI Connects YouTube channel</a>
            </div>
            <h3>Knowledge Check — 5 MCQs</h3>
            <QuizBlock quizKey="m1s2" questions={MODULE1_SECTION_QUIZZES.m1s2} />
          </div>
        </section>

        <section className={styles.card} id="m1s3">
          <div className={styles.cardTitle}>
            <h2>Section 3 — Indian Insurance Market and Latest Official References</h2>
            <small>Estimated learner time: 65 minutes</small>
          </div>
          <div className={`${styles.cardBody} ${styles.sectionContent}`}>
            <h4>1. Indian Insurance Ecosystem</h4>
            <p>
              The ecosystem includes IRDAI, insurers, reinsurers, brokers, agents, corporate agents, web
              aggregators, insurance marketing firms, TPAs, surveyors, repositories and policyholders.
            </p>
            <h4>2. Important Participants</h4>
            <div className={styles.tableWrap}>
              <table className={styles.infoTable}>
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Role</th>
                    <th>Why POSP should know</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>IRDAI</td>
                    <td>Regulates and promotes orderly growth and protects policyholder interests.</td>
                    <td>POSP conduct must align with regulated expectations.</td>
                  </tr>
                  <tr>
                    <td>Life insurers</td>
                    <td>Provide life insurance products.</td>
                    <td>Distinguish life, non-life and health categories.</td>
                  </tr>
                  <tr>
                    <td>General insurers</td>
                    <td>Provide motor, fire, marine, liability and other general products.</td>
                    <td>Many permitted POSP products fall here.</td>
                  </tr>
                  <tr>
                    <td>Health insurers</td>
                    <td>Provide health, accident and travel-related health products.</td>
                    <td>Disclosure and waiting periods are critical.</td>
                  </tr>
                  <tr>
                    <td>Reinsurers</td>
                    <td>Accept part of insurers&rsquo; risk.</td>
                    <td>Shows the layered risk ecosystem.</td>
                  </tr>
                  <tr>
                    <td>Intermediaries</td>
                    <td>Support distribution and servicing as permitted.</td>
                    <td>POSP must understand limited authority.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h4>3. Use Official Sources</h4>
            <p>
              Entity lists change. Use official IRDAI registered-entity pages, annual reports and approved
              platform instructions rather than old screenshots or informal counts.
            </p>
            <div className={styles.activity}>
              <b>
                Self-learning activity: Identify one life insurer, general insurer, health insurer, reinsurer
                and broker from official sources, and record the validation date.
              </b>
            </div>
            <div className={styles.resourceBox}>
              <strong>Required section readings / videos</strong>
              <a href="#">IRDAI Annual Reports</a>
              <a href="#">IRDAI registered insurance entities</a>
              <a href="#">Policyholder portal – Available products</a>
              <a href="#">IRDAI consolidated regulations</a>
            </div>
            <h3>Knowledge Check — 5 MCQs</h3>
            <QuizBlock quizKey="m1s3" questions={MODULE1_SECTION_QUIZZES.m1s3} />
          </div>
        </section>

        <section className={styles.card} id="m1s4">
          <div className={styles.cardTitle}>
            <h2>Section 4 — Insurance Intermediaries and POSP Role</h2>
            <small>Estimated learner time: 65 minutes</small>
          </div>
          <div className={`${styles.cardBody} ${styles.sectionContent}`}>
            <h4>1. Why Intermediaries Exist</h4>
            <p>
              Intermediaries support awareness, comparison, documentation, distribution, servicing and
              claim support. Each type has a defined regulatory role.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.infoTable}>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Typical function</th>
                    <th>POSP relevance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Individual agent</td>
                    <td>Solicits for insurer(s) as permitted.</td>
                    <td>Different authorization from POSP.</td>
                  </tr>
                  <tr>
                    <td>Corporate agent</td>
                    <td>Corporate distribution entity.</td>
                    <td>Specified-person and POSP processes may differ.</td>
                  </tr>
                  <tr>
                    <td>Insurance broker</td>
                    <td>Places risk under broker regulations.</td>
                    <td>POSP follows broker process and authorization.</td>
                  </tr>
                  <tr>
                    <td>Web aggregator</td>
                    <td>Online information/comparison and lead generation.</td>
                    <td>Comparison does not guarantee claims.</td>
                  </tr>
                  <tr>
                    <td>TPA</td>
                    <td>Health servicing and cashless coordination.</td>
                    <td>Not a POSP selling authority.</td>
                  </tr>
                  <tr>
                    <td>Surveyor/loss assessor</td>
                    <td>Assesses eligible losses.</td>
                    <td>POSP must not influence assessment.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h4>2. POSP Role and Boundary</h4>
            <p>
              A POSP may solicit only permitted pre-underwritten products after prescribed training,
              examination, certification, agreement and authorization.
            </p>
            <h4>3. Responsibilities</h4>
            <ul className={styles.outcomeList}>
              <li>Sell only permitted and authorized products.</li>
              <li>Disclose POSP role where required.</li>
              <li>Ensure correct identity tagging and proposal data.</li>
              <li>Never hide material facts or promise claim approval.</li>
              <li>Follow onboarding guidelines and code of conduct.</li>
            </ul>
            <div className={styles.activity}>
              <b>
                Self-learning activity: Note five responsibilities you must personally follow before
                soliciting any product.
              </b>
            </div>
            <div className={styles.resourceBox}>
              <strong>Required section readings / videos</strong>
              <a href="#">IRDAI POSP Guidelines – Non-Life &amp; Health</a>
              <a href="#">Revision in POSP Guidelines</a>
              <a href="#">Policyholder portal – Intermediaries handbook</a>
              <a href="#">IRDAI registered entity lists</a>
            </div>
            <h3>Knowledge Check — 5 MCQs</h3>
            <QuizBlock quizKey="m1s4" questions={MODULE1_SECTION_QUIZZES.m1s4} />
          </div>
        </section>

        <section className={styles.card} id="m1s5">
          <div className={styles.cardTitle}>
            <h2>Section 5 — Regulatory Awareness and Policyholder Protection</h2>
            <small>Estimated learner time: 45 minutes</small>
          </div>
          <div className={`${styles.cardBody} ${styles.sectionContent}`}>
            <h4>1. Policyholder Protection</h4>
            <p>
              Customers must receive fair information before sale, during sale, after issuance and during
              claim support. Explain cover, exclusions, waiting periods, deductibles, documents and
              complaint channels.
            </p>
            <h4>2. Customer Communication Standards</h4>
            <ul className={styles.outcomeList}>
              <li>Do not create false urgency.</li>
              <li>Do not offer unauthorized rebates.</li>
              <li>Do not promise claim approval.</li>
              <li>Use authorized payment and document channels.</li>
              <li>Protect KYC, health and financial data.</li>
            </ul>
            <h4>3. Grievance Flow</h4>
            <p>
              The customer should generally first approach the insurer&rsquo;s grievance channel. Further
              escalation may include Bima Bharosa/IGMS, Ombudsman or consumer forum as applicable.
            </p>
            <div className={styles.successNote}>
              Recommended closing script: Please review your proposal details, coverage, premium, policy
              schedule, exclusions and waiting periods. Claims are processed by the insurer according to
              policy terms and submitted documents.
            </div>
            <div className={styles.activity}>
              <b>
                Self-learning activity: Create a complaint escalation map from customer to insurer, Bima
                Bharosa/IRDAI route and other applicable forums.
              </b>
            </div>
            <div className={styles.resourceBox}>
              <strong>Required section readings / videos</strong>
              <a href="#">Bima Bharosa / IGMS</a>
              <a href="#">Bima Bharosa complaint logging page</a>
              <a href="#">Policyholder portal – Consumer affairs booklet</a>
              <a href="#">IRDAI Connects videos</a>
            </div>
            <h3>Knowledge Check — 5 MCQs</h3>
            <QuizBlock quizKey="m1s5" questions={MODULE1_SECTION_QUIZZES.m1s5} />
          </div>
        </section>

        <section className={styles.card} id="final">
          <div className={styles.cardTitle}>
            <h2>Final Module Assessment</h2>
            <small>20 MCQs covering all sections</small>
          </div>
          <div className={styles.cardBody}>
            <p>Attempt all questions after completing the sections and required readings.</p>
            <QuizBlock quizKey="final" questions={MODULE1_FINAL_QUIZ} />
          </div>
        </section>

        <section className={styles.completionBox}>
          <h3>Completion Declaration</h3>
          <label>
            <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} /> I
            confirm that I completed Module 1 and understand insurance fundamentals, the Indian market,
            POSP boundaries and policyholder protection expectations.
          </label>
        </section>

        <section className={`${styles.card} ${styles.referenceCard}`}>
          <div className={styles.cardTitle}>
            <h2>Reference Library</h2>
            <small>Official and supplementary study resources</small>
          </div>
          <div className={`${styles.cardBody} ${styles.resources}`}>
            <a href="#">IRDAI POSP Guidelines</a>
            <a href="#">IRDAI Annual Reports</a>
            <a href="#">IRDAI registered entities</a>
            <a href="#">Bima Bharosa / IGMS</a>
            <a href="#">Policyholder consumer resources</a>
            <a href="#">Insurance Institute of India – IC-38</a>
          </div>
        </section>

        <div className={styles.moduleSwitch}>
          <span />
          <span className={styles.locked} title="Module 2 is coming soon">
            Continue to Module 2 →
          </span>
        </div>

        <footer>
          <p>POSP Self-Onboarding Training Module 1</p>
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

export default Module1Training;
