import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Employee } from '@/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Plus, Search, Trash2, Edit, UserCog, ShieldCheck, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function Employees() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    role: 'cashier',
    pin: '',
    active: true,
  });

  const employees = useLiveQuery(
    () => db.employees
      .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .toArray(),
    [searchQuery]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await db.employees.update(editingEmployee.id, formData);
        toast.success(t('employee_saved'));
      } else {
        await db.employees.add({
          name: formData.name!,
          role: formData.role || 'cashier',
          pin: formData.pin || '0000',
          active: formData.active !== undefined ? formData.active : true,
        } as Employee);
        toast.success(t('employee_saved'));
      }
      setIsDialogOpen(false);
      setEditingEmployee(null);
      setFormData({ name: '', role: 'cashier', pin: '', active: true });
    } catch (error) {
      toast.error('Error saving employee');
      console.error(error);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData(employee);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('confirm_delete_employee'))) {
      await db.employees.delete(id);
      toast.success(t('delete'));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="h-4 w-4 text-purple-600" />;
      case 'manager': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <User className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('employees')}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingEmployee(null); setFormData({ name: '', role: 'cashier', pin: '', active: true }); }}>
              <Plus className="mr-2 h-4 w-4" /> {t('add_employee')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEmployee ? t('edit') : t('add_employee')}</DialogTitle>
              <DialogDescription>
                {t('add_new_employee')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">{t('role')}</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                >
                  <option value="admin">{t('role_admin')}</option>
                  <option value="manager">{t('role_manager')}</option>
                  <option value="cashier">{t('role_cashier')}</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pin">{t('pin_code')}</Label>
                <Input
                  id="pin"
                  type="password"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  required
                  maxLength={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="active">{t('active')}</Label>
              </div>
              <DialogFooter>
                <Button type="submit">{t('save')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('role')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                    {getRoleIcon(employee.role)}
                  </div>
                  {employee.name}
                </TableCell>
                <TableCell className="capitalize">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    employee.role === 'admin' ? "bg-purple-100 text-purple-800" :
                    employee.role === 'manager' ? "bg-blue-100 text-blue-800" :
                    "bg-slate-100 text-slate-800"
                  )}>
                    {t(`role_${employee.role}`)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    employee.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}>
                    {employee.active ? t('active') : t('inactive')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(employee.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {employees?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {t('no_employees')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
