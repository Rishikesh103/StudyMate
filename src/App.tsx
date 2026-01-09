import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthPage from "./pages/AuthPage";
import StudentDashboard from "./pages/StudentDashboard";
import StudyLogPage from "./pages/StudyLogPage";
import QuizPage from "./pages/QuizPage";
import RevisionPlannerPage from "./pages/RevisionPlannerPage";
import AnalyticsPage from "./pages/AnalyticsPage";

import RoadmapPage from "./pages/RoadmapPage";
import SyllabusMapPage from "./pages/SyllabusMapPage";
import SettingsPage from "./pages/SettingsPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// Force dark mode by default
if (!document.documentElement.classList.contains('dark')) {
  document.documentElement.classList.add('dark');
}

const App = () => (
  <AuthProvider>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/study-log" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudyLogPage />
          </ProtectedRoute>
        } />
        <Route path="/syllabus" element={
          <ProtectedRoute allowedRoles={['student']}>
            <SyllabusMapPage />
          </ProtectedRoute>
        } />
        <Route path="/quiz" element={
          <ProtectedRoute allowedRoles={['student']}>
            <QuizPage />
          </ProtectedRoute>
        } />
        <Route path="/revision" element={
          <ProtectedRoute allowedRoles={['student']}>
            <RevisionPlannerPage />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={['student']}>
            <AnalyticsPage />
          </ProtectedRoute>
        } />

        <Route path="/roadmap" element={
          <ProtectedRoute allowedRoles={['student']}>
            <RoadmapPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'parent']}>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/teacher/dashboard" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/parent/dashboard" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);


export default App;
