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
import { Button } from '@/components/ui/Button';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { FileDown, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export function SalesHistory() {
  const { t } = useTranslation();
  const sales = useLiveQuery(() => db.sales.orderBy('date').reverse().toArray());

  const handleRefund = async (sale: any) => {
    if (confirm(t('confirm_delete'))) {
      await db.transaction('rw', db.sales, db.products, async () => {
        await db.sales.update(sale.id, { status: 'refunded' });
        
        // Restore stock
        for (const item of sale.items) {
          const product = await db.products.get(item.productId);
          if (product) {
            await db.products.update(item.productId, {
              stock: product.stock + item.quantity
            });
          }
        }
      });
      toast.success(t('refunded'));
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.text(t('sales_history'), 14, 10);
    
    const tableData = sales?.map(sale => [
      sale.id,
      format(sale.date, 'yyyy-MM-dd HH:mm'),
      sale.items.length,
      sale.paymentMethod,
      formatCurrency(sale.total),
      sale.status
    ]);

    autoTable(doc, {
      head: [[t('id'), t('date'), t('items'), t('payment_method'), t('total'), t('status')]],
      body: tableData,
      startY: 20,
    });

    doc.save('sales-history.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">{t('sales_history')}</h2>
        <Button variant="outline" onClick={exportPDF}>
          <FileDown className="mr-2 h-4 w-4" />
          {t('export_pdf')}
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('id')}</TableHead>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('items')}</TableHead>
              <TableHead>{t('payment_method')}</TableHead>
              <TableHead className="text-right">{t('total')}</TableHead>
              <TableHead className="text-right">{t('status')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales?.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">#{sale.id}</TableCell>
                <TableCell>{format(sale.date, 'PP p')}</TableCell>
                <TableCell>{sale.items.length} {t('items')}</TableCell>
                <TableCell className="capitalize">{t(sale.paymentMethod)}</TableCell>
                <TableCell className="text-right">{formatCurrency(sale.total)}</TableCell>
                <TableCell className="text-right capitalize">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs",
                    sale.status === 'completed' ? "bg-green-100 text-green-800" : 
                    sale.status === 'refunded' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                  )}>
                    {t(sale.status)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {sale.status === 'completed' && (
                    <Button variant="ghost" size="sm" onClick={() => handleRefund(sale)} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {t('refunded')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sales?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t('no_sales')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
