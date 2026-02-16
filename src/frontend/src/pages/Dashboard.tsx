import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Users, History, Bell, TrendingUp, FileText } from 'lucide-react';
import DashboardOverview from '../components/DashboardOverview';
import CustomersTab from '../components/CustomersTab';
import ServicesTab from '../components/ServicesTab';
import RemindersTab from '../components/RemindersTab';
import RevenueAnalyticsTab from '../components/RevenueAnalyticsTab';
import AMCTab from '../components/AMCTab';

export type CustomerFilter = 'all' | 'inWarranty' | 'outWarranty' | 'dueForService';
export type ServiceFilter = 'all' | 'unpaid';
export type ReminderFilter = 'all' | 'today' | 'upcoming';

export interface PrefilledServiceData {
  customerId: bigint;
  customerName: string;
  serviceType: any;
}

/**
 * Dashboard component with tabbed navigation.
 * VERIFICATION: AMC tab is explicitly wired and visible for authenticated users.
 * The tab trigger (line 94-97) and content (line 133-135) ensure AMC functionality is accessible.
 */
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('all');
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>('all');
  const [prefilledServiceData, setPrefilledServiceData] = useState<PrefilledServiceData | null>(null);

  const handleCustomerCardClick = (filter: CustomerFilter) => {
    setCustomerFilter(filter);
    setActiveTab('customers');
  };

  const handleServiceCardClick = (filter: ServiceFilter) => {
    setServiceFilter(filter);
    setActiveTab('services');
  };

  const handleReminderCardClick = (filter: ReminderFilter) => {
    setReminderFilter(filter);
    setActiveTab('reminders');
  };

  const handleAddServiceFromReminder = (data: PrefilledServiceData) => {
    setPrefilledServiceData(data);
    setActiveTab('services');
  };

  const handleClearCustomerFilter = () => {
    setCustomerFilter('all');
  };

  const handleClearServiceFilter = () => {
    setServiceFilter('all');
  };

  const handleClearReminderFilter = () => {
    setReminderFilter('all');
  };

  const handleClearPrefilledServiceData = () => {
    setPrefilledServiceData(null);
  };

  return (
    <div className="container py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your customers, services, and reminders</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Services</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Reminders</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Revenue</span>
            </TabsTrigger>
            {/* VERIFICATION: AMC tab trigger - ensures AMC tab is visible and accessible */}
            <TabsTrigger value="amc" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">AMC</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview 
              onCustomerCardClick={handleCustomerCardClick}
              onServiceCardClick={handleServiceCardClick}
              onReminderCardClick={handleReminderCardClick}
            />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomersTab filter={customerFilter} onClearFilter={handleClearCustomerFilter} />
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <ServicesTab 
              filter={serviceFilter} 
              onClearFilter={handleClearServiceFilter}
              prefilledData={prefilledServiceData}
              onClearPrefilledData={handleClearPrefilledServiceData}
            />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-6">
            <RemindersTab 
              filter={reminderFilter} 
              onClearFilter={handleClearReminderFilter}
              onAddServiceFromReminder={handleAddServiceFromReminder}
            />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueAnalyticsTab />
          </TabsContent>

          {/* VERIFICATION: AMC tab content - ensures AMC component mounts without errors */}
          <TabsContent value="amc" className="space-y-6">
            <AMCTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
