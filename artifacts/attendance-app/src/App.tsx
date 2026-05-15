import { type ComponentType } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { MainLayout } from "@/components/layout/main-layout";

import DashboardPage from "@/pages/dashboard";
import BranchesPage from "@/pages/branches";
import BranchDetailPage from "@/pages/branch-detail";
import SubjectsPage from "@/pages/subjects";
import StudentsPage from "@/pages/students";
import AttendancePage from "@/pages/attendance";
import ReportPage from "@/pages/report";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: ComponentType<any> }) {
  // Temporarily bypass authentication for development
  return (
    <MainLayout>
      <Component />
    </MainLayout>
  );
}

function Router() {
  return (
    <Switch>
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
