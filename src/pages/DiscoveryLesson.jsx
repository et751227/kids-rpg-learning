import { useEffect, useRef, useState } from "react";
import AnswerPad from "../components/AnswerPad";
import WorldBackButton from "../components/WorldBackButton";
import { learningApi } from "../api/learningClient";

const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12,"0").slice(0,12)}`;

export default function DiscoveryLesson() {
  const [lesson, setLesson] = useState(null);
  const [phase, setPhase] = useState("learn");
  const [input, setInput] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);
  const startedAt = useRef(Date.now());

  const load = async () => {
    setBusy(true);
    setMessage("");
    setInput([]);
    setPhase("learn");
    try {
      const data = await learningApi.discoveryNext();
      setLesson(data.lesson);
      startedAt.current = Date.now();
    } catch (error) {
      if (error?.status === 404) setMessage("🎉 目前沒有新的探索單字了！");
      else setMessage("探索單字載入失敗，請稍後再試");
      setLesson(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  const speak = () => {
    if (!lesson?.english || typeof SpeechSynthesisUtterance === "undefined") return;
    speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(lesson.english);
    msg.lang = "en-US";
    speechSynthesis.speak(msg);
  };

  const submit = async () => {
    if (!lesson || busy) return;
    setBusy(true);
    try {
      const result = await learningApi.discoveryAttempt({
        attemptId: newId(),
        vocabularyId: lesson.vocabularyId,
        submittedAnswer: input.join(""),
        responseTimeMs: Date.now() - startedAt.current,
      });
      if (result?.attempt?.correct) {
        setMessage(`✨ ${lesson.english} 已加入冒險題庫！之後會在村莊或森林遇見；真正遇見後才會收進圖鑑。`);
        setTimeout(load, 1800);
      } else {
        setMessage(`再看一次：${lesson.english} = ${lesson.chinese}`);
        setPhase("learn");
        setInput([]);
      }
    } catch {
      setMessage("送出失敗，請再試一次");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-950 via-indigo-950 to-slate-950 text-white p-4 md:p-6">
      <div className="max-w-5xl mx-auto grid gap-5">
        <div className="flex items-center gap-3"><WorldBackButton /><h1 className="text-3xl font-black flex-1 text-center">🔮 新單字探索</h1><div className="w-[110px]" /></div>
        <div className="rounded-2xl bg-violet-900/40 border border-violet-300/20 px-4 py-3 text-center text-violet-100">
          探索成功會把新單字加入村莊／森林題庫；圖鑑要等你真的在冒險中遇見它才會揭露。
        </div>
        {busy && !lesson ? <div className="text-center text-xl py-20">正在尋找新的魔法單字…</div> : null}
        {message ? <div className="text-center text-xl font-bold rounded-2xl bg-white/10 p-4">{message}</div> : null}
        {lesson && phase === "learn" ? (
          <section className="rounded-3xl bg-white/10 border border-white/20 p-8 text-center shadow-2xl">
            <div className="text-sm tracking-widest text-violet-200">NEW WORD TRAINING</div>
            <div className="text-6xl md:text-7xl font-black mt-4 text-amber-300">{lesson.english}</div>
            <div className="text-3xl mt-4">{lesson.chinese}</div>
            <button onClick={speak} className="mt-6 px-6 py-3 rounded-2xl bg-sky-600 font-black text-xl">🔊 聽一次</button>
            <div className="mt-8 text-lg text-violet-100">先看、先聽，不用猜。記住之後把它解鎖到冒險題庫。</div>
            <button onClick={() => { setPhase("recall"); setMessage(""); startedAt.current = Date.now(); }} className="mt-5 px-8 py-4 rounded-2xl bg-green-600 font-black text-2xl">我準備好了 ✨</button>
          </section>
        ) : null}
        {lesson && phase === "recall" ? (
          <section className="grid gap-4 justify-items-center">
            <div className="text-center"><div className="text-lg text-violet-200">剛剛學到的字</div><div className="text-4xl font-black mt-1">{lesson.chinese}</div></div>
            <AnswerPad
              input={input}
              answerLength={lesson.answerLength}
              disabled={busy}
              onLetter={(letter) => setInput((current) => [...current, letter])}
              onBackspace={() => setInput((current) => current.slice(0, -1))}
              onClear={() => setInput([])}
              onSubmit={submit}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
