import { useState, useEffect } from 'react';
import { useGetAllServices, useGetUnpaidServices, useGetAllCustomers, useUpdatePaymentStatus, useDeleteServiceEntry } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { X, Edit, Trash2 } from 'lucide-react';
import { formatDate, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { PaymentStatus, PaymentMethod } from '../backend';
import AddServiceEntryDialog from './AddServiceEntryDialog';
import EditServiceEntryDialog from './EditServiceEntryDialog';
import type { ServiceEntry } from '../backend';
import type { ServiceFilter } from '../pages/Dashboard';
import type { PrefilledServiceData } from '../pages/Dashboard';

interface ServicesTabProps {
  filter?: ServiceFilter;
  onClearFilter?: () => void;
  prefilledData?: PrefilledServiceData | null;
  onClearPrefilledData?: () => void;
}

export default function ServicesTab({ filter = 'all', onClearFilter, prefilledData, onClearPrefilledData }: ServicesTabProps) {
  const { data: allServices = [], isLoading: allLoading } = useGetAllServices();
  const { data: unpaidServicesData = [], isLoading: unpaidLoading } = useGetUnpaidServices();
  const { data: customers = [] } = useGetAllCustomers();
  const [localFilter, setLocalFilter] = useState<'all' | 'paid' | 'unpaid' | 'free'>('all');
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<bigint | null>(null);
  const [editingService, setEditingService] = useState<ServiceEntry | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceEntry | null>(null);
  const updatePayment = useUpdatePaymentStatus();
  const deleteService = useDeleteServiceEntry();

  useEffect(() => {
    if (prefilledData) {
      setSelectedCustomerId(prefilledData.customerId);
      setShowAddServiceDialog(true);
    }
  }, [prefilledData]);

  const handleDialogClose = (open: boolean) => {
    setShowAddServiceDialog(open);
    if (!open) {
      setSelectedCustomerId(null);
      if (onClearPrefilledData) {
        onClearPrefilledData();
      }
    }
  };

  const handleDeleteService = async () => {
    if (!deletingService) return;

    try {
      await deleteService.mutateAsync(deletingService.id);
      toast.success('Service entry deleted successfully');
      setDeletingService(null);
    } catch (error) {
      toast.error('Failed to delete service entry');
      console.error(error);
    }
  };

  let services: ServiceEntry[] = allServices;
  let isLoading = allLoading;

  if (filter === 'unpaid') {
    services = unpaidServicesData;
    isLoading = unpaidLoading;
  }

  const filteredServices = filter === 'all' ? services.filter((service) => {
    if (localFilter === 'all') return true;
    if (localFilter === 'paid') return service.paymentStatus === PaymentStatus.paid;
    if (localFilter === 'unpaid') return service.paymentStatus === PaymentStatus.unpaid;
    if (localFilter === 'free') return service.paymentStatus === PaymentStatus.free;
    return true;
  }) : services;

  const getCustomerName = (customerId: bigint) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || 'Unknown';
  };

  const handleMarkAsPaid = async (service: ServiceEntry) => {
    try {
      await updatePayment.mutateAsync({
        serviceId: service.id,
        status: PaymentStatus.paid,
        paymentMethod: PaymentMethod.cash,
      });
      toast.success('Payment status updated');
    } catch (error) {
      toast.error('Failed to update payment status');
      console.error(error);
    }
  };

  const getFilterLabel = () => {
    if (filter === 'unpaid') return 'Unpaid Services';
    return null;
  };

  const filterLabel = getFilterLabel();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
          <CardDescription>All recorded services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service History</CardTitle>
              <CardDescription>All recorded services across customers</CardDescription>
            </div>
            {filter === 'all' && (
              <Select value={localFilter} onValueChange={(v) => setLocalFilter(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="paid">Paid Only</SelectItem>
                  <SelectItem value="unpaid">Unpaid Only</SelectItem>
                  <SelectItem value="free">Free Only</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {prefilledData && (
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
              <AlertDescription className="flex items-center justify-between">
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Adding service for: {prefilledData.customerName}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    if (onClearPrefilledData) {
                      onClearPrefilledData();
                    }
                  }}
                  className="h-auto py-1 px-2 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices
                    .sort((a, b) => Number(b.serviceDate - a.serviceDate))
                    .map((service) => (
                      <TableRow key={service.id.toString()}>
                        <TableCell className="font-medium">{getCustomerName(service.customerId)}</TableCell>
                        <TableCell>{getServiceTypeLabel(service.serviceType)}</TableCell>
                        <TableCell>{formatDate(service.serviceDate)}</TableCell>
                        <TableCell>{formatCurrency(Number(service.amount))}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              service.paymentStatus === PaymentStatus.paid 
                                ? 'default' 
                                : service.paymentStatus === PaymentStatus.free
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {service.paymentStatus === PaymentStatus.paid 
                              ? 'Paid' 
                              : service.paymentStatus === PaymentStatus.free
                              ? 'Free'
                              : 'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {service.paymentMethod ? getPaymentMethodLabel(service.paymentMethod) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingService(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingService(service)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            {service.paymentStatus === PaymentStatus.unpaid && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPaid(service)}
                                disabled={updatePayment.isPending}
                              >
                                Mark as Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCustomerId && (
        <AddServiceEntryDialog
          customerId={selectedCustomerId}
          open={showAddServiceDialog}
          onOpenChange={handleDialogClose}
        />
      )}

      {editingService && (
        <EditServiceEntryDialog
          service={editingService}
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
        />
      )}

      <AlertDialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function getServiceTypeLabel(serviceType: any): string {
  if ('cleaning' in serviceType) return 'Cleaning';
  if ('maintenance' in serviceType) return 'Maintenance';
  if ('repair' in serviceType) return 'Repair';
  if ('other' in serviceType) return serviceType.other;
  return 'Unknown';
}

function getPaymentMethodLabel(method: PaymentMethod): string {
  return method === PaymentMethod.upi ? 'UPI' : method === PaymentMethod.cash ? 'Cash' : 'Unknown';
}
