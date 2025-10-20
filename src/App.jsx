import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import WorldMap from "./pages/WorldMap";
import PracticeMode from "./pages/PracticeMode";
import ChallengeMode from "./pages/ChallengeMode";
import RecordsPage from "./pages/RecordsPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WorldMap />} />
        <Route path="/practice" element={<PracticeMode />} />
        <Route path="/challenge" element={<ChallengeMode />} />
        <Route path="/records" element={<RecordsPage />} />
      </Routes>
    </Router>
  );
}
