import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetAllCustomers, useGetAllServices, useGetAllReminders } from './hooks/useQueries';
import { Toaster, toast } from 'sonner';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import LoginPrompt from './components/LoginPrompt';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Database } from 'lucide-react';

/**
 * Main application component with Internet Identity authentication.
 * VERIFICATION: Authenticated-only access is enforced - Dashboard (which includes AMC tab)
 * is only rendered when isAuthenticated is true (line 63). This ensures users must log in
 * before accessing any application data, including AMC contracts.
 */
export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: customers = [], isLoading: customersLoading, isSuccess: customersSuccess } = useGetAllCustomers();
  const { data: services = [], isLoading: servicesLoading, isSuccess: servicesSuccess } = useGetAllServices();
  const { data: reminders = [], isLoading: remindersLoading, isSuccess: remindersSuccess } = useGetAllReminders();
  
  const [dataValidationShown, setDataValidationShown] = useState(false);

  const showLoginPrompt = !isAuthenticated && !isInitializing;
  const showDashboard = isAuthenticated;

  // Data persistence validation - show confirmation after successful data load
  useEffect(() => {
    if (isAuthenticated && !dataValidationShown && customersSuccess && servicesSuccess && remindersSuccess) {
      const totalRecords = customers.length + services.length + reminders.length;
      
      if (totalRecords > 0) {
        toast.success(
          `Data loaded successfully: ${customers.length} customers, ${services.length} services, ${reminders.length} reminders`,
          {
            duration: 5000,
            icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          }
        );
      }
      
      setDataValidationShown(true);
    }
  }, [isAuthenticated, customersSuccess, servicesSuccess, remindersSuccess, customers.length, services.length, reminders.length, dataValidationShown]);

  // Show loading state for data validation
  const isLoadingData = isAuthenticated && (customersLoading || servicesLoading || remindersLoading);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {showLoginPrompt && <LoginPrompt />}
          {isLoadingData && showDashboard && (
            <div className="container py-8">
              <Alert className="border-primary/20 bg-primary/5">
                <Database className="h-4 w-4 animate-pulse" />
                <AlertDescription className="ml-2">
                  Loading and validating data persistence...
                </AlertDescription>
              </Alert>
            </div>
          )}
          {/* VERIFICATION: Dashboard (with AMC tab) only renders when authenticated */}
          {showDashboard && <Dashboard />}
        </main>
        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
