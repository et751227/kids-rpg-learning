import React from "react";
import {
  HashRouter,
  Routes,
  Route
} from "react-router-dom";

import WorldMap from "./pages/WorldMap";
import PracticeMode from "./pages/PracticeMode";
import ChallengeMode from "./pages/ChallengeMode";
import RecordsPage from "./pages/RecordsPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<WorldMap />} />
        <Route path="/practice" element={<PracticeMode />} />
        <Route path="/challenge" element={<ChallengeMode />} />
        <Route path="/records" element={<RecordsPage />} />
      </Routes>
    </HashRouter>
  );
}
