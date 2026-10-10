import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute, PublicRoute } from "@/components/auth/ProtectedRoutes";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import StudentWorkoutsPage from "@/pages/student/StudentWorkoutsPage";
import StudentWorkoutPage from "@/pages/student/StudentWorkoutPage";
import StudentCatalogPage   from "@/pages/student/Studentcatalogpage";
import JourneyDetailPage   from "@/pages/student/JourneyDetailPage";
import WorkoutPreviewPage  from "@/pages/student/WorkoutPreviewPage";
import StudentProfilePage  from "@/pages/student/StudentProfilePage";
import StudentEvolutionPage from "@/pages/student/StudentEvolutionPage";
import TrainRedirectPage from "@/pages/student/TrainRedirectPage";
import DashboardPage from "@/pages/admin/DashboardPage";
import AdminAlunosPage from "@/pages/admin/AdminAlunosPage";
import AdminAlunoDetailPage from "@/pages/admin/AdminAlunoDetailPage.jsx";
import CreateStudentPage from "@/pages/admin/CreateStudentPage";
import AdminCatalogPage from "@/pages/admin/Admincatalogpage";
import {
  ExercisesPage as TreinosExercisesPage,
  WorkoutsPage,
  WorkoutEditorPage,
  CustomWorkoutsPage,
} from "@/pages/admin/treinos";

const RedirectByRole = () => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <Navigate to="/student" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route path="/student" element={<ProtectedRoute><StudentWorkoutsPage /></ProtectedRoute>} />
      <Route path="/student/workout/:id" element={<ProtectedRoute><StudentWorkoutPage /></ProtectedRoute>} />
      <Route path="/student/train" element={<ProtectedRoute><TrainRedirectPage /></ProtectedRoute>} />
      <Route path="/student/catalog"      element={<ProtectedRoute><StudentCatalogPage /></ProtectedRoute>} />
      <Route path="/student/journey/:id"   element={<ProtectedRoute><JourneyDetailPage /></ProtectedRoute>} />
      <Route path="/student/workout-preview/:id" element={<ProtectedRoute><WorkoutPreviewPage /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
      <Route path="/student/evolution" element={<ProtectedRoute><StudentEvolutionPage /></ProtectedRoute>} />
      <Route path="/app" element={<Navigate to="/student" replace />} />
      <Route path="/student/workouts" element={<Navigate to="/student" replace />} />
      <Route path="/admin" element={<AdminRoute><DashboardPage /></AdminRoute>} />
      <Route path="/admin/alunos" element={<AdminRoute><AdminAlunosPage /></AdminRoute>} />
      <Route path="/admin/alunos/novo" element={<AdminRoute><CreateStudentPage /></AdminRoute>} />
      <Route path="/admin/alunos/:id" element={<AdminRoute><AdminAlunoDetailPage /></AdminRoute>} />
      <Route path="/admin/treinos/exercicios" element={<AdminRoute><TreinosExercisesPage /></AdminRoute>} />
      <Route path="/admin/exercicios" element={<Navigate to="/admin/treinos/exercicios" replace />} />
      <Route path="/admin/treinos/templates" element={<AdminRoute><WorkoutsPage /></AdminRoute>} />
      <Route path="/admin/treinos/editor/:id" element={<AdminRoute><WorkoutEditorPage /></AdminRoute>} />
      <Route path="/admin/treinos/personalizados" element={<AdminRoute><CustomWorkoutsPage /></AdminRoute>} />
      <Route path="/admin/catalog" element={<AdminRoute><AdminCatalogPage /></AdminRoute>} />
      <Route path="/" element={<RedirectByRole />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
        <ThemeToggle className="fixed bottom-20 right-4 z-50 shadow-lg md:bottom-4" />
        <Toaster position="top-center" richColors closeButton />
      </div>
    </ThemeProvider>
  );
}

export default App;
