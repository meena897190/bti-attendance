import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Users, 
  BookOpen, 
  CheckSquare, 
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Menu,
  FileText
} from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/branches", label: "Branches", icon: Building2 },
    { href: "/subjects", label: "Subjects", icon: BookOpen },
    { href: "/students", label: "Students", icon: Users },
    { href: "/attendance", label: "Attendance", icon: CheckSquare },
    { href: "/attendance/report", label: "Reports", icon: FileText },
  ];

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <div className="flex flex-col gap-2 p-4">
      {navItems.map((item) => (
        <Link 
          key={item.href} 
          href={item.href} 
          onClick={onClick}
          className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            location === item.href 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-background no-print">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-6 border-b flex items-center gap-3">
          <img src="/bti-logo.jpeg" alt="BTI Logo" className="h-8 w-8 rounded object-cover" />
          <div className="font-semibold text-lg tracking-tight">BTI Admin</div>
        </div>
        <div className="flex-1 overflow-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t flex flex-col gap-2">
          <div className="px-3 py-2 text-sm font-medium text-muted-foreground truncate">
            {user?.email || "Faculty"}
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <div className="p-6 border-b flex items-center gap-3">
                  <img src="/bti-logo.jpeg" alt="BTI Logo" className="h-8 w-8 rounded object-cover" />
                  <div className="font-semibold text-lg">BTI Admin</div>
                </div>
                <NavLinks />
              </SheetContent>
            </Sheet>
            <span className="font-semibold">BTI Admin</span>
          </div>
          
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold tracking-tight">
              {navItems.find(item => item.href === location)?.label || "BTI Attendance"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
