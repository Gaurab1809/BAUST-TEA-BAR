import { useState, useMemo } from "react";
import { ShoppingCart, Plus, Minus, Calendar, AlertCircle, Ban, ArrowRight, Utensils, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useAppState } from "@/lib/app-state";
import { WORKING_DAYS, DayOfWeek, MenuItem, OrderItem } from "@/lib/mock-data";

const ORDER_CUTOFF_HOUR = 17;

function getNextWorkingDays(): { date: Date; dayName: DayOfWeek; disabled: boolean }[] {
  const days: { date: Date; dayName: DayOfWeek; disabled: boolean }[] = [];
  const now = new Date();
  for (let i = 1; i <= 14 && days.length < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const name = d.toLocaleDateString("en-US", { weekday: "long" }) as string;
    if (WORKING_DAYS.includes(name as DayOfWeek)) {
      const disabled = i === 1 && now.getHours() >= ORDER_CUTOFF_HOUR;
      days.push({ date: d, dayName: name as DayOfWeek, disabled });
    }
  }
  return days.slice(0, 5);
}

export default function OrderPage() {
  const { user } = useAuth();
  const { menuItems, placeOrder, users } = useAppState();

  const appUser = users.find(u => u.id === user?.id);
  const isBlocked = appUser?.blocked === "ordering" || appUser?.blocked === "full";
  const workingDays = useMemo(() => getNextWorkingDays(), []);
  
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => {
    const firstEnabled = workingDays.findIndex(d => !d.disabled);
    return firstEnabled >= 0 ? firstEnabled : 0;
  });
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedDay = workingDays[selectedDayIdx];
  const _d = selectedDay.date;
  const dateStr = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}T12:00:00`;

  const availableItems = menuItems.filter(item => 
    item.availableDays.includes(selectedDay.dayName) &&
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item: MenuItem) => {
    if (selectedDay.disabled) { toast.error("Ordering closed (past 5 PM)"); return; }
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    toast.success(`${item.name} added`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => c.menuItem.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handlePlaceOrder = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (selectedDay.disabled) { toast.error("Ordering closed"); return; }
    if (isBlocked) { toast.error("Ordering blocked by admin"); return; }
    if (!user) return;
    placeOrder(user.id, user.name, cart, dateStr, selectedDay.dayName);
    toast.success(`Order placed for ${selectedDay.dayName}!`);
    setCart([]);
    setCartOpen(false);
  };

  return (
    <div className="container max-w-5xl py-6 px-4 animate-in fade-in min-h-screen">
      {/* Header remain unchanged */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Menu
          </h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">
            Secure your meals ahead of time.
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20">
            <AlertCircle className="h-3 w-3" /> 5:00 PM cutoff for next-day
          </div>
        </div>

        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
             {/* ... cart button ... */}
            <Button className="fixed bottom-6 right-6 z-50 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] h-14 w-14 sm:w-auto sm:px-6 bg-gradient-to-r from-primary to-accent text-primary-foreground transition-all hover:scale-105 active:scale-95 border-none dark:shadow-[0_8px_30px_rgba(255,255,255,0.1)] focus:outline-none">
              <ShoppingCart className="h-6 w-6 sm:h-5 sm:w-5 sm:mr-2" /> 
              <span className="font-bold text-sm hidden sm:inline">View Cart</span>
              {cartCount > 0 && <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground border-2 border-background shadow-sm rounded-full">{cartCount}</Badge>}
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col w-full sm:max-w-sm rounded-l-2xl border-l-0 shadow-xl p-5">
            <SheetHeader className="pb-3 border-b">
              <SheetTitle className="font-heading text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Active Cart
              </SheetTitle>
              <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 bg-primary/10 text-primary rounded-lg font-medium text-xs border border-primary/20">
                <Calendar className="h-3 w-3" />
                Delivery: <span className="font-bold">{selectedDay.dayName}, {selectedDay.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                   <Utensils className="h-10 w-10 mb-3 text-muted-foreground" />
                   <p className="text-base font-bold font-heading">Cart is empty</p>
                </div>
              ) : (
                cart.map(c => (
                  <div key={c.menuItem.id} className="flex items-center justify-between p-3 rounded-xl border bg-card shadow-sm">
                    <div className="flex items-center gap-2.5 w-1/2">
                       <img src={c.menuItem.image} alt="" className="w-10 h-10 rounded-md object-cover shadow-sm" />
                       <div>
                         <p className="font-bold text-xs leading-tight line-clamp-2">{c.menuItem.name}</p>
                         <p className="text-[11px] font-semibold text-primary mt-0.5">৳{c.menuItem.price} /ea</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full border">
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/20 text-foreground" onClick={() => updateQuantity(c.menuItem.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="text-xs w-3 text-center font-bold">{c.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/20 text-foreground" onClick={() => updateQuantity(c.menuItem.id, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {cart.length > 0 && (
              <SheetFooter className="border-t pt-4 flex flex-col gap-3 pb-2">
                <div className="flex justify-between items-center bg-muted/40 p-3 rounded-xl">
                   <span className="text-sm text-muted-foreground font-semibold">Total Amount</span>
                   <span className="text-2xl font-extrabold font-heading text-primary">৳{cartTotal}</span>
                </div>
                <Button className="w-full h-11 rounded-full font-bold shadow-md bg-gradient-to-r from-emerald-500 to-teal-500 border-none relative overflow-hidden" onClick={handlePlaceOrder}>
                   Place Order <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {isBlocked && (
        <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-sm">
          <Ban className="h-5 w-5 flex-shrink-0" />
          <p className="font-medium">Your ordering privileges have been suspended.</p>
        </div>
      )}

      {/* Date Carousel */}
      <div className="mb-8 relative">
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scroll-indicator">
           {/* carousel buttons */}
           {workingDays.map((day, idx) => {
             const isSelected = idx === selectedDayIdx;
             return (
               <button
                 key={idx} onClick={() => { if (!day.disabled) { setSelectedDayIdx(idx); setCart([]); } }} disabled={day.disabled}
                 className={`snap-start flex flex-col items-center justify-center flex-shrink-0 w-24 h-28 rounded-2xl border transition-all relative overflow-hidden ${
                   day.disabled ? "opacity-50 cursor-not-allowed bg-muted/50 grayscale" : isSelected ? "bg-gradient-to-b from-primary to-accent text-white shadow-md shadow-primary/20 scale-[1.02] border-transparent" : "bg-card text-foreground hover:border-primary/40 cursor-pointer"
                 }`}
               >
                 <div className="relative z-10 text-center">
                   <p className={`text-[11px] mb-0.5 ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>{day.date.toLocaleDateString("en-US", { month: "short" })}</p>
                   <p className="text-3xl font-extrabold font-heading mb-0.5 leading-none">{day.date.getDate()}</p>
                   <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-foreground'}`}>{day.dayName.slice(0,3)}</p>
                 </div>
                 {day.disabled && <div className="absolute inset-x-0 bottom-0 bg-destructive/80 text-white text-[9px] font-bold uppercase py-0.5 text-center">Locked</div>}
               </button>
             );
           })}
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <span className="text-primary">{selectedDay.dayName}</span> Menu
          </h2>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-9 h-10 rounded-xl bg-card border-border/50 text-sm" 
            />
          </div>
        </div>

        {availableItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-card/50 border rounded-2xl border-dashed">
             <Utensils className="h-10 w-10 mb-3 text-muted-foreground opacity-50" />
             <h3 className="text-lg font-bold font-heading mt-2">{searchQuery ? "No matching items" : "Menu Exhausted"}</h3>
             <p className="text-muted-foreground text-sm mt-1">{searchQuery ? "Try a different search." : "No items scheduled for this day."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {/* Menu Items */}
             {availableItems.map((item, idx) => {
               const inCart = cart.find(c => c.menuItem.id === item.id);
               return (
                 <Card key={item.id} className={`overflow-hidden relative flex flex-col group transition-all duration-300 border bg-card rounded-2xl ${inCart ? 'ring-1 ring-primary shadow-md' : 'shadow-sm'}`}>
                   <div className="h-36 overflow-hidden relative">
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                     <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <Badge className="absolute top-2 left-2 z-20 bg-background/90 text-foreground border-none font-bold px-2 py-0.5 text-[10px] uppercase">{item.category}</Badge>
                     <Badge className="absolute top-2 right-2 z-20 bg-primary text-primary-foreground border-none font-bold text-sm px-2.5 py-0.5 rounded-full">৳{item.price}</Badge>
                     <h3 className="absolute bottom-2 left-3 right-3 z-20 text-white font-bold font-heading text-lg leading-tight drop-shadow-md line-clamp-1">{item.name}</h3>
                   </div>
                   
                   <CardContent className="p-4 flex flex-col justify-between flex-1 gap-4">
                     <p className="text-xs text-muted-foreground line-clamp-2 h-8">{item.description}</p>
                     
                     <div>
                       {inCart ? (
                         <div className="flex items-center justify-between bg-primary/5 p-1.5 rounded-xl border border-primary/20">
                           <div className="flex items-center gap-1.5 bg-background shadow-sm rounded-full p-0.5 border">
                             <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-foreground hover:bg-black/10 dark:hover:bg-white/20" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                             <span className="w-4 text-center font-bold text-sm">{inCart.quantity}</span>
                             <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-primary bg-primary/10 hover:bg-primary hover:text-white dark:hover:bg-primary/50" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                           </div>
                           <span className="text-sm font-extrabold font-heading text-primary mr-2">৳{item.price * inCart.quantity}</span>
                         </div>
                       ) : (
                         <Button className="w-full rounded-xl h-10 shadow-sm text-sm font-semibold" variant="secondary" onClick={() => addToCart(item)} disabled={selectedDay.disabled || isBlocked}>
                           <Plus className="h-4 w-4 mr-1.5" /> Add
                         </Button>
                       )}
                     </div>
                   </CardContent>
                 </Card>
               );
             })}
          </div>
        )}
      </div>
    </div>
  );
}
