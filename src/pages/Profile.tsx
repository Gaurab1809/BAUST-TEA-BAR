import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useAppState } from "@/lib/app-state";
import { User, Camera, ShieldCheck, Mail, Building, Briefcase, Phone, Store, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { orders } = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [designation, setDesignation] = useState(user?.designation ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  if (!user) return null;

  const myOrders = orders.filter(o => o.userId === user.id);
  const totalSpent = myOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB file size exceeded"); return; }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
        
        updateProfile({ avatar: compressedDataUrl }); 
        toast.success("Profile photo updated");
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateProfile({ name, email, designation, department, phone });
    toast.success("Profile saved");
  };

  return (
    <div className="container max-w-4xl py-8 px-4 animate-in fade-in min-h-screen">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Col */}
        <div className="w-full md:w-1/3 space-y-4">
          <Card className="overflow-hidden border shadow-sm rounded-3xl">
            <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-500" />
            <CardContent className="px-5 pb-5 text-center relative mt-[-40px]">
               <div className="relative inline-block mb-3 cursor-pointer group" onClick={() => fileRef.current?.click()}>
                  <div className="w-20 h-20 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-md">
                    {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <User className="h-10 w-10 text-muted-foreground opacity-50" />}
                  </div>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                     <Camera className="w-5 h-5 text-white" />
                  </div>
                  <Badge className="absolute bottom-0 right-0 text-[9px] px-1.5 py-0 bg-primary text-white border-0 z-10">{user.role}</Badge>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
               </div>

               <h2 className="font-heading font-bold text-xl mb-0.5 text-foreground">{user.name}</h2>
               <p className="text-muted-foreground font-medium text-[11px] flex items-center justify-center gap-1 mb-4">
                 <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified Identity
               </p>

               <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="bg-muted/30 p-2.5 rounded-xl border">
                    <Store className="w-4 h-4 text-indigo-500 mb-1" />
                    <p className="text-lg font-bold font-heading">{myOrders.length}</p>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Orders</p>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded-xl border">
                    <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
                    <p className="text-lg font-bold font-heading">৳{totalSpent}</p>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Spent</p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col */}
        <div className="w-full md:w-2/3">
          <Card className="border shadow-sm rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/10">
              <h2 className="font-heading text-lg font-bold">Profile Info</h2>
            </div>
            
            <CardContent className="p-5">
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[9px] font-bold text-muted-foreground flex items-center gap-1"><User className="w-3 h-3"/> Name</Label>
                    <Input value={name} onChange={e=>setName(e.target.value)} className="h-10 rounded-lg text-sm bg-muted/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[9px] font-bold text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3"/> Email</Label>
                    <Input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="h-10 rounded-lg text-sm bg-muted/20" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[9px] font-bold text-muted-foreground flex items-center gap-1"><Briefcase className="w-3 h-3"/> Designation</Label>
                    <Input value={designation} onChange={e=>setDesignation(e.target.value)} className="h-10 rounded-lg text-sm bg-muted/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[9px] font-bold text-muted-foreground flex items-center gap-1"><Building className="w-3 h-3"/> Department</Label>
                    <Input value={department} onChange={e=>setDepartment(e.target.value)} className="h-10 rounded-lg text-sm bg-muted/20" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="uppercase text-[9px] font-bold text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3"/> Phone</Label>
                  <Input value={phone} onChange={e=>setPhone(e.target.value)} className="h-10 rounded-lg text-sm bg-muted/20" />
                </div>
                
                <div className="pt-4 mt-1 flex justify-end border-t">
                  <Button className="rounded-xl px-6 h-10 text-sm shadow-sm" onClick={handleSave}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
