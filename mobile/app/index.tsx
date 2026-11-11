import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getAccessToken } from '../src/api';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { getAccessToken().then(token => { setSignedIn(Boolean(token)); setReady(true); }); }, []);
  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#c55239" /></View>;
  return <Redirect href={signedIn ? '/(tabs)/directory' : '/(auth)/login'} />;
}
