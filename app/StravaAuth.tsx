import * as AuthSession from 'expo-auth-session';
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ 修復：使用 useProxy 讓 Expo Go 也能正常運作
  // 若是正式 build，改為 scheme: '你的app_scheme'
  // const redirectUri = AuthSession.makeRedirectUri({
  //   //scheme: 'runrecord',  // 正式 build 用這個
  // });
  const redirectUri = AuthSession.makeRedirectUri();
  console.log('Redirect URI:', redirectUri);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: STRAVA_CLIENT_ID,
      scopes: ['activity:read_all'],
      redirectUri,
      // ✅ 修復：明確指定使用授權碼流程
      responseType: AuthSession.ResponseType.Code,
      // ✅ 修復：Strava 需要這個參數
      extraParams: {
        approval_prompt: 'auto',
      },
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      fetchToken(code);
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
          redirect_uri: redirectUri, // ✅ 修復：token 交換時也要帶上 redirect_uri
        }),
      });
      const data = await res.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        console.log('取得 Token:', data.access_token);
      } else {
        console.error('Token 回應異常:', data);
      }
    } catch (error) {
      console.error('交換 Token 失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ 修復：背景改為深色
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Logo 區塊 */}
      <View style={styles.logoArea}>
        <Text style={styles.logoIcon}>🏃</Text>
        <Text style={styles.title}>Strava 連結</Text>
        <Text style={styles.subtitle}>連結你的 Strava 帳號以同步活動資料</Text>
      </View>

      {/* 主要內容 */}
      {accessToken ? (
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successText}>授權成功！</Text>
          <Text style={styles.successSub}>已成功取得存取權杖</Text>
        </View>
      ) : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e', // ✅ 深色背景
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8888aa',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FC4C02', // Strava 橘紅色
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
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    backgroundColor: '#555566',
    shadowOpacity: 0,
  },
  buttonIcon: {
    fontSize: 18,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  successBox: {
    alignItems: 'center',
    backgroundColor: '#16213e',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22c55e33',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  successSub: {
    fontSize: 14,
    color: '#8888aa',
  },
});