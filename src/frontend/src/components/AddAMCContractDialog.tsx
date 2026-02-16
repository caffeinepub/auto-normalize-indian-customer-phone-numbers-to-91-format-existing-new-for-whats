import { useState, useEffect } from 'react';
import { useGetAllCustomers, useAddAMC } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AMCType } from '../backend';

interface AddAMCContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCustomerId?: bigint;
}

export default function AddAMCContractDialog({ open, onOpenChange, preselectedCustomerId }: AddAMCContractDialogProps) {
  const { data: customers = [] } = useGetAllCustomers();
  const addAMC = useAddAMC();

  const [customerId, setCustomerId] = useState<string>('');
  const [planType, setPlanType] = useState<string>('onlyService');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (preselectedCustomerId) {
      setCustomerId(preselectedCustomerId.toString());
    }
  }, [preselectedCustomerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || !planType || !amount || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      const startDateNanos = BigInt(start.getTime()) * BigInt(1_000_000);
      const endDateNanos = BigInt(end.getTime()) * BigInt(1_000_000);
      const amountInPaise = BigInt(Math.round(amountNum * 100));

      await addAMC.mutateAsync({
        customerId: BigInt(customerId),
        contractType: planType as AMCType,
        amount: amountInPaise,
        startDate: startDateNanos,
        endDate: endDateNanos,
      });

      toast.success('AMC contract added successfully!');
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes('Unauthorized')) {
        toast.error('You are not authorized to add AMC contracts for this customer');
      } else {
        toast.error('Failed to add AMC contract');
      }
      console.error(error);
    }
  };

  const resetForm = () => {
    if (!preselectedCustomerId) {
      setCustomerId('');
    }
    setPlanType('onlyService');
    setAmount('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add AMC Contract</DialogTitle>
          <DialogDescription>Create a new AMC contract for a customer</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select 
              value={customerId} 
              onValueChange={setCustomerId}
              disabled={!!preselectedCustomerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id.toString()} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="planType">Plan Type *</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onlyService">Only Service</SelectItem>
                <SelectItem value="serviceWithParts">Service with Parts</SelectItem>
                <SelectItem value="serviceWithParts50">Service with Parts @50%</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addAMC.isPending}>
              {addAMC.isPending ? 'Adding...' : 'Add AMC'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
