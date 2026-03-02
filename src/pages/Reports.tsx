import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';
import { format, subDays, isSameDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/Button';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Reports() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'7days' | '30days' | 'month' | 'all'>('7days');

  const sales = useLiveQuery(() => db.sales.toArray());
  const products = useLiveQuery(() => db.products.toArray());
  const expenses = useLiveQuery(() => db.expenses.toArray());

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    const now = new Date();
    let startDate = subDays(now, 7);

    if (period === '30days') startDate = subDays(now, 30);
    if (period === 'month') startDate = startOfMonth(now);
    if (period === 'all') return sales;

    return sales.filter(s => s.date >= startDate);
  }, [sales, period]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    const now = new Date();
    let startDate = subDays(now, 7);

    if (period === '30days') startDate = subDays(now, 30);
    if (period === 'month') startDate = startOfMonth(now);
    if (period === 'all') return expenses;

    return expenses.filter(e => e.date >= startDate);
  }, [expenses, period]);

  const financialSummary = useMemo(() => {
    if (!filteredSales || !products || !filteredExpenses) return { revenue: 0, cost: 0, expenses: 0, profit: 0 };

    const revenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate COGS (Cost of Goods Sold)
    const productCostMap = new Map(products.map(p => [p.id, p.cost]));
    const cogs = filteredSales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        const cost = productCostMap.get(item.productId) || 0;
        return itemSum + (cost * item.quantity);
      }, 0);
    }, 0);

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = revenue - cogs - totalExpenses;

    return { revenue, cost: cogs, expenses: totalExpenses, profit };
  }, [filteredSales, products, filteredExpenses]);

  const salesTrend = useMemo(() => {
    if (!filteredSales) return [];
    const data: any[] = [];
    const grouped = new Map();

    filteredSales.forEach(sale => {
      const dateStr = format(sale.date, 'yyyy-MM-dd');
      if (!grouped.has(dateStr)) grouped.set(dateStr, 0);
      grouped.set(dateStr, grouped.get(dateStr) + sale.total);
    });

    grouped.forEach((total, date) => {
      data.push({ date, total });
    });

    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredSales]);

  const salesByCategory = useMemo(() => {
    if (!filteredSales || !products) return [];
    
    const productCategoryMap = new Map(products.map(p => [p.id, p.category]));
    const grouped = new Map();

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const category = productCategoryMap.get(item.productId) || 'Unknown';
        if (!grouped.has(category)) grouped.set(category, 0);
        grouped.set(category, grouped.get(category) + item.total);
      });
    });

    const data: any[] = [];
    grouped.forEach((value, name) => {
      data.push({ name, value });
    });

    return data;
  }, [filteredSales, products]);

  const topProducts = useMemo(() => {
    if (!filteredSales) return [];
    const grouped = new Map();

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!grouped.has(item.name)) grouped.set(item.name, 0);
        grouped.set(item.name, grouped.get(item.name) + item.quantity);
      });
    });

    const data: any[] = [];
    grouped.forEach((quantity, name) => {
      data.push({ name, quantity });
    });

    return data.sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('reports')}</h2>
        <div className="flex gap-2">
          <Button variant={period === '7days' ? 'default' : 'outline'} onClick={() => setPeriod('7days')}>{t('last_7_days')}</Button>
          <Button variant={period === '30days' ? 'default' : 'outline'} onClick={() => setPeriod('30days')}>{t('last_30_days')}</Button>
          <Button variant={period === 'month' ? 'default' : 'outline'} onClick={() => setPeriod('month')}>{t('this_month')}</Button>
          <Button variant={period === 'all' ? 'default' : 'outline'} onClick={() => setPeriod('all')}>{t('all_time')}</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_revenue') || 'Total Revenue'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('cogs') || 'COGS'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(financialSummary.cost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('expenses') || 'Expenses'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.expenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('net_profit') || 'Net Profit'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", financialSummary.profit >= 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(financialSummary.profit)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t('daily_sales')}</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} name={t('revenue')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('sales_by_category')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('top_products')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#82ca9d" name={t('count')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
