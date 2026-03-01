import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Product, type SaleItem } from '@/db';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, ScanLine } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

export function POS() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<SaleItem[]>([]);
  
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
    toast.success(`Added ${product.name} to cart`);
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
  const total = subtotal + tax;

  const handleCheckout = async (method: 'cash' | 'card' | 'qr') => {
    if (cart.length === 0) return;

    try {
      await db.sales.add({
        date: new Date(),
        items: cart,
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod: method,
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

      setCart([]);
      toast.success('Sale completed successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to complete sale');
    }
  };

  // Barcode scanner listener (simple keyboard listener)
  useEffect(() => {
    let barcode = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (barcode) {
          const product = products?.find(p => p.barcode === barcode);
          if (product) {
            addToCart(product);
            setSearchQuery(''); // Clear search if it was focused
          }
          barcode = '';
        }
      } else if (e.key.length === 1) {
        barcode += e.key;
      }
    };
    
    // Only listen if not focused on input
    // window.addEventListener('keydown', handleKeyDown);
    // return () => window.removeEventListener('keydown', handleKeyDown);
    // Commented out to avoid conflict with search input for now
  }, [products]);

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4">
      {/* Left Side: Products */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Header / Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or scan barcode..."
              className="pl-8"
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
            All Items
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
                <div className="aspect-square bg-slate-100 rounded-md mb-2 flex items-center justify-center text-slate-400">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-md" />
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
      <div className="w-96 flex flex-col bg-white rounded-lg border shadow-sm h-full">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg flex items-center gap-2">
            Current Sale
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full ml-auto">
              {cart.length} items
            </span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <ShoppingBag className="h-12 w-12 mb-2" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex gap-3 items-start">
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
                    className="text-red-500 hover:text-red-700 text-xs mt-1"
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
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button className="flex flex-col h-16 gap-1" variant="outline" onClick={() => handleCheckout('cash')}>
              <Banknote className="h-5 w-5" />
              <span className="text-xs">Cash</span>
            </Button>
            <Button className="flex flex-col h-16 gap-1" variant="outline" onClick={() => handleCheckout('card')}>
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">Card</span>
            </Button>
            <Button className="flex flex-col h-16 gap-1" variant="outline" onClick={() => handleCheckout('qr')}>
              <QrCode className="h-5 w-5" />
              <span className="text-xs">QR</span>
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
