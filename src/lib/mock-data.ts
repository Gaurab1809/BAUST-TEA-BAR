import milkTeaImg from "@/assets/items/milk-tea.jpg";
import singaraImg from "@/assets/items/singara.jpg";
import eggSandwichImg from "@/assets/items/egg-sandwich.jpg";
import puriImg from "@/assets/items/puri.jpg";
import blackTeaImg from "@/assets/items/black-tea.jpg";
import biscuitImg from "@/assets/items/biscuit.jpg";

export type DayOfWeek = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday";

export const WORKING_DAYS: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: "tea" | "snack" | "meal";
  availableDays: DayOfWeek[];
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  total: number;
  date: string;
  dayName: DayOfWeek;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  phone: string;
  avatar?: string;
  role: "admin" | "user";
  blocked?: "none" | "ordering" | "full";
  passwordHash?: string;
}

export interface MonthlyBill {
  id: string;
  userId: string;
  userName: string;
  month: string;
  totalAmount: number;
  paidAmount: number;
  status: "paid" | "unpaid" | "partial";
  orders: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "order" | "payment" | "menu" | "announcement";
  targetUserId?: string;
  read: boolean;
  createdAt: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: "1", name: "Milk Tea (দুধ চা)", description: "Classic Bangladeshi milk tea with premium blend", price: 15, image: milkTeaImg, category: "tea", availableDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] },
  { id: "2", name: "Black Tea (লাল চা)", description: "Strong black tea, refreshing and aromatic", price: 10, image: blackTeaImg, category: "tea", availableDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] },
  { id: "3", name: "Singara (সিঙ্গাড়া)", description: "Crispy golden singara with spiced potato filling", price: 15, image: singaraImg, category: "snack", availableDays: ["Sunday", "Tuesday", "Thursday"] },
  { id: "4", name: "Egg Sandwich", description: "Toasted bread with egg filling, a perfect snack", price: 30, image: eggSandwichImg, category: "meal", availableDays: ["Sunday", "Monday", "Wednesday"] },
  { id: "5", name: "Puri (পুরি)", description: "Deep fried puffed bread, served with chana", price: 20, image: puriImg, category: "meal", availableDays: ["Monday", "Wednesday", "Thursday"] },
  { id: "6", name: "Biscuit", description: "Crispy cookies, perfect with tea", price: 10, image: biscuitImg, category: "snack", availableDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] },
];

export const SAMPLE_ORDERS: Order[] = [
  { id: "o1", userId: "u1", userName: "Dr. Rahman", items: [{ menuItem: MENU_ITEMS[0], quantity: 2 }, { menuItem: MENU_ITEMS[2], quantity: 1 }], total: 45, date: "2026-04-13", dayName: "Sunday", status: "confirmed", createdAt: "2026-04-11T10:00:00Z" },
  { id: "o2", userId: "u2", userName: "Prof. Hasan", items: [{ menuItem: MENU_ITEMS[1], quantity: 1 }, { menuItem: MENU_ITEMS[5], quantity: 2 }], total: 30, date: "2026-04-13", dayName: "Sunday", status: "pending", createdAt: "2026-04-11T11:30:00Z" },
  { id: "o3", userId: "u3", userName: "Asst. Prof. Karim", items: [{ menuItem: MENU_ITEMS[3], quantity: 1 }], total: 30, date: "2026-04-14", dayName: "Monday", status: "pending", createdAt: "2026-04-11T09:00:00Z" },
];

export const SAMPLE_BILLS: MonthlyBill[] = [
  { id: "b1", userId: "u1", userName: "Dr. Rahman", month: "March 2026", totalAmount: 850, paidAmount: 850, status: "paid", orders: 22 },
  { id: "b2", userId: "u2", userName: "Prof. Hasan", month: "March 2026", totalAmount: 620, paidAmount: 0, status: "unpaid", orders: 18 },
  { id: "b3", userId: "u3", userName: "Asst. Prof. Karim", month: "March 2026", totalAmount: 440, paidAmount: 200, status: "partial", orders: 14 },
];

export const SAMPLE_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Order Confirmed", message: "Your order for Sunday has been confirmed by admin.", type: "order", targetUserId: "u1", read: false, createdAt: "2026-04-11T12:00:00Z" },
  { id: "n2", title: "Monthly Bill Generated", message: "Your March 2026 bill of ৳850 has been generated.", type: "payment", targetUserId: "u1", read: false, createdAt: "2026-04-01T08:00:00Z" },
  { id: "n3", title: "New Menu Item", message: "Puri with Chana has been added to Monday menu!", type: "menu", read: true, createdAt: "2026-03-28T10:00:00Z" },
];

export const CURRENT_USER: User = {
  id: "u1",
  name: "Dr. Abdul Rahman",
  email: "rahman@baust.edu.bd",
  designation: "Associate Professor",
  department: "Computer Science & Engineering",
  phone: "+880-1712-345678",
  role: "user",
};
