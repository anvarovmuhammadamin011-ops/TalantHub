import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import EmployerHome from "./pages/EmployerHome";
import Vacancies from "./pages/Vacancies";
import VacancyDetail from "./pages/VacancyDetail";
import SpecialistProfile from "./pages/SpecialistProfile";
import EmployerProfile from "./pages/EmployerProfile";
import SpecialistDetail from "./pages/SpecialistDetail";
import Specialists from "./pages/Specialists";
import Applications from "./pages/Applications";
import Orders from "./pages/Orders";
import EmployerDashboard from "./pages/EmployerDashboard";
import Chat from "./pages/Chat";
import AiChat from "./pages/AiChat";
import Statistics from "./pages/Statistics";
import VacancyCreate from "./pages/VacancyCreate";
import Wallet from "./pages/Wallet";
import VacancyApplicants from "./pages/VacancyApplicants";
import NotificationsPage from "./pages/NotificationsPage";
import Admin from "./pages/Admin";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminModeration from "./pages/AdminModeration";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminStats from "./pages/AdminStats";
import AdminLayout from "./components/layout/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";
import AuthCallback from "./pages/AuthCallback";

function RootRoute() {
  const { user } = useAuth();
  if (user?.role === "specialist") return <Home />;
  if (user?.role === "employer") return <EmployerHome />;
  return <Vacancies />;
}

function ProfileRoute() {
  const { user } = useAuth();
  return user?.role === "employer" ? <EmployerProfile /> : <SpecialistProfile />;
}

function FallbackRoute() {
  const { user } = useAuth();
  const goHome = user?.role === "specialist" || user?.role === "employer";
  return <Navigate to={goHome ? "/" : "/vacancies"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<RootRoute />} />
              <Route path="/vacancies" element={<Vacancies />} />
              <Route path="/vacancies/new" element={<VacancyCreate />} />
              <Route path="/vacancies/:id/edit" element={<VacancyCreate />} />
              <Route path="/vacancies/:id/applicants" element={<VacancyApplicants />} />
              <Route path="/vacancies/:id" element={<VacancyDetail />} />
              <Route path="/specialists" element={<Specialists />} />
              <Route path="/specialists/:id" element={<SpecialistDetail />} />
              <Route path="/profile" element={<ProfileRoute />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/dashboard" element={<EmployerDashboard />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/ai-chat" element={<AiChat />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/users/:id" element={<AdminUserDetail />} />
              </Route>
            </Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/moderation" element={<AdminModeration />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/stats" element={<AdminStats />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<FallbackRoute />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
