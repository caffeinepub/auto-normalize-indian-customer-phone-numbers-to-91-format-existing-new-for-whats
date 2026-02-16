import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { formatDate } from '../lib/utils';
import type { ImportCustomerData } from '../backend';

interface ParsedCustomer {
  data: ImportCustomerData;
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

interface ImportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsedCustomers: ParsedCustomer[];
  onConfirm: () => void;
  isImporting: boolean;
}

export default function ImportPreviewModal({
  open,
  onOpenChange,
  parsedCustomers,
  onConfirm,
  isImporting,
}: ImportPreviewModalProps) {
  const validCount = parsedCustomers.filter((c) => c.isValid).length;
  const invalidCount = parsedCustomers.filter((c) => !c.isValid).length;

  const getServiceTypeDisplay = (serviceType: any): string => {
    if (serviceType.cleaning !== undefined) return 'Cleaning';
    if (serviceType.maintenance !== undefined) return 'Maintenance';
    if (serviceType.repair !== undefined) return 'Repair';
    if (serviceType.other !== undefined) return serviceType.other;
    return 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Preview</DialogTitle>
          <DialogDescription>
            Review the customers to be imported. Only valid entries will be imported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="ml-2">
                <span className="font-semibold text-green-700 dark:text-green-300">
                  {validCount} Valid
                </span>
                <span className="text-green-600 dark:text-green-400 ml-1">
                  {validCount === 1 ? 'customer' : 'customers'} ready to import
                </span>
              </AlertDescription>
            </Alert>

            {invalidCount > 0 && (
              <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="ml-2">
                  <span className="font-semibold text-red-700 dark:text-red-300">
                    {invalidCount} Invalid
                  </span>
                  <span className="text-red-600 dark:text-red-400 ml-1">
                    {invalidCount === 1 ? 'customer' : 'customers'} will be skipped
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Row</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Installation Date</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedCustomers.map((customer, index) => (
                  <TableRow
                    key={index}
                    className={customer.isValid ? '' : 'bg-red-50/50 dark:bg-red-950/10'}
                  >
                    <TableCell className="font-mono text-xs">{customer.rowNumber}</TableCell>
                    <TableCell>
                      {customer.isValid ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Invalid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{customer.data.name || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{customer.data.contact || '-'}</TableCell>
                    <TableCell>{customer.data.brand || '-'}</TableCell>
                    <TableCell>{customer.data.model || '-'}</TableCell>
                    <TableCell>{getServiceTypeDisplay(customer.data.serviceType)}</TableCell>
                    <TableCell>{customer.data.serviceInterval.toString()} months</TableCell>
                    <TableCell className="text-xs">
                      {formatDate(customer.data.installationDate)}
                    </TableCell>
                    <TableCell>
                      {customer.errors.length > 0 ? (
                        <div className="space-y-1">
                          {customer.errors.map((error, i) => (
                            <div key={i} className="flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {invalidCount > 0 && (
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="ml-2 text-amber-700 dark:text-amber-300">
                <strong>Note:</strong> Invalid entries will be skipped during import. Please fix the errors in your file and re-import if needed.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={validCount === 0 || isImporting}>
            {isImporting ? 'Importing...' : `Import ${validCount} Customer${validCount !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
