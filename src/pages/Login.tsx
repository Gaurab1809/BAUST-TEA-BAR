import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Coffee, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import logo from "@/assets/logo-new.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'staff';

  const portalNames: Record<string, string> = {
    management: "Management Portal",
    admin: "Admin Portal",
    staff: "Teacher & Staff Login"
  };
  
  const portalName = portalNames[type] || portalNames.staff;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      toast.success("Welcome back!");
      navigate("/");
    } else {
      toast.error("Authentication failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none"></div>
      
      <div className="w-full max-w-[400px] border border-border/50 shadow-2xl rounded-[2rem] bg-card/95 backdrop-blur-xl relative z-10 p-6 sm:p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-full shadow-2xl h-36 w-36 sm:h-40 sm:w-40 flex items-center justify-center mb-6 overflow-hidden">
            <img src={logo} alt="BAUST Tea Bar logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground uppercase mb-1">BAUST TEA BAR</h1>
          <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20">{portalName}</Badge>
          <p className="text-muted-foreground text-sm font-medium">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
            <Input id="email" type="email" placeholder="you@baust.edu.bd" value={email} onChange={e => setEmail(e.target.value)} className="h-12 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-xl" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-12 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-xl pr-10" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-10 w-10 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button type="submit" className="w-full h-12 text-base font-semibold mt-2 rounded-xl shadow-lg hover:shadow-primary/25 transition-all" disabled={loading}>
            {loading ? <Coffee className="mr-2 h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2">Sign In <LogIn className="w-4 h-4"/></span>}
          </Button>
        </form>

        {type === 'staff' && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account? <Link to={`/register?type=${type}`} className="text-primary font-semibold hover:underline">Sign up</Link>
          </div>
        )}
      </div>
    </div>
  );
}
