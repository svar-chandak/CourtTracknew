'use client'

// Push notification service for team announcements
export class NotificationService {
  private static instance: NotificationService
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission === 'denied') {
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  async registerServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('This browser does not support service workers')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service worker registered successfully')
      return true
    } catch (error) {
      console.error('Service worker registration failed:', error)
      return false
    }
  }

  async subscribeToNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      const registered = await this.registerServiceWorker()
      if (!registered) return null
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return null
    }

    try {
      // For now, we'll use a simple subscription without VAPID key
      // In production, you would generate and use a proper VAPID key
      const subscription = await this.registration!.pushManager.subscribe({
        userVisibleOnly: true,
      })

      console.log('Push subscription created:', subscription)
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('Cannot send notification: permission not granted')
      return
    }

    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    })
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray as Uint8Array
  }
}

// Hook for using notifications in React components
export function useNotifications() {
  const notificationService = NotificationService.getInstance()

  const requestPermission = async () => {
    return await notificationService.requestPermission()
  }

  const subscribeToPush = async () => {
    return await notificationService.subscribeToNotifications()
  }

  const sendNotification = async (title: string, options?: NotificationOptions) => {
    await notificationService.sendNotification(title, options)
  }

  const isSupported = () => {
    return 'Notification' in window && 'serviceWorker' in navigator
  }

  return {
    requestPermission,
    subscribeToPush,
    sendNotification,
    isSupported,
  }
}
