import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '../lib/utils';
import { Trash2, Eye } from 'lucide-react';
import AMCBadge from './AMCBadge';
import type { Customer } from '../backend';

interface CustomerListProps {
  customers: Customer[];
  onViewCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  isAdmin: boolean;
  onMultiDelete: (customerIds: bigint[]) => void;
}

export default function CustomerList({ customers, onViewCustomer, onDeleteCustomer, isAdmin, onMultiDelete }: CustomerListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<bigint>>(new Set());
  const [sortField, setSortField] = useState<'name' | 'nextServiceDate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name' | 'nextServiceDate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else {
      comparison = Number(a.nextServiceDate - b.nextServiceDate);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleSelection = (id: bigint) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map(c => c.id)));
    }
  };

  const handleMultiDelete = () => {
    if (selectedIds.size > 0) {
      onMultiDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No customers found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} customer(s) selected</span>
          <Button variant="destructive" size="sm" onClick={handleMultiDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === customers.length && customers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Brand/Model</TableHead>
              <TableHead>Warranty</TableHead>
              <TableHead>AMC</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('nextServiceDate')}>
                Next Service {sortField === 'nextServiceDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCustomers.map((customer) => (
              <TableRow key={customer.id.toString()}>
                {isAdmin && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(customer.id)}
                      onCheckedChange={() => toggleSelection(customer.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.contact}</TableCell>
                <TableCell>
                  {customer.brand} {customer.model}
                </TableCell>
                <TableCell>
                  <Badge variant={customer.warrantyStatus === 'inWarranty' ? 'default' : 'secondary'}>
                    {customer.warrantyStatus === 'inWarranty' ? 'In Warranty' : 'Out of Warranty'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {customer.amcDetails ? (
                    <AMCBadge type={customer.amcDetails.contractType} />
                  ) : (
                    <span className="text-xs text-muted-foreground">No AMC</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(customer.nextServiceDate)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewCustomer(customer)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteCustomer(customer)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
