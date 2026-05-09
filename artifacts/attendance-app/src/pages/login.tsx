import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Eye, EyeOff, Lock, User } from "lucide-react";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [mode, setMode] = useState<"login" | "setup">("login");
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    fetch("/api/auth/setup-status", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data.needsSetup) {
          setNeedsSetup(true);
          setMode("setup");
        } else {
          setNeedsSetup(false);
          setMode("login");
        }
      })
      .catch(() => setNeedsSetup(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("Please enter username and password"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      window.location.href = "/";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !name) { setError("All fields are required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Setup failed"); return; }
      window.location.href = "/";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="text-center pb-4 pt-8 space-y-4">
          <div className="mx-auto w-full max-w-xs">
            <img
              src="/bti-logo.jpeg"
              alt="Bangalore Technological Institute Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Smart Attendance Monitoring System
            </p>
            <p className="text-xs text-muted-foreground">
              {mode === "setup" ? "Create your admin account to get started" : "Faculty & Admin Portal"}
            </p>
          </div>
        </CardHeader>

        <CardContent className="pb-8 space-y-5">
          {mode === "setup" && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
              No accounts exist yet. Create your administrator account below.
            </div>
          )}

          <form onSubmit={mode === "setup" ? handleSetup : handleLogin} className="space-y-4">
            {mode === "setup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Dr. Rajesh Kumar"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="pl-9"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoFocus={mode === "login"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "setup" ? "Min. 6 characters" : "••••••••"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={submitting}>
              {submitting
                ? (mode === "setup" ? "Creating account..." : "Signing in...")
                : (mode === "setup" ? "Create Admin Account" : "Sign In")}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Affiliated to VTU, Belagavi &nbsp;|&nbsp; Accredited by NAAC &nbsp;|&nbsp; ISO Certified
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
