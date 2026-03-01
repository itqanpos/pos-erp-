import { Button } from '@/components/ui/Button';
import { db } from '@/db';
import { toast } from 'sonner';

export function Settings() {
  const handleReset = async () => {
    if (confirm('Are you sure? This will delete all data and reset to defaults.')) {
      await db.delete();
      await db.open();
      // Trigger populate
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <h3 className="text-lg font-medium text-red-800">Danger Zone</h3>
        <p className="text-sm text-red-600 mb-4">
          Resetting the database will clear all sales, products, and customers.
        </p>
        <Button variant="destructive" onClick={handleReset}>
          Reset Database
        </Button>
      </div>
    </div>
  );
}
