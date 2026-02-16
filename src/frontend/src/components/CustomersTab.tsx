import { useState, useRef, useEffect } from 'react';
import { useGetAllCustomers, useDeleteCustomer, useMultiDeleteCustomers, useImportCustomers, useGetCustomersByWarrantyStatus, useGetCustomersDueForService, useIsAdmin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import CustomerList from './CustomerList';
import AddCustomerDialog from './AddCustomerDialog';
import CustomerDetailDialog from './CustomerDetailDialog';
import ImportPreviewModal from './ImportPreviewModal';
import { normalizeIndianMobileToE164 } from '../lib/phoneNormalization';
import type { Customer, ImportCustomerData } from '../backend';
import { WarrantyStatus as WarrantyStatusEnum } from '../backend';
import type { CustomerFilter } from '../pages/Dashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Declare XLSX as a global variable that will be loaded from CDN
declare global {
  interface Window {
    XLSX: any;
  }
}

interface ParsedCustomer {
  data: ImportCustomerData;
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

interface CustomersTabProps {
  filter?: CustomerFilter;
  onClearFilter?: () => void;
}

export default function CustomersTab({ filter = 'all', onClearFilter }: CustomersTabProps) {
  const { data: allCustomers = [], isLoading: allLoading } = useGetAllCustomers();
  const { data: inWarrantyCustomers = [], isLoading: inWarrantyLoading } = useGetCustomersByWarrantyStatus(WarrantyStatusEnum.inWarranty);
  const { data: outWarrantyCustomers = [], isLoading: outWarrantyLoading } = useGetCustomersByWarrantyStatus(WarrantyStatusEnum.outWarranty);
  const { data: dueForServiceCustomers = [], isLoading: dueLoading } = useGetCustomersDueForService();
  const { data: isAdmin = false } = useIsAdmin();
  
  const deleteCustomer = useDeleteCustomer();
  const multiDeleteCustomers = useMultiDeleteCustomers();
  const importCustomers = useImportCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [warrantyFilter, setWarrantyFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load XLSX library from CDN
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
      script.async = true;
      script.onload = () => setXlsxLoaded(true);
      script.onerror = () => {
        console.error('Failed to load XLSX library');
        setXlsxLoaded(false);
      };
      document.head.appendChild(script);
    } else if (window.XLSX) {
      setXlsxLoaded(true);
    }
  }, []);

  // Determine which customer list to use based on filter
  let customers: Customer[] = allCustomers;
  let isLoading = allLoading;

  if (filter === 'inWarranty') {
    customers = inWarrantyCustomers;
    isLoading = inWarrantyLoading;
  } else if (filter === 'outWarranty') {
    customers = outWarrantyCustomers;
    isLoading = outWarrantyLoading;
  } else if (filter === 'dueForService') {
    customers = dueForServiceCustomers;
    isLoading = dueLoading;
  }

  const filteredCustomers = customers.filter((customer) => {
    // Case-insensitive search with partial matching
    const query = searchQuery.toLowerCase().trim();
    
    if (query) {
      const matchesName = customer.name.toLowerCase().includes(query);
      const matchesContact = customer.contact.toLowerCase().includes(query);
      const matchesBrand = customer.brand.toLowerCase().includes(query);
      const matchesModel = customer.model.toLowerCase().includes(query);
      
      const matchesSearch = matchesName || matchesContact || matchesBrand || matchesModel;
      
      if (!matchesSearch) return false;
    }
    
    // Only apply warranty filter if no dashboard filter is active
    if (filter === 'all') {
      const matchesWarranty = warrantyFilter === 'all' || customer.warrantyStatus === warrantyFilter;
      return matchesWarranty;
    }
    
    return true;
  });

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      await deleteCustomer.mutateAsync(customerToDelete.id);
      toast.success(`Customer "${customerToDelete.name}" and all associated data deleted successfully`);
      setCustomerToDelete(null);
      if (selectedCustomer?.id === customerToDelete.id) {
        setSelectedCustomer(null);
      }
    } catch (error: any) {
      if (error.message?.includes('Unauthorized') || error.message?.includes('Only admins')) {
        toast.error('Only admin users can delete customers');
      } else {
        toast.error('Failed to delete customer');
      }
      console.error(error);
    }
  };

  const handleMultiDelete = async (customerIds: bigint[]) => {
    if (customerIds.length === 0) return;

    try {
      await multiDeleteCustomers.mutateAsync(customerIds);
      toast.success(`Successfully deleted ${customerIds.length} customer${customerIds.length > 1 ? 's' : ''} and all associated data`);
    } catch (error: any) {
      if (error.message?.includes('Unauthorized') || error.message?.includes('Only admins')) {
        toast.error('Only admin users can delete customers');
      } else {
        toast.error('Failed to delete customers');
      }
      console.error(error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const parseCSV = (text: string): any[][] => {
    const lines = text.split(/\r?\n/);
    const result: any[][] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const row: any[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      row.push(current.trim());
      result.push(row);
    }
    
    return result;
  };

  const validateAndParseCustomers = (jsonData: any[][]): ParsedCustomer[] => {
    if (jsonData.length < 2) {
      return [];
    }

    // Parse header and data
    const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
    const dataRows = jsonData.slice(1);

    // Map column names to indices
    const columnMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      columnMap[header] = index;
    });

    // Check for required columns
    const requiredColumns = ['name', 'contact'];
    const missingRequired = requiredColumns.filter(col => columnMap[col] === undefined);

    if (missingRequired.length > 0) {
      throw new Error(`Missing required columns: ${missingRequired.join(', ')}`);
    }

    const parsedCustomers: ParsedCustomer[] = [];

    dataRows.forEach((row, index) => {
      // Skip completely empty rows
      if (!row || row.length === 0 || !row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
        return;
      }

      const rowNum = index + 2; // +2 because index starts at 0 and we skip header
      const errors: string[] = [];

      // Required fields
      const name = String(row[columnMap['name']] || '').trim();
      const contactRaw = String(row[columnMap['contact']] || '').trim();

      if (!name) {
        errors.push('Name is required');
      }
      if (!contactRaw) {
        errors.push('Contact is required');
      }

      // Normalize contact to +91 format
      const contact = normalizeIndianMobileToE164(contactRaw);

      // Optional fields with defaults
      const brand = columnMap['brand'] !== undefined 
        ? String(row[columnMap['brand']] || '').trim() || 'Unknown'
        : 'Unknown';

      const model = columnMap['model'] !== undefined
        ? String(row[columnMap['model']] || '').trim() || 'Unknown'
        : 'Unknown';

      // Parse service type
      let serviceType;
      if (columnMap['servicetype'] !== undefined) {
        const serviceTypeStr = String(row[columnMap['servicetype']] || '').toLowerCase().trim();
        if (serviceTypeStr === 'cleaning') {
          serviceType = { __kind__: 'cleaning' as const, cleaning: null };
        } else if (serviceTypeStr === 'maintenance') {
          serviceType = { __kind__: 'maintenance' as const, maintenance: null };
        } else if (serviceTypeStr === 'repair') {
          serviceType = { __kind__: 'repair' as const, repair: null };
        } else {
          serviceType = { __kind__: 'other' as const, other: serviceTypeStr || 'Other' };
        }
      } else {
        serviceType = { __kind__: 'maintenance' as const, maintenance: null };
      }

      // Parse installation date
      let installationDate: bigint;
      if (columnMap['installationdate'] !== undefined) {
        const installationDateStr = row[columnMap['installationdate']];

        if (!installationDateStr || installationDateStr === '') {
          installationDate = BigInt(Date.now()) * BigInt(1_000_000);
        } else if (typeof installationDateStr === 'number') {
          // Excel date serial number
          if (isNaN(installationDateStr) || installationDateStr <= 0) {
            errors.push('Invalid installation date');
            installationDate = BigInt(Date.now()) * BigInt(1_000_000);
          } else {
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + installationDateStr * 86400000);
            if (isNaN(date.getTime())) {
              errors.push('Invalid installation date');
              installationDate = BigInt(Date.now()) * BigInt(1_000_000);
            } else {
              installationDate = BigInt(date.getTime()) * BigInt(1_000_000);
            }
          }
        } else {
          const date = new Date(installationDateStr);
          if (isNaN(date.getTime())) {
            errors.push('Invalid installation date format');
            installationDate = BigInt(Date.now()) * BigInt(1_000_000);
          } else {
            installationDate = BigInt(date.getTime()) * BigInt(1_000_000);
          }
        }
      } else {
        installationDate = BigInt(Date.now()) * BigInt(1_000_000);
      }

      // Validate installation date is positive
      if (installationDate <= 0n) {
        errors.push('Installation date must be valid');
        installationDate = BigInt(Date.now()) * BigInt(1_000_000);
      }

      // Parse service interval
      let serviceInterval: bigint;
      if (columnMap['serviceinterval'] !== undefined) {
        const serviceIntervalStr = row[columnMap['serviceinterval']];
        const intervalNum = parseInt(String(serviceIntervalStr));

        if (isNaN(intervalNum) || ![1, 3, 6].includes(intervalNum)) {
          serviceInterval = 3n;
          if (serviceIntervalStr && String(serviceIntervalStr).trim() !== '') {
            errors.push('Invalid service interval (using default: 3 months)');
          }
        } else {
          serviceInterval = BigInt(intervalNum);
        }
      } else {
        serviceInterval = 3n;
      }

      const customerData: ImportCustomerData = {
        name,
        contact,
        brand,
        model,
        serviceType,
        installationDate,
        serviceInterval,
      };

      parsedCustomers.push({
        data: customerData,
        rowNumber: rowNum,
        isValid: errors.length === 0,
        errors,
      });
    });

    return parsedCustomers;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.xls', '.xlsx', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error('Invalid file format. Please upload .xls, .xlsx, or .csv files only.');
      event.target.value = '';
      return;
    }

    // Check if XLSX library is needed and loaded
    if ((fileExtension === '.xls' || fileExtension === '.xlsx') && !xlsxLoaded) {
      toast.error('Excel library is still loading. Please try again in a moment.');
      event.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          let jsonData: any[][] = [];

          if (fileExtension === '.csv') {
            // Parse CSV manually
            const text = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer);
            jsonData = parseCSV(text);
          } else {
            // Parse Excel using XLSX library
            if (!window.XLSX) {
              toast.error('Excel library not loaded. Please try again.');
              return;
            }

            const workbook = window.XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          }

          if (jsonData.length < 2) {
            toast.error('File is empty or has no data rows');
            return;
          }

          // Validate and parse customers
          const parsed = validateAndParseCustomers(jsonData);

          if (parsed.length === 0) {
            toast.error('No valid customer data found in file');
            return;
          }

          // Show preview modal
          setParsedCustomers(parsed);
          setShowPreviewModal(true);

        } catch (error: any) {
          toast.error(`Failed to parse file: ${error.message || 'Unknown error'}`);
          console.error('Parse error:', error);
        }
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
      };

      if (fileExtension === '.csv') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }

    } catch (error: any) {
      toast.error(`Failed to process file: ${error.message || 'Unknown error'}`);
      console.error('File processing error:', error);
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const handleConfirmImport = async () => {
    const validCustomers = parsedCustomers.filter(c => c.isValid).map(c => c.data);

    if (validCustomers.length === 0) {
      toast.error('No valid customers to import');
      return;
    }

    try {
      const result = await importCustomers.mutateAsync(validCustomers);

      setShowPreviewModal(false);
      setParsedCustomers([]);

      if (result.successCount > 0) {
        toast.success(`Successfully imported ${result.successCount} customer${result.successCount > 1 ? 's' : ''}`);
      }

      if (result.failureCount > 0) {
        const errorMsg = result.errors.length > 0 
          ? result.errors.slice(0, 3).join('; ')
          : 'Unknown errors occurred';
        toast.error(`Failed to import ${result.failureCount} customer${result.failureCount > 1 ? 's' : ''}. ${errorMsg}`);
      }

    } catch (error: any) {
      if (error.message?.includes('Unauthorized') || error.message?.includes('Only admins')) {
        toast.error('Only admin users can import customers');
      } else {
        toast.error(`Import failed: ${error.message || 'Unknown error'}`);
      }
      console.error('Import error:', error);
    }
  };

  const getFilterLabel = () => {
    switch (filter) {
      case 'inWarranty':
        return 'In-Warranty Customers';
      case 'outWarranty':
        return 'Out-of-Warranty Customers';
      case 'dueForService':
        return 'Customers Due for Service';
      default:
        return null;
    }
  };

  const filterLabel = getFilterLabel();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Manage your customer database</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {isAdmin && (
                <Button 
                  variant="outline" 
                  onClick={handleImportClick} 
                  disabled={importCustomers.isPending}
                  className="flex-shrink-0"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Customers
                </Button>
              )}
              <AddCustomerDialog />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filterLabel && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>Showing: <strong>{filterLabel}</strong></span>
                {onClearFilter && (
                  <Button variant="ghost" size="sm" onClick={onClearFilter}>
                    <X className="mr-2 h-4 w-4" />
                    Clear Filter
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, contact, brand, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {filter === 'all' && (
              <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by warranty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warranties</SelectItem>
                  <SelectItem value="inWarranty">In Warranty</SelectItem>
                  <SelectItem value="outWarranty">Out of Warranty</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading customers...</p>
            </div>
          ) : (
            <CustomerList
              customers={filteredCustomers}
              onViewCustomer={setSelectedCustomer}
              onDeleteCustomer={setCustomerToDelete}
              onMultiDelete={handleMultiDelete}
              isAdmin={isAdmin}
            />
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xls,.xlsx,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {selectedCustomer && (
        <CustomerDetailDialog
          customer={selectedCustomer}
          open={!!selectedCustomer}
          onOpenChange={(open) => !open && setSelectedCustomer(null)}
          onDeleteCustomer={setCustomerToDelete}
        />
      )}

      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete customer "{customerToDelete?.name}" and all associated service records and reminders. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        parsedCustomers={parsedCustomers}
        onConfirm={handleConfirmImport}
        isImporting={importCustomers.isPending}
      />
    </>
  );
}
