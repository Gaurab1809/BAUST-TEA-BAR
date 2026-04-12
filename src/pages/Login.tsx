import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Coffee, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500/10 via-background to-purple-500/10 animate-in fade-in relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
         <div className="absolute top-[-5%] right-[-5%] w-64 h-64 rounded-full bg-primary/10 blur-[80px]"></div>
         <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 rounded-full bg-accent/10 blur-[80px]"></div>
      </div>

      <Card className="w-full max-w-sm border-0 shadow-xl rounded-3xl bg-card/90 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-accent"></div>
        
        <CardContent className="p-6 sm:p-8 text-center space-y-4 shadow-inner">
          <div className="flex justify-center mb-2">
             <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 group">
                <img src={logo} alt="Logo" className="h-10 w-10 group-hover:scale-105 transition-transform" />
             </div>
          </div>
          
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">Welcome Back</h1>
            <p className="text-muted-foreground font-medium text-xs mt-1">Access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left mt-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="uppercase tracking-wide text-[10px] font-bold text-muted-foreground ml-1">Email</Label>
              <Input id="email" type="email" placeholder="you@baust.edu.bd" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl bg-muted/30 focus:bg-background text-sm px-4" />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="uppercase tracking-wide text-[10px] font-bold text-muted-foreground ml-1">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl bg-muted/30 focus:bg-background text-sm px-4 pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-10 w-10 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-sm shadow-md mt-2" disabled={loading}>
              {loading ? <Coffee className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center gap-1.5">Sign In <ArrowRight className="w-4 h-4"/></span>}
            </Button>
          </form>

          <div className="pt-4 border-t flex flex-col gap-2 text-xs text-muted-foreground font-medium mt-6">
             <Link to="/forgot-password" className="hover:text-primary transition-colors">Forgot password?</Link>
             <span>New here? <Link to="/register" className="text-primary font-bold hover:underline">Create Account</Link></span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
