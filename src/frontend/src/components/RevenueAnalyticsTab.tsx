import { useState } from 'react';
import { useGetRevenueByMonth, useGetRevenueByQuarter, useGetRevenueByYear, useGetCustomerRevenueBreakdown, useGetAMCRevenue, useGetPaymentMethodBreakdownByPeriod } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../lib/utils';
import { getCurrentFYQuarter, getFYQuarterLabel, FY_QUARTERS } from '../lib/fyQuarter';
import { getAMCTypeInfo } from '../lib/amc';
import { TrendingUp, Users, Gift, Wallet, CreditCard, Banknote } from 'lucide-react';

type PeriodMode = 'monthly' | 'quarterly' | 'yearly';

export default function RevenueAnalyticsTab() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = getCurrentFYQuarter();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);

  const [paymentPeriodMode, setPaymentPeriodMode] = useState<PeriodMode>('yearly');
  const [paymentYear, setPaymentYear] = useState(currentYear);
  const [paymentMonth, setPaymentMonth] = useState(currentMonth);
  const [paymentQuarter, setPaymentQuarter] = useState(currentQuarter);

  const { data: monthlyRevenue, isLoading: monthlyLoading } = useGetRevenueByMonth(BigInt(selectedYear), BigInt(selectedMonth));
  const { data: quarterlyRevenue, isLoading: quarterlyLoading } = useGetRevenueByQuarter(BigInt(selectedYear), BigInt(selectedQuarter));
  const { data: yearlyRevenue, isLoading: yearlyLoading } = useGetRevenueByYear(BigInt(selectedYear));
  const { data: customerBreakdown = [], isLoading: breakdownLoading } = useGetCustomerRevenueBreakdown();
  const { data: amcRevenue, isLoading: amcLoading } = useGetAMCRevenue();
  
  const { data: paymentBreakdown, isLoading: paymentLoading } = useGetPaymentMethodBreakdownByPeriod(
    paymentPeriodMode,
    BigInt(paymentYear),
    paymentPeriodMode === 'monthly' ? BigInt(paymentMonth) : paymentPeriodMode === 'quarterly' ? BigInt(paymentQuarter) : undefined
  );

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  if (monthlyLoading || quarterlyLoading || yearlyLoading || breakdownLoading || amcLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="amc">AMC Revenue</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="customers">Customer Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <div className="text-2xl font-bold">
                    {formatCurrency(Number(monthlyRevenue?.totalRevenue || 0))}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Services:</span>
                    <span className="font-medium">{Number(monthlyRevenue?.paidServicesCount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Free Services:</span>
                    <span className="font-medium">{Number(monthlyRevenue?.freeServicesCount || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Quarterly Revenue (FY)</CardTitle>
                  <Select value={selectedQuarter.toString()} onValueChange={(v) => setSelectedQuarter(parseInt(v))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FY_QUARTERS.map((q) => (
                        <SelectItem key={q.quarter} value={q.quarter.toString()}>
                          {q.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div className="text-2xl font-bold">
                    {formatCurrency(Number(quarterlyRevenue?.totalRevenue || 0))}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Services:</span>
                    <span className="font-medium">{Number(quarterlyRevenue?.paidServicesCount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Free Services:</span>
                    <span className="font-medium">{Number(quarterlyRevenue?.freeServicesCount || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Yearly Revenue</CardTitle>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div className="text-2xl font-bold">
                    {formatCurrency(Number(yearlyRevenue?.totalRevenue || 0))}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Services:</span>
                    <span className="font-medium">{Number(yearlyRevenue?.paidServicesCount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Free Services:</span>
                    <span className="font-medium">{Number(yearlyRevenue?.freeServicesCount || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="amc" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total AMC Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(Number(amcRevenue?.totalAmount || 0))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All AMC contracts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(Number(amcRevenue?.inProgressAmount || 0))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Active contracts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(Number(amcRevenue?.completedAmount || 0))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Expired contracts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(Number(amcRevenue?.remainingBalance || 0))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Unpaid amount</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Method Breakdown</CardTitle>
                  <CardDescription>Revenue distribution by payment method</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Tabs value={paymentPeriodMode} onValueChange={(v) => setPaymentPeriodMode(v as PeriodMode)}>
                    <TabsList>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                      <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                      <TabsTrigger value="yearly">Yearly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Select value={paymentYear.toString()} onValueChange={(v) => setPaymentYear(parseInt(v))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {paymentPeriodMode === 'monthly' && (
                  <Select value={paymentMonth.toString()} onValueChange={(v) => setPaymentMonth(parseInt(v))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {paymentPeriodMode === 'quarterly' && (
                  <Select value={paymentQuarter.toString()} onValueChange={(v) => setPaymentQuarter(parseInt(v))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FY_QUARTERS.map((q) => (
                        <SelectItem key={q.quarter} value={q.quarter.toString()}>
                          {q.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {paymentLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">UPI</p>
                        <p className="text-sm text-muted-foreground">Digital payments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(Number(paymentBreakdown?.upiPayments || 0))}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Cash</p>
                        <p className="text-sm text-muted-foreground">Cash payments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(Number(paymentBreakdown?.cashPayments || 0))}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Revenue Breakdown</CardTitle>
              <CardDescription>Revenue contribution by customer (last 12 months)</CardDescription>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : customerBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No revenue data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-center">Paid Services</TableHead>
                        <TableHead className="text-center">Free Services</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-center">AMC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerBreakdown
                        .sort((a, b) => Number(b.totalRevenue - a.totalRevenue))
                        .map((customer) => {
                          const amcInfo = customer.contractType ? getAMCTypeInfo(customer.contractType) : null;
                          return (
                            <TableRow key={customer.customerId.toString()}>
                              <TableCell className="font-medium">{customer.customerName}</TableCell>
                              <TableCell className="text-center">{Number(customer.paidServicesCount)}</TableCell>
                              <TableCell className="text-center">{Number(customer.freeServicesCount)}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(Number(customer.totalRevenue))}
                              </TableCell>
                              <TableCell className="text-center">
                                {amcInfo ? (
                                  <Badge variant="outline">
                                    {amcInfo.label}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
