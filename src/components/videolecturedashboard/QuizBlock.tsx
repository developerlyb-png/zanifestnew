"use client";

import React, { useState } from "react";
import styles from "@/styles/components/videolecturedashboard/Module1Training.module.css";
import { QuizQuestion } from "@/constants/pospModule1Quiz";

interface QuizBlockProps {
  quizKey: string;
  questions: QuizQuestion[];
}

const QuizBlock: React.FC<QuizBlockProps> = ({ quizKey, questions }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const score = questions.reduce((acc, _q, i) => acc + (answers[i] === "0" ? 1 : 0), 0);

  const handleCheck = () => {
    setChecked(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `${window.location.pathname}:${quizKey}`,
        JSON.stringify({ answered: answeredCount, score, total: questions.length })
      );
    }
  };

  const handleReset = () => {
    setAnswers({});
    setChecked(false);
  };

  const resultText = !checked
    ? ""
    : answeredCount < questions.length
    ? `Answered ${answeredCount}/${questions.length}`
    : `Score: ${score}/${questions.length}`;

  return (
    <div className={styles.quiz}>
      {questions.map((q, i) => {
        const isAnswered = answers[i] !== undefined;
        const isCorrect = checked && isAnswered && answers[i] === "0";
        const isIncorrect = checked && isAnswered && answers[i] !== "0";
        return (
          <div
            key={i}
            className={`${styles.question} ${isCorrect ? styles.correct : ""} ${
              isIncorrect ? styles.incorrect : ""
            }`}
          >
            <div className={styles.questionTitle}>
              {i + 1}. {q[0]}
            </div>
            {q[1].map((opt, j) => (
              <label key={j} className={styles.option}>
                <input
                  type="radio"
                  name={`${quizKey}_${i}`}
                  value={String(j)}
                  checked={answers[i] === String(j)}
                  onChange={() => setAnswers((prev) => ({ ...prev, [i]: String(j) }))}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );
      })}
      <div className={styles.quizActions}>
        <button type="button" className={styles.primary} onClick={handleCheck}>
          Check Answers
        </button>
        <button type="button" className={styles.secondary} onClick={handleReset}>
          Reset
        </button>
        <span className={styles.result}>{resultText}</span>
      </div>
    </div>
  );
};

export default QuizBlock;
