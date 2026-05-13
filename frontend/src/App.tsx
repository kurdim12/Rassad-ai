import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ClaimChecker } from "./components/ClaimChecker";
import { AgentsShowcase } from "./components/AgentsShowcase";
import { Trending } from "./components/Trending";
import { Footer } from "./components/Footer";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { Onboarding } from "./components/Onboarding";
import { health } from "./lib/api";
import { CheckResult } from "./lib/api";
import {
  HistoryItem,
  getHistory,
  isOnboarded,
  setTheme,
  getTheme,
} from "./lib/storage";
import { ToastProvider } from "./lib/toast";

export default function App() {
  const [demoMode, setDemoMode] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [prefilled, setPrefilled] = useState<{
    claim?: string;
    result?: CheckResult | null;
  }>({});
  const [showOnboarding, setShowOnboarding] = useState(false);

  const refreshHealth = () => {
    health()
      .then((h) => {
        setDemoMode(h.demo_mode);
        setServerError(null);
      })
      .catch((e) => setServerError(e.message));
  };

  useEffect(() => {
    refreshHealth();
    setHistory(getHistory());
    setTheme(getTheme()); // apply persisted theme
    setShowOnboarding(!isOnboarded());

    // Hydrate claim from URL ?claim=...
    const params = new URLSearchParams(window.location.search);
    const claim = params.get("claim");
    if (claim) setPrefilled({ claim });

    const onStorage = () => setHistory(getHistory());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Header
          demoMode={demoMode}
          serverError={serverError}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
          historyCount={history.length}
        />
        <main>
          <Hero />
          <ClaimChecker
            prefilledClaim={prefilled.claim}
            prefilledResult={prefilled.result || null}
          />
          <AgentsShowcase />
          <Trending />
        </main>
        <Footer />

        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onKeyChange={refreshHealth}
        />
        <HistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          items={history}
          onPick={(item) => {
            setPrefilled({ claim: item.claim, result: item.result });
            // Scroll to checker
            setTimeout(() => {
              document
                .getElementById("checker")
                ?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
          onChanged={setHistory}
        />

        {showOnboarding && <Onboarding />}
      </div>
    </ToastProvider>
  );
}
