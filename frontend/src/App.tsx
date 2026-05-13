import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ClaimChecker } from "./components/ClaimChecker";
import { AgentsShowcase } from "./components/AgentsShowcase";
import { Trending } from "./components/Trending";
import { Footer } from "./components/Footer";
import { health } from "./lib/api";

export default function App() {
  const [demoMode, setDemoMode] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    health()
      .then((h) => setDemoMode(h.demo_mode))
      .catch((e) => setServerError(e.message));
  }, []);

  return (
    <div className="min-h-screen">
      <Header demoMode={demoMode} serverError={serverError} />
      <main>
        <Hero />
        <ClaimChecker />
        <AgentsShowcase />
        <Trending />
      </main>
      <Footer />
    </div>
  );
}
