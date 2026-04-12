import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { AppStateProvider } from "@/lib/app-state";
import { Navbar } from "@/components/layout/Navbar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OrderPage from "./pages/OrderPage";
import MyOrders from "./pages/MyOrders";
import Billing from "./pages/Billing";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/order" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        const isDark = e.matches;
        document.documentElement.classList.toggle("dark", isDark);
        window.dispatchEvent(new Event("theme-changed"));
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppStateProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </AppStateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
