import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Product } from '@/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/Table';
import { Plus, Search, Trash2, Edit, AlertTriangle, Calendar } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export function Inventory() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  
  const products = useLiveQuery(
    () => {
      let collection = db.products.toCollection();
      if (showLowStock) {
        collection = db.products.filter(p => p.stock <= 10);
      }
      return collection
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .toArray();
    },
    [searchQuery, showLowStock]
  );

  const handleDelete = async (id: number) => {
    if (confirm(t('confirm_delete'))) {
      await db.products.delete(id);
      toast.success(t('delete'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('inventory')}</h2>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('add_product')}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground rtl:right-2 rtl:left-auto" />
          <Input
            placeholder={t('search_placeholder')}
            className="pl-8 rtl:pr-8 rtl:pl-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          variant={showLowStock ? "destructive" : "outline"}
          onClick={() => setShowLowStock(!showLowStock)}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          {t('stock_low')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('barcode')}</TableHead>
              <TableHead>{t('category')}</TableHead>
              <TableHead className="text-right">{t('price')}</TableHead>
              <TableHead className="text-right">{t('stock')}</TableHead>
              <TableHead className="text-right">{t('expiry_date')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.barcode}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    product.stock <= 10 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                  )}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {product.expiryDate ? (
                    <div className="flex items-center justify-end gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(product.expiryDate, 'PP')}
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => toast.info('Edit feature coming soon')}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {products?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t('no_products')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
