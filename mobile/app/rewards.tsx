import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Rewards() {
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const [coupon, setCoupon] = useState('');
  const [message, setMessage] = useState('');
  const shareReferral = async () => {
    await Share.share({ message: 'Try Halo for better salon visits. Find your next salon and book with me: https://halo-salon.app' });
  };
  const applyCoupon = () => setMessage(coupon.trim() ? `We’ll check ${coupon.trim().toUpperCase()} at checkout.` : 'Enter a coupon code first.');
  return <SafeAreaView style={s.safeArea}><ScrollView style={s.screen} contentContainerStyle={s.content}>
    <Pressable onPress={() => router.back()}><Text style={s.back}>‹ Back</Text></Pressable>
    <Text style={s.eyebrow}>REWARDS</Text><Text style={s.title}>Share more, save more.</Text><Text style={s.subtitle}>Invite friends and keep your salon offers together in one place.</Text>
    {mode !== 'coupons' ? <View style={s.card}><View style={s.icon}><Text style={s.iconText}>↗</Text></View><Text style={s.cardTitle}>Refer a friend</Text><Text style={s.cardCopy}>Share Halo with someone who deserves a better salon experience. Referral rewards can be applied to a future visit.</Text><Pressable style={s.primary} onPress={() => void shareReferral()}><Text style={s.primaryText}>Share invitation</Text></Pressable></View> : null}
    {mode !== 'referral' ? <View style={s.card}><View style={s.icon}><Text style={s.iconText}>%</Text></View><Text style={s.cardTitle}>Coupons</Text><Text style={s.cardCopy}>Have a salon offer? Enter the code before your next booking.</Text><TextInput value={coupon} onChangeText={setCoupon} autoCapitalize="characters" placeholder="Enter coupon code" placeholderTextColor="#9aa19c" style={s.input} /><Pressable style={s.secondary} onPress={applyCoupon}><Text style={s.secondaryText}>Apply coupon</Text></Pressable>{message ? <Text style={s.message}>{message}</Text> : null}</View> : null}
    <Text style={s.note}>Coupon and referral validation will be connected to the salon backend when those services are enabled.</Text>
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#f7f5f0' }, screen: { flex: 1, backgroundColor: '#f7f5f0' }, content: { padding: 22, paddingBottom: 44 }, back: { color: '#c55239', fontWeight: '700', marginBottom: 26 }, eyebrow: { color: '#91b3a3', fontSize: 11, fontWeight: '800', letterSpacing: 1.6 }, title: { color: '#20352d', fontSize: 31, fontWeight: '800', marginTop: 8 }, subtitle: { color: '#77817c', lineHeight: 21, marginTop: 8, marginBottom: 24 }, card: { backgroundColor: '#fffdfa', borderWidth: 1, borderColor: '#e4e1d9', borderRadius: 18, padding: 18, marginBottom: 16 }, icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f8e5df', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, iconText: { color: '#c55239', fontSize: 22, fontWeight: '800' }, cardTitle: { color: '#20352d', fontSize: 20, fontWeight: '800' }, cardCopy: { color: '#77817c', lineHeight: 20, marginTop: 8 }, primary: { backgroundColor: '#c55239', minHeight: 48, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 18 }, primaryText: { color: '#fff', fontWeight: '800' }, input: { height: 48, borderWidth: 1, borderColor: '#d9d6ce', borderRadius: 9, backgroundColor: '#fff', paddingHorizontal: 13, color: '#20352d', marginTop: 16 }, secondary: { minHeight: 48, borderRadius: 9, borderWidth: 1, borderColor: '#c55239', alignItems: 'center', justifyContent: 'center', marginTop: 10 }, secondaryText: { color: '#c55239', fontWeight: '800' }, message: { color: '#4c947d', marginTop: 12 }, note: { color: '#9aa19c', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 } });
