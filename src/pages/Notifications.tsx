import { Bell, CheckCircle, CreditCard, UtensilsCrossed, Megaphone, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/app-state";
import { useAuth } from "@/lib/auth-context";

const icons = { order: UtensilsCrossed, payment: CreditCard, menu: Bell, announcement: Megaphone };

export default function Notifications() {
  const { user, isAdmin } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppState();

  const userNotifications = notifications.filter(n =>
    isAdmin || n.type === "announcement" || (n.targetUserId && n.targetUserId === user?.id)
  );
  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className="container max-w-3xl py-6 px-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllNotificationsRead(userNotifications.filter(n => !n.read).map(n => n.id))}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {userNotifications.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {userNotifications.map(n => {
            const Icon = icons[n.type];
            return (
              <Card
                key={n.id}
                className={`transition-colors cursor-pointer ${!n.read ? "bg-primary/5 border-primary/20" : ""}`}
                onClick={() => !n.read && markNotificationRead(n.id)}
              >
                <CardContent className="py-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 mt-0.5"><Icon className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{n.title}</p>
                      {!n.read && <Badge className="text-[10px] px-1.5 py-0">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
