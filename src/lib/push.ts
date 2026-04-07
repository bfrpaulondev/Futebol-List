import webpush from 'web-push';
import { db } from '@/lib/db';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from './push-config';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export { VAPID_PUBLIC_KEY };

/**
 * Send a web push notification to all subscribed devices of a user.
 * Automatically removes invalid subscriptions (410/404).
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url?: string
): Promise<void> {
  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({ title, body, url: url || '/notifications' });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.keysAuth,
            p256dh: sub.keysP256dh,
          },
        };

        return webpush.sendNotification(pushSubscription, payload);
      })
    );

    // Remove invalid subscriptions
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const error = result.reason as Error & { statusCode?: number };
        // 410 = Gone (subscription expired), 404 = Not Found
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          try {
            await db.pushSubscription.delete({
              where: { id: subscriptions[i].id },
            });
          } catch {
            // Ignore delete errors
          }
        }
      }
    }
  } catch (error) {
    console.error('Push notification error:', error);
    // Don't throw - push failures shouldn't break the main flow
  }
}

/**
 * Send web push to multiple users at once.
 */
export async function sendPushNotificationBatch(
  userIds: string[],
  title: string,
  body: string,
  url?: string
): Promise<void> {
  await Promise.allSettled(
    userIds.map((userId) => sendPushNotification(userId, title, body, url))
  );
}
