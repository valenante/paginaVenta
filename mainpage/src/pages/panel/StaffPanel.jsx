import React, { useMemo, useState } from "react";
import StaffWelcome from "../../components/Panel/StaffWelcome";
import StaffDashboard from "../../components/Panel/StaffDashboard";

const ONBOARDING_KEY = "staff_onboarding_seen";

export default function StaffPanel() {
  const onboardingSeen = useMemo(() => {
    return (
      localStorage.getItem(ONBOARDING_KEY) === "true" ||
      localStorage.getItem("camarero_onboarding_seen") === "true"
    );
  }, []);

  const [showWelcome, setShowWelcome] = useState(!onboardingSeen);

  const handleStart = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");

    // migración suave desde la key antigua
    if (localStorage.getItem("camarero_onboarding_seen")) {
      localStorage.removeItem("camarero_onboarding_seen");
    }

    setShowWelcome(false);
  };

  return showWelcome ? (
    <StaffWelcome onStart={handleStart} />
  ) : (
    <StaffDashboard />
  );
}