import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { MenuItem, Order, OrderItem, MonthlyBill, Notification, DayOfWeek, User, MENU_ITEMS as INITIAL_MENU } from "./mock-data";
import { db } from "./firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot, addDoc, updateDoc, getDocs, getDoc, increment, writeBatch } from "firebase/firestore";

interface AppState {
  // Menu
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, "id">) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;

  // Orders
  orders: Order[];
  placeOrder: (userId: string, userName: string, items: OrderItem[], date: string, dayName: DayOfWeek) => void;
  cancelOrder: (orderId: string) => void;
  confirmOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  completeOrder: (orderId: string) => void;

  // Bills
  bills: MonthlyBill[];
  markBillPaid: (billId: string) => void;
  markBillPartial: (billId: string, amount: number) => void;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: (notifIdsToMark: string[]) => void;
  addNotification: (notif: Omit<Notification, "id" | "createdAt">) => void;

  // Users (admin)
  users: User[];
  addUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  blockUser: (userId: string, blockType: "none" | "ordering" | "full") => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Setup Firestore Real-time Listeners
  useEffect(() => {
    const unsubMenu = onSnapshot(collection(db, "menuItems"), (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
      // Optionally seed default items if empty initially
      if (items.length === 0) {
        const seedMenu = async () => {
          const batch = writeBatch(db);
          INITIAL_MENU.forEach(item => {
            const docRef = doc(collection(db, "menuItems"));
            batch.set(docRef, { ...item, id: docRef.id });
          });
          await batch.commit();
        };
        seedMenu();
      } else {
        setMenuItems(items);
      }
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Order));
      // Sort by latest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(items);
    });

    const unsubBills = onSnapshot(collection(db, "bills"), (snapshot) => {
      setBills(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MonthlyBill)));
    });

    const unsubNotifs = onSnapshot(collection(db, "notifications"), (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Notification));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(items);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User)));
    });

    return () => {
      unsubMenu(); unsubOrders(); unsubBills(); unsubNotifs(); unsubUsers();
    };
  }, []);

  const addNotification = useCallback((notif: Omit<Notification, "id" | "createdAt">) => {
    addDoc(collection(db, "notifications"), {
      ...notif,
      createdAt: new Date().toISOString(),
    });
  }, []);

  // -- MENU --
  const addMenuItem = useCallback((item: Omit<MenuItem, "id">) => {
    const docRef = doc(collection(db, "menuItems"));
    setDoc(docRef, { ...item, id: docRef.id });
  }, []);

  const updateMenuItem = useCallback((id: string, updates: Partial<MenuItem>) => {
    updateDoc(doc(db, "menuItems", id), updates);
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    deleteDoc(doc(db, "menuItems", id));
  }, []);

  // -- BILLING AUTOMATIC UPDATE LOGIC --
  // Helper to ensure a bill is tracked properly when orders change
  const updateMonthlyBill = async (userId: string, userName: string, orderTotal: number, dateIsoStr: string, isOrderRemoved: boolean = false) => {
    const d = new Date(dateIsoStr);
    const monthYear = d.toLocaleString('default', { month: 'long' }) + " " + d.getFullYear(); // e.g. "April 2026"
    const billId = `${userId}_${d.getFullYear()}_${d.getMonth()}`;
    const billRef = doc(db, "bills", billId);

    const adjustment = isOrderRemoved ? -orderTotal : orderTotal;
    const orderCountAdj = isOrderRemoved ? -1 : 1;

    try {
      const billSnap = await getDoc(billRef);
      if (billSnap.exists()) {
        const data = billSnap.data() as MonthlyBill;
        // calculate new status automatically
        const newTotal = Math.max(0, data.totalAmount + adjustment);
        let newStatus = data.status;
        if (newTotal === 0) newStatus = "paid";
        else if (data.paidAmount >= newTotal) newStatus = "paid";
        else if (data.paidAmount > 0) newStatus = "partial";
        else newStatus = "unpaid";

        await updateDoc(billRef, {
          totalAmount: increment(adjustment),
          orders: increment(orderCountAdj),
          status: newStatus
        });
      } else {
        if (isOrderRemoved) return; // Cannot remove from non-existent bill
        
        await setDoc(billRef, {
          id: billId,
          userId,
          userName,
          month: monthYear,
          totalAmount: orderTotal,
          paidAmount: 0,
          status: "unpaid",
          orders: 1
        });
      }
    } catch (e) {
      console.error("Error updating bill", e);
    }
  };

  // -- ORDERS --
  const placeOrder = useCallback(async (userId: string, userName: string, items: OrderItem[], date: string, dayName: DayOfWeek) => {
    const total = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
    const orderRef = doc(collection(db, "orders"));
    
    await setDoc(orderRef, {
      id: orderRef.id,
      userId, userName, items, total, date, dayName,
      status: "pending", 
      createdAt: new Date().toISOString()
    });

    // Directly track it in the bill right now so admin sees unpaid amount instantly
    await updateMonthlyBill(userId, userName, total, date, false);

    addNotification({ title: "Order Placed", message: `Your order for ${dayName} (৳${total}) has been placed.`, type: "order", targetUserId: userId, read: false });
  }, [addNotification]);

  const cancelOrder = useCallback(async (orderId: string) => {
    const o = orders.find(x => x.id === orderId);
    if (!o || o.status !== "pending") return;

    await updateDoc(doc(db, "orders", orderId), { status: "cancelled" });
    await updateMonthlyBill(o.userId, o.userName, o.total, o.date, true);
    addNotification({ title: "Order Cancelled", message: "Your order has been cancelled.", type: "order", targetUserId: o.userId, read: false });
  }, [orders, addNotification]);

  const confirmOrder = useCallback(async (orderId: string) => {
    const o = orders.find(x => x.id === orderId);
    if (!o) return;
    
    await updateDoc(doc(db, "orders", orderId), { status: "confirmed" });
    addNotification({ title: "Order Confirmed", message: `${o.userName}'s order for ${o.dayName} has been confirmed.`, type: "order", targetUserId: o.userId, read: false });
  }, [orders, addNotification]);

  const rejectOrder = useCallback(async (orderId: string) => {
    const o = orders.find(x => x.id === orderId);
    if (!o || o.status !== "pending") return;

    await updateDoc(doc(db, "orders", orderId), { status: "cancelled" });
    await updateMonthlyBill(o.userId, o.userName, o.total, o.date, true);
    addNotification({ title: "Order Cancelled", message: `Your order for ${o.dayName} (৳${o.total}) has been cancelled by the admin.`, type: "order", targetUserId: o.userId, read: false });
  }, [orders, addNotification]);

  const completeOrder = useCallback((orderId: string) => {
    updateDoc(doc(db, "orders", orderId), { status: "completed" });
  }, []);

  // -- BILLS --
  const markBillPaid = useCallback(async (billId: string) => {
    const b = bills.find(x => x.id === billId);
    if (!b) return;
    await updateDoc(doc(db, "bills", billId), {
      paidAmount: b.totalAmount,
      status: "paid"
    });
    addNotification({ title: "Payment Recorded", message: "Your payment has been marked as fully paid.", type: "payment", targetUserId: b.userId, read: false });
  }, [bills, addNotification]);

  const markBillPartial = useCallback(async (billId: string, amount: number) => {
    const b = bills.find(x => x.id === billId);
    if (!b) return;

    const newPaid = b.paidAmount + amount;
    const isFullyPaid = newPaid >= b.totalAmount;
    
    await updateDoc(doc(db, "bills", billId), {
      paidAmount: newPaid,
      status: isFullyPaid ? "paid" : "partial"
    });
  }, [bills]);

  // -- NOTIFICATIONS --
  const markNotificationRead = useCallback((notifId: string) => {
    updateDoc(doc(db, "notifications", notifId), { read: true });
  }, []);

  const markAllNotificationsRead = useCallback(async (notifIdsToMark: string[]) => {
    const batch = writeBatch(db);
    notifIdsToMark.forEach((id) => {
      batch.update(doc(db, "notifications", id), { read: true });
    });
    await batch.commit();
  }, []);

  // -- USERS --
  const addUser = useCallback((user: User) => {
    // This is managed dynamically via Auth context creating docs, 
    // but just in case, we'll write:
    setDoc(doc(db, "users", user.id), user);
  }, []);

  const deleteUser = useCallback((userId: string) => {
    // Note: This deletes the Firestore profile, but not their Auth account 
    // unless done through an Admin SDK
    deleteDoc(doc(db, "users", userId));
  }, []);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    updateDoc(doc(db, "users", userId), updates);
  }, []);

  const blockUser = useCallback((userId: string, blockType: "none" | "ordering" | "full") => {
    updateDoc(doc(db, "users", userId), { blocked: blockType });
  }, []);

  return (
    <AppStateContext.Provider value={{
      menuItems, addMenuItem, updateMenuItem, deleteMenuItem,
      orders, placeOrder, cancelOrder, confirmOrder, rejectOrder, completeOrder,
      bills, markBillPaid, markBillPartial,
      notifications, markNotificationRead, markAllNotificationsRead, addNotification,
      users, addUser, deleteUser, updateUser, blockUser,
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
};
