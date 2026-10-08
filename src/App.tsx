import React from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import { Dashboard } from "./components/Dashboard";
import { Project } from "./components/Project";
import { Settings } from "./components/Settings";
import { Help } from "./components/Help";
import { Sidebar } from "./components/Sidebar";
import "./index.css";

function MainLayout() {
    const { view, mainContentRef } = useAppContext();

  return (
    <div className="flex h-screen bg-bg-deep text-text-main font-sans selection:bg-blue-500/30 overflow-hidden">
      <main ref={mainContentRef} className={`flex-1 scroll-smooth ${view === "project" ? "h-screen overflow-hidden" : "overflow-y-auto p-6 md:p-12"}`}>
        <div className={view === "project" ? "h-full w-full" : "max-w-6xl mx-auto flex flex-col gap-8"}>
          <Dashboard />
          <Project />
          <Settings />
          <Help />
        </div>
      </main>
      <Sidebar />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
