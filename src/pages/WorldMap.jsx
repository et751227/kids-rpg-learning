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

  const areaLabel = (icon, name, description) => (
    <span className="flex flex-col items-center leading-tight">
      <span className="font-extrabold">{icon} {name}</span>
      <span className="mt-1 text-xs md:text-sm font-bold opacity-80">{description}</span>
    </span>
  );

  return (
    <div className="relative w-full h-screen bg-cover bg-center flex flex-col items-center justify-center" style={{ backgroundImage: "url('/images/worldmap.png')" }}>
      <div className="absolute top-4 w-full text-center px-4 text-gray-800 drop-shadow">
        <div className="text-2xl md:text-3xl font-extrabold">今天想去哪裡冒險？</div>
        <div className="mt-1 text-sm md:text-base font-bold">每個地方都能學習，選你今天想玩的方式。</div>
      </div>

      <button onClick={() => handleAreaClick("village")} className="absolute left-[18%] bottom-[25%] bg-white bg-opacity-75 hover:bg-opacity-95 px-6 py-3 rounded-xl shadow-xl text-lg text-gray-800 border-2 border-yellow-600 transition-all hover:scale-105">
        {areaLabel("🏡", "VILLAGE", "單字練習")}
      </button>
      <button onClick={() => handleAreaClick("forest")} className="absolute left-[42%] bottom-[18%] bg-white bg-opacity-75 hover:bg-opacity-95 px-6 py-3 rounded-xl shadow-xl text-lg text-green-800 border-2 border-green-600 transition-all hover:scale-105">
        {areaLabel("🌲", "FOREST", "冒險戰鬥")}
      </button>
      <button onClick={() => handleAreaClick("castle")} className="absolute right-[15%] bottom-[30%] bg-white bg-opacity-75 hover:bg-opacity-95 px-6 py-3 rounded-xl shadow-xl text-lg text-blue-800 border-2 border-blue-600 transition-all hover:scale-105">
        {areaLabel("🏰", "CASTLE", "我的冒險紀錄")}
      </button>
      <button onClick={() => handleAreaClick("codex")} className="absolute left-[4%] top-[14%] bg-indigo-950 bg-opacity-90 text-white px-5 py-3 rounded-xl shadow-xl text-base border-2 border-amber-300 transition-all hover:scale-105">
        {areaLabel("📖", "CODEX", "魔法單字圖鑑")}
      </button>
      <button onClick={() => handleAreaClick("discovery")} className="absolute left-[4%] top-[27%] bg-violet-900 bg-opacity-90 text-white px-5 py-3 rounded-xl shadow-xl text-base border-2 border-violet-300 transition-all hover:scale-105">
        {areaLabel("🔮", "DISCOVERY", "探索新單字")}
      </button>
      <button onClick={() => handleAreaClick("status-v2")} className="absolute right-[4%] top-[14%] bg-slate-900 bg-opacity-90 text-white px-5 py-3 rounded-xl shadow-xl text-base border border-white transition-all hover:scale-105">
        {areaLabel("🧙", "CHARACTER", "我的角色")}
      </button>
    </div>
  );
}
