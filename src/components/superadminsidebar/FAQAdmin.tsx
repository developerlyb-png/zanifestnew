"use client";

import React, { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { FaEdit, FaSave } from "react-icons/fa";
import axios from "axios";
import FAQSection from "../home/FAQSection";
import styles from "@/styles/components/superadminsidebar/FAQAdmin.module.css";

export default function FAQAdmin() {
  const { data } = useSWR("/api/faq", (url) =>
    fetch(url).then((res) => res.json())
  );

  const [inputValue, setInputValue] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQues, setEditQues] = useState("");
  const [editAns, setEditAns] = useState("");

  // Load initial data
  useEffect(() => {
    if (data?.heading) setInputValue(data.heading);
    if (data?.questions?.length) setQuestions(data.questions);
  }, [data]);

  const saveHeading = async () => {
    try {
      await axios.put("/api/faq", { heading: inputValue, questions });
      mutate("/api/faq", { heading: inputValue, questions }, false);
    } catch (err) {
      console.error("Failed to save FAQ heading:", err);
    }
  };

  const saveQuestion = async (index: number) => {
    const updated = [...questions];
    updated[index] = { ques: editQues, ans: editAns };
    setQuestions(updated);
    try {
      await axios.put("/api/faq", { heading: inputValue, questions: updated });
      mutate("/api/faq", { heading: inputValue, questions: updated }, false);
      setEditingIndex(null);
    } catch (err) {
      console.error("Failed to save FAQ question:", err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Heading editor */}
      <div className={styles.headingRow}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={styles.headingInput}
        />
        <button onClick={saveHeading} className={styles.saveBtn}>
          <FaSave /> Save
        </button>
      </div>
     

      {/* Questions editor */}
      <div className={styles.questionsWrapper}>
        {questions.map((q, index) => (
          <div key={index} className={styles.questionBox}>
            {editingIndex === index ? (
              <div className={styles.editWrapper}>
                <input
                  value={editQues}
                  onChange={(e) => setEditQues(e.target.value)}
                  placeholder="Question"
                  className={styles.input}
                />
                <textarea
                  value={editAns}
                  onChange={(e) => setEditAns(e.target.value)}
                  placeholder="Answer"
                  className={styles.textarea}
                />
                <button
                  onClick={() => saveQuestion(index)}
                  className={styles.saveBtn}
                >
                  <FaSave /> Save
                </button>
              </div>
            ) : (
              <div className={styles.questionRow}>
                <p className={styles.questionText}>{q.ques}</p>
                <FaEdit
                  className={styles.editIcon}
                  onClick={() => {
                    setEditingIndex(index);
                    setEditQues(q.ques);
                    setEditAns(q.ans);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Live Preview */}
      <div className={styles.previewBox}>
        <h2 className={styles.previewHeading}>Live Preview</h2>
        <FAQSection
          headingOverride={inputValue}
          questionsOverride={questions}
        />
      </div>
    </div>
  );
}
