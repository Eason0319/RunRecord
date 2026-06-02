import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const STRAVA_CLIENT_ID = '254362';
const STRAVA_CLIENT_SECRET = '5f50b67e5b59611c7fab54415c55b44c13b657f5';

const discovery = {
  authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
  tokenEndpoint: 'https://www.strava.com/oauth/token',
};

export default function StravaAuth() {
  const [loading, setLoading] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: STRAVA_CLIENT_ID,
      scopes: ['activity:read_all'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: { approval_prompt: 'auto' },
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      fetchToken(response.params.code);
    } else if (response?.type === 'error') {
      console.error('授權失敗:', response.error);
    }
  }, [response]);

  const fetchToken = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });
      const data = await res.json();
      if (data.access_token) {
        await AsyncStorage.setItem('strava_token', data.access_token);
        //  用 Expo Router 跳轉，token 透過 query params 傳遞
        router.replace({
          pathname: '/Dashboard',
          params: { accessToken: data.access_token },
        });
      }
    } catch (error) {
      console.error('交換 Token 失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.logoArea}>
        <Text style={styles.logoIcon}>🏃</Text>
        <Text style={styles.title}>Strava 連結</Text>
        <Text style={styles.subtitle}>連結你的 Strava 帳號以同步活動資料</Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          (!request || loading) && styles.buttonDisabled,
        ]}
        disabled={!request || loading}
        onPress={() => promptAsync()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.buttonIcon}>🔗</Text>
            <Text style={styles.buttonText}>連結 Strava 帳號</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logoIcon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8888aa', textAlign: 'center', lineHeight: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FC4C02',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#FC4C02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  buttonDisabled: { backgroundColor: '#555566', shadowOpacity: 0 },
  buttonIcon: { fontSize: 18 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});