import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import FeatureHeader from "@/features/common/Header";
import LandingPageContent from "@/features/landing/LandingPage";

const STORAGE_KEY = "avaliapro:landing-dismissed";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      navigate(user ? "/dashboard" : "/login", { replace: true });
    }
  }, [navigate, user]);

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    navigate(user ? "/dashboard" : "/login");
  };

  return (
    <div className="min-h-screen bg-white">
      <FeatureHeader />
      <LandingPageContent onContinue={handleContinue} />
    </div>
  );
}
