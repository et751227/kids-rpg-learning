import React from "react";
import { useNavigate } from "react-router-dom";

export default function WorldMap() {
  const navigate = useNavigate();

  const handleAreaClick = (area) => {
    switch (area) {
      case "village":
        navigate("/practice");
        break;
      case "forest":
        navigate("/challenge");
        break;
      case "castle":
        navigate("/records");
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center flex flex-col items-center justify-center"
      style={{
        backgroundImage: "url('/images/worldmap.png')", // 你的地圖圖檔
      }}
    >
      <div className="absolute top-4 w-full text-center text-3xl font-extrabold text-gray-800 drop-shadow">
        歡迎來到 RPG 世界地圖
      </div>

      {/* 村莊 */}
      <button
        onClick={() => handleAreaClick("village")}
        className="absolute left-[18%] bottom-[25%] bg-white bg-opacity-70 hover:bg-opacity-90 px-6 py-3 rounded-xl shadow-xl font-bold text-lg text-gray-800 border-2 border-yellow-600 transition-all hover:scale-105"
      >
        🏡 VILLAGE
      </button>

      {/* 森林 */}
      <button
        onClick={() => handleAreaClick("forest")}
        className="absolute left-[42%] bottom-[18%] bg-white bg-opacity-70 hover:bg-opacity-90 px-6 py-3 rounded-xl shadow-xl font-bold text-lg text-green-800 border-2 border-green-600 transition-all hover:scale-105"
      >
        🌲 FOREST
      </button>

      {/* 城堡 */}
      <button
        onClick={() => handleAreaClick("castle")}
        className="absolute right-[15%] bottom-[30%] bg-white bg-opacity-70 hover:bg-opacity-90 px-6 py-3 rounded-xl shadow-xl font-bold text-lg text-blue-800 border-2 border-blue-600 transition-all hover:scale-105"
      >
        🏰 RECORDS
      </button>
    </div>
  );
}
