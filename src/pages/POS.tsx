import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Product, type SaleItem, type Customer } from '@/db';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, ScanLine, PauseCircle, PlayCircle, UserPlus, ShoppingBag, PackagePlus, PenLine } from 'lucide-react';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState(0);
  const [quickAddQuery, setQuickAddQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastSale, setLastSale] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const heldSales = useLiveQuery(() => db.sales.where('status').equals('hold').toArray());
  const settings = useLiveQuery(() => db.settings.toArray());
  
  const storeName = settings?.find(s => s.key === 'storeName')?.value || 'My Smart Store';
  const storeAddress = settings?.find(s => s.key === 'storeAddress')?.value || '123 Main Street';
  const storePhone = settings?.find(s => s.key === 'storePhone')?.value || 'Tel: 555-0123';
  const taxRate = parseFloat(settings?.find(s => s.key === 'taxRate')?.value || '0');
  
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

  const searchResults = useLiveQuery(
    () => {
      if (!dialogSearchQuery) return [];
      return db.products.filter(p => 
        p.name.toLowerCase().includes(dialogSearchQuery.toLowerCase()) || 
        p.barcode.includes(dialogSearchQuery)
      ).limit(50).toArray();
    },
    [dialogSearchQuery]
  );

  const categories = useLiveQuery(() => db.categories.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!quickAddQuery.trim()) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const lowerQuery = quickAddQuery.toLowerCase();
        const results = await db.products
          .filter(p => 
            p.name.toLowerCase().includes(lowerQuery) || 
            p.barcode.includes(lowerQuery)
          )
          .limit(5)
          .toArray();
        
        setSearchSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeoutId);
  }, [quickAddQuery]);

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

  const handleAddCustomItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    
    if (!name || isNaN(price)) return;

    setCart(prev => [...prev, {
      productId: -Date.now(), // Negative ID for custom items
      name,
      quantity: 1,
      price,
      discount: 0,
      total: price
    }]);
    setIsCustomItemOpen(false);
    toast.success(t('added_custom_item') || 'Added custom item');
  };

  const handleQuickAdd = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickAddQuery) {
      // Try exact barcode match first
      let product = await db.products.where('barcode').equals(quickAddQuery).first();
      
      // If not found, try exact name match
      if (!product) {
        product = await db.products.where('name').equals(quickAddQuery).first();
      }

      // If still not found, try partial name match (only if it returns exactly one result)
      if (!product) {
        const matches = await db.products
          .filter(p => p.name.toLowerCase().includes(quickAddQuery.toLowerCase()))
          .toArray();
        
        if (matches.length === 1) {
          product = matches[0];
        } else if (matches.length > 1) {
          toast.info(t('multiple_matches') || 'Multiple matches found, please be more specific');
          return;
        }
      }

      if (product) {
        addToCart(product);
        setQuickAddQuery('');
        toast.success(t('product_added'));
      } else {
        toast.error(t('product_not_found') || 'Product not found');
      }
    }
  };

  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    
    if (!name) return;

    try {
      const id = await db.customers.add({
        name,
        phone,
        email,
        points: 0,
        address: '',
        notes: ''
      } as Customer);
      
      const newCustomer = await db.customers.get(id);
      if (newCustomer) {
        setSelectedCustomer(newCustomer);
        toast.success(t('customer_added') || 'Customer added');
        setIsAddCustomerOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to add customer');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      name: formData.get('name') as string,
      barcode: formData.get('barcode') as string,
      category: formData.get('category') as string,
      price: parseFloat(formData.get('price') as string),
      cost: parseFloat(formData.get('cost') as string),
      stock: parseInt(formData.get('stock') as string),
      supplierId: formData.get('supplierId') ? parseInt(formData.get('supplierId') as string) : undefined,
    };

    try {
      await db.products.add(productData as Product);
      toast.success(t('product_added'));
      setIsAddProductOpen(false);
    } catch (error) {
      toast.error('Error saving product');
    }
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
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax - discount;

  const handleCheckout = async (method: 'cash' | 'card' | 'qr') => {
    if (cart.length === 0) return;

    try {
      const saleData = {
        date: new Date(),
        items: cart,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: method,
        customerId: selectedCustomer?.id,
        status: 'completed' as const
      };

      const saleId = await db.sales.add(saleData);
      
      // Update stock for real products (positive IDs)
      for (const item of cart) {
        if (item.productId > 0) {
          const product = await db.products.get(item.productId);
          if (product) {
            await db.products.update(item.productId, {
              stock: product.stock - item.quantity
            });
          }
        }
      }

      // Update customer points
      if (selectedCustomer) {
        await db.customers.update(selectedCustomer.id, {
          points: selectedCustomer.points + Math.floor(total)
        });
      }

      setLastSale({ ...saleData, id: saleId });
      setShowReceipt(true);

      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      toast.success(t('sale_completed'));
    } catch (error) {
      console.error(error);
      toast.error('Failed to complete sale');
    }
  };

  const printReceipt = () => {
    const content = document.getElementById('receipt-content');
    if (content) {
      const printWindow = window.open('', '', 'width=300,height=600');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write('<style>body{font-family:monospace; padding: 10px; font-size: 12px;} .text-center{text-align:center;} .flex{display:flex;justify-content:space-between;} .border-b{border-bottom:1px dashed #000; padding-bottom:5px; margin-bottom:5px;} .font-bold{font-weight:bold;} .my-2{margin: 10px 0;} table{width:100%;} td,th{text-align:left;} .text-right{text-align:right;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleHoldSale = async () => {
    if (cart.length === 0) return;
    try {
      await db.sales.add({
        date: new Date(),
        items: cart,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: 'other', // Placeholder for held sales
        customerId: selectedCustomer?.id,
        status: 'hold'
      });
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      toast.success(t('sale_held'));
    } catch (error) {
      toast.error('Failed to hold sale');
    }
  };

  const retrieveSale = async (sale: any) => {
    setCart(sale.items);
    if (sale.customerId) {
        const customer = await db.customers.get(sale.customerId);
        setSelectedCustomer(customer || null);
    } else {
        setSelectedCustomer(null);
    }
    setDiscount(sale.discount);
    await db.sales.delete(sale.id);
    toast.success(t('retrieve'));
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
          <Button variant="outline" size="icon" onClick={() => setIsSearchOpen(true)} title={t('search_product')}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setIsAddProductOpen(true)} title={t('add_product')}>
            <PackagePlus className="h-4 w-4" />
          </Button>
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
              className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md flex flex-col justify-between group relative overflow-hidden"
              onClick={() => addToCart(product)}
            >
              <div className="p-4">
                <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center text-muted-foreground overflow-hidden group-hover:scale-105 transition-transform duration-300">
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
                <span className={cn("text-xs px-2 py-1 rounded-full font-medium", product.stock > 10 ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive")}>
                  {product.stock} left
                </span>
              </div>
              
              {/* Add Button Overlay */}
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                 <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-200">
                    <Plus className="h-6 w-6" />
                 </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Side: Cart */}
      <div className="w-full lg:w-96 flex flex-col bg-card rounded-lg border shadow-sm h-full">
        <div className="p-4 border-b flex justify-between items-center bg-muted/30">
          <h2 className="font-bold text-lg flex items-center gap-2">
            {t('current_sale')}
            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              {cart.length} {t('items')}
            </span>
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCustomItemOpen(true)} title={t('custom_item')}>
              <PenLine className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleHoldSale} disabled={cart.length === 0}>
              <PauseCircle className="h-4 w-4 mr-1" />
              {t('hold')}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <PlayCircle className="h-4 w-4 mr-1" />
                  {t('retrieve')}
                  {heldSales && heldSales.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
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
                  {heldSales?.map(sale => (
                    <div key={sale.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => retrieveSale(sale)}>
                      <div>
                        <p className="font-medium">
                          {sale.customerId ? customers?.find(c => c.id === sale.customerId)?.name : 'Walk-in'}
                        </p>
                        <p className="text-xs text-muted-foreground">{sale.items.length} items • {sale.date.toLocaleTimeString()}</p>
                      </div>
                      <Button size="sm" variant="ghost">Retrieve</Button>
                    </div>
                  ))}
                  {(!heldSales || heldSales.length === 0) && <p className="text-center text-muted-foreground py-4">No held sales</p>}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="p-3 border-b bg-muted/10">
          {selectedCustomer ? (
            <div className="flex justify-between items-center bg-primary/5 p-2 rounded border border-primary/10">
              <div>
                <p className="font-medium text-primary">{selectedCustomer.name}</p>
                <p className="text-xs text-primary/80">{selectedCustomer.points} Points</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
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
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => setIsAddCustomerOpen(true)} title={t('add_customer')}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Quick Add Input */}
        <div className="p-3 border-b bg-background relative z-20">
          <div className="relative">
            <ScanLine className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground rtl:right-2 rtl:left-auto" />
            <Input
              placeholder={t('scan_barcode_or_search') || "Scan barcode or search..."}
              className="pl-8 rtl:pr-8 rtl:pl-3"
              value={quickAddQuery}
              onChange={(e) => setQuickAddQuery(e.target.value)}
              onKeyDown={handleQuickAdd}
              onFocus={() => {
                if (quickAddQuery.trim()) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay hiding to allow click event to register
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute w-full bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-auto z-50 top-full left-0">
                {searchSuggestions.map((product) => (
                  <div
                    key={product.id}
                    className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center border-b last:border-0"
                    onClick={() => {
                      addToCart(product);
                      setQuickAddQuery('');
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{product.name}</span>
                      <span className="text-xs text-muted-foreground">{product.barcode}</span>
                    </div>
                    <span className="font-medium text-sm">{formatCurrency(product.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-right min-w-[60px]">
                  <div className="font-medium">{formatCurrency(item.total)}</div>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="text-muted-foreground hover:text-destructive text-xs mt-1 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 ml-auto" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-muted/30">
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
      
      {/* Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('search_product')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground rtl:right-2 rtl:left-auto" />
              <Input
                placeholder={t('search_placeholder')}
                className="pl-8 rtl:pr-8 rtl:pl-3"
                value={dialogSearchQuery}
                onChange={(e) => setDialogSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {searchResults?.map(product => (
                <div 
                  key={product.id} 
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    addToCart(product);
                    setIsSearchOpen(false);
                    setDialogSearchQuery('');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                        {product.image ? <img src={product.image} className="h-full w-full object-cover" /> : <span className="text-xs">IMG</span>}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.barcode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(product.price)}</p>
                    <p className={cn("text-xs", product.stock > 0 ? "text-green-600" : "text-destructive")}>
                      {product.stock} {t('stock')}
                    </p>
                  </div>
                </div>
              ))}
              {dialogSearchQuery && searchResults?.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">{t('no_products')}</p>
                  <Button variant="outline" onClick={() => {
                    setIsSearchOpen(false);
                    setIsAddProductOpen(true);
                  }}>
                    {t('add_new_product')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('add_product')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('product_name')}</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="barcode">{t('barcode')}</Label>
              <Input id="barcode" name="barcode" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">{t('category')}</Label>
              <select 
                id="category" 
                name="category" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">{t('select_category')}</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supplierId">{t('supplier')}</Label>
              <select 
                id="supplierId" 
                name="supplierId" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{t('select_supplier')}</option>
                {suppliers?.map((sup) => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">{t('price')}</Label>
              <Input id="price" name="price" type="number" step="0.01" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">{t('cost')}</Label>
              <Input id="cost" name="cost" type="number" step="0.01" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">{t('stock')}</Label>
              <Input id="stock" name="stock" type="number" required />
            </div>
            <div className="col-span-2 flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">{t('save')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Item Dialog */}
      <Dialog open={isCustomItemOpen} onOpenChange={setIsCustomItemOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('add_custom_item') || 'Add Custom Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomItem} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="custom-name">{t('name')}</Label>
              <Input id="custom-name" name="name" required placeholder="Item Name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="custom-price">{t('price')}</Label>
              <Input id="custom-price" name="price" type="number" step="0.01" required placeholder="0.00" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCustomItemOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">{t('add')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('add_customer')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="customer-name">{t('name')}</Label>
              <Input id="customer-name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">{t('phone')}</Label>
              <Input id="customer-phone" name="phone" type="tel" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email">{t('email')}</Label>
              <Input id="customer-email" name="email" type="email" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddCustomerOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">{t('save')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('receipt') || 'Receipt'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto border p-4 rounded bg-white text-black" id="receipt-content">
            {lastSale && (
              <div className="space-y-2 text-sm">
                <div className="text-center border-b pb-2">
                  <h3 className="font-bold text-lg">{storeName}</h3>
                  <p>{storeAddress}</p>
                  <p>{storePhone}</p>
                  <p className="text-xs mt-1">{new Date(lastSale.date).toLocaleString()}</p>
                  <p className="text-xs">Receipt #{lastSale.id}</p>
                </div>
                
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left">Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastSale.items.map((item: any, i: number) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{lastSale.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>{lastSale.tax.toFixed(2)}</span>
                  </div>
                  {lastSale.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{lastSale.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-1 mt-1">
                    <span>Total:</span>
                    <span>{lastSale.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center text-xs mt-4 pt-2 border-t">
                  <p>Payment: {lastSale.paymentMethod.toUpperCase()}</p>
                  <p className="mt-1">Thank you for your business!</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowReceipt(false)}>
              {t('close') || 'Close'}
            </Button>
            <Button onClick={printReceipt}>
              {t('print') || 'Print'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
