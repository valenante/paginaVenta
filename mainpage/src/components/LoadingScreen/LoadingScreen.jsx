import React from "react";
import "./LoadingScreen.css";
import logoAlef from "../../assets/imagenes/alef.png";

export default function LoadingScreen() {
  return (
    <div className="LoadingScreen">
      <div className="LoadingScreen-inner">
        <img src={logoAlef} alt="Alef Logo" className="LoadingScreen-logo" />
        <div className="LoadingScreen-pulse"></div>
      </div>
    </div>
  );
}
