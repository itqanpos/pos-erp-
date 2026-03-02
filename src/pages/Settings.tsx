import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { db } from '@/db';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Globe, Database, Trash2, Store, Printer, Save } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

export function Settings() {
  const { t, i18n } = useTranslation();
  const settings = useLiveQuery(() => db.settings.toArray());
  
  const [storeInfo, setStoreInfo] = useState({
    name: '',
    address: '',
    phone: '',
    taxRate: '0',
  });

  useEffect(() => {
    if (settings) {
      const name = settings.find(s => s.key === 'storeName')?.value || '';
      const address = settings.find(s => s.key === 'storeAddress')?.value || '';
      const phone = settings.find(s => s.key === 'storePhone')?.value || '';
      const taxRate = settings.find(s => s.key === 'taxRate')?.value || '0';
      setStoreInfo({ name, address, phone, taxRate });
    }
  }, [settings]);

  const handleSaveStoreInfo = async () => {
    await db.settings.put({ key: 'storeName', value: storeInfo.name });
    await db.settings.put({ key: 'storeAddress', value: storeInfo.address });
    await db.settings.put({ key: 'storePhone', value: storeInfo.phone });
    await db.settings.put({ key: 'taxRate', value: storeInfo.taxRate });
    toast.success(t('settings_saved'));
  };

  const handleReset = async () => {
    if (confirm(t('confirm_delete'))) {
      await db.delete();
      window.location.reload();
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">{t('settings')}</h2>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('language')}
            </CardTitle>
            <CardDescription>{t('select_language')}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button 
              variant={i18n.language === 'en' ? 'default' : 'outline'}
              onClick={() => changeLanguage('en')}
            >
              English
            </Button>
            <Button 
              variant={i18n.language === 'ar' ? 'default' : 'outline'}
              onClick={() => changeLanguage('ar')}
              className="font-arabic"
            >
              العربية
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {t('store_info')}
            </CardTitle>
            <CardDescription>{t('store_info')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="storeName">{t('store_name')}</Label>
              <Input 
                id="storeName" 
                value={storeInfo.name} 
                onChange={(e) => setStoreInfo({...storeInfo, name: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="storeAddress">{t('store_address')}</Label>
              <Input 
                id="storeAddress" 
                value={storeInfo.address} 
                onChange={(e) => setStoreInfo({...storeInfo, address: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="storePhone">{t('store_phone')}</Label>
              <Input 
                id="storePhone" 
                value={storeInfo.phone} 
                onChange={(e) => setStoreInfo({...storeInfo, phone: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxRate">{t('tax_rate')} (%)</Label>
              <Input 
                id="taxRate" 
                type="number"
                min="0"
                step="0.1"
                value={storeInfo.taxRate} 
                onChange={(e) => setStoreInfo({...storeInfo, taxRate: e.target.value})} 
              />
            </div>
            <Button onClick={handleSaveStoreInfo} className="gap-2">
              <Save className="h-4 w-4" />
              {t('save_settings')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              {t('printer_settings')}
            </CardTitle>
            <CardDescription>{t('connect_printer')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Thermal Printer (USB)</p>
                <p className="text-sm text-muted-foreground">Not connected</p>
              </div>
              <Button variant="outline" onClick={() => toast.info('Printer connection simulation started')}>
                {t('connect_printer')}
              </Button>
            </div>
            <Button variant="secondary" onClick={() => toast.success('Test page printed')} className="w-full">
              {t('test_print')}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Database className="h-5 w-5" />
              {t('danger_zone')}
            </CardTitle>
            <CardDescription className="text-red-600">
              {t('reset_db')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleReset} className="gap-2">
              <Trash2 className="h-4 w-4" />
              {t('reset_db')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
