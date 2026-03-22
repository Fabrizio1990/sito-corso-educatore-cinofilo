'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
} from '@/app/actions/notifications'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { Notification } from '@/types/database'

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const fetchUnreadCount = useCallback(async () => {
        const count = await getUnreadCount()
        setUnreadCount(count)
    }, [])

    const fetchNotifications = useCallback(async () => {
        const data = await getNotifications()
        setNotifications(data)
    }, [])

    // Fetch unread count on mount and poll every 30s
    useEffect(() => {
        fetchUnreadCount()

        const interval = setInterval(fetchUnreadCount, 30_000)
        return () => clearInterval(interval)
    }, [fetchUnreadCount])

    // Fetch full list when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen, fetchNotifications])

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markNotificationRead(notification.id)
            setUnreadCount((prev) => Math.max(0, prev - 1))
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notification.id ? { ...n, read: true } : n
                )
            )
        }

        if (notification.link) {
            setIsOpen(false)
            router.push(notification.link)
        }
    }

    const handleMarkAllRead = async () => {
        await markAllNotificationsRead()
        setUnreadCount(0)
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, read: true }))
        )
    }

    const hasUnread = notifications.some((n) => !n.read)

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifiche</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                            Nessuna notifica
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="cursor-pointer flex items-start gap-3 p-3"
                                onClick={() => handleNotificationClick(notification)}
                            >
                                {!notification.read && (
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                )}
                                <div className={`flex flex-col gap-0.5 ${notification.read ? 'ml-5' : ''}`}>
                                    <span className="text-sm font-medium">{notification.title}</span>
                                    {notification.body && (
                                        <span className="text-xs text-gray-500 line-clamp-1">
                                            {notification.body}
                                        </span>
                                    )}
                                    {notification.created_at && (
                                        <span className="text-xs text-gray-400">
                                            {formatDistanceToNow(new Date(notification.created_at), {
                                                addSuffix: true,
                                                locale: it,
                                            })}
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
                {hasUnread && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={handleMarkAllRead}
                            >
                                Segna tutto come letto
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
