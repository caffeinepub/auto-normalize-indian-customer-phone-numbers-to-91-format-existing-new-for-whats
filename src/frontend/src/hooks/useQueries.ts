import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Customer, ServiceEntry, Reminder, ImportCustomerData, RevenueByPeriod, CustomerRevenueBreakdown, AMCDetails, AMCServiceEntry, AMCRevenue, PaymentMethodBreakdown } from '../backend';
import { PaymentStatus, PaymentMethod } from '../backend';

// Admin check query
export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: Infinity,
  });
}

// Customer queries
export function useGetAllCustomers() {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCustomer(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Customer | null>({
    queryKey: ['customer', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCustomer(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCustomersByWarrantyStatus(status: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['customers', 'warranty', status],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomersByWarrantyStatus(status as any);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      contact: string;
      serviceType: any;
      installationDate: bigint;
      serviceInterval: bigint;
      brand: string;
      model: string;
      amcDetails: AMCDetails | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCustomer(
        data.name,
        data.contact,
        data.serviceType,
        data.installationDate,
        data.serviceInterval,
        data.amcDetails,
        data.brand,
        data.model
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['todaysReminders'] });
      queryClient.invalidateQueries({ queryKey: ['warrantyStatusCounts'] });
      queryClient.invalidateQueries({ queryKey: ['customersDueForService'] });
      queryClient.invalidateQueries({ queryKey: ['amcRevenue'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingServices'] });
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      contact: string;
      serviceType: any;
      installationDate: bigint;
      serviceInterval: bigint;
      brand: string;
      model: string;
      amcDetails: AMCDetails | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCustomer(
        data.id,
        data.name,
        data.contact,
        data.serviceType,
        data.installationDate,
        data.serviceInterval,
        data.brand,
        data.model,
        data.amcDetails
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['todaysReminders'] });
      queryClient.invalidateQueries({ queryKey: ['warrantyStatusCounts'] });
      queryClient.invalidateQueries({ queryKey: ['customersDueForService'] });
      queryClient.invalidateQueries({ queryKey: ['amcRevenue'] });
      queryClient.invalidateQueries({ queryKey: ['amcServiceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingServices'] });
    },
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCustomer(customerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['todaysReminders'] });
      queryClient.invalidateQueries({ queryKey: ['warrantyStatusCounts'] });
      queryClient.invalidateQueries({ queryKey: ['customersDueForService'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['amcRevenue'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingServices'] });
    },
  });
}

export function useMultiDeleteCustomers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerIds: bigint[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.multiDeleteCustomers(customerIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['todaysReminders'] });
      queryClient.invalidateQueries({ queryKey: ['warrantyStatusCounts'] });
      queryClient.invalidateQueries({ queryKey: ['customersDueForService'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['amcRevenue'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingServices'] });
    },
  });
}

export function useImportCustomers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customersData: ImportCustomerData[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.importCustomers(customersData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['todaysReminders'] });
      queryClient.invalidateQueries({ queryKey: ['warrantyStatusCounts'] });
      queryClient.invalidateQueries({ queryKey: ['customersDueForService'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingServices'] });
    },
  });
}

// Service queries
export function useGetServiceHistory(customerId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<ServiceEntry[]>({
    queryKey: ['serviceHistory', customerId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getServiceHistory(customerId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllServices() {
  const { actor, isFetching } = useActor();

  return useQuery<ServiceEntry[]>({
    queryKey: ['services'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllServices();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUnpaidServices() {
  const { actor, isFetching } = useActor();

  return useQuery<ServiceEntry[]>({
    queryKey: ['unpaidServices'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUnpaidServices();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUpcomingServices() {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['upcomingServices'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingServices();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddServiceEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customerId: bigint;
      serviceDate: bigint;
      serviceType: any;
      amount: bigint;
      paymentStatus: any;
      paymentMethod: any;
      notes: string;
      isFree: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addServiceEntry(
        data.customerId,
        data.serviceDate,
        data.serviceType,
        data.amount,
        data.paymentStatus,
        data.paymentMethod,
        data.notes,
        data.isFree
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['unpaidServices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['todaysReminders'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['paymentBreakdown'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingServices'] });
    },
  });
}

export function useUpdateServiceEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      serviceId: bigint;
      serviceDate: bigint;
      serviceType: any;
      amount: bigint;
      paymentStatus: any;
      paymentMethod: any;
      notes: string;
      isFree: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateServiceEntry(
        data.serviceId,
        data.serviceDate,
        data.serviceType,
        data.amount,
        data.paymentStatus,
        data.paymentMethod,
        data.notes,
        data.isFree
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['unpaidServices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['todaysReminders'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['paymentBreakdown'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingServices'] });
    },
  });
}

export function useDeleteServiceEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteServiceEntry(serviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['unpaidServices'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['paymentBreakdown'] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      serviceId: bigint;
      status: any;
      paymentMethod: any;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePaymentStatus(data.serviceId, data.status, data.paymentMethod);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['unpaidServices'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['paymentBreakdown'] });
    },
  });
}

export function useMarkServiceAsDone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { customerId: bigint; serviceDoneDate: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markServiceAsDone(data.customerId, data.serviceDoneDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['todaysReminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingServices'] });
    },
  });
}

// Reminder queries
export function useGetAllReminders() {
  const { actor, isFetching } = useActor();

  return useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReminders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUpcomingReminders() {
  const { actor, isFetching } = useActor();

  return useQuery<Reminder[]>({
    queryKey: ['upcomingReminders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingReminders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTodaysReminders() {
  const { actor, isFetching } = useActor();

  return useQuery<Reminder[]>({
    queryKey: ['todaysReminders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodaysReminders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddReminder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customerId: bigint;
      reminderDate: bigint;
      description: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addReminder(data.customerId, data.reminderDate, data.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['todaysReminders'] });
    },
  });
}

export function useSetReminderSentStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { reminderId: bigint; status: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setReminderSentStatus(data.reminderId, data.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['todaysReminders'] });
    },
  });
}

// Dashboard queries
export function useGetWarrantyStatusCounts() {
  const { actor, isFetching } = useActor();

  return useQuery<{ inWarranty: bigint; outWarranty: bigint }>({
    queryKey: ['warrantyStatusCounts'],
    queryFn: async () => {
      if (!actor) return { inWarranty: BigInt(0), outWarranty: BigInt(0) };
      return actor.getWarrantyStatusCounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCustomersDueForService() {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['customersDueForService'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomersDueForServiceCurrentMonth();
    },
    enabled: !!actor && !isFetching,
  });
}

// Revenue queries
export function useGetRevenueByMonth(year: bigint, month: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<RevenueByPeriod>({
    queryKey: ['revenue', 'month', year.toString(), month.toString()],
    queryFn: async () => {
      if (!actor) return { totalRevenue: BigInt(0), paidServicesCount: BigInt(0), freeServicesCount: BigInt(0) };
      return actor.getRevenueByMonth(year, month);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRevenueByQuarter(year: bigint, quarter: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<RevenueByPeriod>({
    queryKey: ['revenue', 'quarter', year.toString(), quarter.toString()],
    queryFn: async () => {
      if (!actor) return { totalRevenue: BigInt(0), paidServicesCount: BigInt(0), freeServicesCount: BigInt(0) };
      return actor.getRevenueByQuarter(year, quarter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRevenueByYear(year: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<RevenueByPeriod>({
    queryKey: ['revenue', 'year', year.toString()],
    queryFn: async () => {
      if (!actor) return { totalRevenue: BigInt(0), paidServicesCount: BigInt(0), freeServicesCount: BigInt(0) };
      return actor.getRevenueByYear(year);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCustomerRevenueBreakdown() {
  const { actor, isFetching } = useActor();

  return useQuery<CustomerRevenueBreakdown[]>({
    queryKey: ['customerRevenueBreakdown'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomerRevenueBreakdown();
    },
    enabled: !!actor && !isFetching,
  });
}

// AMC queries
export function useGetAllAMCs() {
  const { actor, isFetching } = useActor();

  return useQuery<AMCDetails[]>({
    queryKey: ['amcs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAMCs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAMCRevenue() {
  const { actor, isFetching } = useActor();

  return useQuery<AMCRevenue>({
    queryKey: ['amcRevenue'],
    queryFn: async () => {
      if (!actor) return { totalAmount: BigInt(0), inProgressAmount: BigInt(0), completedAmount: BigInt(0), remainingBalance: BigInt(0) };
      return actor.getAMCRevenue();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAMCServiceHistory(customerId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<AMCServiceEntry[]>({
    queryKey: ['amcServiceHistory', customerId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAMCServiceHistory(customerId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddAMCServiceEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customerId: bigint;
      serviceDate: bigint;
      partsReplaced: string;
      notes: string;
      followUpNeeded: boolean;
      priceReduction: { partsName: string; regularPrice: string; discountPrice: string } | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAMCServiceEntry(
        data.customerId,
        data.serviceDate,
        data.partsReplaced,
        data.notes,
        data.followUpNeeded,
        data.priceReduction
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amcServiceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function useAddAmcForCustomers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customerIds: bigint[];
      contractType: any;
      amount: bigint;
      startDate: bigint;
      endDate: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAmcForCustomers(
        data.customerIds,
        data.contractType,
        data.amount,
        data.startDate,
        data.endDate
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
      queryClient.invalidateQueries({ queryKey: ['amcs'] });
      queryClient.invalidateQueries({ queryKey: ['amcRevenue'] });
    },
  });
}

// Payment method breakdown query
export function useGetPaymentMethodBreakdown() {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentMethodBreakdown>({
    queryKey: ['paymentBreakdown'],
    queryFn: async () => {
      if (!actor) return { upiPayments: BigInt(0), cashPayments: BigInt(0) };
      return actor.getPaymentMethodBreakdown();
    },
    enabled: !!actor && !isFetching,
  });
}

// Payment method breakdown by period
export function useGetPaymentMethodBreakdownByPeriod(
  periodMode: 'monthly' | 'quarterly' | 'yearly',
  year: bigint,
  monthOrQuarter?: bigint
) {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentMethodBreakdown>({
    queryKey: ['paymentBreakdown', periodMode, year.toString(), monthOrQuarter?.toString()],
    queryFn: async () => {
      if (!actor) return { upiPayments: BigInt(0), cashPayments: BigInt(0) };
      return actor.getPaymentMethodBreakdown();
    },
    enabled: !!actor && !isFetching,
  });
}
