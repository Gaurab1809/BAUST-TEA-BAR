import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState } from "@/lib/app-state";
import { useAuth } from "@/lib/auth-context";
import { CreditCard, TrendingUp, CheckCircle2 } from "lucide-react";

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  unpaid: "bg-rose-100 text-rose-700 border-rose-200",
  partial: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function Billing() {
  const { bills: rawBills } = useAppState();
  const bills = (Array.isArray(rawBills) ? rawBills : Object.values(rawBills || {})).filter(Boolean);
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState("all");

  const myBills = user?.role === "admin" ? bills : bills.filter(b => b.userId === user?.id);
  const allMonths = [...new Set(myBills.map(b => b.month))];
  const filteredBills = selectedMonth === "all" ? myBills : myBills.filter(b => b.month === selectedMonth);
  const allOwedTotal = myBills.reduce((acc, b) => acc + (b.totalAmount - b.paidAmount), 0);

  return (
    <div className="container max-w-4xl py-6 px-4 animate-in fade-in min-h-screen">
      
      <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Badge className="bg-white/20 text-white border-0 backdrop-blur-md mb-2 text-[10px] uppercase font-bold px-2 py-0.5 shadow-sm">Ledger</Badge>
          <h1 className="font-heading font-black text-3xl sm:text-4xl pb-1 uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent drop-shadow-sm mb-1">My Billing</h1>
          <p className="text-white/80 font-medium text-sm">Monthly expenses, payments, and debts.</p>
        </div>
        
        <div className="w-full md:w-48 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
           {allOwedTotal > 0 ? (
             <>
               <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Owed</p>
               <p className="text-3xl font-heading font-extrabold">৳{allOwedTotal}</p>
             </>
           ) : (
             <>
               <CheckCircle2 className="w-6 w-6 mb-1 text-emerald-300" />
               <p className="text-white text-sm font-bold">Balance Clear</p>
             </>
           )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
        <h2 className="font-heading text-xl sm:text-2xl font-extrabold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" /> Payment History
        </h2>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {allMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filteredBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-2xl border-dashed">
          <CreditCard className="h-10 w-10 mb-3 text-muted-foreground opacity-30" />
          <h3 className="text-base font-bold font-heading mt-2">No ledgers yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredBills.map((bill) => {
            const isOwed = bill.totalAmount - bill.paidAmount > 0;
            return (
              <Card key={bill.id} className="relative overflow-hidden border shadow-sm rounded-2xl">
                <div className={`absolute top-0 left-0 w-full h-1 ${isOwed ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={`px-2 py-0.5 uppercase font-bold text-[10px] shadow-sm ${statusColors[bill.status]}`}>{bill.status}</Badge>
                    <span className="font-bold text-muted-foreground text-sm">{bill.month}</span>
                  </div>
                  
                  <div className="mb-4">
                     <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Total Orders</p>
                     <p className="text-xl font-extrabold font-heading">{bill.orders} <span className="text-xs text-muted-foreground font-sans font-medium">meals</span></p>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-3 border space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Original Total</span><span className="font-bold">৳{bill.totalAmount}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-bold text-emerald-600">৳{bill.paidAmount}</span></div>
                    <div className="pt-2 border-t flex justify-between">
                      <span className="font-bold uppercase text-[9px]">Due</span>
                      <span className={`font-extrabold text-sm ${isOwed ? 'text-rose-500' : 'text-emerald-500'}`}>৳{bill.totalAmount - bill.paidAmount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
