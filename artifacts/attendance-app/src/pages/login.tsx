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
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="text-center pb-8 pt-8 space-y-4">
          <div className="mx-auto w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-md">
            <img 
              src="/bti-logo.jpeg" 
              alt="BTI Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Bangalore Technological Institute
            </CardTitle>
            <CardDescription className="text-base">
              Smart Attendance Monitoring System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8 space-y-6 text-center">
          <div className="text-sm text-muted-foreground flex flex-col gap-1">
            <span>Affiliated to VTU, Belagavi</span>
            <span>Accredited by NAAC | ISO Certified</span>
          </div>
          
          <Button 
            className="w-full h-12 text-base font-semibold" 
            onClick={() => login()}
          >
            Faculty Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
