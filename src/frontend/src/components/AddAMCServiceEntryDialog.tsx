import { useState } from 'react';
import { useAddAMCServiceEntry } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface AddAMCServiceEntryDialogProps {
  customerId: bigint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddAMCServiceEntryDialog({ customerId, open, onOpenChange }: AddAMCServiceEntryDialogProps) {
  const [serviceDate, setServiceDate] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [hasPriceReduction, setHasPriceReduction] = useState(false);
  const [partsName, setPartsName] = useState('');
  const [regularPrice, setRegularPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');

  const addAMCService = useAddAMCServiceEntry();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceDate.trim() || !notes.trim()) {
      toast.error('Please fill in service date and notes');
      return;
    }

    try {
      const dateInNanos = BigInt(new Date(serviceDate).getTime()) * BigInt(1_000_000);
      
      const priceReduction = hasPriceReduction && partsName.trim() && regularPrice.trim() && discountPrice.trim()
        ? { partsName: partsName.trim(), regularPrice: regularPrice.trim(), discountPrice: discountPrice.trim() }
        : null;

      await addAMCService.mutateAsync({
        customerId,
        serviceDate: dateInNanos,
        partsReplaced: partsReplaced.trim(),
        notes: notes.trim(),
        followUpNeeded,
        priceReduction,
      });

      toast.success('AMC service entry added successfully');
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add AMC service entry');
      console.error(error);
    }
  };

  const resetForm = () => {
    setServiceDate('');
    setPartsReplaced('');
    setNotes('');
    setFollowUpNeeded(false);
    setHasPriceReduction(false);
    setPartsName('');
    setRegularPrice('');
    setDiscountPrice('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add AMC Service Entry</DialogTitle>
          <DialogDescription>Record a service performed under AMC contract</DialogDescription>
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
            <Label htmlFor="partsReplaced">Parts Replaced</Label>
            <Input
              id="partsReplaced"
              placeholder="e.g., Filter, Motor"
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Service Notes *</Label>
            <Textarea
              id="notes"
              placeholder="Describe the service performed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUpNeeded"
              checked={followUpNeeded}
              onCheckedChange={(checked) => setFollowUpNeeded(checked as boolean)}
            />
            <Label htmlFor="followUpNeeded" className="cursor-pointer">
              Follow-up needed
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasPriceReduction"
              checked={hasPriceReduction}
              onCheckedChange={(checked) => setHasPriceReduction(checked as boolean)}
            />
            <Label htmlFor="hasPriceReduction" className="cursor-pointer">
              Parts price reduction applied
            </Label>
          </div>

          {hasPriceReduction && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="partsName">Parts Name</Label>
                <Input
                  id="partsName"
                  placeholder="e.g., Compressor"
                  value={partsName}
                  onChange={(e) => setPartsName(e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="regularPrice">Regular Price</Label>
                  <Input
                    id="regularPrice"
                    placeholder="e.g., ₹5000"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Discount Price</Label>
                  <Input
                    id="discountPrice"
                    placeholder="e.g., ₹2500"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addAMCService.isPending}>
              {addAMCService.isPending ? 'Adding...' : 'Add Service Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
