import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Plus, Minus, Calendar, AlertCircle, Ban, ArrowRight, Utensils, Search, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useAppState } from "@/lib/app-state";
import { WORKING_DAYS, DayOfWeek, MenuItem, OrderItem } from "@/lib/mock-data";

const ORDER_CUTOFF_HOUR = 17;

function getNextWorkingDays(): { date: Date; dayName: DayOfWeek; disabled: boolean }[] {
  const days: { date: Date; dayName: DayOfWeek; disabled: boolean }[] = [];
  const now = new Date();
  for (let i = 1; i <= 40 && days.length < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const name = d.toLocaleDateString("en-US", { weekday: "long" }) as string;
    if (WORKING_DAYS.includes(name as DayOfWeek)) {
      const disabled = i === 1 && now.getHours() >= ORDER_CUTOFF_HOUR;
      days.push({ date: d, dayName: name as DayOfWeek, disabled });
    }
  }
  return days;
}

export default function Index() {
  const { user, isAdmin, isTopManagement } = useAuth();
  const { menuItems: rawMenu, placeMultiDayOrder, users } = useAppState();
  const menuItems = (Array.isArray(rawMenu) ? rawMenu : Object.values(rawMenu || {})).filter(Boolean);

  const appUser = users.find(u => u.id === user?.id);
  const isBlocked = appUser?.blocked === "ordering" || appUser?.blocked === "full";
  const workingDays = useMemo(() => getNextWorkingDays(), []);
  
  const todayDate = new Date();
  
  // Format for min/max date inputs (YYYY-MM-DD)
  const currentYear = todayDate.getFullYear();
  const currentMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
  const minDateStr = `${currentYear}-${currentMonth}-01`;
  const lastDay = new Date(currentYear, todayDate.getMonth() + 1, 0).getDate();
  const maxDateStr = `${currentYear}-${currentMonth}-${String(lastDay).padStart(2, '0')}`;
  
  interface SmartCartItem {
    menuItem: MenuItem;
    quantity: number;
    activeDates: string[]; // ISO date strings
    sugarOption?: "Sugar" | "No Sugar";
  }

  const [orderMode, setOrderMode] = useState<"multiple" | "range">("multiple");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({ from: undefined, to: undefined });

  const [cart, setCart] = useState<SmartCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teaSugarPrefs, setTeaSugarPrefs] = useState<Record<string, boolean>>({});

  const getSugarPref = (itemId: string) => teaSugarPrefs[itemId] ?? true;
  const toggleSugarPref = (itemId: string) => setTeaSugarPrefs(p => ({ ...p, [itemId]: !getSugarPref(itemId) }));

  // Calculate past limits for Calendar Blocking natively
  const minValidNextDay = useMemo(() => {
     let d = new Date(todayDate);
     d.setDate(d.getDate() + 1);
     if (d.getDate() === todayDate.getDate() + 1 && todayDate.getHours() >= ORDER_CUTOFF_HOUR) {
         d.setDate(d.getDate() + 1);
     }
     d.setHours(0,0,0,0);
     return d;
  }, [todayDate]);

  // Dynamically calculate valid days from the selected dates array
  const selectedFullDays = useMemo(() => {
    const validDays = [];
    
    if (orderMode === "range") {
       if (!dateRange.from) return [];
       const startLimit = new Date(dateRange.from);
       startLimit.setHours(0,0,0,0);
       const endLimit = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
       endLimit.setHours(0,0,0,0);
       
       const dayNames: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" as any, "Saturday" as any];
       
       for (let d = new Date(startLimit); d <= endLimit; d.setDate(d.getDate() + 1)) {
          const dIso = new Date(d);
          dIso.setHours(0,0,0,0);
          
          if (dIso.getDay() === 5 || dIso.getDay() === 6) continue;
          
          const dayStr = dayNames[dIso.getDay()];
          validDays.push({ date: new Date(dIso), dayName: dayStr });
       }
    } else {
       if (!selectedDates || selectedDates.length === 0) return [];
       const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
       const dayNames: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" as any, "Saturday" as any];
       
       for (const d of sorted) {
          const dIso = new Date(d); // clone
          dIso.setHours(0,0,0,0);
          
          if (dIso.getDay() === 5 || dIso.getDay() === 6) continue;
          
          const dayStr = dayNames[dIso.getDay()];
          validDays.push({ date: new Date(dIso), dayName: dayStr });
       }
    }
    
    return validDays;
  }, [orderMode, dateRange, selectedDates, todayDate]);

  const dayCount = selectedFullDays.length;

  const availableItems = menuItems.filter(item => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (dayCount === 0) return true;
    return selectedFullDays.some(d => item.availableDays.includes(d.dayName));
  });

  const resetDatesAndCart = () => {
    setSelectedDates([]);
    setDateRange({ from: undefined, to: undefined });
    setCart([]);
  };

  const addToCart = (item: MenuItem, sugarOption?: "Sugar" | "No Sugar") => {
    if (dayCount === 0) { toast.error("Please select a valid date range first."); return; }
    
    // Find matching dates for this exact item
    const defaultValidDates = selectedFullDays
       .filter(d => item.availableDays.includes(d.dayName))
       .map(d => `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}-${String(d.date.getDate()).padStart(2, '0')}T12:00:00`);

    if (defaultValidDates.length === 0) {
        toast.error(`${item.name} is not available during your selected days.`);
        return;
    }

    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id && c.sugarOption === sugarOption);
      if (existing) return prev.map(c => (c.menuItem.id === item.id && c.sugarOption === sugarOption) ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1, activeDates: defaultValidDates, sugarOption }];
    });
    toast.success(`${item.name}${sugarOption ? ` (${sugarOption})` : ''} added`);
  };

  const updateQuantity = (itemId: string, delta: number, sugarOption?: "Sugar" | "No Sugar") => {
    setCart(prev => prev.map(c => (c.menuItem.id === itemId && c.sugarOption === sugarOption) ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const toggleCartItemDate = (itemId: string, dateStr: string, sugarOption?: "Sugar" | "No Sugar") => {
    setCart(prev => prev.map(c => {
      if (c.menuItem.id === itemId && c.sugarOption === sugarOption) {
        const active = c.activeDates.includes(dateStr);
        return { ...c, activeDates: active ? c.activeDates.filter(d => d !== dateStr) : [...c.activeDates, dateStr] };
      }
      return c;
    }));
  };

  // Complex Total Calculations
  const cartTotal = cart.reduce((sum, c) => sum + (c.menuItem.price * c.quantity * c.activeDates.length), 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (dayCount === 0) { toast.error("No valid dates selected in range"); return; }
    
    // Ensure all items have at least one active date
    if (cart.some(c => c.activeDates.length === 0)) {
        toast.error("Some items don't have active days selected.");
        return;
    }
    
    if (isBlocked) { toast.error("Ordering blocked by admin"); return; }
    if (!user) return;
    
    const datesPayload = selectedFullDays.map(d => ({
      date: `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}-${String(d.date.getDate()).padStart(2, '0')}T12:00:00`,
      dayName: d.dayName
    }));
    
    // Construct the dailySchedules Object
    const dailySchedules: Record<string, OrderItem[]> = {};
    datesPayload.forEach(dp => {
       const itemsForDay = cart.filter(c => c.activeDates.includes(dp.date)).map(c => {
           const payload: any = { menuItem: c.menuItem, quantity: c.quantity };
           if (c.sugarOption) payload.sugarOption = c.sugarOption;
           return payload;
       });
       if (itemsForDay.length > 0) {
           dailySchedules[dp.date] = itemsForDay;
       }
    });

    const promise = placeMultiDayOrder(user.id, user.name, [], datesPayload, dailySchedules, cartTotal);
    
    toast.promise(promise, {
      loading: "Placing your custom mapped order...",
      success: () => {
        setCart([]);
        setCartOpen(false);
        return `Successfully placed order for ${dayCount} active day${dayCount !== 1 ? 's' : ''}!`;
      },
      error: "Failed to place order. Please try again."
    });
  };

  return (
    <div className="container max-w-5xl py-6 px-4 animate-in fade-in min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <Badge variant="outline" className="mb-2 px-2.5 py-0.5 border-primary/20 bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-wider">Welcome Back</Badge>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent tracking-tight">
            {isTopManagement ? user?.name : `Hello, ${user?.name}!`}
          </h1>
          <p className="text-muted-foreground mt-1 font-medium text-sm md:text-base max-w-md">Secure your meals ahead of time.</p>
          <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20">
            <AlertCircle className="h-3 w-3" /> 5:00 PM cutoff for next-day
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(isAdmin || isTopManagement) && (
            <Button asChild className="rounded-full shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 border-none group px-5 h-10 hidden sm:flex text-sm">
              <Link to="/admin">{isAdmin ? "Admin Workspace" : "Management Workspace"} <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" /></Link>
            </Button>
          )}

          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
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
                  Delivery: <span className="font-bold">{dayCount} Selected Day{dayCount !== 1 ? 's' : ''}</span>
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
                    <div key={`${c.menuItem.id}-${c.sugarOption || 'none'}`} className="flex flex-col p-3 rounded-xl border bg-card shadow-sm gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 w-1/2">
                           <img src={c.menuItem.image} alt="" className="w-10 h-10 rounded-md object-cover shadow-sm" />
                           <div>
                             <p className="font-bold text-xs leading-tight line-clamp-2">
                               {c.menuItem.name}
                               {c.sugarOption && <span className="block mt-0.5 text-[8px] uppercase tracking-wider text-muted-foreground font-bold">{c.sugarOption}</span>}
                             </p>
                             <p className="text-[11px] font-semibold text-primary mt-0.5">৳{c.menuItem.price}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full border">
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/20 text-foreground" onClick={() => updateQuantity(c.menuItem.id, -1, c.sugarOption)}><Minus className="h-3 w-3" /></Button>
                          <span className="text-xs w-3 text-center font-bold">{c.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/20 text-foreground" onClick={() => updateQuantity(c.menuItem.id, 1, c.sugarOption)}><Plus className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <div className="border-t border-border/50 pt-2 mt-1">
                        <p className="text-[10px] font-bold text-muted-foreground mb-1.5 uppercase">Delivery Dates ({c.activeDates.length})</p>
                        <div className="flex flex-wrap gap-1">
                           {selectedFullDays.filter(d => c.menuItem.availableDays.includes(d.dayName)).map(d => {
                              const dStr = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}-${String(d.date.getDate()).padStart(2, '0')}T12:00:00`;
                              const isActive = c.activeDates.includes(dStr);
                              return (
                                <button key={dStr} onClick={() => toggleCartItemDate(c.menuItem.id, dStr, c.sugarOption)} className={`text-[9px] px-1.5 py-0.5 flex items-center gap-0.5 rounded border shadow-sm font-bold transition-all ${isActive ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted opacity-50'}`}>
                                   {isActive ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                                   <span className="uppercase tracking-tighter">{d.date.toLocaleDateString("en-US", { weekday: "short" })} {d.date.getDate()}</span>
                                </button>
                              )
                           })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {cart.length > 0 && (
                <SheetFooter className="border-t pt-4 flex flex-col gap-3 pb-2">
                  <div className="flex justify-between items-center bg-muted/40 p-3 rounded-xl">
                   <div className="text-left">
                     <span className="text-sm font-bold text-foreground">Order Total</span>
                     <div className="text-[11px] text-muted-foreground font-medium">{cart.length} item{cart.length !== 1 && 's'} selected</div>
                   </div>
                   <span className="text-xl font-black font-heading text-primary">৳{cartTotal}</span>
                  </div>
                  <Button className="w-full h-11 rounded-full font-bold shadow-md bg-gradient-to-r from-emerald-500 to-teal-500 border-none relative overflow-hidden" onClick={handlePlaceOrder}>
                     Place Order <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {(isAdmin || isTopManagement) && (
        <div className="mb-6 sm:hidden">
            <Button asChild className="rounded-full shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 border-none group px-5 h-10 w-full text-sm">
              <Link to="/admin">{isAdmin ? "Admin Workspace" : "Management Workspace"} <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" /></Link>
            </Button>
        </div>
      )}

      {isBlocked && (
        <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-sm">
          <Ban className="h-5 w-5 flex-shrink-0" />
          <p className="font-medium">Your ordering privileges have been suspended.</p>
        </div>
      )}

      <div className="mb-8 relative bg-card p-5 rounded-3xl border shadow-sm">
        <Tabs value={orderMode} onValueChange={(val) => { setOrderMode(val as any); resetDatesAndCart(); }} className="w-full">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="font-heading text-foreground font-extrabold text-xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" /> Select Dates
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                 <TabsList className="bg-secondary/40 border border-border/80 shadow-md h-11 rounded-2xl p-1 gap-1 mb-1">
                    <TabsTrigger value="multiple" className="text-[13px] font-extrabold px-5 h-9 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Specific Days</TabsTrigger>
                    <TabsTrigger value="range" className="text-[13px] font-extrabold px-5 h-9 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Date Range</TabsTrigger>
                 </TabsList>
                 <Button variant="outline" size="sm" onClick={resetDatesAndCart} className="h-9 bg-destructive/10 text-destructive border-transparent hover:bg-destructive hover:text-white rounded-xl px-4 font-extrabold shadow-sm transition-all flex items-center gap-1.5 group">
                   <RotateCcw className="h-3.5 w-3.5 group-hover:-rotate-90 transition-transform duration-300" />
                   Start Over
                 </Button>
              </div>
           </div>

           <TabsContent value="multiple" className="w-full mt-0 border-none outline-none">
             <div className="w-full">
               <div className="flex-1 relative group w-full">
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button className={`w-full h-12 justify-start text-left font-bold bg-card border border-border hover:bg-card/70 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl shadow-sm text-sm ${selectedDates.length === 0 ? "text-muted-foreground/60" : "text-foreground"}`}>
                       <Calendar className="mr-3 h-4 w-4 text-primary" />
                       {selectedDates.length > 0 ? (
                          <span className="truncate max-w-xs">{selectedDates.length} Specific Day{selectedDates.length > 1 ? 's' : ''} Selected</span>
                       ) : (
                         <span>Pick dates from calendar</span>
                       )}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-2" align="start">
                     <CalendarComponent
                       initialFocus
                       mode="multiple"
                       defaultMonth={todayDate}
                       selected={selectedDates}
                       disabled={(date) => date.getDay() === 5 || date.getDay() === 6 || date < minValidNextDay || date.getMonth() !== minValidNextDay.getMonth()}
                       onSelect={(days) => { setSelectedDates(days as Date[] || []); setCart([]); }}
                       numberOfMonths={1}
                     />
                   </PopoverContent>
                 </Popover>
               </div>
             </div>
           </TabsContent>

           <TabsContent value="range" className="w-full mt-0 border-none outline-none">
             <div className="flex flex-col sm:flex-row gap-4 w-full">
                 <div className="flex-1 relative group w-full">
                   <Popover>
                     <PopoverTrigger asChild>
                       <Button className={`w-full h-12 justify-start text-left font-bold bg-card border border-border hover:bg-card/70 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl shadow-sm text-sm ${!dateRange.from ? "text-muted-foreground/60" : "text-foreground"}`}>
                         <Calendar className="mr-3 h-4 w-4 text-primary" />
                         {dateRange.from ? <span className="truncate">{dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> : <span>From Date</span>}
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-2" align="start">
                       <CalendarComponent initialFocus mode="single" defaultMonth={todayDate} selected={dateRange.from} disabled={(date) => date.getDay() === 5 || date.getDay() === 6 || date < minValidNextDay || date.getMonth() !== minValidNextDay.getMonth()} onSelect={(date) => { setDateRange(prev => ({...prev, from: date})); setCart([]); }} />
                     </PopoverContent>
                   </Popover>
                 </div>
                 
                 <div className="flex-none flex items-end justify-center pb-4 hidden sm:flex">
                   <ArrowRight className="h-5 w-5 text-muted-foreground opacity-50" />
                 </div>

                 <div className="flex-1 relative group w-full">
                   <Popover>
                     <PopoverTrigger asChild>
                       <Button className={`w-full h-12 justify-start text-left font-bold bg-card border border-border hover:bg-card/70 hover:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl shadow-sm text-sm ${!dateRange.to ? "text-muted-foreground/60" : "text-foreground"}`}>
                         <Calendar className="mr-3 h-4 w-4 text-primary" />
                         {dateRange.to ? <span className="truncate">{dateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> : <span>To Date</span>}
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-2" align="start">
                       <CalendarComponent initialFocus mode="single" defaultMonth={dateRange.from || todayDate} selected={dateRange.to} disabled={(date) => date.getDay() === 5 || date.getDay() === 6 || date < minValidNextDay || date.getMonth() !== minValidNextDay.getMonth() || (dateRange.from ? date < dateRange.from : false)} onSelect={(date) => { setDateRange(prev => ({...prev, to: date})); setCart([]); }} />
                     </PopoverContent>
                   </Popover>
                 </div>
             </div>
           </TabsContent>
        </Tabs>
        
        {((orderMode === "multiple" && selectedDates.length > 0) || (orderMode === "range" && dateRange.from && dateRange.to)) && (
           <div className="mt-5 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm flex items-center gap-2">
             <Calendar className="h-4 w-4 text-primary" />
             <span className="font-bold text-foreground">
               <span className="text-primary">{dayCount} working day{dayCount !== 1 && 's'}</span> matched successfully. You can now select items!
             </span>
           </div>
        )}
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold flex items-center gap-2">
            <span className="text-primary">{dayCount > 0 ? "Available" : "Select dates for"}</span> Menu
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
             <h3 className="text-lg font-bold font-heading mt-2">{dayCount === 0 ? "Select Order Dates" : searchQuery ? "No matching items" : "Menu Exhausted"}</h3>
             <p className="text-muted-foreground text-sm mt-1">{dayCount === 0 ? "Please select a From and To date from the calendar above to see available items." : searchQuery ? "Try a different search." : "No items are available."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
             {/* Menu Items */}
             {availableItems.map((item, idx) => {
               const itemTotalQuantity = cart.filter(c => c.menuItem.id === item.id).reduce((sum, c) => sum + c.quantity, 0);
               const activeSugarOption = item.category === 'tea' ? (getSugarPref(item.id) ? "Sugar" : "No Sugar") : undefined;
               const activeCartItem = cart.find(c => c.menuItem.id === item.id && c.sugarOption === activeSugarOption);
               return (
                 <Card key={item.id} className={`overflow-hidden relative flex flex-col group transition-all duration-300 border bg-card rounded-2xl ${activeCartItem ? 'ring-1 ring-primary shadow-md' : 'shadow-sm'}`}>
                   <div className="h-36 overflow-hidden relative">
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                     <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     {itemTotalQuantity > 0 && (
                        <div className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none z-30" />
                     )}
                     <Badge className="absolute top-2 left-2 z-20 bg-background/90 text-foreground border-none font-bold px-2 py-0.5 text-[10px] uppercase">{item.category}</Badge>
                     <Badge className="absolute top-2 right-2 z-20 bg-primary text-primary-foreground border-none font-bold text-sm px-2.5 py-0.5 rounded-full">৳{item.price}</Badge>
                     <h3 className="absolute bottom-2 left-3 right-3 z-20 text-white font-bold font-heading text-lg leading-tight drop-shadow-md line-clamp-1">{item.name}</h3>
                   </div>
                   
                    <CardContent className="p-4 flex flex-col justify-between flex-1 gap-3">
                      <div className="flex flex-col gap-1.5">
                         <div className="flex flex-wrap gap-0.5">
                           {[...item.availableDays].sort((a,b) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(a) - ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(b)).map(d => (
                              <div key={d} className="text-[8px] px-1.5 py-0.5 rounded-sm uppercase font-bold bg-secondary/50 text-secondary-foreground">{d.slice(0,3)}</div>
                           ))}
                         </div>
                         <p className="text-xs text-muted-foreground line-clamp-2 h-8">{item.description}</p>
                      </div>
                     <div>
                       {item.category === 'tea' && (
                         <div className="flex items-center gap-2 mb-2 ml-1">
                           <input type="checkbox" id={`sugar-${item.id}`} className="rounded text-primary focus:ring-primary h-3 w-3 cursor-pointer" checked={getSugarPref(item.id)} onChange={() => toggleSugarPref(item.id)} />
                           <label htmlFor={`sugar-${item.id}`} className="text-xs font-bold text-muted-foreground select-none cursor-pointer">With Sugar</label>
                         </div>
                       )}
                       {activeCartItem ? (
                         <div className="flex items-center justify-between bg-primary/5 p-1.5 rounded-xl border border-primary/20 mt-1">
                           <div className="flex items-center gap-1.5 bg-background shadow-sm rounded-full p-0.5 border">
                             <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-foreground hover:bg-black/10 dark:hover:bg-white/20" onClick={() => updateQuantity(item.id, -1, activeSugarOption)}><Minus className="h-3 w-3" /></Button>
                             <span className="w-4 text-center font-bold text-sm">{activeCartItem.quantity}</span>
                             <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-primary bg-primary/10 hover:bg-primary hover:text-white dark:hover:bg-primary/50" onClick={() => updateQuantity(item.id, 1, activeSugarOption)}><Plus className="h-3 w-3" /></Button>
                           </div>
                           <span className="text-sm font-extrabold font-heading text-primary mr-2">৳{item.price * activeCartItem.quantity}</span>
                         </div>
                       ) : (
                         <Button className="w-full rounded-xl h-10 shadow-sm text-sm font-semibold mt-1" variant="secondary" onClick={() => addToCart(item, activeSugarOption)} disabled={dayCount === 0 || isBlocked}>
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

