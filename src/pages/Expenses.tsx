import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Expense } from '@/db';
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
import { Plus, Search, Pencil, Trash2, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export function Expenses() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const isRtl = i18n.dir() === 'rtl';

  const expenses = useLiveQuery(
    () =>
      db.expenses
        .orderBy('date')
        .reverse()
        .filter((expense) =>
          expense.description.toLowerCase().includes(search.toLowerCase()) ||
          expense.category.toLowerCase().includes(search.toLowerCase())
        )
        .toArray(),
    [search]
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const expenseData = {
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as string,
      date: new Date(formData.get('date') as string),
      paymentMethod: formData.get('paymentMethod') as 'cash' | 'card' | 'bank_transfer' | 'other',
      notes: formData.get('notes') as string,
    };

    try {
      if (editingExpense) {
        await db.expenses.update(editingExpense.id!, expenseData);
        toast.success(t('expense_updated') || 'Expense updated');
      } else {
        await db.expenses.add(expenseData);
        toast.success(t('expense_added') || 'Expense added');
      }
      setIsAddOpen(false);
      setEditingExpense(null);
    } catch (error) {
      toast.error('Error saving expense');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('confirm_delete_expense') || 'Are you sure you want to delete this expense?')) {
      await db.expenses.delete(id);
      toast.success(t('expense_deleted') || 'Expense deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('expenses') || 'Expenses'}</h2>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setEditingExpense(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t('add_expense') || 'Add Expense'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? (t('edit_expense') || 'Edit Expense') : (t('add_expense') || 'Add Expense')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="description">{t('description') || 'Description'}</Label>
                <Input id="description" name="description" defaultValue={editingExpense?.description} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">{t('amount') || 'Amount'}</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editingExpense?.amount} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">{t('category') || 'Category'}</Label>
                  <select 
                    id="category" 
                    name="category" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={editingExpense?.category || 'Rent'}
                  >
                    <option value="Rent">{t('rent') || 'Rent'}</option>
                    <option value="Utilities">{t('utilities') || 'Utilities'}</option>
                    <option value="Salaries">{t('salaries') || 'Salaries'}</option>
                    <option value="Inventory">{t('inventory') || 'Inventory'}</option>
                    <option value="Maintenance">{t('maintenance') || 'Maintenance'}</option>
                    <option value="Other">{t('other') || 'Other'}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">{t('date') || 'Date'}</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    defaultValue={editingExpense?.date ? format(editingExpense.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')} 
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod">{t('payment_method') || 'Payment Method'}</Label>
                  <select 
                    id="paymentMethod" 
                    name="paymentMethod" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={editingExpense?.paymentMethod || 'cash'}
                  >
                    <option value="cash">{t('cash') || 'Cash'}</option>
                    <option value="card">{t('card') || 'Card'}</option>
                    <option value="bank_transfer">{t('bank_transfer') || 'Bank Transfer'}</option>
                    <option value="other">{t('other') || 'Other'}</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{t('notes') || 'Notes'}</Label>
                <Input id="notes" name="notes" defaultValue={editingExpense?.notes} />
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
            placeholder={t('search_expenses') || 'Search expenses...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(isRtl ? "pr-8" : "pl-8")}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('expense_history') || 'Expense History'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date') || 'Date'}</TableHead>
                <TableHead>{t('description') || 'Description'}</TableHead>
                <TableHead>{t('category') || 'Category'}</TableHead>
                <TableHead>{t('payment_method') || 'Payment Method'}</TableHead>
                <TableHead className="text-right">{t('amount') || 'Amount'}</TableHead>
                <TableHead className="text-right">{t('actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t('no_expenses') || 'No expenses found'}
                  </TableCell>
                </TableRow>
              ) : (
                expenses?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(expense.date, 'PP')}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{expense.paymentMethod.replace('_', ' ')}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsAddOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(expense.id!)}
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
