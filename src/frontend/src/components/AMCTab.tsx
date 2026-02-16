import { useState } from 'react';
import { useGetAllCustomers } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { formatDate, formatCurrency } from '../lib/utils';
import { getAMCTypeInfo } from '../lib/amc';
import AMCBadge from './AMCBadge';
import AddAMCContractDialog from './AddAMCContractDialog';
import type { Customer } from '../backend';

export default function AMCTab() {
  const { data: customers = [], isLoading } = useGetAllCustomers();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const customersWithAMC = customers.filter(c => c.amcContracts && c.amcContracts.length > 0);

  const allContracts = customersWithAMC.flatMap(customer =>
    customer.amcContracts.map(contract => ({
      customer,
      contract,
    }))
  ).sort((a, b) => Number(b.contract.startDate - a.contract.startDate));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AMC Contracts</CardTitle>
          <CardDescription>Manage all AMC contracts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AMC Contracts</CardTitle>
              <CardDescription>View and manage all AMC contracts</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add AMC
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allContracts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No AMC contracts found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Add AMC" to create your first contract
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allContracts.map((item, index) => (
                    <TableRow key={`${item.customer.id}-${index}`}>
                      <TableCell className="font-medium">{item.customer.name}</TableCell>
                      <TableCell>
                        <AMCBadge type={item.contract.contractType} />
                      </TableCell>
                      <TableCell>{formatDate(item.contract.startDate)}</TableCell>
                      <TableCell>{formatDate(item.contract.endDate)}</TableCell>
                      <TableCell>{formatCurrency(Number(item.contract.amount))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddAMCContractDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </>
  );
}
