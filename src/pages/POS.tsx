import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Product, type SaleItem, type Customer } from '@/db';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, ScanLine, PauseCircle, PlayCircle, UserPlus } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";

export function POS() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState(0);
  const [heldSales, setHeldSales] = useState<{id: number, date: Date, items: SaleItem[], customer?: Customer}[]>([]);
  
  const products = useLiveQuery(
    () => {
      let collection = db.products.toCollection();
      if (selectedCategory) {
        collection = db.products.where('category').equals(selectedCategory);
      }
      return collection.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.barcode.includes(searchQuery)
      ).toArray();
    },
    [searchQuery, selectedCategory]
  );

  const categories = useLiveQuery(() => db.categories.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
        discount: 0,
        total: product.price
      }];
    });
    toast.success(`${t('add_product')}: ${product.name}`);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity, total: newQuantity * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax - discount;

  const handleCheckout = async (method: 'cash' | 'card' | 'qr') => {
    if (cart.length === 0) return;

    try {
      await db.sales.add({
        date: new Date(),
        items: cart,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: method,
        customerId: selectedCustomer?.id,
        status: 'completed'
      });
      
      // Update stock
      for (const item of cart) {
        const product = await db.products.get(item.productId);
        if (product) {
          await db.products.update(item.productId, {
            stock: product.stock - item.quantity
          });
        }
      }

      // Update customer points
      if (selectedCustomer) {
        await db.customers.update(selectedCustomer.id, {
          points: selectedCustomer.points + Math.floor(total)
        });
      }

      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      toast.success(t('sale_completed'));
    } catch (error) {
      console.error(error);
      toast.error('Failed to complete sale');
    }
  };

  const handleHoldSale = () => {
    if (cart.length === 0) return;
    const holdId = Date.now();
    setHeldSales(prev => [...prev, { id: holdId, date: new Date(), items: cart, customer: selectedCustomer || undefined }]);
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    toast.success(t('sale_held'));
  };

  const retrieveSale = (id: number) => {
    const sale = heldSales.find(s => s.id === id);
    if (sale) {
      setCart(sale.items);
      setSelectedCustomer(sale.customer || null);
      setHeldSales(prev => prev.filter(s => s.id !== id));
      toast.success(t('retrieve'));
    }
  };

  // Barcode scanner listener
  useEffect(() => {
    let barcode = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (barcode) {
          const product = products?.find(p => p.barcode === barcode);
          if (product) {
            addToCart(product);
            setSearchQuery('');
          }
          barcode = '';
        }
      } else if (e.key.length === 1) {
        barcode += e.key;
      }
    };
    
    // window.addEventListener('keydown', handleKeyDown);
    // return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-4">
      {/* Left Side: Products */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Header / Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground rtl:right-2 rtl:left-auto" />
            <Input
              placeholder={t('search_placeholder')}
              className="pl-8 rtl:pr-8 rtl:pl-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <Button variant="outline" size="icon">
            <ScanLine className="h-4 w-4" />
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button 
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="whitespace-nowrap"
          >
            {t('all_items')}
          </Button>
          {categories?.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.name ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.name)}
              className="whitespace-nowrap"
              style={{ borderColor: selectedCategory === cat.name ? cat.color : undefined }}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-20">
          {products?.map(product => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:border-primary transition-colors flex flex-col justify-between"
              onClick={() => addToCart(product)}
            >
              <div className="p-4">
                <div className="aspect-square bg-slate-100 rounded-md mb-2 flex items-center justify-center text-slate-400 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs">No Image</span>
                  )}
                </div>
                <h3 className="font-medium truncate" title={product.name}>{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.category}</p>
              </div>
              <div className="p-4 pt-0 flex justify-between items-center mt-auto">
                <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
                <span className={cn("text-xs px-2 py-1 rounded-full", product.stock > 10 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                  {product.stock} left
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Side: Cart */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-lg border shadow-sm h-full">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg flex items-center gap-2">
            {t('current_sale')}
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              {cart.length} {t('items')}
            </span>
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleHoldSale} disabled={cart.length === 0}>
              <PauseCircle className="h-4 w-4 mr-1" />
              {t('hold')}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <PlayCircle className="h-4 w-4 mr-1" />
                  {t('retrieve')}
                  {heldSales.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {heldSales.length}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Held Sales</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  {heldSales.map(sale => (
                    <div key={sale.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => retrieveSale(sale.id)}>
                      <div>
                        <p className="font-medium">{sale.customer?.name || 'Walk-in'}</p>
                        <p className="text-xs text-muted-foreground">{sale.items.length} items • {sale.date.toLocaleTimeString()}</p>
                      </div>
                      <Button size="sm" variant="ghost">Retrieve</Button>
                    </div>
                  ))}
                  {heldSales.length === 0 && <p className="text-center text-muted-foreground py-4">No held sales</p>}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="p-3 border-b bg-slate-50/50">
          {selectedCustomer ? (
            <div className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100">
              <div>
                <p className="font-medium text-blue-900">{selectedCustomer.name}</p>
                <p className="text-xs text-blue-700">{selectedCustomer.points} Points</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)} className="h-6 w-6 p-0">
                <Trash2 className="h-3 w-3 text-blue-700" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select 
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => {
                  const customer = customers?.find(c => c.id === Number(e.target.value));
                  if (customer) setSelectedCustomer(customer);
                }}
                value=""
              >
                <option value="" disabled>{t('add_customer')}</option>
                {customers?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Button variant="outline" size="icon" className="shrink-0">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <ShoppingBag className="h-12 w-12 mb-2" />
              <p>{t('empty_cart')}</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-200">
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(item.price)} x {item.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-4 text-center text-sm">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-right min-w-[60px]">
                  <div className="font-medium">{formatCurrency(item.total)}</div>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-500 hover:text-red-700 text-xs mt-1 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 ml-auto" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-slate-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('subtotal')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('tax')} (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">{t('discount')}</span>
              <div className="flex items-center gap-1 w-24">
                <Input 
                  type="number" 
                  value={discount} 
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="h-6 text-right px-1"
                />
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>{t('total')}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button className="flex flex-col h-16 gap-1" variant="outline" onClick={() => handleCheckout('cash')}>
              <Banknote className="h-5 w-5" />
              <span className="text-xs">{t('cash')}</span>
            </Button>
            <Button className="flex flex-col h-16 gap-1" variant="outline" onClick={() => handleCheckout('card')}>
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">{t('card')}</span>
            </Button>
            <Button className="flex flex-col h-16 gap-1" variant="outline" onClick={() => handleCheckout('qr')}>
              <QrCode className="h-5 w-5" />
              <span className="text-xs">{t('qr')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShoppingBag(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
