import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "../src/components/ToastProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </SafeAreaProvider>
  );
}
