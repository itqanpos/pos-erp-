import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export function SalesHistory() {
  const sales = useLiveQuery(() => db.sales.orderBy('date').reverse().toArray());

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Sales History</h2>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales?.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">#{sale.id}</TableCell>
                <TableCell>{format(sale.date, 'PP p')}</TableCell>
                <TableCell>{sale.items.length} items</TableCell>
                <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                <TableCell className="text-right">{formatCurrency(sale.total)}</TableCell>
                <TableCell className="text-right capitalize">{sale.status}</TableCell>
              </TableRow>
            ))}
            {sales?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No sales found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
