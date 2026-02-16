import { useState } from 'react';
import { useGetTodaysReminders, useGetUpcomingReminders, useGetAllReminders, useGetAllCustomers, useSetReminderSentStatus } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar, Clock, X, CheckCircle2, ClipboardList, CheckCheck, User } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { formatDate } from '../lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import AddReminderDialog from './AddReminderDialog';
import MarkServiceDoneDialog from './MarkServiceDoneDialog';
import CustomerDetailDialog from './CustomerDetailDialog';
import { toast } from 'sonner';
import { toWhatsAppWaNumber } from '../lib/phoneNormalization';
import type { ReminderFilter } from '../pages/Dashboard';
import type { PrefilledServiceData } from '../pages/Dashboard';
import type { Reminder, Customer } from '../backend';

interface RemindersTabProps {
  filter?: ReminderFilter;
  onClearFilter?: () => void;
  onAddServiceFromReminder?: (data: PrefilledServiceData) => void;
}

export default function RemindersTab({ filter = 'all', onClearFilter, onAddServiceFromReminder }: RemindersTabProps) {
  const { data: allReminders = [], isLoading: allLoading } = useGetAllReminders();
  const { data: todaysRemindersData = [], isLoading: todayLoading } = useGetTodaysReminders();
  const { data: upcomingRemindersData = [], isLoading: upcomingLoading } = useGetUpcomingReminders();
  const { data: customers = [] } = useGetAllCustomers();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMarkDoneDialog, setShowMarkDoneDialog] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const setSentStatusMutation = useSetReminderSentStatus();

  // Determine which reminders to display based on dashboard filter
  let todaysReminders: Reminder[] = todaysRemindersData;
  let upcomingReminders: Reminder[] = upcomingRemindersData;
  let isLoading = todayLoading || upcomingLoading;

  if (filter === 'all') {
    // Show all reminders organized by today and upcoming
    isLoading = allLoading || todayLoading || upcomingLoading;
  } else if (filter === 'today') {
    // Show only today's reminders
    upcomingReminders = [];
    isLoading = todayLoading;
  } else if (filter === 'upcoming') {
    // Show only upcoming reminders
    todaysReminders = [];
    isLoading = upcomingLoading;
  }

  const getCustomer = (customerId: bigint) => {
    return customers.find((c) => c.id === customerId);
  };

  const getCustomerName = (customerId: bigint) => {
    const customer = getCustomer(customerId);
    return customer?.name || 'Unknown';
  };

  const handleSendWhatsApp = async (reminder: Reminder) => {
    const customer = getCustomer(reminder.customerId);
    
    if (!customer) {
      toast.error('Customer not found');
      return;
    }

    // Convert contact to WhatsApp-compatible number
    const waNumber = toWhatsAppWaNumber(customer.contact);
    
    if (!waNumber) {
      toast.error('Invalid or missing phone number for this customer. Please update the contact with a valid phone number including country code (e.g., +919978707701).');
      return;
    }

    // Format the message with bilingual template (English + Gujarati)
    const formattedDate = formatDate(reminder.reminderDate);
    const message = `Hello ${customer.name},

This is a reminder for your upcoming water purifier service:
Time to clean Water Purifier
Scheduled Date: ${formattedDate}
Please let us know if you need to reschedule or confirm if you're okay with the date.
Thank you!

હેલો ${customer.name},

આપના વોટર પ્યુરિફાયર સર્વિસ કરવાનો સમય થઈ ગયો છે.
${formattedDate}
જો તમે તારીખ બદલવા ઇચ્છતા હો તો કૃપા કરીને અમને જાણ કરો અથવા ખાતરી આપો કે તારીખ યોગ્ય છે.
આભાર`;
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp link with country-code-inclusive number
    const whatsappUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Mark reminder as sent
    if (!reminder.sentStatus) {
      try {
        await setSentStatusMutation.mutateAsync({
          reminderId: reminder.id,
          status: true,
        });
        toast.success('Reminder marked as sent');
      } catch (error) {
        toast.error('Failed to update reminder status');
      }
    }
  };

  const handleToggleSentStatus = async (reminder: Reminder) => {
    try {
      await setSentStatusMutation.mutateAsync({
        reminderId: reminder.id,
        status: !reminder.sentStatus,
      });
      toast.success(reminder.sentStatus ? 'Reminder marked as unsent' : 'Reminder marked as sent');
    } catch (error) {
      toast.error('Failed to update reminder status');
    }
  };

  const handleAddService = (reminder: Reminder) => {
    const customer = getCustomer(reminder.customerId);
    if (!customer) {
      toast.error('Customer not found');
      return;
    }

    if (onAddServiceFromReminder) {
      onAddServiceFromReminder({
        customerId: customer.id,
        customerName: customer.name,
        serviceType: customer.serviceType,
      });
      toast.success(`Navigating to add service for ${customer.name}`);
    }
  };

  const handleMarkAsDone = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setShowMarkDoneDialog(true);
  };

  const handleViewCustomer = (reminder: Reminder) => {
    const customer = getCustomer(reminder.customerId);
    if (!customer) {
      toast.error('Customer not found');
      return;
    }
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    // This is handled by CustomerDetailDialog, just close the dialog
    setShowCustomerDetail(false);
    setSelectedCustomer(null);
    toast.success('Customer deleted successfully');
  };

  const getFilterLabel = () => {
    if (filter === 'today') return "Today's Reminders";
    if (filter === 'upcoming') return 'Upcoming Reminders (Within 7 Days)';
    return null;
  };

  const filterLabel = getFilterLabel();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
          <CardDescription>Manage service reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const ReminderCard = ({ reminder, isToday = false }: { reminder: Reminder; isToday?: boolean }) => {
    const customer = getCustomer(reminder.customerId);
    const warrantyStatus = customer?.warrantyStatus === 'inWarranty' ? 'In Warranty' : 'Out of Warranty';
    const deviceBrand = customer?.brand || 'Unknown';

    return (
      <Card 
        key={reminder.id.toString()} 
        className={`${isToday ? 'border-primary/50 bg-primary/5' : ''} ${
          reminder.sentStatus ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : ''
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Checkbox
                checked={reminder.sentStatus}
                onCheckedChange={() => handleToggleSentStatus(reminder)}
                className="mt-1"
                title={reminder.sentStatus ? 'Mark as unsent' : 'Mark as sent'}
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{getCustomerName(reminder.customerId)}</p>
                  {reminder.sentStatus && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Sent
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{reminder.description}</p>
                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Badge variant={customer?.warrantyStatus === 'inWarranty' ? 'default' : 'secondary'} className="text-xs">
                      {warrantyStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Device:</span>
                    <span>{deviceBrand}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">{formatDate(reminder.reminderDate)}</p>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleViewCustomer(reminder)}
                className="shrink-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                title="View Customer Profile"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleMarkAsDone(reminder)}
                className="shrink-0 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 dark:hover:bg-purple-950 dark:hover:text-purple-400"
                title="Mark Service as Done"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
              {!isToday && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleAddService(reminder)}
                  className="shrink-0 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-400"
                  title="Add Service for this Customer"
                >
                  <ClipboardList className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleSendWhatsApp(reminder)}
                disabled={setSentStatusMutation.isPending}
                className="shrink-0 hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-400"
                title="Send WhatsApp Reminder"
              >
                <SiWhatsapp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reminders</CardTitle>
              <CardDescription>Manage service reminders for customers</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {filterLabel && (
            <Alert className="bg-primary/5 border-primary/20">
              <AlertDescription className="flex items-center justify-between">
                <span className="font-medium">Showing {filterLabel}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearFilter}
                  className="h-auto py-1 px-2 hover:bg-primary/10"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear Filter
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Today's Reminders Section */}
          {(filter === 'all' || filter === 'today') && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Today's Reminders</h3>
              </div>
              {todaysReminders.length === 0 ? (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">No reminders scheduled for today</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {todaysReminders
                    .sort((a, b) => Number(a.reminderDate - b.reminderDate))
                    .map((reminder) => (
                      <ReminderCard key={reminder.id.toString()} reminder={reminder} isToday />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Reminders Section */}
          {(filter === 'all' || filter === 'upcoming') && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Upcoming Reminders</h3>
              </div>
              {upcomingReminders.length === 0 ? (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">No upcoming reminders</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcomingReminders
                    .sort((a, b) => Number(a.reminderDate - b.reminderDate))
                    .map((reminder) => (
                      <ReminderCard key={reminder.id.toString()} reminder={reminder} />
                    ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddReminderDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <MarkServiceDoneDialog 
        reminder={selectedReminder} 
        open={showMarkDoneDialog} 
        onOpenChange={setShowMarkDoneDialog} 
      />
      {selectedCustomer && (
        <CustomerDetailDialog
          customer={selectedCustomer}
          open={showCustomerDetail}
          onOpenChange={setShowCustomerDetail}
          onDeleteCustomer={handleDeleteCustomer}
        />
      )}
    </>
  );
}
