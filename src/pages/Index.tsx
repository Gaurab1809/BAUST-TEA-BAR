import { useNavigate } from "react-router-dom";
import { Coffee, ShoppingBag, CreditCard, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useAppState } from "@/lib/app-state";

export default function Index() {
  const { user, isAdmin } = useAuth();
  const { menuItems, orders, bills } = useAppState();
  const navigate = useNavigate();

  const myOrders = orders.filter(o => o.userId === user?.id);
  const pendingOrders = myOrders.filter(o => o.status === "pending").length;
  
  const now = new Date();
  const monthYear = now.toLocaleString('default', { month: 'long' }) + " " + now.getFullYear();
  const currentBill = bills.find(b => b.userId === user?.id && b.month === monthYear) || bills.find(b => b.userId === user?.id);
  const dueAmount = currentBill ? Math.max(0, currentBill.totalAmount - currentBill.paidAmount) : 0;

  return (
    <div className="animate-in fade-in duration-500 min-h-screen pb-10">
      <div className="container max-w-5xl px-4 py-6">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="outline" className="mb-2 px-2.5 py-0.5 border-primary/20 bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-wider">Welcome Back</Badge>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent tracking-tight">
              Hello, {user?.name}!
            </h1>
            <p className="text-muted-foreground mt-1 font-medium text-sm md:text-base max-w-md">What would you like to have today? Discover new items or track your orders.</p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate("/admin")} className="rounded-full shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 border-none group px-5 h-10 w-full sm:w-auto text-sm">
              Admin Workspace <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>

        {/* Quick Actions (Premium Layout - Scaled Down) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-10">
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 relative overflow-hidden rounded-2xl" onClick={() => navigate("/order")}>
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <Coffee className="w-24 h-24" />
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white w-fit shadow-sm mb-3">
                <Coffee className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-extrabold text-xl mb-1 text-foreground">Order Catalog</h3>
              <p className="text-muted-foreground text-sm font-medium mb-3">{menuItems.length} items available</p>
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                Explore Menu <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 relative overflow-hidden rounded-2xl" onClick={() => navigate("/my-orders")}>
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <ShoppingBag className="w-24 h-24" />
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-xl bg-blue-500 text-white w-fit shadow-sm mb-3">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                {pendingOrders > 0 && <Badge className="bg-rose-500 text-white text-[10px] shadow-sm border-0">{pendingOrders} Active</Badge>}
              </div>
              <h3 className="font-heading font-extrabold text-xl mb-1 text-foreground">My Orders</h3>
              <p className="text-muted-foreground text-sm font-medium mb-3">Track your pending orders</p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                View Tracker <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-rose-500/10 to-orange-500/5 relative overflow-hidden rounded-2xl" onClick={() => navigate("/billing")}>
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <CreditCard className="w-24 h-24" />
            </div>
            <CardContent className="p-5 relative z-10">
              <div className="p-2.5 rounded-xl bg-rose-500 text-white w-fit shadow-sm mb-3">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-extrabold text-xl mb-1 text-foreground">Billing</h3>
              <div className="flex items-center gap-1.5 mb-3 text-sm">
                 <span className="text-muted-foreground font-medium">Owed:</span>
                 <span className={`font-bold ${dueAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>৳{dueAmount}</span>
              </div>
              <div className="flex items-center text-rose-600 dark:text-rose-400 font-bold text-xs">
                View Ledger <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Items Showcase */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Popular Items
            </h2>
            <Button variant="ghost" size="sm" className="rounded-full text-primary text-xs hover:bg-primary/10 px-3 h-8" onClick={() => navigate("/order")}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {menuItems.slice(0, 4).map((item, idx) => (
              <Card key={item.id} className="overflow-hidden cursor-pointer group hover:shadow-md transition-all duration-300 border-border/50 bg-card rounded-2xl" onClick={() => navigate("/order")}>
                <div className="aspect-square overflow-hidden relative">
                  <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10" />
                  <Badge className="absolute top-2 right-2 z-20 shadow-sm backdrop-blur-md bg-background/90 text-foreground border-none font-bold text-xs px-2 py-0.5">
                    ৳{item.price}
                  </Badge>
                  <div className="absolute bottom-3 left-3 z-20 pr-3">
                     <p className="text-white font-bold font-heading text-sm leading-tight drop-shadow-md line-clamp-2">{item.name}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
