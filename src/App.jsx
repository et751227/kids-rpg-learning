import React from "react";
import {
  HashRouter,
  Routes,
  Route
} from "react-router-dom";

import LearningSessionGate from "./components/LearningSessionGate";
import WorldMap from "./pages/WorldMap";
import PracticeMode from "./pages/PracticeMode";
import ChallengeMode from "./pages/ChallengeMode";
import ChallengeV2 from "./pages/ChallengeV2";
import CharacterStatusV2 from "./pages/CharacterStatusV2";
import RecordsPage from "./pages/RecordsPage";
import WordCodex from "./pages/WordCodex";
import DiscoveryLesson from "./pages/DiscoveryLesson";

export default function App() {
  return (
    <LearningSessionGate>
      <HashRouter>
        <Routes>
          <Route path="/" element={<WorldMap />} />
          <Route path="/practice" element={<PracticeMode />} />
          <Route path="/challenge" element={<ChallengeV2 />} />
          <Route path="/challenge-v2" element={<ChallengeV2 />} />
          <Route path="/challenge-legacy" element={<ChallengeMode />} />
          <Route path="/status-v2" element={<CharacterStatusV2 />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/codex" element={<WordCodex />} />
          <Route path="/discovery" element={<DiscoveryLesson />} />
        </Routes>
      </HashRouter>
    </LearningSessionGate>
  );
}
