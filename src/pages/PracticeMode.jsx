import { useEffect, useRef, useState } from "react";
import AnswerPad from "../components/AnswerPad";
import LearningSessionGate from "../components/LearningSessionGate";
import WorldBackButton from "../components/WorldBackButton";
import { learningApi } from "../api/learningClient";

const newId = () => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  if (!cryptoApi?.getRandomValues) throw new Error("secure_crypto_unavailable");
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

function PracticeContent() {
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [outcome, setOutcome] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answerLocked, setAnswerLocked] = useState(false);
  const questionStartedAt = useRef(Date.now());
  const attemptId = useRef(null);
  const sessionKey = useRef(`practice-${newId()}`);

  const beginAttempt = () => {
    attemptId.current = newId();
    questionStartedAt.current = Date.now();
  };

  const loadNewQuestion = async () => {
    setIsLoading(true);
    try {
      const data = await learningApi.nextQuestion("practice");
      setQuestion(data.question);
      setInput([]);
      setFeedback("");
      setOutcome(null);
      setCorrectAnswer("");
      setAnswerLocked(false);
      beginAttempt();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const progress = await learningApi.progress();
        if (!active) return;
        setLevel(Number(progress.level || 1));
        await loadNewQuestion();
      } catch (_) {
        if (active) {
          setFeedback("角色或題庫載入失敗，請稍後再試");
          setOutcome("error");
          setIsLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, []);

  const speak = (text, lang) => {
    if (!text || typeof SpeechSynthesisUtterance === "undefined") return;
    speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = lang;
    speechSynthesis.speak(msg);
  };

  const submit = async () => {
    if (answerLocked || !question || !input.length || !attemptId.current) return;
    setAnswerLocked(true);
    const responseTimeMs = Date.now() - questionStartedAt.current;
    try {
      const result = await learningApi.submitAttempt({
        attemptId: attemptId.current,
        vocabularyId: question.vocabularyId,
        sessionKey: sessionKey.current,
        mode: "practice",
        submittedAnswer: input.join(""),
        responseTimeMs,
        metadata: { area: "village", learningFlow: "api-v1" },
      });
      const attempt = result.attempt || {};
      const answer = attempt.correctAnswer || "";
      setCorrectAnswer(answer);

      if (attempt.correct) {
        setFeedback("🎉 答對了！");
        setOutcome("correct");
        return;
      }

      setFeedback("❌ 再試一次");
      setOutcome("wrong");
      setInput([]);
      setAnswerLocked(false);
      beginAttempt();
    } catch (_) {
      setFeedback("答案沒有成功儲存，請再按一次確認");
      setOutcome("error");
      setAnswerLocked(false);
    }
  };

  const handleNext = async () => {
    if (outcome !== "correct" || !answerLocked) return;
    try {
      await loadNewQuestion();
    } catch (_) {
      setFeedback("下一題載入失敗，請再試一次");
      setOutcome("error");
      setAnswerLocked(true);
    }
  };

  if (isLoading && !question) {
    return <div className="p-10 text-3xl text-center animate-bounce text-purple-700">🧠 載入拼字題中...</div>;
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-3 md:p-5 font-sans text-shadow"
      style={{ backgroundImage: "url('/images/bg-magic.jpg')" }}
    >
      <div className="w-full max-w-6xl grid gap-3 md:gap-4" style={{ gridTemplateRows: "auto auto auto 1fr" }}>
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
          <WorldBackButton />
          <div className="text-center text-3xl md:text-4xl font-extrabold text-purple-700 tracking-wider drop-shadow-md">
            🏡 村莊單字練習
          </div>
          <div className="min-w-[120px]" aria-hidden="true" />
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-4 items-center bg-white/90 px-4 py-3 rounded-2xl shadow-lg">
          <img
            src="/images/hero.png"
            alt="小魔法師"
            className="w-20 h-20 md:w-24 md:h-24 rounded-full ring-4 ring-purple-400 bg-white p-1"
          />
          <div className="text-lg font-semibold text-gray-800">
            🧙‍♀️ 等級：<span className="text-blue-600">{level}</span>
          </div>
        </div>

        <div className="grid gap-2 text-center">
          <div className="text-sm md:text-base italic text-gray-700">題型：中 ➜ 英</div>
          <div className="text-xl md:text-2xl font-extrabold text-blue-800 bg-white/90 px-6 py-2 rounded-xl drop-shadow">
            請拼出：「{question?.chinese || "—"}」
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => speak(question?.chinese || "", "zh-TW")}
              className="px-5 py-2 bg-blue-500 text-white text-base md:text-lg rounded-full shadow active:scale-95"
            >
              🔊 再聽一次
            </button>
            {correctAnswer ? (
              <button
                type="button"
                onClick={() => speak(correctAnswer, "en-US")}
                className="px-5 py-2 bg-indigo-600 text-white text-base md:text-lg rounded-full shadow active:scale-95"
              >
                🔊 聽英文
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 min-h-0">
          {feedback ? (
            <div className={`self-center justify-self-center text-center text-xl md:text-2xl font-bold px-6 py-3 rounded-xl max-w-2xl min-h-[64px] ${outcome === "correct" ? "bg-green-700 text-white" : outcome === "wrong" ? "bg-amber-100 text-amber-900" : "bg-black/70 text-white"}`}>
              <div>{feedback}</div>
              {correctAnswer ? <div className="mt-1 text-lg">正確答案：{correctAnswer}</div> : null}
            </div>
          ) : null}

          {outcome === "correct" ? (
            <button
              type="button"
              onClick={handleNext}
              className="self-center justify-self-center text-xl md:text-2xl font-bold text-white bg-purple-700 px-6 py-4 rounded-xl min-h-[64px] min-w-[220px] active:scale-95"
            >
              下一題 ➜
            </button>
          ) : (
            <AnswerPad
              input={input}
              answerLength={question?.answerLength || 0}
              disabled={answerLocked || !question}
              onLetter={(char) => input.length < (question?.answerLength || 0) && setInput((value) => [...value, char])}
              onBackspace={() => setInput((value) => value.slice(0, -1))}
              onClear={() => setInput([])}
              onSubmit={submit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PracticeMode() {
  return <LearningSessionGate><PracticeContent /></LearningSessionGate>;
}
