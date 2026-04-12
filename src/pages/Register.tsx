import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Coffee, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";

const DEPARTMENTS = ["CSE", "EEE", "ICT", "ME", "IPE", "Civil Engineering (CE)", "DBA", "AIS", "English", "Department of Arts and Sciences (Bangla, English, Physics, Math, Chemistry, Sociology)"];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !designation || !department || !password) {
      toast.error("All parameters required.");
      return;
    }
    setLoading(true);
    const result = await register({ name, email, password, designation, department, phone });
    setLoading(false);

    if (result.success) {
      toast.success("Identity established! You may now sign in.");
      navigate("/login");
    } else {
      toast.error(result.message || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-gradient-to-br from-emerald-500/10 via-background to-cyan-500/10 animate-in fade-in relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
         <div className="absolute top-[-5%] left-[-5%] w-72 h-72 rounded-full bg-emerald-500/10 blur-[80px]"></div>
         <div className="absolute bottom-[-5%] right-[-5%] w-72 h-72 rounded-full bg-cyan-500/10 blur-[80px]"></div>
      </div>

      <Card className="w-full max-w-md border-0 shadow-xl rounded-3xl bg-card/90 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
        
        <CardContent className="p-6 sm:p-8 text-center shadow-inner">
          <div className="flex justify-center mb-3">
             <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 group">
                <img src={logo} alt="Logo" className="h-10 w-10 group-hover:scale-105 transition-transform" />
             </div>
          </div>
          
          <div className="mb-6">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight mb-1">Create Account</h1>
            <p className="text-muted-foreground font-medium text-xs flex items-center justify-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500"/> Secure operations</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold text-muted-foreground ml-1">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. John" required className="h-10 rounded-xl bg-muted/30 text-sm px-3" />
              </div>
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold text-muted-foreground ml-1">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+88017" required className="h-10 rounded-xl bg-muted/30 text-sm px-3" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="uppercase text-[9px] font-bold text-muted-foreground ml-1">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@baust.edu.bd" required className="h-10 rounded-xl bg-muted/30 text-sm px-3" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold text-muted-foreground ml-1">Title</Label>
                <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Lecturer" required className="h-10 rounded-xl bg-muted/30 text-sm px-3" />
              </div>
              <div className="space-y-1">
                <Label className="uppercase text-[9px] font-bold text-muted-foreground ml-1">Dept</Label>
                <Select value={department} onValueChange={setDepartment} required>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/30 text-sm px-3"><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="uppercase text-[9px] font-bold text-muted-foreground ml-1">Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 char" required className="h-10 rounded-xl bg-muted/30 text-sm px-3" />
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-sm shadow-md mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 border-none" disabled={loading}>
              {loading ? <Coffee className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center gap-1.5">Register <ArrowRight className="w-4 h-4"/></span>}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t text-xs font-medium text-muted-foreground">
            Already verified? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
