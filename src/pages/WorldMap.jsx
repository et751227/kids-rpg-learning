import React from "react";
import { useNavigate } from "react-router-dom";

export default function WorldMap() {
  const navigate = useNavigate();

  const handleAreaClick = (area) => {
    switch (area) {
      case "village": navigate("/practice"); break;
      case "forest": navigate("/challenge"); break;
      case "castle": navigate("/records"); break;
      case "status-v2": navigate("/status-v2"); break;
      case "codex": navigate("/codex"); break;
      case "discovery": navigate("/discovery"); break;
      default: break;
    }
  };

  return (
    <div className="relative w-full h-screen bg-cover bg-center flex flex-col items-center justify-center" style={{ backgroundImage: "url('/images/worldmap.png')" }}>
      <div className="absolute top-4 w-full text-center text-3xl font-extrabold text-gray-800 drop-shadow">歡迎來到 RPG 世界地圖</div>
      <button onClick={() => handleAreaClick("village")} className="absolute left-[18%] bottom-[25%] bg-white bg-opacity-70 hover:bg-opacity-90 px-6 py-3 rounded-xl shadow-xl font-bold text-lg text-gray-800 border-2 border-yellow-600 transition-all hover:scale-105">🏡 VILLAGE</button>
      <button onClick={() => handleAreaClick("forest")} className="absolute left-[42%] bottom-[18%] bg-white bg-opacity-70 hover:bg-opacity-90 px-6 py-3 rounded-xl shadow-xl font-bold text-lg text-green-800 border-2 border-green-600 transition-all hover:scale-105">🌲 FOREST</button>
      <button onClick={() => handleAreaClick("castle")} className="absolute right-[15%] bottom-[30%] bg-white bg-opacity-70 hover:bg-opacity-90 px-6 py-3 rounded-xl shadow-xl font-bold text-lg text-blue-800 border-2 border-blue-600 transition-all hover:scale-105">🏰 RECORDS</button>
      <button onClick={() => handleAreaClick("codex")} className="absolute left-[4%] top-[12%] bg-indigo-950 bg-opacity-90 text-white px-5 py-3 rounded-xl shadow-xl font-bold text-base border-2 border-amber-300 transition-all hover:scale-105">📖 單字圖鑑</button>
      <button onClick={() => handleAreaClick("discovery")} className="absolute left-[4%] top-[24%] bg-violet-900 bg-opacity-90 text-white px-5 py-3 rounded-xl shadow-xl font-bold text-base border-2 border-violet-300 transition-all hover:scale-105">🔮 新單字探索</button>
      <button onClick={() => handleAreaClick("status-v2")} className="absolute right-[4%] top-[12%] bg-slate-900 bg-opacity-85 text-white px-5 py-3 rounded-xl shadow-xl font-bold text-base border border-white">🧙 我的角色</button>
    </div>
  );
}
