// src/pages/CocineroPanel.jsx
import React, { useState } from "react";
import CocineroWelcome from "../../components/Cocinero/CocineroWelcome.jsx";
import CocineroDashboard from "../../components/Cocinero/CocineroDashboard.jsx";

export default function CocineroPanel() {
  const [showWelcome, setShowWelcome] = useState(
    !localStorage.getItem("cocinero_onboarding_seen")
  );

  const handleStart = () => {
    localStorage.setItem("cocinero_onboarding_seen", "true");
    setShowWelcome(false);
  };

  return showWelcome ? (
    <CocineroWelcome onStart={handleStart} />
  ) : (
    <CocineroDashboard />
  );
}
