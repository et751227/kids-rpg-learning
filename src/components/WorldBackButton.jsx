import { useNavigate } from "react-router-dom";

export default function WorldBackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      className="min-h-[48px] px-4 py-2 rounded-xl bg-slate-800/90 text-white text-base md:text-lg font-bold shadow-lg active:scale-95"
    >
      🌍 回到世界
    </button>
  );
}
