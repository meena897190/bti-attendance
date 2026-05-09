import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import { ThemeProvider } from "next-themes";
import { MainLayout } from "@/components/layout/main-layout";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import BranchesPage from "@/pages/branches";
import BranchDetailPage from "@/pages/branch-detail";
import SubjectsPage from "@/pages/subjects";
import StudentsPage from "@/pages/students";
import AttendancePage from "@/pages/attendance";
import ReportPage from "@/pages/report";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/branches" component={() => <ProtectedRoute component={BranchesPage} />} />
      <Route path="/branches/:id" component={() => <ProtectedRoute component={BranchDetailPage} />} />
      <Route path="/subjects" component={() => <ProtectedRoute component={SubjectsPage} />} />
      <Route path="/students" component={() => <ProtectedRoute component={StudentsPage} />} />
      <Route path="/attendance" component={() => <ProtectedRoute component={AttendancePage} />} />
      <Route path="/attendance/report" component={() => <ProtectedRoute component={ReportPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
