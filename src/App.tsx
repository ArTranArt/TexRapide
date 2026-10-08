import React from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import { Dashboard } from "./components/Dashboard";
import { Project } from "./components/Project";
import { Settings } from "./components/Settings";
import { Help } from "./components/Help";
import { Sidebar } from "./components/Sidebar";
import { RefreshCw } from "lucide-react";
import "./index.css";

function MainLayout() {
    const { view, mainContentRef, compileStatus } = useAppContext();

  return (
    <div className="flex h-screen bg-bg-deep text-text-main font-sans selection:bg-blue-500/30 overflow-hidden">
      <main ref={mainContentRef} className={`flex-1 scroll-smooth ${view === "project" ? "h-screen overflow-hidden" : "overflow-y-auto p-6 md:p-12"}`}>
        <div className={view === "project" ? "h-full w-full" : "max-w-6xl mx-auto flex flex-col gap-8"}>
          {view === "dashboard" && <Dashboard />}
          {view === "project" && <Project />}
          {view === "settings" && <Settings />}
          {view === "help" && <Help />}
        </div>
      </main>
      
      {compileStatus === "compiling" && (
        <div className="fixed top-6 right-6 z-[9999] bg-[#121216]/90 backdrop-blur-md border border-amber-500/30 text-amber-500 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in pointer-events-none">
          <RefreshCw size={16} className="animate-spin" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wide">Compilation...</span>
            <span className="text-[10px] text-amber-500/70 font-medium leading-tight">1er lancement : téléchargement des paquets requis</span>
          </div>
        </div>
      )}
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
