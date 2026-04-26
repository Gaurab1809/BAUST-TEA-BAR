import { Link } from "react-router-dom";
import { Coffee, Shield, Users, Briefcase } from "lucide-react";
import logo from "@/assets/logo-new.jpg";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-10 max-w-lg mx-auto animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 rounded-full overflow-hidden shadow-2xl border-4 border-background ring-4 ring-primary/20">
          <img src={logo} alt="BAUST Tea Bar Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading mb-3 tracking-tight text-foreground">
          Welcome to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">BAUST Tea Bar</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed px-4">
          Welcome to the official digital cafeteria, designed exclusively for BAUST teachers, staff, and university management. Enjoy a seamless, lightweight experience to order your daily meals.
        </p>
      </div>

      {/* Portals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        
        <Link to="/login?type=management" className="group">
          <div className="h-full bg-card hover:bg-muted/50 border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-2xl rounded-full translate-x-8 -translate-y-8" />
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg mb-2">Top Management</h3>
            <p className="text-xs text-muted-foreground">Read-only oversight dashboard and full reporting.</p>
          </div>
        </Link>
        
        <Link to="/login?type=admin" className="group">
          <div className="h-full bg-card hover:bg-muted/50 border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/10 to-orange-500/10 blur-2xl rounded-full translate-x-8 -translate-y-8" />
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg mb-2">Administration</h3>
            <p className="text-xs text-muted-foreground">Manage orders, update menus, and billing operations.</p>
          </div>
        </Link>

        <Link to="/login?type=staff" className="group">
          <div className="h-full bg-card hover:bg-muted/50 border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-2xl rounded-full translate-x-8 -translate-y-8" />
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg mb-2">Teachers & Staff</h3>
            <p className="text-xs text-muted-foreground">Place your daily orders and check your ledger.</p>
          </div>
        </Link>
        
      </div>
    </div>
  );
}
