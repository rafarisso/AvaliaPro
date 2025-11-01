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

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
        Carregando...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/avaliacoes/nova" element={<AssessmentCreator />} />
      <Route path="/planos/nova" element={<LessonPlanCreator />} />
      <Route path="/slides/novo" element={<SlidesCreator />} />
      <Route path="/create/slides" element={<CreateSlides />} />
      <Route path="/create/assessment" element={<CreateAssessment />} />
      <Route path="/create/assessment/adapted" element={<CreateAdaptedAssessment />} />
      <Route path="/create/lesson-plan" element={<CreateLessonPlan />} />
      <Route path="/create/rubric" element={<CreateRubric />} />
      <Route path="/tutor" element={<Tutor />} />
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
