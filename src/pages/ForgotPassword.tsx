import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import logo from "@/assets/logo-new.jpg";

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Enter your email"); return; }
    setLoading(true);
    const result = await sendPasswordReset(email);
    setLoading(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none"></div>

      <div className="w-full max-w-[400px] border border-border/50 shadow-2xl rounded-3xl bg-card relative z-10 p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-full shadow-xl h-28 w-28 sm:h-32 sm:w-32 flex items-center justify-center mb-5 overflow-hidden">
            <img src={logo} alt="BAUST Tea Bar logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground uppercase mb-1">Recover Access</h1>
          <p className="text-muted-foreground text-sm font-medium text-center text-balance">Receive a secure reset link</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <MailCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-base font-bold mb-2">Email Sent Successfully!</p>
            <p className="text-muted-foreground text-xs text-center text-balance mb-6">
              Check your inbox for <span className="font-bold text-foreground">{email}</span>. Click the attached link to securely choose a new password.
            </p>
            <Button asChild variant="outline" className="w-full h-12 text-sm font-semibold">
              <Link to="/login"><ArrowLeft className="w-4 h-4 mr-2" /> Return to Login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Account Email</Label>
              <Input id="email" type="email" placeholder="you@baust.edu.bd" value={email} onChange={e => setEmail(e.target.value)} className="h-12 bg-muted/50" />
            </div>
            
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Transmit Request"}
            </Button>
            
            <div className="mt-8 text-center text-sm font-medium">
              <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}