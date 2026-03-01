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
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export function Inventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const products = useLiveQuery(
    () => db.products
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .toArray(),
    [searchQuery]
  );

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await db.products.delete(id);
      toast.success('Product deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.barcode}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-right">{product.stock}</TableCell>
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
                <TableCell colSpan={6} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
