import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, LogOut, Menu, Moon, Sun, User, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useAppState } from "@/lib/app-state";
import logo from "@/assets/logo.png";

export function Navbar() {
  const { user, isAdmin, logout, isAuthenticated } = useAuth();
  const { notifications } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const relevantNotifications = notifications.filter(n => 
    isAdmin || n.type === "announcement" || n.targetUserId === user?.id
  );
  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const syncTheme = () => setDark(document.documentElement.classList.contains("dark"));
    window.addEventListener("theme-changed", syncTheme);
    return () => window.removeEventListener("theme-changed", syncTheme);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/order", label: "Order" },
    { to: "/my-orders", label: "My Orders" },
    { to: "/billing", label: "Billing" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logo} alt="BAUST Tea Bar" className="h-8 w-8" />
          <span className="font-heading text-lg font-bold text-primary">BAUST Tea Bar</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 text-muted-foreground">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 bg-primary/10 text-primary overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.designation}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card animate-slide-up">
          <div className="flex flex-col p-3 gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.to) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
