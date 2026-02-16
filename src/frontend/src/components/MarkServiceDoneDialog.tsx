import { useState, useEffect } from 'react';
import { useMarkServiceAsDone, useGetAllCustomers } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { formatDate } from '../lib/utils';
import type { Reminder } from '../backend';

interface MarkServiceDoneDialogProps {
  reminder: Reminder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MarkServiceDoneDialog({ reminder, open, onOpenChange }: MarkServiceDoneDialogProps) {
  const [serviceDoneDate, setServiceDoneDate] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const markServiceAsDone = useMarkServiceAsDone();
  const { data: customers = [] } = useGetAllCustomers();

  useEffect(() => {
    if (reminder) {
      // Set default service done date to today
      const today = new Date();
      setServiceDoneDate(today.toISOString().split('T')[0]);

      // Get customer to calculate new reminder date
      const customer = customers.find((c) => c.id === reminder.customerId);
      if (customer) {
        // Calculate new reminder date based on service interval
        const serviceInterval = Number(customer.serviceInterval);
        const newDate = new Date(today);
        newDate.setMonth(newDate.getMonth() + serviceInterval);
        setNewReminderDate(newDate.toISOString().split('T')[0]);
      }
    }
  }, [reminder, customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reminder || !serviceDoneDate) {
      toast.error('Please select a service done date');
      return;
    }

    try {
      const dateInNanos = BigInt(new Date(serviceDoneDate).getTime()) * BigInt(1_000_000);

      await markServiceAsDone.mutateAsync({
        customerId: reminder.customerId,
        serviceDoneDate: dateInNanos,
      });

      toast.success('Service marked as done! New reminder created.');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to mark service as done');
      console.error(error);
    }
  };

  const handleDateChange = (date: string) => {
    setServiceDoneDate(date);

    // Recalculate new reminder date when service done date changes
    const customer = customers.find((c) => c.id === reminder?.customerId);
    if (customer) {
      const serviceInterval = Number(customer.serviceInterval);
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() + serviceInterval);
      setNewReminderDate(newDate.toISOString().split('T')[0]);
    }
  };

  if (!reminder) return null;

  const customer = customers.find((c) => c.id === reminder.customerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Service as Done</DialogTitle>
          <DialogDescription>
            Complete this service and schedule the next reminder
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Customer</Label>
            <p className="text-sm text-muted-foreground">{customer?.name || 'Unknown'}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Reminder</Label>
            <p className="text-sm text-muted-foreground">{reminder.description}</p>
            <p className="text-sm text-muted-foreground">
              Scheduled: {formatDate(reminder.reminderDate)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceDoneDate">Service Done Date *</Label>
            <Input
              id="serviceDoneDate"
              type="date"
              value={serviceDoneDate}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
          </div>

          {newReminderDate && customer && (
            <div className="space-y-2 rounded-lg bg-primary/5 p-4 border border-primary/20">
              <Label className="text-sm font-medium">New Reminder Will Be Created</Label>
              <p className="text-sm text-muted-foreground">
                Next service date: <span className="font-medium">{new Date(newReminderDate).toLocaleDateString()}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Based on {customer.serviceInterval.toString()} month service interval
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={markServiceAsDone.isPending}>
              {markServiceAsDone.isPending ? 'Processing...' : 'Mark as Done'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
