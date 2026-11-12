import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, getAccessToken } from "../src/api";

type Recommendation = {
  id: string;
  styleId: string;
  name: string;
  description: string;
  reason: string;
  maintenance: string;
  serviceCategory: string;
  matchReasons: string[];
};
type Session = {
  id: string;
  photoAssetId: string;
  status: string;
  profile?: Record<string, string> | null;
  recommendations: Recommendation[];
  jobs?: Job[];
};
type Job = {
  id: string;
  status: string;
  outputAssetId?: string | null;
  errorMessage?: string | null;
};

export default function HairstyleScreen({ showBack = true }: { showBack?: boolean }) {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState("Ready when you are");
  const [resultSource, setResultSource] = useState<{
    uri: string;
    headers?: Record<string, string>;
  } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    api<Session>(`/ai/hairstyle/sessions/${sessionId}`)
      .then((loaded) => {
        setSession(loaded);
        setStage(
          loaded.status === "recommendations-ready"
            ? "Choose a hairstyle"
            : loaded.status,
        );
        setJob(loaded.jobs?.[0] || null);
      })
      .catch((error) =>
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to open this session.",
        ),
      );
  }, [sessionId]);

  useEffect(() => {
    if (!job?.id || !session) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const next = await api<Job>(`/ai/hairstyle/jobs/${job.id}`);
        if (cancelled) return;
        setJob(next);
        if (next.status === "completed" && next.outputAssetId) {
          const token = await getAccessToken();
          setResultSource({
            uri: `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"}/media/${next.outputAssetId}`,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          setStage("Your preview is ready");
          setBusy(false);
        } else if (next.status === "failed") {
          setMessage(
            next.errorMessage ||
              "We could not create that preview. Please try again.",
          );
          setBusy(false);
        } else if (!cancelled) {
          setStage("Generating your preview");
          setTimeout(() => void poll(), 1500);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to check preview status.",
          );
          setBusy(false);
        }
      }
    };
    void poll();
    return () => {
      cancelled = true;
    };
  }, [job?.id, session]);

  async function choosePhoto(useCamera: boolean) {
    setMessage("");
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Photo permission is needed to create a hairstyle preview.");
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          base64: true,
          allowsEditing: true,
          aspect: [3, 4],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          base64: true,
          allowsEditing: true,
          aspect: [3, 4],
        });
    if (!result.canceled) {
      setAsset(result.assets[0]);
      setSession(null);
      setSelected(null);
      setJob(null);
      setResultSource(null);
      setConsent(false);
      setStage("Review your photo");
    }
  }

  async function analyze() {
    if (!asset || !consent) {
      setMessage("Please choose a photo and confirm the processing consent.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      setStage("Uploading photo");
      const mimeType =
        asset.mimeType?.toLowerCase() === "image/jpg"
          ? "image/jpeg"
          : asset.mimeType?.toLowerCase() || "image/jpeg";
      if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType))
        throw new Error("Only JPG, PNG, and WebP photos are supported.");
      if (!asset.base64)
        throw new Error("The selected photo could not be read.");
      const uploaded = await api<Session>("/ai/hairstyle/upload-base64", {
        method: "POST",
        body: JSON.stringify({
          imageBase64: asset.base64,
          mimeType,
          fileName:
            asset.fileName ||
            `hairstyle-photo.${mimeType.split("/")[1] || "jpg"}`,
          consentGiven: true,
        }),
      });
      setSession(uploaded);
      setStage("Analyzing visible hair characteristics");
      const analyzed = await api<Session>("/ai/hairstyle/analyze", {
        method: "POST",
        body: JSON.stringify({ sessionId: uploaded.id }),
      });
      setSession(analyzed);
      setStage("Choose a hairstyle");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not analyze this photo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    if (!session || !selected) return;
    setBusy(true);
    setMessage("");
    setStage("Preparing selected hairstyle");
    try {
      const created = await api<Job>("/ai/hairstyle/generate", {
        method: "POST",
        body: JSON.stringify({
          sessionId: session.id,
          recommendationId: selected.id,
          idempotencyKey: `${session.id}:${selected.id}`,
        }),
      });
      setJob(created);
    } catch (error) {
      setBusy(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not start the preview.",
      );
    }
  }

  async function removeSession() {
    if (!session) return;
    Alert.alert(
      "Delete photo and session?",
      "This permanently deletes the uploaded and generated images.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await api(`/ai/hairstyle/sessions/${session.id}`, {
              method: "DELETE",
            });
            setAsset(null);
            setSession(null);
            setJob(null);
            setResultSource(null);
            setStage("Photo deleted");
          },
        },
      ],
    );
  }

  async function uploadAnotherPhoto() {
    if (session) {
      await api(`/ai/hairstyle/sessions/${session.id}`, {
        method: "DELETE",
      }).catch(() => undefined);
    }
    setAsset(null);
    setSession(null);
    setSelected(null);
    setJob(null);
    setResultSource(null);
    setConsent(false);
    setMessage("");
    setStage("Ready when you are");
  }

  async function saveToPassport() {
    if (!selected || !resultSource || !job?.outputAssetId) return;
    try {
      const passport = await api<any>("/passport");
      const image = `/media/${job.outputAssetId}`;
      await api("/passport", {
        method: "PUT",
        body: JSON.stringify({
          ...passport,
          afterImage: image,
          styles: [
            ...(passport.styles || []),
            { name: selected.name, meta: "AI preview", tone: "blush", image },
          ],
        }),
      });
      setSaved(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save this look.",
      );
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        {showBack ? (
          <Pressable onPress={() => router.back()}>
            <Text style={s.back}>‹ Back</Text>
          </Pressable>
        ) : null}
        <Text style={s.eyebrow}>HALO AI STUDIO</Text>
        <Text style={s.title}>Find your next look.</Text>
        <Text style={s.copy}>
          Get five salon-ready hairstyle ideas from one private photo, then see
          one selected look on you.
        </Text>
        {asset || resultSource ? (
          <Image
            source={{
              uri: resultSource?.uri || asset?.uri || "",
              headers: resultSource?.headers,
            }}
            style={s.preview}
          />
        ) : (
          <View style={s.placeholder}>
            <Text style={s.placeholderIcon}>✦</Text>
            <Text style={s.cardTitle}>Your photo stays private</Text>
            <Text style={s.muted}>
              Use a clear front-facing photo with your face and hair visible.
            </Text>
          </View>
        )}
        {!asset ? (
          <View style={s.actions}>
            <Pressable
              style={s.primary}
              onPress={() => void choosePhoto(false)}
            >
              <Text style={s.primaryText}>Choose a photo</Text>
            </Pressable>
            <Pressable
              style={s.secondary}
              onPress={() => void choosePhoto(true)}
            >
              <Text style={s.secondaryText}>Take a photo</Text>
            </Pressable>
          </View>
        ) : null}
        {asset && !session ? (
          <View style={s.consent}>
            <Text style={s.cardTitle}>Before we begin</Text>
            <Text style={s.muted}>
              Halo will use this photo only to analyze visible hairstyle
              characteristics and create your requested preview. We do not
              diagnose medical conditions or train models with it.
            </Text>
            <View style={s.consentRow}>
                <Switch
                  style={s.consentSwitch}
                value={consent}
                onValueChange={setConsent}
                  trackColor={{ false: "#d9d6ce", true: "#c55239" }}
                  thumbColor={consent ? "#fffdfa" : "#77817c"}
                  ios_backgroundColor="#d9d6ce"
              />
              <Text style={[s.muted, s.consentText]}>
                I consent to photo processing for this session.
              </Text>
            </View>
            <Pressable
              style={[s.primary, !consent && s.disabled]}
              disabled={!consent || busy}
              onPress={() => void analyze()}
            >
              <Text style={s.primaryText}>Analyze my hair</Text>
            </Pressable>
            <Pressable onPress={() => setAsset(null)}>
              <Text style={s.link}>Choose another photo</Text>
            </Pressable>
          </View>
        ) : null}
        {busy ? (
          <View style={s.loading}>
            <ActivityIndicator color="#c55239" />
            <Text style={s.cardTitle}>{stage}</Text>
            <Text style={s.muted}>This may take a moment.</Text>
          </View>
        ) : null}
        {session?.recommendations?.length && !resultSource ? (
          <View>
            <Text style={s.sectionTitle}>Your recommendations</Text>
            <Text style={s.muted}>
              Choose one style to create a realistic preview.
            </Text>
            {session.recommendations.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  s.recommendation,
                  selected?.id === item.id && s.selected,
                ]}
                onPress={() => setSelected(item)}
              >
                <View style={s.row}>
                  <Text style={s.cardTitle}>{item.name}</Text>
                  <Text style={s.badge}>{item.maintenance} upkeep</Text>
                </View>
                <Text style={s.muted}>{item.description}</Text>
                <Text style={s.reason}>{item.reason}</Text>
                <Text style={s.service}>
                  {item.serviceCategory} · See on me
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[s.primary, !selected && s.disabled]}
              disabled={!selected || busy}
              onPress={() => void generate()}
            >
              <Text style={s.primaryText}>See on me</Text>
            </Pressable>
            <Pressable
              style={s.secondary}
              onPress={() => void uploadAnotherPhoto()}
            >
              <Text style={s.secondaryText}>Upload another photo</Text>
            </Pressable>
          </View>
        ) : null}
        {resultSource ? (
          <View style={s.result}>
            <Text style={s.sectionTitle}>
              {selected?.name || "Your hairstyle preview"}
            </Text>
            <Text style={s.muted}>
              Preview generated from your uploaded photo.
            </Text>
            <Pressable
              style={s.primary}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/directory",
                  params: { hairstyle: selected?.name || "" },
                })
              }
            >
              <Text style={s.primaryText}>Find a salon to book</Text>
            </Pressable>
            <Pressable
              style={s.secondary}
              onPress={() => void saveToPassport()}
            >
              <Text style={s.secondaryText}>
                {saved ? "Saved to hair passport" : "Save this look"}
              </Text>
            </Pressable>
            <Pressable
              style={s.secondary}
              onPress={() =>
                void Share.share({
                  message: `I tried ${selected?.name || "a new hairstyle"} with Halo AI.`,
                })
              }
            >
              <Text style={s.secondaryText}>Share this look</Text>
            </Pressable>
            <Pressable
              style={s.secondary}
              onPress={() => void uploadAnotherPhoto()}
            >
              <Text style={s.secondaryText}>Upload another photo</Text>
            </Pressable>
            <Pressable onPress={() => void removeSession()}>
              <Text style={s.delete}>Delete photos and session</Text>
            </Pressable>
          </View>
        ) : null}
        {message ? <Text style={s.error}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 22, paddingBottom: 48 },
  back: { color: "#c55239", fontSize: 16, marginBottom: 22 },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  title: {
    color: "#20352d",
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "800",
    marginTop: 8,
  },
  copy: { color: "#77817c", lineHeight: 21, marginTop: 10, marginBottom: 18 },
  placeholder: {
    minHeight: 260,
    borderRadius: 22,
    backgroundColor: "#dceee8",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  placeholderIcon: { color: "#c55239", fontSize: 38, marginBottom: 10 },
  preview: {
    width: "100%",
    height: 340,
    borderRadius: 22,
    backgroundColor: "#e4e1d9",
    resizeMode: "cover",
  },
  cardTitle: { color: "#20352d", fontSize: 17, fontWeight: "800" },
  muted: { color: "#77817c", lineHeight: 19, marginTop: 6 },
  actions: { gap: 10 },
  primary: {
    backgroundColor: "#c55239",
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondary: {
    borderWidth: 1,
    borderColor: "#c55239",
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  secondaryText: { color: "#c55239", fontWeight: "800" },
  consent: {
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
  },
  consentSwitch: { flexShrink: 0, marginTop: -4 },
  consentText: { flex: 1, lineHeight: 19, marginTop: 0 },
  link: {
    color: "#c55239",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
  },
  disabled: { opacity: 0.45 },
  loading: { alignItems: "center", padding: 24 },
  sectionTitle: {
    color: "#20352d",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 26,
  },
  recommendation: {
    backgroundColor: "#fffdfa",
    borderWidth: 1,
    borderColor: "#e4e1d9",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  selected: { borderColor: "#c55239", borderWidth: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: { color: "#4c947d", fontSize: 11, fontWeight: "700" },
  reason: { color: "#20352d", lineHeight: 19, marginTop: 10 },
  service: { color: "#c55239", fontWeight: "800", fontSize: 12, marginTop: 12 },
  result: { marginTop: 4 },
  delete: { color: "#c55239", textAlign: "center", marginTop: 18 },
  error: { color: "#c55239", lineHeight: 20, marginTop: 16 },
});
