import { Button } from '@/components/ui/Button';
import { db } from '@/db';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Globe, Database, Trash2 } from 'lucide-react';

export function Settings() {
  const { t, i18n } = useTranslation();

  const handleReset = async () => {
    if (confirm(t('confirm_delete'))) {
      await db.delete();
      await db.open();
      // Trigger populate
      window.location.reload();
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Force reload to ensure all components update direction
    // window.location.reload(); 
    // Actually react-i18next handles re-render, but direction change might need layout re-calc
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
