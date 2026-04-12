import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Coffee, ArrowLeft, MailCheck } from "lucide-react";
import logo from "@/assets/logo.png";

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
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">Recover Access</h1>
            <p className="text-muted-foreground font-medium text-xs mt-1">Receive a secure reset link</p>
          </div>

          {sent ? (
            <div className="mt-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                 <MailCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-sm font-bold mb-2">Email Sent Successfully!</p>
              <p className="text-muted-foreground text-xs text-balance mb-6">
                Check your inbox for <span className="font-bold text-foreground">{email}</span>. Click the attached link to securely choose a new password.
              </p>
              <Button asChild variant="outline" className="w-full h-12 rounded-xl text-sm font-bold">
                 <Link to="/login"><ArrowLeft className="w-4 h-4 mr-2" /> Return to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left mt-6">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="uppercase tracking-wide text-[10px] font-bold text-muted-foreground ml-1">Account Email</Label>
                <Input id="email" type="email" placeholder="you@baust.edu.bd" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl bg-muted/30 focus:bg-background text-sm px-4" />
              </div>
              
              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-sm shadow-md mt-2" disabled={loading}>
                {loading ? <Coffee className="mr-2 h-4 w-4 animate-spin" /> : "Transmit Request"}
              </Button>
              
              <div className="pt-4 border-t flex flex-col items-center gap-2 text-xs text-muted-foreground font-medium mt-6">
                 <Link to="/login" className="hover:text-primary transition-colors flex items-center gap-1"><ArrowLeft className="w-3 w-3" /> Back to Login</Link>
              </div>
            </form>
          )}

        </CardContent>
      </Card>
    </div>
  );
}