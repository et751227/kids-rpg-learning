import { useNavigate } from "react-router-dom";
import RecordsPanel from "../components/RecordsPanel";

export default function RecordsPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center p-4 md:p-6 font-sans"
      style={{ backgroundImage: "url('/images/bg-magic.jpg')" }}
    >
      <div className="w-full max-w-6xl flex items-center justify-between mt-4 mb-4">
        <button onClick={() => navigate("/")} className="px-4 py-2 rounded-xl bg-slate-800/85 text-white font-bold shadow">
          ← 回地圖
        </button>
        <div className="text-center text-white bg-black/55 px-6 py-3 rounded-xl shadow">
          <h1 className="text-3xl md:text-4xl font-black">🏰 CASTLE · 我的冒險城堡</h1>
          <p className="mt-1 text-sm md:text-base text-amber-100 font-bold">這裡收藏我一路冒險留下來的故事</p>
        </div>
        <div className="w-[84px]" />
      </div>

      <div className="w-full">
        <RecordsPanel />
      </div>
    </div>
  );
}