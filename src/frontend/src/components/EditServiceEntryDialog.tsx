import { useState, useEffect } from 'react';
import { useUpdateServiceEntry } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { PaymentStatus, PaymentMethod, type ServiceEntry } from '../backend';

interface EditServiceEntryDialogProps {
  service: ServiceEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditServiceEntryDialog({ service, open, onOpenChange }: EditServiceEntryDialogProps) {
  const [serviceDate, setServiceDate] = useState('');
  const [serviceType, setServiceType] = useState<string>('cleaning');
  const [otherServiceType, setOtherServiceType] = useState('');
  const [amount, setAmount] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('cash');
  const [notes, setNotes] = useState('');
  const updateServiceEntry = useUpdateServiceEntry();

  useEffect(() => {
    if (service) {
      const date = new Date(Number(service.serviceDate / BigInt(1_000_000)));
      setServiceDate(date.toISOString().split('T')[0]);
      
      const type = getServiceTypeString(service.serviceType);
      setServiceType(type);
      if (type === 'other' && 'other' in service.serviceType) {
        setOtherServiceType(service.serviceType.other);
      }
      
      setAmount((Number(service.amount) / 100).toFixed(2));
      setIsFree(service.isFree);
      
      if (service.paymentStatus === PaymentStatus.paid) {
        setPaymentStatus('paid');
      } else if (service.paymentStatus === PaymentStatus.unpaid) {
        setPaymentStatus('unpaid');
      }
      
      if (service.paymentMethod === PaymentMethod.upi) {
        setPaymentMethod('upi');
      } else if (service.paymentMethod === PaymentMethod.cash) {
        setPaymentMethod('cash');
      }
      
      setNotes(service.notes);
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (serviceType === 'other' && !otherServiceType.trim()) {
      toast.error('Please specify the service type');
      return;
    }

    if (!isFree) {
      const amountNum = parseFloat(amount);
      if (!amount || isNaN(amountNum) || amountNum <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
    }

    try {
      const serviceTypeValue = getServiceTypeValue(serviceType, otherServiceType);
      const dateInNanos = BigInt(new Date(serviceDate).getTime()) * BigInt(1_000_000);
      const amountNum = isFree ? 0 : parseFloat(amount);
      const paymentStatusValue = isFree 
        ? PaymentStatus.free 
        : (paymentStatus === 'paid' ? PaymentStatus.paid : PaymentStatus.unpaid);
      const paymentMethodValue = (paymentStatus === 'paid' && !isFree)
        ? (paymentMethod === 'upi' ? PaymentMethod.upi : PaymentMethod.cash)
        : null;

      await updateServiceEntry.mutateAsync({
        serviceId: service.id,
        serviceDate: dateInNanos,
        serviceType: serviceTypeValue,
        amount: BigInt(Math.round(amountNum * 100)),
        paymentStatus: paymentStatusValue,
        paymentMethod: paymentMethodValue,
        notes: notes.trim(),
        isFree,
      });

      toast.success('Service entry updated! Reminder recalculated automatically.');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update service entry');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Entry</DialogTitle>
          <DialogDescription>Update service details. Reminder will be recalculated automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceDate">Service Date *</Label>
            <Input
              id="serviceDate"
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              required
            />
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
                placeholder="Enter service type"
                value={otherServiceType}
                onChange={(e) => setOtherServiceType(e.target.value)}
                required
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFree"
              checked={isFree}
              onCheckedChange={(checked) => setIsFree(checked as boolean)}
            />
            <Label htmlFor="isFree" className="font-normal cursor-pointer">
              Free Service (₹0)
            </Label>
          </div>

          {!isFree && (
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          )}

          {!isFree && (
            <>
              <div className="space-y-2">
                <Label>Payment Status *</Label>
                <RadioGroup value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as 'paid' | 'unpaid')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unpaid" id="unpaid" />
                    <Label htmlFor="unpaid" className="font-normal cursor-pointer">
                      Unpaid
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid" className="font-normal cursor-pointer">
                      Paid
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentStatus === 'paid' && (
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'upi' | 'cash')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="font-normal cursor-pointer">
                        UPI
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="font-normal cursor-pointer">
                        Cash
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateServiceEntry.isPending}>
              {updateServiceEntry.isPending ? 'Updating...' : 'Update Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getServiceTypeString(serviceType: any): string {
  if ('cleaning' in serviceType) return 'cleaning';
  if ('maintenance' in serviceType) return 'maintenance';
  if ('repair' in serviceType) return 'repair';
  if ('other' in serviceType) return 'other';
  return 'cleaning';
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
