// src/pages/CamareroPanel.jsx
import React, { useState } from "react";
import CamareroWelcome from "../../components/Camarero/CamareroWelcome";
import CamareroDashboard from "../../components/Camarero/CamareroDashboard";

export default function CamareroPanel() {
  const [showWelcome, setShowWelcome] = useState(
    !localStorage.getItem("camarero_onboarding_seen")
  );

  const handleStart = () => {
    localStorage.setItem("camarero_onboarding_seen", "true");
    setShowWelcome(false);
  };

  return showWelcome ? (
    <CamareroWelcome onStart={handleStart} />
  ) : (
    <CamareroDashboard />
  );
}
