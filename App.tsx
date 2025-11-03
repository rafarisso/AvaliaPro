import React from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "./hooks/useAuth"
import { SchoolProvider } from "./hooks/useSchool"
import { ThemeProvider } from "./hooks/useTheme"
import { ToastProvider } from "./hooks/useToast"
import AuthCallback from "./src/pages/AuthCallback"
import CreateAdaptedAssessment from "./src/pages/CreateAdaptedAssessment"
import CreateAssessment from "./src/pages/CreateAssessment"
import CreateLessonPlan from "./src/pages/CreateLessonPlan"
import CreateRubric from "./src/pages/CreateRubric"
import CreateSlides from "./src/pages/CreateSlides"
import Dashboard from "./src/pages/Dashboard"
import Health from "./src/pages/Health"
import ImportStudents from "./src/pages/ImportStudents"
import LandingPage from "./src/pages/LandingPage"
import Login from "./src/pages/Login"
import ModelosPage from "./src/pages/modelos/ModelosPage"
import MyCreations from "./src/pages/MyCreations"
import RelatoriosPage from "./src/pages/relatorios/RelatoriosPage"
import Tutor from "./src/pages/Tutor"
import AssessmentCreator from "@/features/assessments/AssessmentCreator"
import LessonPlanCreator from "@/features/lessonPlans/LessonPlanCreator"
import SlidesCreator from "@/features/slides/SlidesCreator"
import OnboardingWizard from "@/features/onboarding/OnboardingWizard"

function AppRoutes() {
  const { user, loading, profile } = useAuth()

  const needsOnboarding = !!user && !profile?.onboarding_completed

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? (needsOnboarding ? "/onboarding" : "/dashboard") : "/login"} replace />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to={needsOnboarding ? "/onboarding" : "/dashboard"} replace /> : <Login />}
      />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            {profile?.onboarding_completed ? <Navigate to="/dashboard" replace /> : <OnboardingWizard />}
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireOnboarding>
            <Dashboard />
          </RequireOnboarding>
        }
      />
      <Route
        path="/avaliacoes/nova"
        element={
          <RequireOnboarding>
            <AssessmentCreator />
          </RequireOnboarding>
        }
      />
      <Route
        path="/planos/nova"
        element={
          <RequireOnboarding>
            <LessonPlanCreator />
          </RequireOnboarding>
        }
      />
      <Route
        path="/slides/novo"
        element={
          <RequireOnboarding>
            <SlidesCreator />
          </RequireOnboarding>
        }
      />
      <Route
        path="/create/slides"
        element={
          <RequireOnboarding>
            <CreateSlides />
          </RequireOnboarding>
        }
      />
      <Route
        path="/create/assessment"
        element={
          <RequireOnboarding>
            <CreateAssessment />
          </RequireOnboarding>
        }
      />
      <Route
        path="/create/assessment/adapted"
        element={
          <RequireOnboarding>
            <CreateAdaptedAssessment />
          </RequireOnboarding>
        }
      />
      <Route
        path="/create/lesson-plan"
        element={
          <RequireOnboarding>
            <CreateLessonPlan />
          </RequireOnboarding>
        }
      />
      <Route
        path="/create/rubric"
        element={
          <RequireOnboarding>
            <CreateRubric />
          </RequireOnboarding>
        }
      />
      <Route
        path="/tutor"
        element={
          <RequireOnboarding>
            <Tutor />
          </RequireOnboarding>
        }
      />
      <Route path="/criar-avaliacao" element={<Navigate to="/create/assessment" replace />} />
      <Route path="/criar-plano" element={<Navigate to="/create/lesson-plan" replace />} />
      <Route path="/criar-slides" element={<Navigate to="/create/slides" replace />} />
      <Route path="/avaliacao-adaptada" element={<Navigate to="/create/assessment/adapted" replace />} />
      <Route path="/modelos" element={<ModelosPage />} />
      <Route path="/relatorios" element={<RelatoriosPage />} />
      <Route path="/my-creations" element={<MyCreations />} />
      <Route path="/import/students" element={<ImportStudents />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/health" element={<Health />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function RequireOnboarding({ children }: { children: React.ReactElement }) {
  const { user, profile } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (!profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SchoolProvider>
            <AppRoutes />
          </SchoolProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
