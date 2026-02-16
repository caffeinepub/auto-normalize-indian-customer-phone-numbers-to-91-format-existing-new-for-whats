import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AMCContract {
    endDate: Time;
    owner: Principal;
    contractType: AMCType;
    amount: bigint;
    startDate: Time;
}
export interface RevenueByPeriod {
    paidServicesCount: bigint;
    totalRevenue: bigint;
    freeServicesCount: bigint;
}
export type ServiceType = {
    __kind__: "repair";
    repair: null;
} | {
    __kind__: "cleaning";
    cleaning: null;
} | {
    __kind__: "other";
    other: string;
} | {
    __kind__: "maintenance";
    maintenance: null;
};
export type Time = bigint;
export interface PaymentMethodBreakdown {
    cashPayments: bigint;
    upiPayments: bigint;
}
export interface ImportResult {
    errors: Array<string>;
    successCount: bigint;
    failureCount: bigint;
}
export interface Customer {
    id: bigint;
    amcServices: Array<AMCServiceEntry>;
    model: string;
    serviceType: ServiceType;
    contact: string;
    owner: Principal;
    nextServiceDate: Time;
    amcDetails?: AMCDetails;
    name: string;
    amcContracts: Array<AMCContract>;
    serviceInterval: bigint;
    brand: string;
    warrantyStatus: WarrantyStatus;
    installationDate: Time;
}
export interface CustomerRevenueBreakdown {
    customerName: string;
    contractType?: AMCType;
    paidServicesCount: bigint;
    amcRenewalCount: bigint;
    customerId: bigint;
    totalRevenue: bigint;
    freeServicesCount: bigint;
}
export interface Reminder {
    id: bigint;
    owner: Principal;
    sentStatus: boolean;
    description: string;
    reminderDate: Time;
    customerId: bigint;
}
export interface ImportCustomerData {
    model: string;
    serviceType: ServiceType;
    contact: string;
    name: string;
    serviceInterval: bigint;
    brand: string;
    installationDate: Time;
}
export interface AMCDetails {
    id: bigint;
    paymentMethod: PaymentMethod;
    durationYears: bigint;
    contractType: AMCType;
    contractEndDate: Time;
    remainingBalance: bigint;
    totalAmount: bigint;
    notes: string;
    contractStartDate: Time;
}
export interface ServiceEntry {
    id: bigint;
    serviceDate: Time;
    serviceType: ServiceType;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    owner: Principal;
    isFree: boolean;
    notes: string;
    customerId: bigint;
    amount: bigint;
}
export interface AMCServiceEntry {
    serviceDate: Time;
    followUpNeeded: boolean;
    contractType: AMCType;
    priceReduction?: {
        partsName: string;
        discountPrice: string;
        regularPrice: string;
    };
    amcServiceId: bigint;
    notes: string;
    partsReplaced: string;
    customerServiceId: bigint;
    contractStatus: ContractStatus;
}
export interface AMCRevenue {
    completedAmount: bigint;
    inProgressAmount: bigint;
    remainingBalance: bigint;
    totalAmount: bigint;
}
export enum AMCType {
    serviceWithParts50 = "serviceWithParts50",
    onlyService = "onlyService",
    serviceWithParts = "serviceWithParts"
}
export enum ContractStatus {
    active = "active",
    pendingRenewal = "pendingRenewal",
    expired = "expired"
}
export enum PaymentMethod {
    upi = "upi",
    cash = "cash"
}
export enum PaymentStatus {
    free = "free",
    paid = "paid",
    unpaid = "unpaid"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WarrantyStatus {
    outWarranty = "outWarranty",
    inWarranty = "inWarranty"
}
export interface backendInterface {
    addAMCServiceEntry(customerId: bigint, serviceDate: Time, partsReplaced: string, notes: string, followUpNeeded: boolean, priceReduction: {
        partsName: string;
        discountPrice: string;
        regularPrice: string;
    } | null): Promise<AMCServiceEntry>;
    addAmcForCustomers(customerIds: Array<bigint>, contractType: AMCType, amount: bigint, startDate: Time, endDate: Time): Promise<void>;
    addCustomer(name: string, contact: string, serviceType: ServiceType, installationDate: Time, serviceInterval: bigint, amcDetails: AMCDetails | null, brand: string, model: string): Promise<Customer>;
    addReminder(customerId: bigint, reminderDate: Time, description: string): Promise<Reminder>;
    addServiceEntry(customerId: bigint, serviceDate: Time, serviceType: ServiceType, amount: bigint, paymentStatus: PaymentStatus, paymentMethod: PaymentMethod | null, notes: string, isFree: boolean): Promise<ServiceEntry>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCustomer(customerId: bigint): Promise<void>;
    deleteServiceEntry(serviceId: bigint): Promise<void>;
    getAMCRevenue(): Promise<AMCRevenue>;
    getAMCServiceHistory(customerId: bigint): Promise<Array<AMCServiceEntry>>;
    getAllAMCs(): Promise<Array<AMCDetails>>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllReminders(): Promise<Array<Reminder>>;
    getAllServices(): Promise<Array<ServiceEntry>>;
    getAmcRenewalsByUser(userId: Principal): Promise<bigint>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(id: bigint): Promise<Customer | null>;
    getCustomerRevenueBreakdown(): Promise<Array<CustomerRevenueBreakdown>>;
    getCustomersByWarrantyStatus(status: WarrantyStatus): Promise<Array<Customer>>;
    getCustomersDueForServiceCurrentMonth(): Promise<Array<Customer>>;
    getPaymentMethodBreakdown(): Promise<PaymentMethodBreakdown>;
    getRevenueByMonth(year: bigint, month: bigint): Promise<RevenueByPeriod>;
    getRevenueByQuarter(year: bigint, quarter: bigint): Promise<RevenueByPeriod>;
    getRevenueByYear(year: bigint): Promise<RevenueByPeriod>;
    getServiceHistory(customerId: bigint): Promise<Array<ServiceEntry>>;
    getTodaysReminders(): Promise<Array<Reminder>>;
    getUnpaidServices(): Promise<Array<ServiceEntry>>;
    getUpcomingReminders(): Promise<Array<Reminder>>;
    getUpcomingServices(): Promise<Array<Customer>>;
    getWarrantyStatusCounts(): Promise<{
        outWarranty: bigint;
        inWarranty: bigint;
    }>;
    importCustomers(customersData: Array<ImportCustomerData>): Promise<ImportResult>;
    isCallerAdmin(): Promise<boolean>;
    markServiceAsDone(customerId: bigint, serviceDoneDate: Time): Promise<void>;
    multiDeleteCustomers(ids: Array<bigint>): Promise<void>;
    setReminderSentStatus(reminderId: bigint, status: boolean): Promise<void>;
    updateCustomer(id: bigint, name: string, contact: string, serviceType: ServiceType, installationDate: Time, serviceInterval: bigint, brand: string, model: string, amcDetails: AMCDetails | null): Promise<Customer>;
    updatePaymentStatus(serviceId: bigint, status: PaymentStatus, paymentMethod: PaymentMethod | null): Promise<ServiceEntry>;
    updateServiceEntry(serviceId: bigint, serviceDate: Time, serviceType: ServiceType, amount: bigint, paymentStatus: PaymentStatus, paymentMethod: PaymentMethod | null, notes: string, isFree: boolean): Promise<ServiceEntry>;
}
