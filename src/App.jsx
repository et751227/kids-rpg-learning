import { useState } from "react";
 import { useState, useEffect } from "react";
 import { useMainQuestions } from "./hooks/useMainQuestions";
 
 export default function RPGWordGameMain() {
   const { question, loading } = useMainQuestions();
   const [input, setInput] = useState([]);
   const [feedback, setFeedback] = useState("");
   const [exp, setExp] = useState(() => parseInt(localStorage.getItem("exp")) || 0);
   const [level, setLevel] = useState(() => parseInt(localStorage.getItem("level")) || 1);
   const [maxHp, setMaxHp] = useState(50);
   const [hp, setHp] = useState(50);
   const [question, setQuestion] = useState(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     loadNewQuestion();
   }, []);
 
   const loadNewQuestion = () => {
     setLoading(true);
     fetch("https://script.google.com/macros/s/AKfycbwjSr6rDRrqo5xq1ztDsRVDORoBWLGZwwtHSSHKkYLUykjNdao9Va-YN3eg02HTWYMh/exec?type=main")
       .then(res => res.json())
       .then(data => {
         const clean = data.filter(item => item.chinese && item.english);
         const random = clean[Math.floor(Math.random() * clean.length)];
         setQuestion({
           questionText: random.chinese,
           answer: random.english,
           direction: "中 ➜ 英"
         });
         setLoading(false);
       });
   };
 
   const speak = (text) => {
     const msg = new SpeechSynthesisUtterance(text);
     msg.lang = "zh-TW"; // 中文語音
     msg.lang = "zh-TW";
     speechSynthesis.speak(msg);
   };
 
 @@ -48,18 +69,18 @@
       setExp(newExp);
       localStorage.setItem("exp", newExp);
       localStorage.setItem("level", newLevel);
       setFeedback("🎉 答對了！");
       setFeedback("🎉 答對了！點擊任意處繼續...");
     } else {
       const newHp = Math.max(hp - 10, 0);
       setHp(newHp);
       setFeedback(`❌ 錯了！正確是 ${correct}`);
       setFeedback(`❌ 錯了！正確是 ${correct}，點擊任意處繼續...`);
     }
   };
 
     setTimeout(() => {
       setFeedback("");
       setInput([]);
       location.reload();
     }, 1500);
   const handleNext = () => {
     setFeedback("");
     setInput([]);
     loadNewQuestion();
   };
 
   const renderAlphabetButtons = () => {
 @@ -87,6 +108,7 @@
     <div
       className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4 font-sans text-shadow"
       style={{ backgroundImage: "url('/images/bg-magic.jpg')" }}
       onClick={feedback ? handleNext : undefined}
     >
       <div className="text-5xl font-extrabold text-purple-700 mb-4 animate-pulse tracking-wider drop-shadow-md">
         🌟 RPG 單字冒險
 @@ -125,7 +147,7 @@
       </div>
 
       <button
         onClick={() => speak(question.questionText)}
         onClick={(e) => { e.stopPropagation(); speak(question.questionText); }}
         className="mb-5 px-6 py-2 bg-blue-500 text-white text-lg rounded-full shadow hover:bg-blue-600 transition"
       >
         🔊 點我聽發音
 @@ -136,28 +158,28 @@
       </div>
 
       <div className="flex gap-3 mb-6">
         <button onClick={handleBackspace} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow">
         <button onClick={(e) => { e.stopPropagation(); handleBackspace(); }} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow">
           ⬅ 退格
         </button>
         <button onClick={handleClear} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow">
         <button onClick={(e) => { e.stopPropagation(); handleClear(); }} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded shadow">
           🔄 清除
         </button>
         <button
           onClick={handleSubmit}
           onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
           disabled={input.length !== question.answer.length}
           className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow disabled:opacity-50"
         >
           ✅ 確認
         </button>
       </div>
 
       {renderAlphabetButtons()}
       {!feedback && renderAlphabetButtons()}
 
       {feedback && (
         <div className="mt-6 text-2xl font-bold text-center text-white bg-black bg-opacity-60 px-6 py-3 rounded-xl animate-bounce max-w-md">
           {feedback}
         </div>
       )}
     </div>
   );
 }
