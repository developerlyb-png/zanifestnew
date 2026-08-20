"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import styles from "@/styles/components/videolecturedashboard/Module1Training.module.css";
import { MODULE2_SECTIONS, MODULE2_FINAL_QUIZ } from "@/constants/pospModule2Data";
import QuizBlock from "./QuizBlock";

interface Module2TrainingProps {
  onComplete?: () => void;
}

const Module2Training: React.FC<Module2TrainingProps> = ({ onComplete }) => {
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
      window.localStorage.setItem(`${window.location.pathname}:module2Completed`, "1");
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
            <p className={styles.muted}>5 Modules · 5-Hour Review Learning</p>
          </div>
          <span className={styles.statusPill}>{moduleCompleted ? "Module 2 complete" : "75% complete"}</span>
        </section>

        <div className={styles.moduleTabs}>
          <span>Module 1</span>
          <span className={styles.active}>Module 2</span>
          <span className={styles.locked} title="Coming soon">
            Module 3
          </span>
        </div>

        <div className={styles.progressRow}>
          <span>Training in Progress</span>
          <span>Module 2 of 3</span>
        </div>
        <div className={styles.progressTrack}>
          <div style={{ width: "66%" }} />
        </div>

        <section className={styles.heroCard}>
          <h1>POSP Self-Onboarding Training — Module 2</h1>
          <p>Principles &amp; Practice of Insurance, Claim Process, Grievance, AML/KYC and POSP Conduct</p>
          <small>Duration: 5 Hours · Mode: POSP self-onboarding digital learning with interactive checks</small>
        </section>

        <p className={styles.muted}>
          1. Content 2. Principles 3. Proposal &amp; Premium 4. Claims 5. Grievance &amp; Conduct &nbsp; Final
          Assessment
        </p>

        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <h2>Module 2 Overview</h2>
            <small>Estimated time: 5 hours</small>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.overviewGrid}>
              <div className={`${styles.overviewBox} ${styles.blue}`}>
                <b>Module objective</b>
                <p>
                  Understand insurance contracts, core principles, proposal accuracy, premium, claims, grievance,
                  AML/KYC and ethical POSP conduct.
                </p>
              </div>
              <div className={`${styles.overviewBox} ${styles.green}`}>
                <b>Assessment pattern</b>
                <p>5 MCQs after every section and a final 20-MCQ assessment.</p>
              </div>
              <div className={`${styles.overviewBox} ${styles.orange}`}>
                <b>Completion expectation</b>
                <p>Read all sections, open required resources, complete every question and submit assessments.</p>
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
                    <td>Section 1: Insurance contract and valid consent</td>
                    <td>55 min</td>
                    <td>Read contract formation, proposal, acceptance, premium and consent concepts.</td>
                  </tr>
                  <tr>
                    <td>Section 2: Core insurance principles</td>
                    <td>60 min</td>
                    <td>Study insurable interest, utmost good faith, indemnity and proximate cause.</td>
                  </tr>
                  <tr>
                    <td>Section 3: Proposal, policy documents, premium and rebating</td>
                    <td>60 min</td>
                    <td>Read proposal accuracy, premium collection, documents and anti-rebating conduct.</td>
                  </tr>
                  <tr>
                    <td>Section 4: Claim process and documentation</td>
                    <td>55 min</td>
                    <td>Understand claim intimation, documents, survey, assessment and settlement.</td>
                  </tr>
                  <tr>
                    <td>Section 5: Grievance, AML/KYC and POSP conduct</td>
                    <td>55 min</td>
                    <td>Study grievance redressal, KYC, privacy and ethical conduct.</td>
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
              <li>Understand how insurance contracts are formed and why consent matters.</li>
              <li>Apply core insurance principles to practical customer situations.</li>
              <li>Recognize proposal, premium, documentation and claim responsibilities.</li>
              <li>Handle customer data, grievance and ethical communication correctly.</li>
            </ul>
          </div>
        </section>

        {MODULE2_SECTIONS.map((section, idx) => (
          <section className={styles.card} key={section.title}>
            <div className={styles.cardTitle}>
              <h2>{section.title}</h2>
              <small>{section.time}</small>
            </div>
            <div className={`${styles.cardBody} ${styles.sectionContent}`}>
              {section.blocks.map(([heading, text]) => (
                <React.Fragment key={heading}>
                  <h4>{heading}</h4>
                  <p>{text}</p>
                </React.Fragment>
              ))}
              {section.note && <div className={styles.note}>{section.note}</div>}
              <div className={styles.activity}>
                <b>{section.activity}</b>
              </div>
              <div className={styles.resourceBox}>
                <strong>Required section reading / videos</strong>
                {section.resources.map((r) => (
                  <a href="#" key={r}>
                    {r}
                  </a>
                ))}
              </div>
              <h3>Knowledge Check — 5 MCQs</h3>
              <QuizBlock quizKey={`section${idx + 1}`} questions={section.quiz} />
            </div>
          </section>
        ))}

        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <h2>Final Module Assessment</h2>
            <small>20 MCQs covering all sections</small>
          </div>
          <div className={styles.cardBody}>
            <p>
              Attempt all questions after completing the sections and required readings. Your training completion,
              score and time spent will be recorded.
            </p>
            <QuizBlock quizKey="final" questions={MODULE2_FINAL_QUIZ} />
          </div>
        </section>

        <section className={styles.completionBox}>
          <h3>Completion Declaration</h3>
          <label>
            <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} /> I confirm
            that I have completed Module 2, including required reading, videos, assessments and
            customer-protection expectations.
          </label>
        </section>

        <section className={`${styles.card} ${styles.referenceCard}`}>
          <div className={styles.cardTitle}>
            <h2>Reference Library</h2>
            <small>Official and supplementary study resources</small>
          </div>
          <div className={`${styles.cardBody} ${styles.resources}`}>
            <h3>Required IRDAI / Regulatory Reading</h3>
            <a href="#">IRDAI POSP Guidelines on Point of Sales Person</a>
            <a href="#">IRDAI KYC, AML and customer due diligence guidance</a>
            <a href="#">IRDAI consolidated regulations</a>
            <a href="#">Insurance Institute of India - IC-38 material</a>
            <h3>Official Video Resources</h3>
            <a href="#">Bima Bharosa grievance and customer protection</a>
            <a href="#">Policyholder awareness and claim support videos</a>
            <a href="#">IRDAI Connects educational videos</a>
          </div>
        </section>

        <div className={styles.moduleSwitch}>
          <span className={styles.locked}>← Back to Module 1</span>
          <span className={styles.locked} title="Module 3 is coming soon">
            Continue to Module 3 →
          </span>
        </div>

        <footer>
          <p>POSP Self-Onboarding Training Module 2</p>
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

export default Module2Training;
