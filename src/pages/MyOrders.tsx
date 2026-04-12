import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useAppState } from "@/lib/app-state";
import { toast } from "sonner";
import { ShoppingBag, Ban, Clock, Search } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function MyOrders() {
  const { user } = useAuth();
  const { orders, cancelOrder } = useAppState();
  const [searchQuery, setSearchQuery] = useState("");

  const userOrders = user?.role === "admin" ? orders : orders.filter(o => o.userId === user?.id);
  
  const myOrders = userOrders.filter(o => {
     if (!searchQuery) return true;
     const lowerQuery = searchQuery.toLowerCase();
     return o.dayName.toLowerCase().includes(lowerQuery) ||
            new Date(o.date).toLocaleDateString().includes(lowerQuery) ||
            o.items.some(i => i.menuItem.name.toLowerCase().includes(lowerQuery));
  });

  const handleCancel = (orderId: string) => {
    cancelOrder(orderId);
    toast.info("Order cancelled.");
  };

  return (
    <div className="container max-w-4xl py-6 px-4 animate-in fade-in min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-md">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">My Orders</h1>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Search past meals..." 
             value={searchQuery} 
             onChange={e => setSearchQuery(e.target.value)} 
             className="pl-9 h-10 rounded-xl bg-card border-border/50 text-sm" 
           />
        </div>
      </div>

      {myOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border rounded-2xl border-dashed">
          <Clock className="h-10 w-10 mb-3 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-bold font-heading mt-2">{searchQuery ? "No matching orders found" : "No History"}</h3>
          <p className="text-muted-foreground text-sm mt-1">{searchQuery ? "Try a different search." : "Place orders in the catalog first."}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {myOrders.map((order, idx) => (
            <Card key={order.id} className="overflow-hidden border bg-card rounded-2xl shadow-sm">
              <div className="flex flex-col md:flex-row">
                
                <div className="md:w-1/3 bg-muted/20 p-4 border-b md:border-b-0 md:border-r flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-1.5">
                       <Badge variant="outline" className={`px-2 py-0.5 text-[10px] uppercase font-bold shadow-sm ${statusColors[order.status]}`}>
                         {order.status}
                       </Badge>
                    </div>
                    <h3 className="font-heading font-bold text-lg mt-2">{order.dayName}</h3>
                    <p className="text-muted-foreground font-medium text-xs flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-6">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p>
                     <p className="font-heading text-xl font-extrabold text-primary">৳{order.total}</p>
                  </div>
                </div>

                <div className="md:w-2/3 p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm bg-background border p-2 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold bg-muted px-1.5 py-0.5 rounded-md text-xs">x{item.quantity}</span>
                          <span className="font-medium truncate max-w-[150px] sm:max-w-xs">{item.menuItem.name}</span>
                        </div>
                        <span className="font-bold text-primary">৳{item.menuItem.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end mt-4 pt-3 border-t">
                    {order.status === "pending" && (
                      <Button variant="outline" size="sm" className="rounded-xl px-4 h-8 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleCancel(order.id)}>
                        <Ban className="w-3 w-3 mr-1" /> Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
