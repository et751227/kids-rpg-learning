import React, { useEffect, useState } from "react";
import { learningApi } from "../api/learningClient";

export default function LearningSessionGate({ children }) {
  const [state, setState] = useState("checking");
  const [accessKey, setAccessKey] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    learningApi.session()
      .then((result) => setState(result?.authenticated ? "ready" : "login"))
      .catch(() => { setMessage("目前無法確認家庭登入狀態"); setState("login"); });
  }, []);

  const login = async (event) => {
    event.preventDefault();
    if (!accessKey.trim()) return;
    setState("signing-in");
    setMessage("");
    try {
      await learningApi.login(accessKey.trim());
      setAccessKey("");
      setState("ready");
    } catch (error) {
      setMessage(error.status === 401 ? "家庭密碼不正確" : "登入失敗，請稍後再試");
      setState("login");
    }
  };

  if (state === "ready") return children;
  if (state === "checking") {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xl">正在讀取角色資料…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <form onSubmit={login} className="w-full max-w-md rounded-3xl bg-slate-800 p-6 shadow-xl">
        <div className="text-2xl font-extrabold mb-2">家庭登入</div>
        <div className="text-slate-300 mb-5">輸入家裡設定的密碼，就能在這台裝置接續同一個角色進度。</div>
        <input
          type="password"
          value={accessKey}
          onChange={(event) => setAccessKey(event.target.value)}
          autoComplete="current-password"
          className="w-full rounded-xl bg-white text-slate-900 px-4 py-3 text-xl mb-3"
          aria-label="家庭密碼"
        />
        {message && <div className="text-amber-300 mb-3">{message}</div>}
        <button disabled={state === "signing-in" || !accessKey.trim()} className="w-full rounded-xl bg-green-600 py-3 text-xl font-bold disabled:opacity-40">
          {state === "signing-in" ? "登入中…" : "開始學習"}
        </button>
      </form>
    </div>
  );
}
