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
import SavedVacancies from "./pages/SavedVacancies";
import CompanyProfile from "./pages/CompanyProfile";
import SpecialistProfile from "./pages/SpecialistProfile";
import EmployerProfile from "./pages/EmployerProfile";
import EditProfile from "./pages/EditProfile";
import EditCompanyProfile from "./pages/EditCompanyProfile";
import NotificationSettings from "./pages/NotificationSettings";
import SupportPage from "./pages/SupportPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SpecialistDetail from "./pages/SpecialistDetail";
import Specialists from "./pages/Specialists";
import Applications from "./pages/Applications";
import Orders from "./pages/Orders";
import EmployerDashboard from "./pages/EmployerDashboard";
import Chat from "./pages/Chat";
import Statistics from "./pages/Statistics";
import VacancyCreate from "./pages/VacancyCreate";
import Wallet from "./pages/Wallet";
import VacancyApplicants from "./pages/VacancyApplicants";
import NotificationsPage from "./pages/NotificationsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminVacancyDetail from "./pages/AdminVacancyDetail";
import AdminModeration from "./pages/AdminModeration";
import AdminSupport from "./pages/AdminSupport";
import AdminDisputes from "./pages/AdminDisputes";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminSpecialistsPage from "./pages/AdminSpecialistsPage";
import AdminVacanciesPage from "./pages/AdminVacanciesPage";
import AdminApplicationsPage from "./pages/AdminApplicationsPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminCompaniesPage from "./pages/AdminCompaniesPage";
import AdminVerificationPage from "./pages/AdminVerificationPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminBroadcastPage from "./pages/AdminBroadcastPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import AdminStats from "./pages/AdminStats";
import AdminFinance from "./pages/AdminFinance";
import AdminSettings from "./pages/AdminSettings";
import AdminLayout from "./components/layout/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import ScrollToTop from "./components/ScrollToTop";
import AuthCallback from "./pages/AuthCallback";

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user?.role === "specialist") return <Home />;
  if (user?.role === "employer") return <EmployerHome />;
  return <Vacancies />;
}

function ProfileRoute() {
  const { user } = useAuth();
  return user?.role === "employer" ? <EmployerProfile /> : <SpecialistProfile />;
}

function EditProfileRoute() {
  const { user } = useAuth();
  return user?.role === "employer" ? <EditCompanyProfile /> : <EditProfile />;
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
          <Route element={<Layout />}>
            {/* Public — no login required, mirrors cloz.uz-style open vacancy browsing */}
            <Route path="/" element={<RootRoute />} />
            <Route path="/vacancies" element={<Vacancies />} />
            <Route path="/vacancies/:id" element={<VacancyDetail />} />
            <Route path="/companies/:id" element={<CompanyProfile />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/vacancies/new" element={<VacancyCreate />} />
              <Route path="/vacancies/:id/edit" element={<VacancyCreate />} />
              <Route path="/vacancies/:id/applicants" element={<VacancyApplicants />} />
              <Route path="/saved" element={<SavedVacancies />} />
              <Route path="/specialists" element={<Specialists />} />
              <Route path="/specialists/:id" element={<SpecialistDetail />} />
              <Route path="/profile" element={<ProfileRoute />} />
              <Route path="/profile/edit" element={<EditProfileRoute />} />
              <Route path="/profile/notifications" element={<NotificationSettings />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/dashboard" element={<EmployerDashboard />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/ai-chat" element={<Navigate to="/chat?ai=1" replace />} />
              <Route path="/statistics" element={<Statistics />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/vacancies" element={<AdminVacanciesPage />} />
                <Route path="/admin/vacancies/:id" element={<AdminVacancyDetail />} />
                <Route path="/admin/specialists" element={<AdminSpecialistsPage />} />
                <Route path="/admin/applications" element={<AdminApplicationsPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/companies" element={<AdminCompaniesPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                <Route path="/admin/stats" element={<AdminStats />} />
                <Route path="/admin/moderation" element={<AdminModeration />} />
                <Route path="/admin/flags" element={<AdminModeration />} />
                <Route path="/admin/verification" element={<AdminVerificationPage />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/disputes" element={<AdminDisputes />} />
                <Route path="/admin/finance" element={<AdminFinance />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/broadcast" element={<AdminBroadcastPage />} />
                <Route path="/admin/logs" element={<AdminLogsPage />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<FallbackRoute />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
