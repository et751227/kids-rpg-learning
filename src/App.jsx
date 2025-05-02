import { useState } from "react";
import { useMainQuestions } from "./hooks/useMainQuestions";

export default function RPGWordGameMain() {
  const { question, loading } = useMainQuestions();
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState("");

  if (loading || !question) {
    return <div className="p-10 text-3xl text-center animate-bounce text-purple-700">🧠 載入拼字題中...</div>;
  }

  const { questionText, answer, direction } = question;

  const handleLetterClick = (char) => {
    if (input.length < answer.length) {
      setInput([...input, char]);
    }
  };

  const handleBackspace = () => {
    setInput(input.slice(0, -1));
  };

  const handleClear = () => {
    setInput([]);
  };

  const handleSubmit = () => {
    const joined = input.join("").toLowerCase();
    if (joined === answer.toLowerCase()) {
      setFeedback("🎉 答對了！");
    } else {
      setFeedback(`❌ 錯了！正確答案是 ${answer}`);
    }

    setTimeout(() => {
      location.reload(); // reload 重新出題（簡易處理）
    }, 1500);
  };

  const renderAlphabetButtons = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return (
      <div className="grid grid-cols-7 gap-2 max-w-md mx-auto mb-4">
        {alphabet.map((char) => (
          <button
            key={char}
            onClick={() => handleLetterClick(char)}
            className="bg-yellow-300 hover:bg-yellow-400 text-xl font-bold py-2 rounded-lg shadow"
          >
            {char}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-yellow-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="text-4xl font-extrabold text-purple-700 mb-3 animate-pulse">✨ 拼字主線冒險</div>

      <div className="text-lg text-gray-600 italic mb-2">題型：{direction}</div>
      <div className="text-2xl font-bold text-blue-700 mb-4">請拼出：「{questionText}」</div>

      <div className="min-h-[48px] mb-4 text-3xl tracking-widest font-mono text-center text-gray-800 bg-white px-6 py-2 rounded-full shadow">
        {input.join("") || "⋯"}
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={handleBackspace} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow">
          ⬅ 退格
        </button>
        <button onClick={handleClear} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow">
          🔄 清除
        </button>
        <button
          onClick={handleSubmit}
          disabled={input.length !== answer.length}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow disabled:opacity-50"
        >
          ✅ 確認
        </button>
      </div>

      {renderAlphabetButtons()}

      {feedback && (
        <div className="mt-6 text-2xl font-bold text-center animate-bounce">
          {feedback}
        </div>
      )}
    </div>
  );
}
