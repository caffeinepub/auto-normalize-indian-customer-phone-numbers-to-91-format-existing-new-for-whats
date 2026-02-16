import { useState } from 'react';
import { useGetServiceHistory, useUpdateCustomer, useIsAdmin, useGetAMCServiceHistory } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { formatDate, formatCurrency } from '../lib/utils';
import { Edit2, Save, X, Trash2 } from 'lucide-react';
import AddServiceEntryDialog from './AddServiceEntryDialog';
import AddAMCServiceEntryDialog from './AddAMCServiceEntryDialog';
import AMCBadge from './AMCBadge';
import { normalizeIndianMobileToE164 } from '../lib/phoneNormalization';
import { getAMCTypeInfo, getContractStatusInfo } from '../lib/amc';
import type { Customer, PaymentStatus, AMCDetails } from '../backend';
import { AMCType, PaymentMethod } from '../backend';

interface CustomerDetailDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteCustomer: (customer: Customer) => void;
}

export default function CustomerDetailDialog({ customer, open, onOpenChange, onDeleteCustomer }: CustomerDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [contact, setContact] = useState(customer.contact);
  const [brand, setBrand] = useState(customer.brand);
  const [model, setModel] = useState(customer.model);
  const [serviceType, setServiceType] = useState(getServiceTypeString(customer.serviceType));
  const [otherServiceType, setOtherServiceType] = useState(getOtherServiceType(customer.serviceType));
  const [installationDate, setInstallationDate] = useState(formatDateForInput(customer.installationDate));
  const [serviceInterval, setServiceInterval] = useState<string>(customer.serviceInterval.toString());
  const [showAddService, setShowAddService] = useState(false);
  const [showAddAMCService, setShowAddAMCService] = useState(false);

  const [hasAMC, setHasAMC] = useState(!!customer.amcDetails);
  const [amcType, setAmcType] = useState<string>(customer.amcDetails?.contractType || 'onlyService');
  const [amcDuration, setAmcDuration] = useState(customer.amcDetails?.durationYears.toString() || '1');
  const [amcStartDate, setAmcStartDate] = useState(customer.amcDetails ? formatDateForInput(customer.amcDetails.contractStartDate) : '');
  const [amcPaymentMethod, setAmcPaymentMethod] = useState<string>(customer.amcDetails?.paymentMethod || 'cash');
  const [amcTotalAmount, setAmcTotalAmount] = useState(customer.amcDetails ? (Number(customer.amcDetails.totalAmount) / 100).toString() : '');
  const [amcNotes, setAmcNotes] = useState(customer.amcDetails?.notes || '');

  const { data: serviceHistory = [], isLoading: historyLoading } = useGetServiceHistory(customer.id);
  const { data: amcServiceHistory = [], isLoading: amcHistoryLoading } = useGetAMCServiceHistory(customer.id);
  const { data: isAdmin = false } = useIsAdmin();
  const updateCustomer = useUpdateCustomer();

  const handleUpdate = async () => {
    if (!name.trim() || !contact.trim() || !installationDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (hasAMC && (!amcStartDate || !amcTotalAmount)) {
      toast.error('Please fill in all AMC contract fields');
      return;
    }

    try {
      const serviceTypeValue = getServiceTypeValue(serviceType, otherServiceType);
      const dateInNanos = BigInt(new Date(installationDate).getTime()) * BigInt(1_000_000);
      
      const normalizedContact = normalizeIndianMobileToE164(contact.trim());

      let amcDetails: AMCDetails | null = null;
      if (hasAMC) {
        const startDateNanos = BigInt(new Date(amcStartDate).getTime()) * BigInt(1_000_000);
        const durationYears = parseInt(amcDuration);
        const endDate = new Date(amcStartDate);
        endDate.setFullYear(endDate.getFullYear() + durationYears);
        const endDateNanos = BigInt(endDate.getTime()) * BigInt(1_000_000);
        
        const totalAmountInPaise = Math.round(parseFloat(amcTotalAmount) * 100);
        const existingPaid = customer.amcDetails ? Number(customer.amcDetails.totalAmount - customer.amcDetails.remainingBalance) : 0;
        const newRemaining = Math.max(0, totalAmountInPaise - existingPaid);

        amcDetails = {
          id: customer.amcDetails?.id || BigInt(0),
          contractType: amcType as AMCType,
          durationYears: BigInt(durationYears),
          contractStartDate: startDateNanos,
          contractEndDate: endDateNanos,
          paymentMethod: amcPaymentMethod as PaymentMethod,
          totalAmount: BigInt(totalAmountInPaise),
          notes: amcNotes.trim(),
          remainingBalance: BigInt(newRemaining),
        };
      }

      await updateCustomer.mutateAsync({
        id: customer.id,
        name: name.trim(),
        contact: normalizedContact,
        serviceType: serviceTypeValue,
        installationDate: dateInNanos,
        serviceInterval: BigInt(serviceInterval),
        brand: brand.trim(),
        model: model.trim(),
        amcDetails,
      });

      toast.success('Customer updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      if (error.message?.includes('Unauthorized') || error.message?.includes('Only admins')) {
        toast.error('Only admin users can edit customers');
      } else {
        toast.error('Failed to update customer');
      }
      console.error(error);
    }
  };

  const handleCancel = () => {
    setName(customer.name);
    setContact(customer.contact);
    setBrand(customer.brand);
    setModel(customer.model);
    setServiceType(getServiceTypeString(customer.serviceType));
    setOtherServiceType(getOtherServiceType(customer.serviceType));
    setInstallationDate(formatDateForInput(customer.installationDate));
    setServiceInterval(customer.serviceInterval.toString());
    setHasAMC(!!customer.amcDetails);
    setAmcType(customer.amcDetails?.contractType || 'onlyService');
    setAmcDuration(customer.amcDetails?.durationYears.toString() || '1');
    setAmcStartDate(customer.amcDetails ? formatDateForInput(customer.amcDetails.contractStartDate) : '');
    setAmcPaymentMethod(customer.amcDetails?.paymentMethod || 'cash');
    setAmcTotalAmount(customer.amcDetails ? (Number(customer.amcDetails.totalAmount) / 100).toString() : '');
    setAmcNotes(customer.amcDetails?.notes || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDeleteCustomer(customer);
    onOpenChange(false);
  };

  const totalPaid = serviceHistory
    .filter((s) => isPaymentStatusPaid(s.paymentStatus))
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const totalUnpaid = serviceHistory
    .filter((s) => isPaymentStatusUnpaid(s.paymentStatus))
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const amcPartsReplacementCount = amcServiceHistory.filter(s => s.partsReplaced.trim().length > 0).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <DialogTitle>{customer.name}</DialogTitle>
                  <DialogDescription>Customer details and service history</DialogDescription>
                </div>
                {customer.amcDetails && <AMCBadge type={customer.amcDetails.contractType} />}
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDelete}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleUpdate} disabled={updateCustomer.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {updateCustomer.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">Service History</TabsTrigger>
              <TabsTrigger value="amc">AMC</TabsTrigger>
              <TabsTrigger value="amcHistory">AMC Services</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-contact">Contact</Label>
                  <Input
                    id="edit-contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Device Brand</Label>
                    <Input
                      id="edit-brand"
                      placeholder="e.g., Samsung, LG"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-model">Device Model</Label>
                    <Input
                      id="edit-model"
                      placeholder="e.g., Model XYZ-123"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-serviceType">Service Type</Label>
                  <Select value={serviceType} onValueChange={setServiceType} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {serviceType === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-otherServiceType">Specify Service Type</Label>
                    <Input
                      id="edit-otherServiceType"
                      value={otherServiceType}
                      onChange={(e) => setOtherServiceType(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Warranty Status (Auto-calculated)</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={customer.warrantyStatus === 'inWarranty' ? 'default' : 'secondary'}>
                      {customer.warrantyStatus === 'inWarranty' ? 'In Warranty' : 'Out of Warranty'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-serviceInterval">Service Interval</Label>
                  <Select value={serviceInterval} onValueChange={setServiceInterval} disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Every 1 month</SelectItem>
                      <SelectItem value="3">Every 3 months</SelectItem>
                      <SelectItem value="6">Every 6 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-installationDate">Installation Date</Label>
                  <Input
                    id="edit-installationDate"
                    type="date"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Next Service Date (Auto-calculated)</Label>
                  <p className="text-sm font-medium">{formatDate(customer.nextServiceDate)}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Service History</h3>
                  <p className="text-sm text-muted-foreground">
                    {serviceHistory.length} service{serviceHistory.length !== 1 ? 's' : ''} recorded
                  </p>
                </div>
                <Button onClick={() => setShowAddService(true)} size="sm">
                  Add Service
                </Button>
              </div>

              <Separator />

              {historyLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading service history...</p>
              ) : serviceHistory.length === 0 ? (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">No service history available</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(totalPaid)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Unpaid</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {formatCurrency(totalUnpaid)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    {serviceHistory
                      .sort((a, b) => Number(b.serviceDate - a.serviceDate))
                      .map((service) => (
                        <Card key={service.id.toString()}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{getServiceTypeDisplay(service.serviceType)}</p>
                                  <Badge variant={getPaymentStatusVariant(service.paymentStatus)}>
                                    {getPaymentStatusDisplay(service.paymentStatus)}
                                  </Badge>
                                  {service.isFree && (
                                    <Badge variant="secondary">Free Service</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(service.serviceDate)}
                                </p>
                                {service.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">{service.notes}</p>
                                )}
                                {service.paymentMethod && (
                                  <p className="text-sm text-muted-foreground">
                                    Payment: {getPaymentMethodDisplay(service.paymentMethod)}
                                  </p>
                                )}
                              </div>
                              <p className="text-lg font-semibold">{formatCurrency(Number(service.amount))}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="amc" className="space-y-4">
              {isEditing && (
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="edit-hasAMC"
                    checked={hasAMC}
                    onCheckedChange={(checked) => setHasAMC(checked as boolean)}
                  />
                  <Label htmlFor="edit-hasAMC" className="cursor-pointer font-semibold">
                    Has AMC Contract
                  </Label>
                </div>
              )}

              {!hasAMC && !customer.amcDetails ? (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">No AMC contract for this customer</p>
                  </CardContent>
                </Card>
              ) : hasAMC || customer.amcDetails ? (
                <>
                  {!isEditing && customer.amcDetails && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Contract Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <AMCBadge type={customer.amcDetails.contractType} />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{formatCurrency(Number(customer.amcDetails.totalAmount) / 100)}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(Number(customer.amcDetails.remainingBalance) / 100)}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Duration</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-semibold">{Number(customer.amcDetails.durationYears)} Year{Number(customer.amcDetails.durationYears) !== 1 ? 's' : ''}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Start Date</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium">{formatDate(customer.amcDetails.contractStartDate)}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">End Date</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium">{formatDate(customer.amcDetails.contractEndDate)}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium">{getPaymentMethodDisplay(customer.amcDetails.paymentMethod)}</p>
                        </CardContent>
                      </Card>

                      {customer.amcDetails.notes && (
                        <Card className="md:col-span-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Notes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">{customer.amcDetails.notes}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Label htmlFor="edit-amcType">AMC Contract Type *</Label>
                        <Select value={amcType} onValueChange={setAmcType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="onlyService">Only Service (Black)</SelectItem>
                            <SelectItem value="serviceWithParts">Service with Parts (Gold)</SelectItem>
                            <SelectItem value="serviceWithParts50">Service with Parts @50% (Silver)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="edit-amcDuration">Contract Duration (Years) *</Label>
                          <Select value={amcDuration} onValueChange={setAmcDuration}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Year</SelectItem>
                              <SelectItem value="2">2 Years</SelectItem>
                              <SelectItem value="3">3 Years</SelectItem>
                              <SelectItem value="5">5 Years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-amcStartDate">Contract Start Date *</Label>
                          <Input
                            id="edit-amcStartDate"
                            type="date"
                            value={amcStartDate}
                            onChange={(e) => setAmcStartDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="edit-amcPaymentMethod">Payment Method *</Label>
                          <Select value={amcPaymentMethod} onValueChange={setAmcPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-amcTotalAmount">Total Amount (₹) *</Label>
                          <Input
                            id="edit-amcTotalAmount"
                            type="number"
                            step="0.01"
                            placeholder="e.g., 5000"
                            value={amcTotalAmount}
                            onChange={(e) => setAmcTotalAmount(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-amcNotes">Contract Notes</Label>
                        <Input
                          id="edit-amcNotes"
                          placeholder="Additional contract details..."
                          value={amcNotes}
                          onChange={(e) => setAmcNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="amcHistory" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">AMC Service History</h3>
                  <p className="text-sm text-muted-foreground">
                    {amcServiceHistory.length} AMC service{amcServiceHistory.length !== 1 ? 's' : ''} recorded
                  </p>
                </div>
                {customer.amcDetails && (
                  <Button onClick={() => setShowAddAMCService(true)} size="sm">
                    Add AMC Service
                  </Button>
                )}
              </div>

              <Separator />

              {amcHistoryLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading AMC service history...</p>
              ) : amcServiceHistory.length === 0 ? (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">No AMC service history available</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{amcServiceHistory.length}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Parts Replaced</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{amcPartsReplacementCount}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Follow-ups Needed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {amcServiceHistory.filter(s => s.followUpNeeded).length}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    {amcServiceHistory
                      .sort((a, b) => Number(b.serviceDate - a.serviceDate))
                      .map((service) => {
                        const statusInfo = getContractStatusInfo(service.contractStatus);
                        return (
                          <Card key={service.amcServiceId.toString()}>
                            <CardContent className="pt-6">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">AMC Service #{Number(service.amcServiceId)}</p>
                                      <Badge variant={statusInfo.variant}>
                                        {statusInfo.label}
                                      </Badge>
                                      {service.followUpNeeded && (
                                        <Badge variant="destructive">Follow-up Needed</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(service.serviceDate)}
                                    </p>
                                  </div>
                                  <AMCBadge type={service.contractType} />
                                </div>

                                {service.partsReplaced && (
                                  <div>
                                    <p className="text-sm font-medium">Parts Replaced:</p>
                                    <p className="text-sm text-muted-foreground">{service.partsReplaced}</p>
                                  </div>
                                )}

                                {service.priceReduction && (
                                  <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-1">Price Reduction Applied</p>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                      <p>Part: {service.priceReduction.partsName}</p>
                                      <p>Regular Price: {service.priceReduction.regularPrice}</p>
                                      <p>Discount Price: {service.priceReduction.discountPrice}</p>
                                    </div>
                                  </div>
                                )}

                                {service.notes && (
                                  <div>
                                    <p className="text-sm font-medium">Notes:</p>
                                    <p className="text-sm text-muted-foreground">{service.notes}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showAddService && (
        <AddServiceEntryDialog
          customerId={customer.id}
          open={showAddService}
          onOpenChange={setShowAddService}
        />
      )}

      {showAddAMCService && (
        <AddAMCServiceEntryDialog
          customerId={customer.id}
          open={showAddAMCService}
          onOpenChange={setShowAddAMCService}
        />
      )}
    </>
  );
}

function getServiceTypeString(serviceType: any): string {
  if ('cleaning' in serviceType) return 'cleaning';
  if ('maintenance' in serviceType) return 'maintenance';
  if ('repair' in serviceType) return 'repair';
  if ('other' in serviceType) return 'other';
  return 'cleaning';
}

function getOtherServiceType(serviceType: any): string {
  if ('other' in serviceType) return serviceType.other;
  return '';
}

function getServiceTypeValue(type: string, otherValue: string): any {
  switch (type) {
    case 'cleaning':
      return { cleaning: null };
    case 'maintenance':
      return { maintenance: null };
    case 'repair':
      return { repair: null };
    case 'other':
      return { other: otherValue };
    default:
      return { cleaning: null };
  }
}

function getServiceTypeDisplay(serviceType: any): string {
  if ('cleaning' in serviceType) return 'Cleaning';
  if ('maintenance' in serviceType) return 'Maintenance';
  if ('repair' in serviceType) return 'Repair';
  if ('other' in serviceType) return serviceType.other;
  return 'Unknown';
}

function getPaymentStatusDisplay(status: PaymentStatus): string {
  const statusStr = status as any;
  if (statusStr === 'paid' || statusStr.__kind__ === 'paid') return 'Paid';
  if (statusStr === 'unpaid' || statusStr.__kind__ === 'unpaid') return 'Unpaid';
  if (statusStr === 'free' || statusStr.__kind__ === 'free') return 'Free';
  return 'Unknown';
}

function getPaymentStatusVariant(status: PaymentStatus): 'default' | 'secondary' | 'destructive' {
  const statusStr = status as any;
  if (statusStr === 'paid' || statusStr.__kind__ === 'paid') return 'default';
  if (statusStr === 'unpaid' || statusStr.__kind__ === 'unpaid') return 'destructive';
  if (statusStr === 'free' || statusStr.__kind__ === 'free') return 'secondary';
  return 'secondary';
}

function getPaymentMethodDisplay(method: any): string {
  if (!method) return 'Not specified';
  const methodStr = method as any;
  if (methodStr === 'upi' || methodStr.__kind__ === 'upi') return 'UPI';
  if (methodStr === 'cash' || methodStr.__kind__ === 'cash') return 'Cash';
  return 'Unknown';
}

function isPaymentStatusPaid(status: PaymentStatus): boolean {
  const statusStr = status as any;
  return statusStr === 'paid' || statusStr.__kind__ === 'paid';
}

function isPaymentStatusUnpaid(status: PaymentStatus): boolean {
  const statusStr = status as any;
  return statusStr === 'unpaid' || statusStr.__kind__ === 'unpaid';
}

function formatDateForInput(nanos: bigint): string {
  const date = new Date(Number(nanos) / 1_000_000);
  return date.toISOString().split('T')[0];
}
