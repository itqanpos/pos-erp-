import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Product, type Supplier, type Category } from '@/db';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Plus, Search, Trash2, Edit, AlertTriangle, Calendar } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export function Inventory() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const isRtl = i18n.dir() === 'rtl';
  
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

  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      name: formData.get('name') as string,
      barcode: formData.get('barcode') as string,
      category: formData.get('category') as string,
      price: parseFloat(formData.get('price') as string),
      cost: parseFloat(formData.get('cost') as string),
      stock: parseInt(formData.get('stock') as string),
      supplierId: formData.get('supplierId') ? parseInt(formData.get('supplierId') as string) : undefined,
      expiryDate: formData.get('expiryDate') ? new Date(formData.get('expiryDate') as string) : undefined,
    };

    try {
      if (editingProduct) {
        await db.products.update(editingProduct.id, productData);
        toast.success(t('product_updated'));
      } else {
        await db.products.add(productData as Product);
        toast.success(t('product_added'));
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      toast.error('Error saving product');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('confirm_delete'))) {
      await db.products.delete(id);
      toast.success(t('delete'));
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('inventory')}</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingProduct(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" /> {t('add_product')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? t('edit_product') : t('add_product')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('product_name')}</Label>
                <Input id="name" name="name" defaultValue={editingProduct?.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="barcode">{t('barcode')}</Label>
                <Input id="barcode" name="barcode" defaultValue={editingProduct?.barcode} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">{t('category')}</Label>
                <select 
                  id="category" 
                  name="category" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={editingProduct?.category}
                  required
                >
                  <option value="">{t('select_category')}</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplierId">{t('supplier')}</Label>
                <select 
                  id="supplierId" 
                  name="supplierId" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={editingProduct?.supplierId || ''}
                >
                  <option value="">{t('select_supplier')}</option>
                  {suppliers?.map((sup) => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">{t('price')}</Label>
                <Input id="price" name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">{t('cost')}</Label>
                <Input id="cost" name="cost" type="number" step="0.01" defaultValue={editingProduct?.cost} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">{t('stock')}</Label>
                <Input id="stock" name="stock" type="number" defaultValue={editingProduct?.stock} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiryDate">{t('expiry_date')}</Label>
                <Input 
                  id="expiryDate" 
                  name="expiryDate" 
                  type="date" 
                  defaultValue={editingProduct?.expiryDate ? format(editingProduct.expiryDate, 'yyyy-MM-dd') : ''} 
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('save')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className={cn("absolute top-2.5 h-4 w-4 text-muted-foreground", isRtl ? "right-2.5" : "left-2.5")} />
          <Input
            placeholder={t('search_placeholder')}
            className={cn(isRtl ? "pr-8" : "pl-8")}
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
              <TableHead>{t('supplier')}</TableHead>
              <TableHead className="text-right">{t('price')}</TableHead>
              <TableHead className="text-right">{t('stock')}</TableHead>
              <TableHead className="text-right">{t('expiry_date')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => {
              const supplier = suppliers?.find(s => s.id === product.supplierId);
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{supplier?.name || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      product.stock <= 10 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
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
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {products?.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
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
