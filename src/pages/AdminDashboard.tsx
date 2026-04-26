import { useState, useRef } from "react";
import { Users, ShoppingBag, TrendingUp, Clock, CheckCircle, XCircle, Plus, Edit, Trash2, Download, Send, Ban, ShieldCheck, ShieldOff, Upload, Image as ImageIcon, ChevronRight, Search, Printer, Filter, Pencil, Check, X } from "lucide-react";
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
import { useAuth } from "@/lib/auth-context";
import { MenuItem, WORKING_DAYS, DayOfWeek } from "@/lib/mock-data";

import { getAccurateOrderDate } from "@/lib/utils";
import logo from "@/assets/logo-new.jpg";

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

const PrintButton = ({ onClick }: { onClick?: () => void }) => (
  <Button variant="outline" size="sm" onClick={onClick || (() => window.print())} className="rounded-full shadow-sm hover:shadow transition-all group border-primary/20 hover:border-primary/50 text-xs h-8">
    <Printer className="h-3 w-3 mr-1.5" /> Print
  </Button>
);

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

export default function AdminDashboard() {
  const { orders, confirmOrder, rejectOrder, completeOrder, updateOrderTotal, menuItems, addMenuItem, updateMenuItem, deleteMenuItem, bills, markBillPaid, updateBillTotal, users, deleteUser, addNotification, blockUser, deleteOrder, deleteBill } = useAppState();
  const { isTopManagement } = useAuth();
  
  // Search queries
  const [orderQuery, setOrderQuery] = useState("");
  const [menuQuery, setMenuQuery] = useState("");
  const [billQuery, setBillQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");

  const [orderFilter, setOrderFilter] = useState("all");
  const [orderDateFilter, setOrderDateFilter] = useState("all");
  const [billingMonth, setBillingMonth] = useState("all");
  const [menuCategory, setMenuCategory] = useState("all");
  const [billStatus, setBillStatus] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  
  const [previewMode, setPreviewMode] = useState<"orders" | "menu" | "billing" | "users" | null>(null);
  
  const [editingOrderTotal, setEditingOrderTotal] = useState<Record<string, string>>({});
  const [editingBillTotal, setEditingBillTotal] = useState<Record<string, string>>({});

  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  // Menu form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState<"tea" | "snack" | "meal">("tea");
  const [formDays, setFormDays] = useState<DayOfWeek[]>([]);
  const [formImage, setFormImage] = useState("");
  
  const isWithinRange = (dateStr: string, range: string) => {
    if (range === "all") return true;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const msDiff = today.getTime() - date.getTime();
    const daysDiff = Math.floor(msDiff / (1000 * 3600 * 24));
    
    if (range === "today") return daysDiff === 0;
    if (range === "tomorrow") return daysDiff === -1;
    if (range === "yesterday") return daysDiff === 1;
    if (range === "week") return daysDiff <= 7 && daysDiff >= 0;
    if (range === "month") return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    if (/^\d{4}-\d{2}$/.test(range)) {
      const [y, m] = range.split('-');
      return date.getFullYear() === parseInt(y, 10) && (date.getMonth() + 1) === parseInt(m, 10);
    }
    return true;
  };

  const filteredOrders = orders.filter(o => 
    (orderFilter === "all" || o.status === orderFilter) &&
    isWithinRange(o.date, orderDateFilter) &&
    (o.userName || "").toLowerCase().includes(orderQuery.toLowerCase())
  );

  const filteredMenu = menuItems.filter(m => 
    (menuCategory === "all" || m.category === menuCategory) &&
    (m.name || "").toLowerCase().includes(menuQuery.toLowerCase())
  );

  const allOrderMonths = [...new Set(orders.map(o => {
    const d = new Date(o.date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }))].sort().reverse();

  const allBillingMonths = [...new Set(bills.map(b => b.month))];
  const filteredBills = bills.filter(b => 
    (billingMonth === "all" || b.month === billingMonth) &&
    (billStatus === "all" || b.status === billStatus) &&
    (b.userName || "").toLowerCase().includes(billQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => {
    const matchesQuery = (u.name || "").toLowerCase().includes(userQuery.toLowerCase()) || 
                         (u.email || "").toLowerCase().includes(userQuery.toLowerCase()) ||
                         (u.department || "").toLowerCase().includes(userQuery.toLowerCase());
    const matchesFilter = userFilter === "all" ? true :
                          userFilter === "admin" ? u.role === "admin" :
                          userFilter === "restricted" ? (u.blocked && u.blocked !== "none") :
                          userFilter === "member" ? (u.role !== "admin" && (!u.blocked || u.blocked === "none")) : true;
    return matchesQuery && matchesFilter;
  });

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

  const handleDeleteUser = async (id: string) => { await deleteUser(id); toast.success("User and history completely deleted"); setUserToDelete(null); };
  const handleDeleteOrder = async (id: string) => { await deleteOrder(id); toast.success("Order deleted"); setOrderToDelete(null); };
  const handleDeleteBill = async (id: string) => { await deleteBill(id); toast.success("Bill deleted"); setBillToDelete(null); };

  const toggleDay = (day: DayOfWeek) => setFormDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  const handleSendAnnouncement = () => {
    if (!announcementText.trim()) return toast.error("Enter message");
    addNotification({ title: "📢 Alert", message: announcementText, type: "announcement", read: false });
    toast.success("Sent"); setAnnouncementText(""); setAnnouncementOpen(false);
  };

  const ordersExportData = orders.map(o => {
    const user = users.find(u => u.id === o.userId);
    return { User: o.userName, Department: user?.department || '', Designation: user?.designation || '', Date: o.date, Day: o.dayName, Items: o.items.map(i => `${i.menuItem.name}×${i.quantity}`).join("; "), Total: o.total, Status: o.status };
  });
  const billsExportData = bills.map(b => ({ User: b.userName, Month: b.month, Orders: b.orders, Total: b.totalAmount, Paid: b.paidAmount, Status: b.status }));

      const renderPrintOrders = () => (
    <div className="text-black bg-white" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
      <div className="mb-6 flex items-center justify-between border-b-4 border-primary pb-4">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-200" />
          <div className="flex flex-col items-start">
            <h2 className="text-3xl font-black uppercase tracking-widest bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">BAUST TEA BAR</h2>
            <p className="text-lg font-extrabold text-gray-700 mt-0.5">
              {orderFilter !== 'all' && <span className="capitalize text-primary">{orderFilter} </span>}
              {/^\d{4}-\d{2}$/.test(orderDateFilter) ? new Date(`${orderDateFilter}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : orderDateFilter === 'today' ? 'Daily' : orderDateFilter === 'tomorrow' ? "Tomorrow's" : orderDateFilter === 'yesterday' ? "Yesterday's" : orderDateFilter === 'week' ? 'Weekly' : orderDateFilter === 'month' ? 'Monthly' : 'All-Time'} Orders Report
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end text-xs font-bold text-gray-600">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full mb-1 border border-primary/20">Total Found: {filteredOrders.length}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <table className="w-full text-sm border-collapse rounded-xl overflow-hidden border border-gray-300">
        <thead>
          <tr className="bg-primary text-primary-foreground border-b-2 border-primary/20">
            <th className="p-3 text-left font-extrabold uppercase text-xs tracking-wider">User</th>
            <th className="p-3 text-left font-extrabold uppercase text-xs tracking-wider">Dept</th>
            <th className="p-3 text-left font-extrabold uppercase text-xs tracking-wider">Desig.</th>
            <th className="p-3 text-left font-extrabold uppercase text-xs tracking-wider">Date</th>
            <th className="p-3 text-left font-extrabold uppercase text-xs tracking-wider w-1/3">Items</th>
            <th className="p-3 text-left font-extrabold uppercase text-xs tracking-wider">Total</th>
            <th className="p-3 text-left font-extrabold uppercase text-xs tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white text-black">
          {filteredOrders.map((order, idx) => {
            const userDetail = users.find(u => u.id === order.userId);
            return (
            <tr key={order.id} className={`border-b border-gray-200 break-inside-avoid hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-primary/5' : 'bg-white'}`}>
              <td contentEditable suppressContentEditableWarning className="p-3 font-extrabold text-gray-900 outline-primary cursor-text whitespace-normal break-words">{order.userName}</td>
              <td contentEditable suppressContentEditableWarning className="p-3 text-gray-700 font-medium text-xs outline-primary cursor-text">{userDetail?.department || '-'}</td>
              <td contentEditable suppressContentEditableWarning className="p-3 text-gray-700 font-medium text-xs outline-primary cursor-text">{userDetail?.designation || '-'}</td>
              <td contentEditable suppressContentEditableWarning className="p-3 text-gray-700 font-semibold text-xs outline-primary cursor-text">{getAccurateOrderDate(order.date, order.dayName).toLocaleDateString()}</td>
              <td contentEditable suppressContentEditableWarning className="p-3 text-sm leading-relaxed text-gray-800 font-semibold outline-primary cursor-text">{order.items.map(i => `${i.menuItem.name} ×${i.quantity}`).join(', ')}</td>
              <td contentEditable suppressContentEditableWarning className="p-3 font-black text-gray-900 border-l border-gray-200 outline-primary cursor-text">৳{order.total}</td>
              <td contentEditable suppressContentEditableWarning className="p-3 capitalize font-bold text-gray-600 border-l border-gray-200 text-xs outline-primary cursor-text">{order.status}</td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );

      const renderPrintMenu = () => (
    <div className="text-black bg-white" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
      <div className="mb-6 flex items-center justify-between border-b-4 border-primary pb-4">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-200" />
          <div className="flex flex-col items-start">
            <h2 className="text-3xl font-black uppercase tracking-widest bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">BAUST TEA BAR</h2>
            <p className="text-lg font-extrabold text-gray-700 mt-0.5">
              {menuCategory !== 'all' && <span className="capitalize text-primary">{menuCategory} </span>}Menu Catalog
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end text-xs font-bold text-gray-600">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full mb-1 border border-primary/20">Total Items: {filteredMenu.length}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <table className="w-full text-sm border-collapse rounded-xl overflow-hidden border border-gray-300">
        <thead>
          <tr className="bg-primary text-primary-foreground border-b-2 border-primary/20">
            <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Item Name</th>
            <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Category</th>
            <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Price</th>
            <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Description</th>
          </tr>
        </thead>
        <tbody className="bg-white text-black">
          {filteredMenu.map((item, idx) => (
            <tr key={item.id} className={`border-b border-gray-200 break-inside-avoid hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-primary/5' : 'bg-white'}`}>
              <td contentEditable suppressContentEditableWarning className="p-3 font-extrabold text-gray-900 outline-primary cursor-text">{item.name}</td>
              <td contentEditable suppressContentEditableWarning className="p-3 capitalize text-gray-700 outline-primary cursor-text">
                <span className="bg-gray-200 text-gray-800 px-2.5 py-1 rounded-md text-[11px] font-bold">{item.category}</span>
              </td>
              <td contentEditable suppressContentEditableWarning className="p-3 font-black text-gray-900 border-l border-gray-200 outline-primary cursor-text">৳{item.price}</td>
              <td contentEditable suppressContentEditableWarning className="p-3 text-sm text-gray-700 font-semibold border-l border-gray-200 outline-primary cursor-text">{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

      const renderPrintBilling = () => (
     <div className="text-black bg-white" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div className="mb-6 flex items-center justify-between border-b-4 border-primary pb-4">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-200" />
            <div className="flex flex-col items-start">
              <h2 className="text-3xl font-black uppercase tracking-widest bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">BAUST TEA BAR</h2>
              <p className="text-lg font-extrabold text-gray-700 mt-0.5">
                {billStatus !== 'all' && <span className="capitalize text-primary">{billStatus} </span>}Billing & Ledger Report
                {billingMonth !== 'all' && ` - ${billingMonth}`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end text-xs font-bold text-gray-600">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full mb-1 border border-primary/20">Total Bills: {filteredBills.length}</span>
            <span>Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <table className="w-full text-sm border-collapse rounded-xl overflow-hidden border border-gray-300">
          <thead>
            <tr className="bg-primary text-primary-foreground border-b-2 border-primary/20">
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">User Name</th>
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Month</th>
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Orders</th>
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Owed</th>
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Paid</th>
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white text-black">
            {filteredBills.map((bill, idx) => {
              const owesMoney = bill.status === 'unpaid';
              const partialMoney = bill.status === 'partial';
              const amountColor = owesMoney ? 'text-red-700' : partialMoney ? 'text-amber-600' : 'text-gray-900';
              const statusColor = owesMoney ? 'text-red-700 bg-red-100 border border-red-200' : partialMoney ? 'text-amber-700 bg-amber-100 border border-amber-200' : 'text-emerald-800 bg-emerald-100 border border-emerald-200';
              
              return (
              <tr key={bill.id} className={`border-b border-gray-200 break-inside-avoid hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-primary/5' : 'bg-white'}`}>
                <td contentEditable suppressContentEditableWarning className="p-3 font-extrabold text-gray-900 outline-primary cursor-text">{bill.userName}</td>
                <td contentEditable suppressContentEditableWarning className="p-3 text-gray-700 font-semibold outline-primary cursor-text">{bill.month}</td>
                <td contentEditable suppressContentEditableWarning className="p-3 text-gray-700 font-medium outline-primary cursor-text">{bill.orders}</td>
                <td contentEditable suppressContentEditableWarning className={`p-3 font-black border-l border-gray-200 outline-primary cursor-text ${amountColor}`}>৳{bill.totalAmount}</td>
                <td contentEditable suppressContentEditableWarning className="p-3 font-black text-emerald-700 border-l border-gray-200 outline-primary cursor-text">৳{bill.paidAmount}</td>
                <td contentEditable suppressContentEditableWarning className="p-3 border-l border-gray-200 outline-primary cursor-text">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase ${statusColor}`}>{bill.status}</span>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
  );

      const renderPrintUsers = () => (
      <div className="text-black bg-white" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div className="mb-6 flex items-center justify-between border-b-4 border-primary pb-4">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-200" />
            <div className="flex flex-col items-start">
              <h2 className="text-3xl font-black uppercase tracking-widest bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">BAUST TEA BAR</h2>
              <p className="text-lg font-extrabold text-gray-700 mt-0.5">
                {userFilter !== 'all' && <span className="capitalize text-primary">{userFilter === 'admin' ? 'Admin ' : userFilter === 'restricted' ? 'Restricted ' : 'Member '}</span>}Users Directory
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end text-xs font-bold text-gray-600">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full mb-1 border border-primary/20">Total Users: {filteredUsers.length}</span>
            <span>Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <table className="w-full text-sm border-collapse rounded-xl overflow-hidden border border-gray-300">
          <thead>
            <tr className="bg-primary text-primary-foreground border-b-2 border-primary/20">
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Name</th>
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Email</th>
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Dept</th>
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Designation</th>
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Phone</th>
              <th className="p-3 text-left font-extrabold text-xs uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white text-black">
            {filteredUsers.map((u, idx) => {
              const isAdmin = u.role === 'admin';
              const isRestricted = u.blocked && u.blocked !== 'none';
              const statusColor = isAdmin ? 'text-primary bg-primary/10 border border-primary/20' : isRestricted ? 'text-red-700 bg-red-100 border border-red-200' : 'text-emerald-800 bg-emerald-100 border border-emerald-200';
              
              return (
              <tr key={u.id} className={`border-b border-gray-200 break-inside-avoid hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-primary/5' : 'bg-white'}`}>
                <td contentEditable suppressContentEditableWarning className="p-3 font-extrabold text-gray-900 outline-primary cursor-text">{u.name}</td>
                <td contentEditable suppressContentEditableWarning className="p-3 text-gray-700 font-semibold outline-primary cursor-text">{u.email}</td>
                <td contentEditable suppressContentEditableWarning className="p-3 text-gray-700 font-medium outline-primary cursor-text">{u.department}</td>
                <td contentEditable suppressContentEditableWarning className="p-3 text-gray-700 font-medium outline-primary cursor-text">{u.designation}</td>
                <td contentEditable suppressContentEditableWarning className="p-3 font-bold text-gray-800 border-l border-gray-200 outline-primary cursor-text">{u.phone}</td>
                <td contentEditable suppressContentEditableWarning className="p-3 border-l border-gray-200 outline-primary cursor-text">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase ${statusColor}`}>
                    {isAdmin ? 'Admin' : isRestricted ? 'Restricted' : 'Member'}
                  </span>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
  );



  return (
    <div className="container max-w-7xl py-6 px-4 animate-in fade-in min-h-screen relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 print:hidden">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Admin Workspace</h1>
          <p className="text-muted-foreground mt-1 font-medium text-sm">Control center for operations.</p>
        </div>
        {!isTopManagement && (
          <Button onClick={() => setAnnouncementOpen(true)} size="sm" className="rounded-full shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 border-none px-4 h-9">
            <Send className="h-3.5 w-3.5 mr-2" /> Broadcast
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:hidden">
        {[
          { label: "Manage Users", value: users.length, sub: "Members", icon: Users, gradient: "from-blue-500/10 to-cyan-500/5", line: "bg-blue-500" },
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
        <div className="mb-4 sm:mb-6 print:hidden w-full">
          <TabsList className="flex w-full h-auto p-1 bg-muted/60 backdrop-blur-xl rounded-[1.25rem] border shadow-inner sm:inline-flex sm:w-auto gap-0.5 sm:gap-1.5">
            <TabsTrigger value="orders" className="flex-1 sm:flex-none rounded-xl py-2.5 px-0 sm:px-7 sm:py-2 text-[11px] min-[370px]:text-[12px] sm:text-sm font-extrabold uppercase tracking-wide data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow transition-all whitespace-nowrap">Orders</TabsTrigger>
            <TabsTrigger value="menu" className="flex-1 sm:flex-none rounded-xl py-2.5 px-0 sm:px-7 sm:py-2 text-[11px] min-[370px]:text-[12px] sm:text-sm font-extrabold uppercase tracking-wide data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow transition-all whitespace-nowrap">Menu</TabsTrigger>
            <TabsTrigger value="billing" className="flex-1 sm:flex-none rounded-xl py-2.5 px-0 sm:px-7 sm:py-2 text-[11px] min-[370px]:text-[12px] sm:text-sm font-extrabold uppercase tracking-wide data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow transition-all whitespace-nowrap">Bills</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 sm:flex-none rounded-xl py-2.5 px-0 sm:px-7 sm:py-2 text-[11px] min-[370px]:text-[12px] sm:text-sm font-extrabold uppercase tracking-wide data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow transition-all whitespace-nowrap">Users</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orders" className="space-y-4 animate-in">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/20 border shadow-sm print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
               <h3 className="font-heading font-black text-xl md:text-2xl flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent uppercase tracking-wider whitespace-nowrap drop-shadow-sm">
                 <ShoppingBag className="h-5 w-5 text-primary" /> Orders
               </h3>
               <div className="w-full sm:w-auto"><SearchBar val={orderQuery} setVal={setOrderQuery} placeholder="Search by name..." /></div>
            </div>
            <div className="flex items-center gap-2 flex-wrap md:justify-end">
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
              <Select value={orderDateFilter} onValueChange={setOrderDateFilter}>
                <SelectTrigger className="w-[120px] rounded-xl h-8 text-xs bg-card"><SelectValue placeholder="Date Range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  {allOrderMonths.map(m => {
                     const date = new Date(`${m}-01`);
                     const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                     return <SelectItem key={m} value={m}>{label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              <PrintButton onClick={() => setPreviewMode("orders")} />
              <ExportButton data={ordersExportData} filename="orders" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 print:hidden">
            {filteredOrders.length === 0 && <p className="text-muted-foreground text-sm col-span-full ml-2">No orders matched search criteria.</p>}
            {filteredOrders.map(order => {
              // Extract the base color for the top border
              const colorBase = order.status === 'pending' ? 'bg-amber-500' :
                                order.status === 'confirmed' ? 'bg-blue-500' :
                                order.status === 'cancelled' ? 'bg-red-500' :
                                order.status === 'completed' ? 'bg-emerald-500' : 'bg-primary';
              const userDetail = users.find(u => u.id === order.userId);
              
              return (
              <Card key={order.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-border/80 hover:border-primary/30 rounded-3xl bg-card flex flex-col relative shadow-sm">
                <div className={`absolute top-0 left-0 w-full h-1.5 ${colorBase}`}></div>
                
                <CardHeader className="p-3 bg-muted/20 border-b flex flex-row items-start justify-between space-y-0 mt-1">
                  <div className="flex flex-col gap-1.5 min-w-0 pr-2">
                    <CardTitle className="text-base font-extrabold whitespace-normal break-words leading-tight">{order.userName}</CardTitle>
                    {userDetail && (
                       <p className="text-[10px] text-muted-foreground font-semibold uppercase leading-none mt-0.5 line-clamp-1">
                         {userDetail.department} • {userDetail.designation}
                       </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] px-2 py-0.5 shadow-none uppercase font-bold leading-none">
                         {order.dayName.slice(0, 3)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold leading-none">
                         {getAccurateOrderDate(order.date, order.dayName).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs px-2.5 py-1 whitespace-nowrap shadow-sm capitalize border-2 font-bold shrink-0 mt-0.5 ${statusColors[order.status]}`}>{order.status}</Badge>
                </CardHeader>
                <CardContent className="p-3 flex-1 flex flex-col">
                  <div className="text-xs font-semibold mb-4 space-y-2 flex-1 mt-1">
                    {order.items.map((i, k) => (
                      <div key={k} className="flex justify-between items-center bg-background border border-border/50 p-2 rounded-xl shadow-sm">
                        <span className="text-foreground truncate mr-2 font-medium">{i.menuItem.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold bg-muted px-2 py-1 rounded-md text-xs border border-border/50">x{i.quantity}</span>
                          <span className="font-bold text-primary bg-primary/5 px-2 py-1 rounded-md text-xs border border-primary/10">৳{i.menuItem.price * i.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-primary/10 px-3.5 py-2 rounded-xl border border-primary/20 shadow-sm hover:bg-primary/20 transition-colors">
                            <span className="font-black text-sm text-primary tracking-tight">৳{order.total}</span>
                            
                         </div>
                    </div>
                    <div className="flex gap-2">
                      {!isTopManagement && order.status === "pending" && (
                        <>
                          <Button size="icon" variant="outline" className="h-9 w-9 rounded-full text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-600/30 shadow-sm transition-colors" onClick={() => confirmOrder(order.id)}><CheckCircle className="h-5 w-5" /></Button>
                          <Button size="icon" variant="outline" className="h-9 w-9 rounded-full text-rose-600 hover:bg-rose-600 hover:text-white border-rose-600/30 shadow-sm transition-colors" onClick={() => rejectOrder(order.id)}><XCircle className="h-5 w-5" /></Button>
                        </>
                      )}
                      {!isTopManagement && order.status === "confirmed" && (
                        <Button size="sm" className="h-9 font-bold px-5 text-sm rounded-full bg-primary/10 hover:bg-primary/20 text-primary shadow-sm border border-primary/20" onClick={() => completeOrder(order.id)}>Complete</Button>
                      )}
                      {!isTopManagement && (
                        <Button size="icon" variant="outline" className="h-9 w-9 rounded-full text-red-600 hover:bg-red-600 hover:text-white border-red-600/30 shadow-sm transition-colors shrink-0" onClick={() => setOrderToDelete(order.id)} title="Delete Order"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
            </div>
          </div>
          <div className={`${previewMode === "orders" ? "fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto animate-in fade-in zoom-in-95 print:static print:bg-transparent print:p-0 print:block print:overflow-visible flex flex-col items-center" : "hidden print:block"}`}>
             {previewMode === "orders" && (
                <div className="w-full max-w-5xl bg-card text-card-foreground p-4 sm:p-6 rounded-3xl shadow-xl border mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden shrink-0 mt-8 sm:mt-0">
                  <div>
                    <h3 className="text-xl font-bold font-heading">Editable Print Preview</h3>
                    <p className="text-sm text-muted-foreground">Click any text or number below to override it before making the final print.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewMode(null)} className="h-10 px-6 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all">Discard</Button>
                    <Button onClick={() => window.print()} className="h-10 px-6 shadow-md"><Printer className="h-4 w-4 mr-2" /> Print Target</Button>
                  </div>
                </div>
             )}
             <div className={`bg-white text-black w-full max-w-5xl ${previewMode === "orders" ? "p-4 sm:p-12 mb-8 rounded-3xl shadow-2xl border relative overflow-x-auto print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:overflow-visible" : ""}`}>
               <div className="min-w-[800px] print:min-w-full">
                 {renderPrintOrders()}
               </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4 animate-in">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/20 border shadow-sm print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
              <h3 className="font-heading font-black text-xl md:text-2xl flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent uppercase tracking-wider whitespace-nowrap drop-shadow-sm">Menu Items</h3>
              <div className="w-full sm:w-auto"><SearchBar val={menuQuery} setVal={setMenuQuery} placeholder="Search item..." /></div>
            </div>
            <div className="flex items-center gap-2 flex-wrap md:justify-end">
              <Select value={menuCategory} onValueChange={setMenuCategory}>
                <SelectTrigger className="w-[110px] rounded-xl h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tea">Tea</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                  <SelectItem value="meal">Meal</SelectItem>
                </SelectContent>
              </Select>
              <PrintButton onClick={() => setPreviewMode("menu")} />
              {!isTopManagement && (
                <Button onClick={openAddMenu} size="sm" className="rounded-full shadow-sm bg-gradient-to-r from-emerald-500 to-teal-500 border-none h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:hidden">
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
                  {!isTopManagement && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => openEditMenu(item)}>Edit</Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg text-red-600 hover:bg-red-600 hover:text-white border-red-600/30" onClick={() => setDeleteConfirm(item.id)}>Del</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
          <div className={`${previewMode === "menu" ? "fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto animate-in fade-in zoom-in-95 print:static print:bg-transparent print:p-0 print:block print:overflow-visible flex flex-col items-center" : "hidden print:block"}`}>
             {previewMode === "menu" && (
                <div className="w-full max-w-5xl bg-card text-card-foreground p-4 sm:p-6 rounded-3xl shadow-xl border mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden shrink-0 mt-8 sm:mt-0">
                  <div>
                    <h3 className="text-xl font-bold font-heading">Editable Print Preview</h3>
                    <p className="text-sm text-muted-foreground">Click any text or number below to override it before making the final print.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewMode(null)} className="h-10 px-6 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all">Discard</Button>
                    <Button onClick={() => window.print()} className="h-10 px-6 shadow-md"><Printer className="h-4 w-4 mr-2" /> Print Target</Button>
                  </div>
                </div>
             )}
             <div className={`bg-white text-black w-full max-w-5xl ${previewMode === "menu" ? "p-4 sm:p-12 mb-8 rounded-3xl shadow-2xl border relative overflow-x-auto print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:overflow-visible" : ""}`}>
               <div className="min-w-[800px] print:min-w-full">
                 {renderPrintMenu()}
               </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 animate-in">
          <div>
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/20 border shadow-sm print:hidden">
             <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
               <h3 className="font-heading font-black text-xl md:text-2xl flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent uppercase tracking-wider whitespace-nowrap drop-shadow-sm">Billings</h3>
               <div className="w-full sm:w-auto"><SearchBar val={billQuery} setVal={setBillQuery} placeholder="Search user..." /></div>
             </div>
             <div className="flex items-center gap-2 flex-wrap">
               <Select value={billStatus} onValueChange={setBillStatus}>
                 <SelectTrigger className="w-[110px] rounded-xl h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Status</SelectItem>
                   <SelectItem value="paid">Paid</SelectItem>
                   <SelectItem value="unpaid">Unpaid</SelectItem>
                   <SelectItem value="partial">Partial</SelectItem>
                 </SelectContent>
               </Select>
               <Select value={billingMonth} onValueChange={setBillingMonth}>
                 <SelectTrigger className="w-[120px] rounded-xl h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Months</SelectItem>
                   {allBillingMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                 </SelectContent>
               </Select>
               <PrintButton onClick={() => setPreviewMode("billing")} />
               <ExportButton data={billsExportData} filename="billing-ledger" />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
            {filteredBills.length === 0 && <p className="text-muted-foreground text-sm col-span-full ml-2">No ledgers matched search criteria.</p>}
            {filteredBills.map(bill => (
              <Card key={bill.id} className="border shadow-sm rounded-2xl overflow-hidden bg-card">
                <CardContent className="p-0 flex">
                  <div className={`w-2 ${bill.status === 'paid' ? 'bg-emerald-500' : bill.status === 'partial' ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
                  <div className="p-4 flex-1">
                    <div className="flex items-center justify-between mb-2 border-b pb-2 gap-2">
                       <p className="font-bold text-sm line-clamp-2 break-words">{bill.userName}</p>
                       <Badge variant="outline" className={`text-[10px] capitalize shrink-0 ${statusColors[bill.status]}`}>{bill.status}</Badge>
                    </div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{bill.month}</span><span>{bill.orders} orders</span></div>
                    <div className="flex justify-between items-center text-xs mb-1 group/editbill">
                       <span className="text-muted-foreground">Owed</span>
                       <div className="flex items-center gap-1">
                          <span className="font-bold">৳{bill.totalAmount}</span>
                       </div>
                    </div>
                    <div className="flex justify-between text-xs mb-3"><span className="text-muted-foreground">Paid</span><span className="font-bold text-emerald-600 dark:text-emerald-400">৳{bill.paidAmount}</span></div>
                    
                    {!isTopManagement && (
                      <div className="flex items-center gap-2 mt-2">
                        {bill.status !== "paid" && <Button size="sm" className="flex-1 h-8 text-xs rounded-lg font-bold" onClick={() => markBillPaid(bill.id)}>Settle <ChevronRight className="h-3 w-3 ml-1" /></Button>}
                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 rounded-lg border border-red-600/30 hover:bg-red-600 hover:text-white shadow-sm shrink-0" onClick={() => setBillToDelete(bill.id)} title="Delete Bill"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
          <div className={`${previewMode === "billing" ? "fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto animate-in fade-in zoom-in-95 print:static print:bg-transparent print:p-0 print:block print:overflow-visible flex flex-col items-center" : "hidden print:block"}`}>
             {previewMode === "billing" && (
                <div className="w-full max-w-5xl bg-card text-card-foreground p-4 sm:p-6 rounded-3xl shadow-xl border mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden shrink-0 mt-8 sm:mt-0">
                  <div>
                    <h3 className="text-xl font-bold font-heading">Editable Print Preview</h3>
                    <p className="text-sm text-muted-foreground">Click any text or number below to override it before making the final print.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewMode(null)} className="h-10 px-6 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all">Discard</Button>
                    <Button onClick={() => window.print()} className="h-10 px-6 shadow-md"><Printer className="h-4 w-4 mr-2" /> Print Target</Button>
                  </div>
                </div>
             )}
             <div className={`bg-white text-black w-full max-w-5xl ${previewMode === "billing" ? "p-4 sm:p-12 mb-8 rounded-3xl shadow-2xl border relative overflow-x-auto print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:overflow-visible" : ""}`}>
               <div className="min-w-[800px] print:min-w-full">
                 {renderPrintBilling()}
               </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 animate-in">
           <div>
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/20 border shadow-sm print:hidden">
             <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
               <h3 className="font-heading font-black text-xl md:text-2xl flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent uppercase tracking-wider whitespace-nowrap drop-shadow-sm">Manage Users</h3>
               <div className="w-full sm:w-auto"><SearchBar val={userQuery} setVal={setUserQuery} placeholder="Search name/email..." /></div>
             </div>
             <div className="flex items-center gap-2 flex-wrap md:justify-end">
               <Select value={userFilter} onValueChange={setUserFilter}>
                 <SelectTrigger className="w-[120px] rounded-xl h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Users</SelectItem>
                   <SelectItem value="admin">Admins</SelectItem>
                   <SelectItem value="member">Members</SelectItem>
                   <SelectItem value="restricted">Restricted</SelectItem>
                 </SelectContent>
               </Select>
               <Badge variant="secondary" className="px-3 py-1 flex items-center justify-center text-xs h-8 rounded-lg">{filteredUsers.length} Found</Badge>
               <PrintButton onClick={() => setPreviewMode("users")} />
             </div>
           </div>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 print:hidden">
            {filteredUsers.map(u => {
              const isBlocked = u.blocked && u.blocked !== "none";
              const colorBase = isBlocked ? "bg-red-500" : "bg-blue-500";
              
                      return (
              <Card key={u.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-border/80 hover:border-primary/30 rounded-3xl bg-card flex flex-col relative shadow-sm">
                <div className={`absolute top-0 left-0 w-full h-1.5 ${colorBase}`}></div>
                
                <CardHeader className="p-3 bg-muted/20 border-b flex flex-row items-center justify-between space-y-0 mt-1">
                  <div className="flex flex-col gap-1.5 min-w-0 pr-2">
                    <CardTitle className="text-base font-extrabold line-clamp-2 break-words leading-tight" title={u.name}>{u.name}</CardTitle>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] px-2 py-0.5 shadow-none uppercase font-bold leading-none">
                         {u.role === "admin" ? "Admin" : "Member"}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-semibold leading-tight break-all" title={u.email}>
                         {u.email}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs px-2.5 py-1 whitespace-nowrap shadow-sm capitalize border-2 font-bold shrink-0 self-start mt-1 ${isBlocked ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                    {isBlocked ? "Restricted" : "Active"}
                  </Badge>
                </CardHeader>
                
                <CardContent className="p-3 flex-1 flex flex-col">
                  <div className="text-xs font-semibold mb-4 space-y-2 flex-1 mt-1">
                    
                    <div className="flex justify-between items-center bg-background border border-border/50 p-2 rounded-xl shadow-sm">
                      <span className="text-muted-foreground mr-2 font-medium">Designation</span>
                      <span className="font-bold bg-muted px-2 py-1 rounded-md text-xs border border-border/50 text-foreground truncate max-w-[150px]">{u.designation}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-background border border-border/50 p-2 rounded-xl shadow-sm">
                      <span className="text-muted-foreground mr-2 font-medium">Department</span>
                      <span className="font-bold bg-muted px-2 py-1 rounded-md text-xs border border-border/50 text-foreground truncate max-w-[150px]" title={u.department}>{u.department}</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-background border border-border/50 p-2 rounded-xl shadow-sm">
                      <span className="text-muted-foreground mr-2 font-medium">Contact</span>
                      <span className="font-bold bg-muted px-2 py-1 rounded-md text-xs border border-border/50 text-primary bg-primary/5">{u.phone}</span>
                    </div>

                  </div>

                  {!isTopManagement && (
                    <div className="flex items-center justify-between pt-4 border-t mt-auto gap-2">
                      <div className="flex-1">
                      {(!u.blocked || u.blocked === "none") ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className="w-full h-9 text-xs rounded-xl font-bold bg-gradient-to-r from-[hsl(30,75%,55%)] to-[hsl(32,85%,50%)] hover:from-[hsl(32,90%,55%)] hover:to-[hsl(30,80%,60%)] text-[hsl(24,10%,8%)] shadow-md shadow-[hsl(30,75%,55%)]/30 hover:shadow-lg hover:shadow-[hsl(30,75%,55%)]/50 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] border-none transition-all duration-300 ease-out" size="sm">Manage Rights</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="rounded-xl border-border/50 shadow-xl w-[200px]">
                            <DropdownMenuItem onClick={() => blockUser(u.id, "ordering")} className="rounded-lg cursor-pointer font-medium">Disable Ordering</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => blockUser(u.id, "full")} className="text-red-600 rounded-lg cursor-pointer font-bold mt-1">Full Ban</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button variant="outline" className="w-full h-9 text-xs font-bold rounded-xl text-emerald-600 border-emerald-600/30 hover:bg-emerald-600 hover:text-white shadow-sm dark:text-emerald-400 dark:hover:text-white" onClick={() => blockUser(u.id, "none")}><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Restore Access</Button>
                      )}
                      </div>
                      <Button variant="outline" size="icon" className="h-9 w-10 text-red-600 rounded-xl border border-red-600/30 hover:bg-red-600 hover:text-white shadow-sm shrink-0" onClick={() => setUserToDelete(u.id)} title="Delete User"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              )
            })}
            </div>
          </div>
          <div className={`${previewMode === "users" ? "fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto animate-in fade-in zoom-in-95 print:static print:bg-transparent print:p-0 print:block print:overflow-visible flex flex-col items-center" : "hidden print:block"}`}>
             {previewMode === "users" && (
                <div className="w-full max-w-5xl bg-card text-card-foreground p-4 sm:p-6 rounded-3xl shadow-xl border mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden shrink-0 mt-8 sm:mt-0">
                  <div>
                    <h3 className="text-xl font-bold font-heading">Editable Print Preview</h3>
                    <p className="text-sm text-muted-foreground">Click any text or number below to override it before making the final print.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPreviewMode(null)} className="h-10 px-6 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all">Discard</Button>
                    <Button onClick={() => window.print()} className="h-10 px-6 shadow-md"><Printer className="h-4 w-4 mr-2" /> Print Target</Button>
                  </div>
                </div>
             )}
             <div className={`bg-white text-black w-full max-w-5xl ${previewMode === "users" ? "p-4 sm:p-12 mb-8 rounded-3xl shadow-2xl border relative overflow-x-auto print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:overflow-visible" : ""}`}>
               <div className="min-w-[800px] print:min-w-full">
                 {renderPrintUsers()}
               </div>
             </div>
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
               <Select value={formCategory} onValueChange={(v: "tea" | "snack" | "meal")=>setFormCategory(v)}>
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
                  <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-2 py-1 text-[10px] rounded-md border transition-all duration-200 active:scale-95 touch-manipulation select-none ${formDays.includes(day) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-background hover:bg-muted'}`}>{day.slice(0,3)}</button>
                ))}
             </div>
          </div>
          <DialogFooter className="mt-4 pt-3 border-t">
            <Button onClick={handleSaveMenu} className="w-full text-sm h-10 rounded-xl" size="sm">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}><DialogContent className="max-w-sm rounded-[1.5rem] p-5"><DialogHeader className="mb-2"><DialogTitle>Broadcast</DialogTitle></DialogHeader><Textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)} placeholder="Message..." rows={4} className="text-sm bg-muted/30 resize-none" /><DialogFooter className="mt-4"><Button onClick={handleSendAnnouncement} size="sm" className="w-full h-10 rounded-xl shadow-sm">Send</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}><DialogContent className="max-w-xs rounded-2xl p-5 text-center"><DialogTitle className="text-base mb-3">Delete Menu Item?</DialogTitle><div className="flex gap-2"><Button variant="outline" className="flex-1 h-9 rounded-xl" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="destructive" className="flex-1 h-9 rounded-xl" onClick={() => deleteConfirm && handleDeleteMenu(deleteConfirm)}>Confirm</Button></div></DialogContent></Dialog>
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}><DialogContent className="max-w-md rounded-2xl p-6 text-center"><DialogHeader><DialogTitle className="text-xl mb-2 text-red-600">Delete User & All History?</DialogTitle><DialogDescription className="text-sm">This action is irreversible. The user's account, their orders, and their billing history will be completely wiped from the database. They will not be able to log in with this account again.</DialogDescription></DialogHeader><div className="flex gap-3 mt-4"><Button variant="outline" className="flex-1 h-10 rounded-xl font-bold" onClick={() => setUserToDelete(null)}>Cancel</Button><Button variant="destructive" className="flex-1 h-10 rounded-xl font-bold" onClick={() => userToDelete && handleDeleteUser(userToDelete)}>Yes, Delete User Data</Button></div></DialogContent></Dialog>
      <Dialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}><DialogContent className="max-w-xs rounded-2xl p-5 text-center"><DialogTitle className="text-base mb-3 text-red-600">Delete Order Permanently?</DialogTitle><div className="flex gap-2"><Button variant="outline" className="flex-1 h-9 rounded-xl font-bold" onClick={() => setOrderToDelete(null)}>Cancel</Button><Button variant="destructive" className="flex-1 h-9 rounded-xl font-bold" onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}>Delete</Button></div></DialogContent></Dialog>
      <Dialog open={!!billToDelete} onOpenChange={() => setBillToDelete(null)}><DialogContent className="max-w-xs rounded-2xl p-5 text-center"><DialogTitle className="text-base mb-3 text-red-600">Delete Billing History?</DialogTitle><div className="flex gap-2"><Button variant="outline" className="flex-1 h-9 rounded-xl font-bold" onClick={() => setBillToDelete(null)}>Cancel</Button><Button variant="destructive" className="flex-1 h-9 rounded-xl font-bold" onClick={() => billToDelete && handleDeleteBill(billToDelete)}>Delete</Button></div></DialogContent></Dialog>
    </div>
  );
}
