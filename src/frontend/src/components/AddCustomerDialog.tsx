import { useState } from 'react';
import { useAddCustomer } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { normalizeIndianMobileToE164 } from '../lib/phoneNormalization';
import type { AMCDetails } from '../backend';
import { AMCType } from '../backend';

export default function AddCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serviceType, setServiceType] = useState('cleaning');
  const [otherServiceType, setOtherServiceType] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [serviceInterval, setServiceInterval] = useState('3');
  
  const [hasAMC, setHasAMC] = useState(false);
  const [amcType, setAmcType] = useState<string>('onlyService');
  const [amcDuration, setAmcDuration] = useState('1');
  const [amcStartDate, setAmcStartDate] = useState('');
  const [amcPaymentMethod, setAmcPaymentMethod] = useState<string>('cash');
  const [amcTotalAmount, setAmcTotalAmount] = useState('');
  const [amcNotes, setAmcNotes] = useState('');

  const addCustomer = useAddCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

        amcDetails = {
          id: BigInt(0),
          contractType: amcType as AMCType,
          durationYears: BigInt(durationYears),
          contractStartDate: startDateNanos,
          contractEndDate: endDateNanos,
          paymentMethod: getAMCPaymentMethodValue(amcPaymentMethod),
          totalAmount: BigInt(totalAmountInPaise),
          notes: amcNotes.trim(),
          remainingBalance: BigInt(totalAmountInPaise),
        };
      }

      await addCustomer.mutateAsync({
        name: name.trim(),
        contact: normalizedContact,
        serviceType: serviceTypeValue,
        installationDate: dateInNanos,
        serviceInterval: BigInt(serviceInterval),
        brand: brand.trim(),
        model: model.trim(),
        amcDetails,
      });

      toast.success('Customer added successfully!');
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to add customer');
      console.error(error);
    }
  };

  const resetForm = () => {
    setName('');
    setContact('');
    setBrand('');
    setModel('');
    setServiceType('cleaning');
    setOtherServiceType('');
    setInstallationDate('');
    setServiceInterval('3');
    setHasAMC(false);
    setAmcType('onlyService');
    setAmcDuration('1');
    setAmcStartDate('');
    setAmcPaymentMethod('cash');
    setAmcTotalAmount('');
    setAmcNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>Enter customer details to add them to your database</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact Number *</Label>
            <Input
              id="contact"
              placeholder="Enter 10-digit mobile number"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand">Device Brand</Label>
              <Input
                id="brand"
                placeholder="e.g., Samsung, LG"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Device Model</Label>
              <Input
                id="model"
                placeholder="e.g., Model XYZ-123"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type *</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
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
              <Label htmlFor="otherServiceType">Specify Service Type *</Label>
              <Input
                id="otherServiceType"
                placeholder="Enter custom service type"
                value={otherServiceType}
                onChange={(e) => setOtherServiceType(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="serviceInterval">Service Interval *</Label>
            <Select value={serviceInterval} onValueChange={setServiceInterval}>
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
            <Label htmlFor="installationDate">Installation Date *</Label>
            <Input
              id="installationDate"
              type="date"
              value={installationDate}
              onChange={(e) => setInstallationDate(e.target.value)}
              required
            />
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasAMC"
              checked={hasAMC}
              onCheckedChange={(checked) => setHasAMC(checked as boolean)}
            />
            <Label htmlFor="hasAMC" className="cursor-pointer font-semibold">
              Add AMC Contract
            </Label>
          </div>

          {hasAMC && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="amcType">AMC Contract Type *</Label>
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
                  <Label htmlFor="amcDuration">Contract Duration (Years) *</Label>
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
                  <Label htmlFor="amcStartDate">Contract Start Date *</Label>
                  <Input
                    id="amcStartDate"
                    type="date"
                    value={amcStartDate}
                    onChange={(e) => setAmcStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amcPaymentMethod">Payment Method *</Label>
                  <Select value={amcPaymentMethod} onValueChange={setAmcPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bankTransfer">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amcTotalAmount">Total Amount (₹) *</Label>
                  <Input
                    id="amcTotalAmount"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 5000"
                    value={amcTotalAmount}
                    onChange={(e) => setAmcTotalAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amcNotes">Contract Notes</Label>
                <Input
                  id="amcNotes"
                  placeholder="Additional contract details..."
                  value={amcNotes}
                  onChange={(e) => setAmcNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addCustomer.isPending}>
              {addCustomer.isPending ? 'Adding...' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
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

function getAMCPaymentMethodValue(method: string): any {
  switch (method) {
    case 'cash':
      return { cash: null };
    case 'bankTransfer':
      return { bankTransfer: null };
    case 'online':
      return { online: null };
    case 'cheque':
      return { cheque: null };
    default:
      return { cash: null };
  }
}
