import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastType = "success" | "error" | "warning" | "info";
type Toast = { id: number; type: ToastType; message: string; actionLabel?: string; onAction?: () => void };
type ToastContextValue = { showToast: (toast: Omit<Toast, "id">) => void; dismissToast: (id: number) => void };

const ToastContext = createContext<ToastContextValue | null>(null);
const colors: Record<ToastType, { background: string; icon: any; accent: string }> = {
  success: { background: "#e5f1eb", icon: "checkmark-circle", accent: "#26735a" },
  error: { background: "#f8e5df", icon: "alert-circle", accent: "#b34d38" },
  warning: { background: "#fff0d8", icon: "warning", accent: "#93631d" },
  info: { background: "#e7f1ed", icon: "information-circle", accent: "#356f63" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();
  const dismissToast = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.filter((item) => item.message !== toast.message), { ...toast, id }].slice(-3));
    setTimeout(() => dismissToast(id), 3800);
  }, [dismissToast]);
  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
        {toasts.map((toast) => {
          const palette = colors[toast.type];
          return (
            <View key={toast.id} style={[styles.toast, { backgroundColor: palette.background }]}>
              <Ionicons name={palette.icon} size={22} color={palette.accent} />
              <Text style={[styles.message, { color: palette.accent }]} numberOfLines={3}>{toast.message}</Text>
              {toast.actionLabel && toast.onAction ? <Pressable onPress={toast.onAction}><Text style={[styles.action, { color: palette.accent }]}>{toast.actionLabel}</Text></Pressable> : null}
              <Pressable onPress={() => dismissToast(toast.id)} accessibilityLabel="Dismiss notification"><Ionicons name="close" size={17} color={palette.accent} /></Pressable>
            </View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: 14, right: 14, zIndex: 1000 },
  toast: { minHeight: 52, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 8, flexDirection: "row", alignItems: "center", shadowColor: "#20352d", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  message: { flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 18, marginHorizontal: 9 },
  action: { fontSize: 12, fontWeight: "800", marginRight: 10 },
});
