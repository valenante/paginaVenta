import React from "react";
import TopBar from "../components/TopBar/TopBar"; // el navbar general ALEF
import "./UserLayout.css";

export default function UserLayout({ children }) {
  return (
    <div className="userlayout-root">
      <TopBar />
      <main className="userlayout-main">
        {children}
      </main>
    </div>
  );
}
