import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock, Shield, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function LoginPrompt() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        toast.error('Already logged in. Please refresh the page.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  };

  const isLoading = loginStatus === 'logging-in';

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <CalendarClock className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Service Data Tracking</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track customers, manage services, record payments, and never miss a service date
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>
                Organize customer information, contact details, and service preferences in one place
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Service Tracking</CardTitle>
              <CardDescription>
                Record service history, track payments, and monitor business performance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is stored securely on the Internet Computer blockchain
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-primary/50 max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Login with Internet Identity to access your service management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Connecting...' : 'Login with Internet Identity'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
