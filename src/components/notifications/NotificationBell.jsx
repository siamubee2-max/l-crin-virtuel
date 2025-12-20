import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Fetch notifications where recipient_id is current user
      const all = await base44.entities.Notification.filter({ recipient_id: user.id }, '-created_date');
      return all;
    },
    enabled: !!user?.id,
    refetchInterval: 30000 // Poll every 30s
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Notification.update(id, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const locale = language === 'fr' ? fr : enUS;

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-neutral-500 hover:text-neutral-900">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-xl border-neutral-100 bg-white">
        <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-400 text-sm">Loading...</div>
          ) : notifications?.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-sm flex flex-col items-center gap-2">
              <Bell className="w-8 h-8 opacity-20" />
              <p>{language === 'fr' ? "Aucune notification" : "No notifications"}</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={cn(
                    "p-4 hover:bg-neutral-50 transition-colors cursor-pointer flex gap-3 items-start",
                    !notification.is_read ? "bg-amber-50/30" : ""
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2 shrink-0",
                    !notification.is_read ? "bg-amber-500" : "bg-neutral-200"
                  )} />
                  <div className="space-y-1 flex-1">
                    <p className={cn("text-sm", !notification.is_read ? "font-semibold text-neutral-900" : "font-medium text-neutral-700")}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true, locale })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}