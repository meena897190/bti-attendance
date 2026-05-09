import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-lg border-primary/10">
        <CardHeader className="text-center pb-6 pt-8 space-y-5">
          {/* Full rectangular BTI logo */}
          <div className="mx-auto w-full max-w-xs">
            <img
              src="/bti-logo.jpeg"
              alt="Bangalore Technological Institute Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="space-y-1 pt-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Smart Attendance Monitoring System
            </CardTitle>
            <CardDescription className="text-sm">
              Faculty &amp; Admin Portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8 space-y-5 text-center">
          <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
            <span>Approved by AICTE, New Delhi &nbsp;|&nbsp; Affiliated to VTU, Belagavi</span>
            <span>Accredited by NAAC &nbsp;|&nbsp; ISO Certified</span>
            <span className="pt-1 text-muted-foreground/70">Kodathi Village, Varthoor Hobli, Bengaluru – 560035</span>
          </div>

          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={() => login()}
            data-testid="button-faculty-login"
          >
            Faculty Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
