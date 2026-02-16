import { useGetUpcomingServices, useGetUnpaidServices, useGetAllCustomers, useGetUpcomingReminders, useGetTodaysReminders, useGetWarrantyStatusCounts, useGetCustomersDueForService } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Calendar, AlertCircle, Shield, ShieldOff, Clock, Bell } from 'lucide-react';
import { formatDate, formatCurrency } from '../lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { CustomerFilter, ServiceFilter, ReminderFilter } from '../pages/Dashboard';

interface DashboardOverviewProps {
  onCustomerCardClick: (filter: CustomerFilter) => void;
  onServiceCardClick: (filter: ServiceFilter) => void;
  onReminderCardClick: (filter: ReminderFilter) => void;
}

export default function DashboardOverview({ onCustomerCardClick, onServiceCardClick, onReminderCardClick }: DashboardOverviewProps) {
  const { data: customers = [], isLoading: customersLoading } = useGetAllCustomers();
  const { data: upcomingServices = [], isLoading: upcomingLoading } = useGetUpcomingServices();
  const { data: unpaidServices = [], isLoading: unpaidLoading } = useGetUnpaidServices();
  const { data: upcomingReminders = [], isLoading: upcomingRemindersLoading } = useGetUpcomingReminders();
  const { data: todaysReminders = [], isLoading: todaysRemindersLoading } = useGetTodaysReminders();
  const { data: warrantyCounts, isLoading: warrantyLoading } = useGetWarrantyStatusCounts();
  const { data: customersDue = [], isLoading: customersDueLoading } = useGetCustomersDueForService();

  const totalUnpaid = unpaidServices.reduce((sum, service) => sum + Number(service.amount), 0);

  const isLoading = customersLoading || upcomingLoading || unpaidLoading || upcomingRemindersLoading || todaysRemindersLoading || warrantyLoading || customersDueLoading;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => onCustomerCardClick('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">Active customer accounts</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => onCustomerCardClick('inWarranty')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Warranty</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warrantyCounts ? Number(warrantyCounts.inWarranty) : 0}</div>
            <p className="text-xs text-muted-foreground">Customers under warranty</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => onCustomerCardClick('outWarranty')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Warranty</CardTitle>
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warrantyCounts ? Number(warrantyCounts.outWarranty) : 0}</div>
            <p className="text-xs text-muted-foreground">Customers without warranty</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => onCustomerCardClick('dueForService')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due for Service</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersDue.length}</div>
            <p className="text-xs text-muted-foreground">Due this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Services</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingServices.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for future dates</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => onServiceCardClick('unpaid')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Services</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidServices.length}</div>
            <p className="text-xs text-muted-foreground">Require payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalUnpaid)}</div>
            <p className="text-xs text-muted-foreground">Total unpaid balance</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => onReminderCardClick('today')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Reminders</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysReminders.length}</div>
            <p className="text-xs text-muted-foreground">Due today</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => onReminderCardClick('upcoming')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingReminders.length}</div>
            <p className="text-xs text-muted-foreground">Within 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Due for Service</CardTitle>
            <CardDescription>Customers with service due this month</CardDescription>
          </CardHeader>
          <CardContent>
            {customersDue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No customers due for service this month</p>
            ) : (
              <div className="space-y-4">
                {customersDue.slice(0, 5).map((customer) => (
                  <div key={customer.id.toString()} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(customer.nextServiceDate)} • Interval: {getServiceIntervalLabel(customer.serviceInterval)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{getServiceTypeLabel(customer.serviceType)}</Badge>
                      <Badge variant={customer.warrantyStatus === 'inWarranty' ? 'default' : 'secondary'}>
                        {customer.warrantyStatus === 'inWarranty' ? 'In Warranty' : 'Out of Warranty'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Services</CardTitle>
            <CardDescription>Services scheduled for future dates</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming services scheduled</p>
            ) : (
              <div className="space-y-4">
                {upcomingServices.slice(0, 5).map((customer) => (
                  <div key={customer.id.toString()} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(customer.nextServiceDate)} • Interval: {getServiceIntervalLabel(customer.serviceInterval)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{getServiceTypeLabel(customer.serviceType)}</Badge>
                      <Badge variant={customer.warrantyStatus === 'inWarranty' ? 'default' : 'secondary'}>
                        {customer.warrantyStatus === 'inWarranty' ? 'In Warranty' : 'Out of Warranty'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unpaid Services</CardTitle>
            <CardDescription>Services requiring payment</CardDescription>
          </CardHeader>
          <CardContent>
            {unpaidServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">All services are paid</p>
            ) : (
              <div className="space-y-4">
                {unpaidServices.slice(0, 5).map((service) => (
                  <div key={service.id.toString()} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Service #{service.id.toString()}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(service.serviceDate)}</p>
                    </div>
                    <Badge variant="destructive">{formatCurrency(Number(service.amount))}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getServiceTypeLabel(serviceType: any): string {
  if ('cleaning' in serviceType) return 'Cleaning';
  if ('maintenance' in serviceType) return 'Maintenance';
  if ('repair' in serviceType) return 'Repair';
  if ('other' in serviceType) return serviceType.other;
  return 'Unknown';
}

function getServiceIntervalLabel(interval: bigint): string {
  const months = Number(interval);
  return months === 1 ? '1 month' : `${months} months`;
}
