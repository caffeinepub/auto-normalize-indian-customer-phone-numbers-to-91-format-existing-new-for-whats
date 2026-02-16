import { useState } from 'react';
import { useAddReminder, useGetAllCustomers } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddReminderDialog({ open, onOpenChange }: AddReminderDialogProps) {
  const [customerId, setCustomerId] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [description, setDescription] = useState('');
  const { data: customers = [] } = useGetAllCustomers();
  const addReminder = useAddReminder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || !reminderDate || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const dateInNanos = BigInt(new Date(reminderDate).getTime()) * BigInt(1_000_000);

      await addReminder.mutateAsync({
        customerId: BigInt(customerId),
        reminderDate: dateInNanos,
        description: description.trim(),
      });

      toast.success('Reminder added successfully!');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add reminder');
      console.error(error);
    }
  };

  const resetForm = () => {
    setCustomerId('');
    setReminderDate('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Reminder</DialogTitle>
          <DialogDescription>Schedule a reminder for a customer service</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
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
            <Label htmlFor="reminderDate">Reminder Date *</Label>
            <Input
              id="reminderDate"
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter reminder description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addReminder.isPending}>
              {addReminder.isPending ? 'Adding...' : 'Add Reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
