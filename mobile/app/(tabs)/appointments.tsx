import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";
import { api } from "../../src/api";
import { SafeAreaView } from "react-native-safe-area-context";

type Appointment = {
  id: string;
  service: string;
  date: string;
  time: string;
  stylist?: string;
  status: string;
};
type Branch = {
  id: string;
  name: string;
  location?: string;
  services?: string[];
  stylists?: string[];
};
type Salon = {
  id: string;
  name: string;
  services: string[];
  stylists: string[];
  branches?: Branch[];
};
function normalizeSalon(raw: any): Salon {
  const services = Array.isArray(raw.services) && raw.services.length
    ? raw.services
    : (raw.serviceDetails || []).map((item: { name?: string }) => item.name).filter(Boolean);
  const stylists = Array.isArray(raw.stylists) ? raw.stylists : [];
  const branches = Array.isArray(raw.branches) && raw.branches.length
    ? raw.branches.map((branch: Branch) => ({
        ...branch,
        services: branch.services?.length ? branch.services : services,
        stylists: branch.stylists?.length ? branch.stylists : stylists,
      }))
    : [{ id: "main", name: raw.name || "Main branch", location: raw.location, services, stylists }];
  return { ...raw, services, stylists, branches };
}
function dateChoices(selected: string) {
  return Array.from({ length: 7 }, (_, index) => {
    const value = new Date(Date.now() + (index + 1) * 86400000);
    return {
      value: value.toISOString().slice(0, 10),
      day: value.toLocaleDateString("en-IN", { weekday: "short" }),
      number: value.getDate().toString(),
      selected: selected === value.toISOString().slice(0, 10),
    };
  });
}
function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) =>
    new Date(month.getFullYear(), month.getMonth(), index - mondayOffset + 1),
  );
}
function dateValue(value: Date) {
  return value.toISOString().slice(0, 10);
}
function AppointmentCard({
  item,
  onChanged,
}: {
  item: Appointment;
  onChanged: () => void;
}) {
  const [date, setDate] = useState(item.date);
  const [time, setTime] = useState(item.time);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const update = async (path: string, body?: object) => {
    setBusy(true);
    setMessage("");
    try {
      await api(`/appointments/${item.id}/${path}`, {
        method: "PATCH",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setMessage(path === "cancel" ? "Cancelled" : "Rescheduled");
      onChanged();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to update appointment.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{item.service}</Text>
      <Text style={s.muted}>
        {item.date} · {item.time}
      </Text>
      <Text style={s.muted}>{item.stylist || "Stylist to be confirmed"}</Text>
      <Text style={s.status}>{item.status}</Text>
      {item.status !== "Cancelled" ? (
        <>
          <View style={s.row}>
            <TextInput
              value={date}
              onChangeText={setDate}
              style={s.smallInput}
              placeholder="YYYY-MM-DD"
            />
            <TextInput
              value={time}
              onChangeText={setTime}
              style={s.smallInput}
              placeholder="Time"
            />
          </View>
          <View style={s.row}>
            <Pressable
              disabled={busy}
              onPress={() => void update("reschedule", { date, time })}
            >
              <Text style={s.action}>Reschedule</Text>
            </Pressable>
            <Pressable disabled={busy} onPress={() => void update("cancel")}>
              <Text style={s.action}>Cancel</Text>
            </Pressable>
          </View>
        </>
      ) : null}
      {message ? (
        <Text
          style={
            message === "Cancelled" || message === "Rescheduled"
              ? s.success
              : s.error
          }
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}
export default function Appointments() {
  const { salonId, booking, hairstyle } = useLocalSearchParams<{
    salonId?: string;
    booking?: string;
    hairstyle?: string;
  }>();
  const [items, setItems] = useState<Appointment[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [branchId, setBranchId] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [stylist, setStylist] = useState("");
  const [date, setDate] = useState(() => {
    const value = new Date(Date.now() + 7 * 86400000);
    return value.toISOString().slice(0, 10);
  });
  const [month, setMonth] = useState(() => {
    const value = new Date(Date.now() + 7 * 86400000);
    return new Date(value.getFullYear(), value.getMonth(), 1);
  });
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      setItems(await api<Appointment[]>("/appointments"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    api<any[]>("/salon/directory")
      .then(async (result) => {
        const directory = result.map(normalizeSalon);
        if (salonId) {
          const selected = await api<any>(`/salon/${encodeURIComponent(salonId)}`);
          return [normalizeSalon(selected)];
        }
        const hasBookingCatalog = directory.some(
          (item) =>
            item.services.length ||
            item.stylists.length ||
            item.branches?.some(
              (branch) => branch.services?.length || branch.stylists?.length,
            ),
        );
        if (directory.length && hasBookingCatalog) return directory;
        const ownSalon = await api<any>("/salon");
        return [normalizeSalon(ownSalon)];
      })
      .then((result) => {
        setSalons(result);
        const first = result[0];
        if (first) {
          setSelectedSalon(first);
          setBranchId(first.branches?.[0]?.id || "main");
          setSelectedServices(first.services[0] ? [first.services[0]] : []);
          setStylist(first.stylists[0] || "");
        }
      })
      .catch(() => setSalons([]));
    api<{ phone?: string }>("/customers/me")
      .then((profile) => setPhone(profile.phone || ""))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!salonId || !salons.length) return;
    const target = salons.find((item) => item.id === salonId);
    if (!target) return;
    setSelectedSalon(target);
    setBranchId(target.branches?.[0]?.id || "main");
    setSelectedServices(target.services[0] ? [target.services[0]] : []);
    setStylist(target.stylists[0] || "");
    if (booking === "1") setBookingOpen(true);
  }, [salonId, booking, salons]);
  useEffect(() => {
    if (hairstyle) setNotes(`AI hairstyle request: ${hairstyle}`);
  }, [hairstyle]);
  const service = selectedServices.join(", ");
  useEffect(() => {
    if (!selectedSalon || !service || !stylist || !date) return;
    api<string[]>(
      `/appointments/slots?date=${encodeURIComponent(date)}&salonId=${encodeURIComponent(selectedSalon.id)}&branchId=${encodeURIComponent(branchId)}&stylist=${encodeURIComponent(stylist)}&service=${encodeURIComponent(service)}`,
    )
      .then((result) => {
        setSlots(result);
        setTime((current) => (result.includes(current) ? current : result[0] || ""));
      })
      .catch(() => {
        setSlots([]);
        setTime("");
      });
  }, [selectedSalon, branchId, service, stylist, date]);
  const submitBooking = async () => {
    if (!selectedSalon || !branchId || !service || !stylist || !date || !time) {
      setBookingMessage("Choose a salon, service, stylist, date, and time.");
      return;
    }
    const normalizedPhone = phone.trim();
    if (normalizedPhone && !/^\+?[0-9 ()-]{8,20}$/.test(normalizedPhone)) {
      setPhoneError("Enter a valid mobile number.");
      return;
    }
    setPhoneError("");
    setBookingBusy(true);
    setBookingMessage("");
    try {
      await api("/appointments", {
        method: "POST",
        body: JSON.stringify({
          salonId: selectedSalon.id,
          branchId,
          service,
          stylist,
          date,
          time,
          notes,
          guestPhone: normalizedPhone,
        }),
      });
      setBookingMessage("Appointment request sent to the salon.");
      setNotes("");
      await load();
    } catch (e) {
      setBookingMessage(
        e instanceof Error ? e.message : "Unable to request appointment.",
      );
    } finally {
      setBookingBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        style={s.screen}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
      >
        <View style={s.headingRow}>
          <View style={s.headingCopy}>
            <Text style={s.eyebrow}>YOUR VISITS</Text>
            <Text style={s.title}>Your next salon moment.</Text>
            <Text style={s.subtitle}>
              Request a visit here and track it while the salon reviews your time.
            </Text>
          </View>
          <Pressable
            style={s.topBookButton}
            onPress={() => setBookingOpen((current) => !current)}
          >
            <Text style={s.topBookText}>{bookingOpen ? "Back" : "Book"}</Text>
          </Pressable>
        </View>
        {bookingOpen ? (
          <View style={s.bookingCard}>
            <Text style={s.formTitle}>Request an appointment</Text>
            <Text style={s.label}>Salon</Text>
            <View style={s.choices}>
              {salons.map((salon) => (
                <Pressable
                  key={salon.id}
                  style={[s.choice, selectedSalon?.id === salon.id && s.selected]}
                  onPress={() => {
                    setSelectedSalon(salon);
                    setBranchId(salon.branches?.[0]?.id || "main");
                    setSelectedServices(salon.services[0] ? [salon.services[0]] : []);
                    setStylist(salon.stylists[0] || "");
                  }}
                >
                  <Text style={s.choiceText}>{salon.name}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.label}>Branch</Text>
            <View style={s.choices}>
              {(selectedSalon?.branches || []).map((item) => (
                <Pressable
                  key={item.id}
                  style={[s.choice, branchId === item.id && s.selected]}
                  onPress={() => setBranchId(item.id)}
                >
                  <Text style={s.choiceText}>{item.name}</Text>
                  <Text style={s.muted}>{item.location}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.label}>Service</Text>
            <View style={s.choices}>
              {(selectedSalon?.services || []).map((item) => (
                <Pressable
                  key={item}
                  style={[s.choice, selectedServices.includes(item) && s.selected]}
                  onPress={() =>
                    setSelectedServices((current) =>
                      current.includes(item)
                        ? current.filter((value) => value !== item)
                        : [...current, item],
                    )
                  }
                >
                  <Text style={s.choiceText}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.label}>Preferred stylist</Text>
            <View style={s.choices}>
              {(selectedSalon?.stylists || []).map((item) => (
                <Pressable
                  key={item}
                  style={[s.choice, stylist === item && s.selected]}
                  onPress={() => setStylist(item)}
                >
                  <Text style={s.choiceText}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.label}>Date</Text>
            <View style={s.calendarPanel}>
              <View style={s.calendarHeader}>
                <Pressable
                  style={s.monthButton}
                  onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                >
                  <Text style={s.monthButtonText}>‹</Text>
                </Pressable>
                <Text style={s.monthTitle}>{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</Text>
                <Pressable
                  style={s.monthButton}
                  onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                >
                  <Text style={s.monthButtonText}>›</Text>
                </Pressable>
              </View>
              <View style={s.weekdays}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <Text key={day} style={s.weekday}>{day}</Text>)}
              </View>
              <View style={s.calendarGrid}>
                {calendarDays(month).map((item) => {
                  const value = dateValue(item);
                  const outside = item.getMonth() !== month.getMonth();
                  const past = value < dateValue(new Date());
                  return (
                    <Pressable
                      key={value}
                      disabled={outside || past}
                      style={[s.calendarDay, outside && s.outsideDay, date === value && s.selectedDay]}
                      onPress={() => {
                        setDate(value);
                        setMonth(new Date(item.getFullYear(), item.getMonth(), 1));
                      }}
                    >
                      <Text style={[s.calendarDayText, outside && s.outsideDayText]}>{item.getDate()}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={s.dateChoices}>
              {dateChoices(date).map((item) => (
                <Pressable
                  key={item.value}
                  style={[s.dateChoice, item.selected && s.selected]}
                  onPress={() => setDate(item.value)}
                >
                  <Text style={s.dateDay}>{item.day}</Text>
                  <Text style={s.dateNumber}>{item.number}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={date} onChangeText={setDate} style={s.input} placeholder="YYYY-MM-DD" />
            <Text style={s.label}>Available time</Text>
            <View style={s.choices}>
              {slots.map((item) => (
                <Pressable key={item} style={[s.choice, time === item && s.selected]} onPress={() => setTime(item)}>
                  <Text style={s.choiceText}>{item}</Text>
                </Pressable>
              ))}
              {date && !slots.length ? <Text style={s.muted}>No slots available for this date.</Text> : null}
            </View>
            <Text style={s.label}>Mobile number</Text>
            <TextInput
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setPhoneError("");
              }}
              style={[s.input, phoneError ? s.inputError : null]}
              placeholder="+91 98450 12345"
              keyboardType="phone-pad"
            />
            {phoneError ? <Text style={s.error}>{phoneError}</Text> : null}
            <Text style={s.label}>Notes</Text>
            <TextInput value={notes} onChangeText={setNotes} style={[s.input, s.multiline]} multiline placeholder="Tell us about your hair goals" />
            <Pressable disabled={bookingBusy} style={s.primary} onPress={() => void submitBooking()}>
              {bookingBusy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Request appointment</Text>}
            </Pressable>
            {bookingMessage ? <Text style={bookingMessage.includes("sent") ? s.success : s.error}>{bookingMessage}</Text> : null}
          </View>
        ) : null}
        {error ? <Text style={s.error}>{error}</Text> : null}
        <View style={s.contextCard}>
          <Text style={s.contextEyebrow}>YOUR STUDIO, REMEMBERED</Text>
          <Text style={s.contextTitle}>Every visit starts with context.</Text>
          <Text style={s.muted}>
            Your notes, preferences, and favourite styles help the salon make
            the next conversation feel familiar.
          </Text>
        </View>
        {items.map((item) => (
          <AppointmentCard
            item={item}
            key={item.id}
            onChanged={() => void load()}
          />
        ))}
        {!loading && !error && !items.length ? (
          <View style={s.empty}>
            <Text style={s.cardTitle}>No appointments yet</Text>
            <Text style={s.muted}>Your next good hair day can start here.</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f5f0" },
  screen: { flex: 1, backgroundColor: "#f7f5f0" },
  content: { padding: 22, paddingBottom: 40 },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  headingCopy: { flex: 1 },
  eyebrow: {
    color: "#91b3a3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    color: "#20352d",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    marginTop: 12,
  },
  subtitle: { color: "#77817c", lineHeight: 20, marginTop: 8 },
  card: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginTop: 12,
  },
  cardTitle: { color: "#20352d", fontSize: 18, fontWeight: "700" },
  muted: { color: "#77817c", marginTop: 6 },
  status: { color: "#4c947d", fontWeight: "700", marginTop: 8 },
  primary: {
    backgroundColor: "#c55239",
    minHeight: 48,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  topBookButton: {
    backgroundColor: "#c55239",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 2,
  },
  topBookText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  backToList: { marginTop: 14, marginBottom: 2 },
  backToListText: { color: "#c55239", fontWeight: "800" },
  bookingCard: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
  },
  contextCard: {
    backgroundColor: "#20352d",
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
  },
  contextEyebrow: {
    color: "#91b3a3",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  contextTitle: { color: "#fffdfa", fontSize: 19, fontWeight: "800", marginTop: 8 },
  formTitle: { color: "#20352d", fontSize: 20, fontWeight: "800" },
  label: {
    color: "#20352d",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 7,
  },
  choices: { gap: 8 },
  choice: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 9,
    padding: 12,
  },
  selected: { borderColor: "#c55239", backgroundColor: "#fff4ef" },
  choiceText: { color: "#20352d", fontWeight: "700" },
  input: {
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 9,
    padding: 13,
    color: "#20352d",
  },
  inputError: { borderColor: "#c55239" },
  dateChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 9 },
  calendarPanel: { borderWidth: 1, borderColor: "#d9d6ce", borderRadius: 10, padding: 10, backgroundColor: "#fffdfa", marginBottom: 10 },
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  monthButton: { width: 30, height: 30, borderRadius: 8, backgroundColor: "#f7f5f0", alignItems: "center", justifyContent: "center" },
  monthButtonText: { color: "#20352d", fontSize: 24, lineHeight: 25 },
  monthTitle: { color: "#20352d", fontWeight: "800" },
  weekdays: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  weekday: { width: "14.2%", textAlign: "center", color: "#77817c", fontSize: 10, fontWeight: "700" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDay: { width: "14.2%", aspectRatio: 1.15, alignItems: "center", justifyContent: "center", borderRadius: 7 },
  calendarDayText: { color: "#20352d", fontSize: 12, fontWeight: "700" },
  selectedDay: { backgroundColor: "#c55239" },
  outsideDay: { opacity: 0.3 },
  outsideDayText: { color: "#77817c" },
  dateChoice: {
    minWidth: 43,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9d6ce",
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: "#fffdfa",
  },
  dateDay: { color: "#77817c", fontSize: 10, fontWeight: "700" },
  dateNumber: { color: "#20352d", fontSize: 15, fontWeight: "800", marginTop: 3 },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10, marginTop: 12, alignItems: "center" },
  smallInput: {
    flex: 1,
    backgroundColor: "#fffdfa",
    borderColor: "#d9d6ce",
    borderWidth: 1,
    borderRadius: 7,
    padding: 9,
  },
  action: { color: "#c55239", fontWeight: "700", marginRight: 16 },
  success: { color: "#4c947d", marginTop: 10 },
  empty: {
    backgroundColor: "#fffdfa",
    borderRadius: 14,
    padding: 20,
    marginTop: 22,
  },
  error: { color: "#c55239", marginVertical: 12 },
});
