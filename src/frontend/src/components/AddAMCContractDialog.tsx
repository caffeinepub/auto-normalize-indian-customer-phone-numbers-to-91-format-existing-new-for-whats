import { useState, useEffect, useMemo } from 'react';
import { useGetAllCustomers, useAddAmcForCustomers } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AMCType } from '../backend';
import { X } from 'lucide-react';

interface AddAMCContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCustomerId?: bigint;
}

export default function AddAMCContractDialog({ open, onOpenChange, preselectedCustomerId }: AddAMCContractDialogProps) {
  const { data: customers = [] } = useGetAllCustomers();
  const addAMC = useAddAmcForCustomers();

  const [selectedCustomerIds, setSelectedCustomerIds] = useState<bigint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [planType, setPlanType] = useState<string>('onlyService');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initialize with preselected customer
  useEffect(() => {
    if (preselectedCustomerId && open) {
      setSelectedCustomerIds((prev) => {
        if (!prev.some(id => id === preselectedCustomerId)) {
          return [...prev, preselectedCustomerId];
        }
        return prev;
      });
    }
  }, [preselectedCustomerId, open]);

  // Filter customers based on search query with null-safe string operations
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase();
    return customers.filter((customer) => {
      try {
        // Safely handle potentially missing or non-string values
        const name = customer.name || '';
        const contact = customer.contact || '';
        const nameMatch = String(name).toLowerCase().includes(query);
        const contactMatch = String(contact).toLowerCase().includes(query);
        return nameMatch || contactMatch;
      } catch (error) {
        // If any error occurs during filtering, exclude this customer
        console.warn('Error filtering customer:', customer.id, error);
        return false;
      }
    });
  }, [customers, searchQuery]);

  const handleToggleCustomer = (customerId: bigint) => {
    setSelectedCustomerIds((prev) => {
      const exists = prev.some(id => id === customerId);
      if (exists) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleRemoveCustomer = (customerId: bigint) => {
    setSelectedCustomerIds((prev) => prev.filter(id => id !== customerId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCustomerIds.length === 0) {
      toast.error('Please select at least one customer');
      return;
    }

    if (!planType || !amount || !startDate || !endDate) {
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
        customerIds: selectedCustomerIds,
        contractType: planType as AMCType,
        amount: amountInPaise,
        startDate: startDateNanos,
        endDate: endDateNanos,
      });

      const count = selectedCustomerIds.length;
      toast.success(`AMC contract added successfully for ${count} customer${count > 1 ? 's' : ''}!`);
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes('Unauthorized')) {
        toast.error('You are not authorized to add AMC contracts for one or more selected customers');
      } else {
        toast.error('Failed to add AMC contract');
      }
      console.error(error);
    }
  };

  const resetForm = () => {
    if (preselectedCustomerId) {
      setSelectedCustomerIds([preselectedCustomerId]);
    } else {
      setSelectedCustomerIds([]);
    }
    setSearchQuery('');
    setPlanType('onlyService');
    setAmount('');
    setStartDate('');
    setEndDate('');
  };

  const selectedCustomers = customers.filter((c) =>
    selectedCustomerIds.some(id => id === c.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add AMC Contract</DialogTitle>
          <DialogDescription>Create a new AMC contract for one or more customers</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customers">Customers *</Label>
            <div className="space-y-2">
              <Input
                id="search"
                type="text"
                placeholder="Search by name or contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {selectedCustomers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/30">
                  {selectedCustomers.map((customer) => (
                    <div
                      key={customer.id.toString()}
                      className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                    >
                      <span>{customer.name || 'Unknown'}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomer(customer.id);
                        }}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <ScrollArea className="h-48 border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {searchQuery ? 'No customers found' : 'No customers available'}
                    </p>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const isSelected = selectedCustomerIds.some(id => id === customer.id);
                      const displayName = customer.name || 'Unknown';
                      const displayContact = customer.contact || 'No contact';
                      
                      return (
                        <div
                          key={customer.id.toString()}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                          onClick={() => handleToggleCustomer(customer.id)}
                        >
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleCustomer(customer.id)}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{displayName}</p>
                            <p className="text-xs text-muted-foreground">{displayContact}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
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

          <div className="grid grid-cols-2 gap-4">
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
