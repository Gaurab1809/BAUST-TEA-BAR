import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Coffee, UserPlus } from "lucide-react";
import logo from "@/assets/logo-new.jpg";

const DEPARTMENTS = ["CSE", "EEE", "ICT", "ME", "IPE", "CE", "DBA", "AIS", "English", "Department of Arts and Sciences (Bangla, English, Physics, Math, Chemistry, Sociology)", "ICT Wing & Archive", "Vice Chancellor's Office", "Office of the Treasurer", "Office of the Registrar", "Controller of Examination", "Admission Office", "Library Office"];

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
      toast.error("All fields are required.");
      return;
    }
    setLoading(true);
    const result = await register({ name, email, password, designation, department, phone });
    setLoading(false);

    if (result.success) {
      toast.success("Account created! You may now sign in.");
      navigate("/login");
    } else {
      toast.error(result.message || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none"></div>

      <div className="w-full max-w-[500px] border border-border/50 shadow-2xl rounded-[2rem] bg-card/95 backdrop-blur-xl relative z-10 p-6 sm:p-10 pt-10">
        
        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="rounded-full shadow-xl h-28 w-28 sm:h-32 sm:w-32 flex items-center justify-center mb-5 overflow-hidden">
            <img src={logo} alt="BAUST Tea Bar logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground uppercase mb-1">Create Account</h1>
          <p className="text-muted-foreground text-sm font-medium">Join BAUST Tea Bar today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. John Doe" required className="h-11 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="017..." required className="h-11 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Email Address</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@baust.edu.bd" required className="h-11 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Designation</Label>
              <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Lecturer" required className="h-11 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Department</Label>
              <Select value={department} onValueChange={setDepartment} required>
                <SelectTrigger className="h-11 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-xl">
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d} className="truncate max-w-[80vw] sm:max-w-none">{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" required className="h-11 bg-muted/40 border-transparent hover:bg-muted/60 focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-xl" />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold mt-2 rounded-xl shadow-lg hover:shadow-primary/25 transition-all" disabled={loading}>
            {loading ? <Coffee className="mr-2 h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2">Create Account <UserPlus className="w-4 h-4"/></span>}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login?type=staff" className="text-primary font-semibold hover:underline border-b border-transparent hover:border-primary pb-0.5 transition-all">Sign in</Link>
        </div>

        <div className="mt-6 pt-6 border-t border-border/40">
          <Link to="/" className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-secondary/40 hover:bg-secondary text-secondary-foreground font-semibold text-sm transition-all border border-transparent hover:border-border shadow-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
