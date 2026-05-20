import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute, PublicRoute } from "@/components/auth/ProtectedRoutes";
import { Loader2 } from "lucide-react";

import LoginPage from "@/pages/LoginPage";
import StudentWorkoutsPage from "@/pages/student/StudentWorkoutsPage";
import StudentWorkoutPage from "@/pages/student/StudentWorkoutPage";
import StudentCatalogPage from "@/pages/student/Studentcatalogpage";
import DashboardPage from "@/pages/admin/DashboardPage";
import AdminAlunosPage from "@/pages/admin/AdminAlunosPage";
import AdminAlunoDetailPage from "@/pages/admin/AdminAlunoDetailPage.jsx";
import CreateStudentPage from "@/pages/admin/CreateStudentPage";
import ExerciciosPage from "@/pages/admin/ExerciciosPage";
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
      <Route path="/student" element={<ProtectedRoute><StudentWorkoutsPage /></ProtectedRoute>} />
      <Route path="/student/workout/:id" element={<ProtectedRoute><StudentWorkoutPage /></ProtectedRoute>} />
      <Route path="/student/catalog" element={<ProtectedRoute><StudentCatalogPage /></ProtectedRoute>} />
      <Route path="/app" element={<Navigate to="/student" replace />} />
      <Route path="/student/workouts" element={<Navigate to="/student" replace />} />
      <Route path="/admin" element={<AdminRoute><DashboardPage /></AdminRoute>} />
      <Route path="/admin/alunos" element={<AdminRoute><AdminAlunosPage /></AdminRoute>} />
      <Route path="/admin/alunos/novo" element={<AdminRoute><CreateStudentPage /></AdminRoute>} />
      <Route path="/admin/alunos/:id" element={<AdminRoute><AdminAlunoDetailPage /></AdminRoute>} />
      <Route path="/admin/exercicios" element={<AdminRoute><ExerciciosPage /></AdminRoute>} />
      <Route path="/admin/treinos/exercicios" element={<AdminRoute><TreinosExercisesPage /></AdminRoute>} />
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
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default App;
