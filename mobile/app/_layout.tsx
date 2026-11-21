import { Stack, useRouter, useSegments } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "../src/components/ToastProvider";
import { getAccessToken } from "../src/api";
import { registerForPushNotifications } from "../src/push";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const registeredForToken = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    void getAccessToken().then((token) => {
      if (!active || !token || registeredForToken.current === token || segments[0] === "(auth)") return;
      registeredForToken.current = token;
      void registerForPushNotifications().catch(() => undefined);
    });
    return () => { active = false; };
  }, [segments]);
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string") router.push(url as never);
    });
    return () => subscription.remove();
  }, [router]);
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </SafeAreaProvider>
  );
}
