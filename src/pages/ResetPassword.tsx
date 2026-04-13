import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Loader2, KeyRound } from "lucide-react";
import logo from "@/assets/logo-new.jpg";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !token || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, token, password);
    setLoading(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setSuccess(true);
    toast.success("Password reset successfully. Please sign in.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none"></div>

      <div className="w-full max-w-[400px] border border-border/50 shadow-2xl rounded-3xl bg-card relative z-10 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-full shadow-xl h-28 w-28 sm:h-32 sm:w-32 flex items-center justify-center mb-5 overflow-hidden">
            <img src={logo} alt="BAUST Tea Bar logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground uppercase mb-1 text-center">Reset Password</h1>
          <p className="text-muted-foreground text-sm font-medium text-center text-balance">Enter your email, reset code, and choose a new password.</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground text-center">Your password has been updated successfully.</p>
            <Button className="w-full h-12 text-sm font-semibold" onClick={() => navigate("/login")}>Sign In</Button>
            <Link to="/login" className="block text-sm text-primary font-semibold hover:underline mt-4">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
              <Input id="reset-email" type="email" placeholder="you@baust.edu.bd" value={email} onChange={e => setEmail(e.target.value)} className="h-12 bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-token" className="text-sm font-medium">Reset Code</Label>
              <Input id="reset-token" type="text" placeholder="Reset code from email" value={token} onChange={e => setToken(e.target.value)} className="h-12 bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
              <Input id="new-password" type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
              <Input id="confirm-password" type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-12 bg-muted/50" />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold mt-2" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2">Reset Password <KeyRound className="w-4 h-4"/></span>}
            </Button>
            <div className="mt-8 text-center text-sm">
              <Link to="/forgot-password" className="text-primary font-semibold hover:underline">Request a new reset code</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
