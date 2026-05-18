import { useState, useEffect } from "react";
import { getRandomVocabularyQuestion } from "../services/questionSource";

export function useMainQuestions() {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getRandomVocabularyQuestion()
      .then((nextQuestion) => {
        if (!isMounted) return;
        setQuestion({
          ...nextQuestion,
          shuffledLetters: shuffleArray(nextQuestion.answer.toUpperCase().split(""))
        });
      })
      .catch((err) => {
        console.error("載入拼字題庫失敗", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { question, loading };
}

function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}
