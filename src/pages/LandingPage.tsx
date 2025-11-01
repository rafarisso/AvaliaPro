import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import FeatureHeader from "@/features/common/Header";
import LandingPageContent from "@/features/landing/LandingPage";

const STORAGE_KEY = "avaliapro:landing-dismissed";

export default function LandingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(profile?.onboarding_completed ? "/dashboard" : "/onboarding", { replace: true });
      return;
    }
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      navigate("/login", { replace: true });
    }
  }, [navigate, profile?.onboarding_completed, user]);

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    if (user) {
      navigate(profile?.onboarding_completed ? "/dashboard" : "/onboarding");
    } else {
      navigate("/login");
    }
  };

  if (user) {
    // Usuario autenticado vai direto para o fluxo apropriado
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <FeatureHeader />
      <LandingPageContent onContinue={handleContinue} />
    </div>
  );
}
