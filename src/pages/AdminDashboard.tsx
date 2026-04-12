import { useState, useRef } from "react";
import { Users, ShoppingBag, TrendingUp, Clock, CheckCircle, XCircle, Plus, Edit, Trash2, Download, Send, Ban, ShieldCheck, ShieldOff, Upload, Image as ImageIcon, ChevronRight, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAppState } from "@/lib/app-state";
import { MenuItem, WORKING_DAYS, DayOfWeek } from "@/lib/mock-data";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  unpaid: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  partial: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
};

function ExportButton({ data, filename }: { data: Record<string, unknown>[]; filename: string }) {
  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map(row => headers.map(h => `"${row[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}.csv`);
  };
  return (
    <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-full shadow-sm hover:shadow transition-all group border-primary/20 hover:border-primary/50 text-xs h-8">
      <Download className="h-3 w-3 mr-1.5" /> Export
    </Button>
  );
}

export default function AdminDashboard() {
  const { orders, confirmOrder, rejectOrder, completeOrder, menuItems, addMenuItem, updateMenuItem, deleteMenuItem, bills, markBillPaid, users, deleteUser, addNotification, blockUser } = useAppState();
  
  // Search queries
  const [orderQuery, setOrderQuery] = useState("");
  const [menuQuery, setMenuQuery] = useState("");
  const [billQuery, setBillQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");

  const [orderFilter, setOrderFilter] = useState("all");
  const [billingMonth, setBillingMonth] = useState("all");

  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Menu form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState<"tea" | "snack" | "meal">("tea");
  const [formDays, setFormDays] = useState<DayOfWeek[]>([]);
  const [formImage, setFormImage] = useState("");
  
  const filteredOrders = orders.filter(o => 
    (orderFilter === "all" || o.status === orderFilter) &&
    (o.userName || "").toLowerCase().includes(orderQuery.toLowerCase())
  );

  const filteredMenu = menuItems.filter(m => (m.name || "").toLowerCase().includes(menuQuery.toLowerCase()));

  const allBillingMonths = [...new Set(bills.map(b => b.month))];
  const filteredBills = bills.filter(b => 
    (billingMonth === "all" || b.month === billingMonth) &&
    (b.userName || "").toLowerCase().includes(billQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    (u.name || "").toLowerCase().includes(userQuery.toLowerCase()) || 
    (u.email || "").toLowerCase().includes(userQuery.toLowerCase()) ||
    (u.department || "").toLowerCase().includes(userQuery.toLowerCase())
  );

  const totalRevenue = orders.filter(o => o.status === "completed" || o.status === "confirmed").reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter(o => o.status === "pending").length;

  const openAddMenu = () => {
    setEditingItem(null); setFormName(""); setFormDesc(""); setFormPrice(""); setFormCategory("tea"); setFormDays([]); setFormImage("");
    setMenuDialogOpen(true);
  };
  const openEditMenu = (item: MenuItem) => {
    setEditingItem(item); setFormName(item.name); setFormDesc(item.description); setFormPrice(String(item.price));
    setFormCategory(item.category); setFormDays([...item.availableDays]); setFormImage(item.image || "");
    setMenuDialogOpen(true);
  };
  const handleSaveMenu = () => {
    if (!formName || !formPrice || formDays.length === 0) return toast.error("Fill required fields and select a day");
    const payload = {
      name: formName, description: formDesc, price: Number(formPrice),
      category: formCategory, availableDays: formDays, image: formImage || editingItem?.image || "/placeholder.svg",
    };
    if (editingItem) { updateMenuItem(editingItem.id, payload); toast.success("Updated"); } else { addMenuItem(payload); toast.success("Added"); }
    setMenuDialogOpen(false);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for firestore safety
        toast.error("Image must be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
        toast.success("Image added locally!");
      };
      reader.readAsDataURL(file);
    }
  };
  const handleDeleteMenu = (id: string) => { deleteMenuItem(id); toast.success("Deleted"); setDeleteConfirm(null); };
  const toggleDay = (day: DayOfWeek) => setFormDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  const handleSendAnnouncement = () => {
    if (!announcementText.trim()) return toast.error("Enter message");
    addNotification({ title: "📢 Alert", message: announcementText, type: "announcement", read: false });
    toast.success("Sent"); setAnnouncementText(""); setAnnouncementOpen(false);
  };

  const ordersExportData = orders.map(o => ({ User: o.userName, Date: o.date, Day: o.dayName, Items: o.items.map(i => `${i.menuItem.name}×${i.quantity}`).join("; "), Total: o.total, Status: o.status }));
  const billsExportData = bills.map(b => ({ User: b.userName, Month: b.month, Orders: b.orders, Total: b.totalAmount, Paid: b.paidAmount, Status: b.status }));

  const SearchBar = ({ val, setVal, placeholder }: { val: string, setVal: (s:string)=>void, placeholder: string }) => (
    <div className="relative max-w-xs w-full">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="h-8 pl-8 text-xs rounded-lg bg-card border-border/50"
      />
    </div>
  );

  return (
    <div className="container max-w-7xl py-6 px-4 animate-in fade-in min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Admin Workspace</h1>
          <p className="text-muted-foreground mt-1 font-medium text-sm">Control center for operations.</p>
        </div>
        <Button onClick={() => setAnnouncementOpen(true)} size="sm" className="rounded-full shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 border-none px-4 h-9">
          <Send className="h-3.5 w-3.5 mr-2" /> Broadcast
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Directory", value: users.length, sub: "Members", icon: Users, gradient: "from-blue-500/10 to-cyan-500/5", line: "bg-blue-500" },
          { label: "Fulfillment", value: orders.length, sub: "Total", icon: ShoppingBag, gradient: "from-purple-500/10 to-pink-500/5", line: "bg-purple-500" },
          { label: "Revenue", value: `৳${totalRevenue.toLocaleString()}`, sub: "Confirmed", icon: TrendingUp, gradient: "from-emerald-500/10 to-teal-500/5", line: "bg-emerald-500" },
          { label: "Required", value: pendingCount, sub: "Pending", icon: Clock, gradient: pendingCount > 0 ? "from-rose-500/20 to-orange-500/5" : "from-slate-500/10 to-gray-500/5", line: pendingCount > 0 ? "bg-rose-500" : "bg-slate-500" },
        ].map((stat, i) => (
          <Card key={i} className={`relative overflow-hidden border shadow-sm bg-gradient-to-br ${stat.gradient} group rounded-2xl`}>
            <div className={`absolute top-0 left-0 w-full h-1 ${stat.line}`}></div>
            <CardContent className="p-4 sm:p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-muted-foreground mb-0.5 text-xs uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-bold font-heading mb-0.5 text-foreground">{stat.value}</h3>
                  <p className="text-[10px] opacity-70 font-medium">{stat.sub}</p>
                </div>
                <div className={`p-2 rounded-xl bg-background/50 shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 hidden sm:block`}>
                  <stat.icon className="h-5 w-5 opacity-70" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="mb-5 w-full sm:w-auto overflow-x-auto justify-start p-1 bg-muted/50 backdrop-blur-md rounded-2xl border">
          <TabsTrigger value="orders" className="rounded-xl px-5 py-2 text-sm data-[state=active]:shadow-sm transition-all">Orders</TabsTrigger>
          <TabsTrigger value="menu" className="rounded-xl px-5 py-2 text-sm data-[state=active]:shadow-sm transition-all">Menu</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl px-5 py-2 text-sm data-[state=active]:shadow-sm transition-all">Billing</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-5 py-2 text-sm data-[state=active]:shadow-sm transition-all">Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4 animate-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/20 border shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto">
               <h3 className="font-heading font-semibold text-base flex items-center gap-2 pl-2 whitespace-nowrap">
                 <ShoppingBag className="h-4 w-4 text-primary" /> Manifest
               </h3>
               <SearchBar val={orderQuery} setVal={setOrderQuery} placeholder="Search by name..." />
            </div>
            <div className="flex items-center gap-2">
              <ExportButton data={ordersExportData} filename="orders" />
              <Select value={orderFilter} onValueChange={setOrderFilter}>
                <SelectTrigger className="w-[120px] rounded-xl h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.length === 0 && <p className="text-muted-foreground text-sm col-span-full ml-2">No orders matched search criteria.</p>}
            {filteredOrders.map(order => (
              <Card key={order.id} className="group hover:shadow-md transition-all overflow-hidden border-border/50 rounded-2xl">
                <CardHeader className="p-3 bg-muted/30 border-b flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold truncate max-w-[150px]">{order.userName}</CardTitle>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] px-1.5 py-0 mt-1 shadow-none w-fit">
                       {order.dayName.slice(0, 3)}, {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0 shadow-sm capitalize ${statusColors[order.status]}`}>{order.status}</Badge>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="text-xs font-medium mb-3 space-y-1">
                    {order.items.map((i, k) => (
                      <div key={k} className="flex justify-between items-center bg-background border p-1.5 rounded-lg">
                        <span className="text-muted-foreground truncate mr-2">{i.menuItem.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold bg-muted px-1.5 py-0.5 rounded shadow-sm text-[10px]">x{i.quantity}</span>
                          <span className="font-bold text-primary text-[10px]">৳{i.menuItem.price * i.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-bold text-sm text-primary">Total: ৳{order.total}</span>
                    <div className="flex gap-1.5">
                      {order.status === "pending" && (
                        <>
                          <Button size="icon" variant="outline" className="h-7 w-7 rounded-full text-success hover:bg-success hover:text-white border-success/30" onClick={() => confirmOrder(order.id)}><CheckCircle className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="outline" className="h-7 w-7 rounded-full text-destructive hover:bg-destructive hover:text-white border-destructive/30" onClick={() => rejectOrder(order.id)}><XCircle className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <Button size="sm" className="h-7 text-xs rounded-full bg-primary/10 text-primary" onClick={() => completeOrder(order.id)}>Complete</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4 animate-in">
          <div className="flex flex-col sm:flex-row justify-between gap-3 p-3 rounded-2xl bg-muted/20 border shadow-sm">
            <div className="flex items-center gap-3">
              <h3 className="font-heading font-semibold text-base flex items-center gap-2 pl-2 whitespace-nowrap">Catalog</h3>
              <SearchBar val={menuQuery} setVal={setMenuQuery} placeholder="Search item..." />
            </div>
            <Button onClick={openAddMenu} size="sm" className="rounded-full shadow-sm bg-gradient-to-r from-emerald-500 to-teal-500 border-none h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMenu.length === 0 && <p className="text-muted-foreground text-sm col-span-full ml-2">No menu items matched your search.</p>}
            {filteredMenu.map(item => (
              <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-all border-border/50 rounded-2xl">
                <div className="h-28 overflow-hidden relative bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <p className="absolute bottom-2 left-2 z-20 text-white font-bold font-heading text-sm line-clamp-1 truncate right-2">{item.name}</p>
                  <Badge className="absolute top-2 right-2 z-20 shadow-sm bg-background/80 text-foreground border-none text-[10px]">৳{item.price}</Badge>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="px-1.5 text-[9px] uppercase">{item.category}</Badge>
                    <div className="flex -space-x-1">
                      {item.availableDays.map((d, i) => (
                        <div key={i} className="w-4 h-4 rounded-full bg-muted border border-card flex items-center justify-center text-[8px] font-bold" title={d}>{d[0]}</div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => openEditMenu(item)}>Edit</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg text-red-500" onClick={() => setDeleteConfirm(item.id)}>Del</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 animate-in">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-5 w-full md:w-auto">
               <div>
                  <h3 className="font-heading font-bold text-xl">Ledger</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Aggregated user debts.</p>
               </div>
               <div className="relative max-w-[200px] w-full">
                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                 <Input placeholder="Search user..." value={billQuery} onChange={e => setBillQuery(e.target.value)} className="h-8 pl-8 text-xs rounded-lg bg-slate-900 border-slate-700 text-white" />
               </div>
             </div>
             <div className="flex flex-wrap gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-700">
               <Select value={billingMonth} onValueChange={setBillingMonth}>
                 <SelectTrigger className="w-[120px] h-8 text-xs bg-slate-800 border-slate-700 text-slate-200 mt-1 md:mt-0"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Months</SelectItem>
                   {allBillingMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                 </SelectContent>
               </Select>
               <Button onClick={() => ExportButton({ data: billsExportData, filename: "billing-ledger" }).props.onClick()} variant="secondary" size="sm" className="h-8 text-xs bg-white text-slate-900"><Download className="w-3.5 h-3.5 mr-1"/> Export</Button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBills.length === 0 && <p className="text-muted-foreground text-sm col-span-full ml-2">No ledgers matched search criteria.</p>}
            {filteredBills.map(bill => (
              <Card key={bill.id} className="border shadow-sm rounded-2xl overflow-hidden bg-card">
                <CardContent className="p-0 flex">
                  <div className={`w-2 ${bill.status === 'paid' ? 'bg-emerald-500' : bill.status === 'partial' ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
                  <div className="p-4 flex-1">
                    <div className="flex items-center justify-between mb-2 border-b pb-2">
                       <p className="font-bold text-sm truncate">{bill.userName}</p>
                       <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[bill.status]}`}>{bill.status}</Badge>
                    </div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{bill.month}</span><span>{bill.orders} orders</span></div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Owed</span><span className="font-bold">৳{bill.totalAmount}</span></div>
                    <div className="flex justify-between text-xs mb-3"><span className="text-muted-foreground">Paid</span><span className="font-bold text-success">৳{bill.paidAmount}</span></div>
                    
                    {bill.status !== "paid" && <Button size="sm" className="w-full h-7 text-xs rounded-lg" onClick={() => markBillPaid(bill.id)}>Settle <ChevronRight className="h-3 w-3 ml-1" /></Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 animate-in">
           <div className="flex flex-col sm:flex-row justify-between gap-3 p-3 rounded-2xl bg-muted/20 border shadow-sm">
             <div className="flex items-center gap-3">
               <h3 className="font-heading border-l-2 border-primary pl-2 font-semibold text-base whitespace-nowrap">Active Directory</h3>
               <SearchBar val={userQuery} setVal={setUserQuery} placeholder="Search name/email..." />
             </div>
             <Badge variant="secondary" className="px-2 py-0.5 text-xs w-fit">{filteredUsers.length} Found</Badge>
           </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(u => (
              <Card key={u.id} className="relative overflow-hidden border rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-bold text-primary shadow-sm border">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.designation}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 bg-muted/30 p-2 rounded-lg border text-[10px] mb-3">
                     <p className="flex justify-between"><span className="text-muted-foreground">Dept:</span> <span className="font-medium truncate max-w-[100px]">{u.department}</span></p>
                     <p className="flex justify-between"><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{u.phone}</span></p>
                  </div>

                  <div className="flex gap-1.5">
                    {(!u.blocked || u.blocked === "none") ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex-1 h-7 text-xs" size="sm">Restrict</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          <DropdownMenuItem onClick={() => blockUser(u.id, "ordering")}>Disable Ordering</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => blockUser(u.id, "full")} className="text-destructive">Full Ban</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button variant="outline" className="flex-1 h-7 text-xs text-success border-success/30" onClick={() => blockUser(u.id, "none")}>Unblock</Button>
                    )}
                    <Button variant="outline" size="icon" className="h-7 w-8 text-destructive" onClick={() => deleteUser(u.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl p-5 border-0 shadow-2xl">
          <DialogHeader className="mb-3 border-b pb-2">
            <DialogTitle className="text-lg font-bold font-heading">{editingItem ? "Edit Item" : "Create Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
             <Input value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Item Name" className="h-10 text-sm bg-muted/30" />
             <Textarea value={formDesc} onChange={e=>setFormDesc(e.target.value)} placeholder="Description" rows={2} className="text-sm bg-muted/30 resize-none" />
             <div className="grid grid-cols-2 gap-3">
               <Input type="number" value={formPrice} onChange={e=>setFormPrice(e.target.value)} placeholder="Price (৳)" className="h-10 text-sm bg-muted/30" />
               <Select value={formCategory} onValueChange={(v:any)=>setFormCategory(v)}>
                 <SelectTrigger className="h-10 text-sm bg-muted/30"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="tea">Tea</SelectItem><SelectItem value="snack">Snack</SelectItem><SelectItem value="meal">Meal</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="space-y-2 mt-2">
               <Label className="text-xs text-muted-foreground font-bold">Image</Label>
               <div className="flex gap-2">
                 <Input value={formImage} onChange={e=>setFormImage(e.target.value)} placeholder="Image URL..." className="h-10 text-sm bg-muted/30 flex-1" />
                 <div className="relative">
                   <Input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   <Button type="button" variant="outline" className="h-10 w-10 p-0 shrink-0"><ImageIcon className="h-4 w-4" /></Button>
                 </div>
               </div>
               {formImage && (
                 <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border">
                   <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                 </div>
               )}
             </div>

             <div className="flex flex-wrap gap-1 mt-1">
                {WORKING_DAYS.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-2 py-1 text-[10px] rounded-md border ${formDays.includes(day) ? 'bg-primary text-white border-primary' : 'bg-background'}`}>{day.slice(0,3)}</button>
                ))}
             </div>
          </div>
          <DialogFooter className="mt-4 pt-3 border-t">
            <Button onClick={handleSaveMenu} className="w-full text-sm h-10 rounded-xl" size="sm">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}><DialogContent className="max-w-sm rounded-[1.5rem] p-5"><DialogHeader className="mb-2"><DialogTitle>Broadcast</DialogTitle></DialogHeader><Textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)} placeholder="Message..." rows={4} className="text-sm bg-muted/30 resize-none" /><DialogFooter className="mt-4"><Button onClick={handleSendAnnouncement} size="sm" className="w-full h-10 rounded-xl shadow-sm">Send</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}><DialogContent className="max-w-xs rounded-2xl p-5 text-center"><DialogTitle className="text-base mb-3">Delete Item?</DialogTitle><div className="flex gap-2"><Button variant="outline" className="flex-1 h-9 rounded-xl" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="destructive" className="flex-1 h-9 rounded-xl" onClick={() => deleteConfirm && handleDeleteMenu(deleteConfirm)}>Confirm</Button></div></DialogContent></Dialog>
    </div>
  );
}
