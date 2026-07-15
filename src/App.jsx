import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Vacancies from "./pages/Vacancies";
import VacancyDetail from "./pages/VacancyDetail";
import SpecialistProfile from "./pages/SpecialistProfile";
import SpecialistDetail from "./pages/SpecialistDetail";
import Specialists from "./pages/Specialists";
import Applications from "./pages/Applications";
import Orders from "./pages/Orders";
import EmployerDashboard from "./pages/EmployerDashboard";
import Chat from "./pages/Chat";
import AiChat from "./pages/AiChat";
import Statistics from "./pages/Statistics";
import VacancyCreate from "./pages/VacancyCreate";
import Admin from "./pages/Admin";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminRoute from "./components/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/vacancies" element={<Vacancies />} />
              <Route path="/vacancies/new" element={<VacancyCreate />} />
              <Route path="/vacancies/:id" element={<VacancyDetail />} />
              <Route path="/specialists" element={<Specialists />} />
              <Route path="/specialists/:id" element={<SpecialistDetail />} />
              <Route path="/profile" element={<SpecialistProfile />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/dashboard" element={<EmployerDashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/ai-chat" element={<AiChat />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/users/:id" element={<AdminUserDetail />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
