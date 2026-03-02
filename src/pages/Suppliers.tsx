import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Supplier } from '@/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Plus, Search, Pencil, Trash2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function Suppliers() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const isRtl = i18n.dir() === 'rtl';

  const suppliers = useLiveQuery(
    () =>
      db.suppliers
        .filter((supplier) =>
          supplier.name.toLowerCase().includes(search.toLowerCase())
        )
        .toArray(),
    [search]
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const supplierData = {
      name: formData.get('name') as string,
      contactName: formData.get('contactName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    };

    try {
      if (editingSupplier) {
        await db.suppliers.update(editingSupplier.id, supplierData);
        toast.success(t('supplier_updated'));
      } else {
        await db.suppliers.add(supplierData as Supplier);
        toast.success(t('supplier_added'));
      }
      setIsAddOpen(false);
      setEditingSupplier(null);
    } catch (error) {
      toast.error('Error saving supplier');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('confirm_delete_supplier'))) {
      await db.suppliers.delete(id);
      toast.success(t('supplier_deleted'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('suppliers')}</h2>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setEditingSupplier(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('add_supplier')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSupplier ? t('edit_supplier') : t('add_supplier')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('supplier_name')}</Label>
                <Input id="name" name="name" defaultValue={editingSupplier?.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contactName">{t('contact_name')}</Label>
                <Input id="contactName" name="contactName" defaultValue={editingSupplier?.contactName} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t('supplier_email')}</Label>
                <Input id="email" name="email" type="email" defaultValue={editingSupplier?.email} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t('supplier_phone')}</Label>
                <Input id="phone" name="phone" defaultValue={editingSupplier?.phone} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">{t('supplier_address')}</Label>
                <Input id="address" name="address" defaultValue={editingSupplier?.address} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('save')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className={cn("absolute top-2.5 h-4 w-4 text-muted-foreground", isRtl ? "right-2.5" : "left-2.5")} />
          <Input
            placeholder={t('search_suppliers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(isRtl ? "pr-8" : "pl-8")}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('suppliers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('supplier_name')}</TableHead>
                <TableHead>{t('contact_name')}</TableHead>
                <TableHead>{t('supplier_phone')}</TableHead>
                <TableHead>{t('supplier_email')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t('no_suppliers')}
                  </TableCell>
                </TableRow>
              ) : (
                suppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {supplier.name}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.contactName || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{supplier.phone || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingSupplier(supplier);
                            setIsAddOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(supplier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
