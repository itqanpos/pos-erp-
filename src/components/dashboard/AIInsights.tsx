import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { generateInsights } from '@/services/ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

export function AIInsights() {
  const { t } = useTranslation();
  const sales = useLiveQuery(() => db.sales.toArray());
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!sales || sales.length === 0) {
      setInsights([t('no_sales')]);
      return;
    }
    
    setLoading(true);
    try {
      const result = await generateInsights(sales);
      if (result.insights) setInsights(result.insights);
      if (result.recommendation) setRecommendation(result.recommendation);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="col-span-4 lg:col-span-3 bg-gradient-to-br from-primary/5 to-accent/20 border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('ai_insights')}
        </CardTitle>
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-background/50 hover:bg-background border-primary/20 text-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? t('analyzing') : t('generate_insights')}
        </Button>
      </CardHeader>
      <CardContent>
        {insights.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i} className="flex gap-2 items-start text-sm text-muted-foreground">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <p>{insight}</p>
                </div>
              ))}
            </div>
            {recommendation && (
              <div className="bg-background/60 p-3 rounded-lg border border-primary/10 flex gap-3 items-start">
                <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground text-sm mb-1">{t('recommendation')}</h4>
                  <p className="text-sm text-muted-foreground">{recommendation}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground/50 text-sm">
            {t('generate_insights')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
