import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Clock, TrendingUp, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type StravaActivity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  type: string;
};

// 公尺/秒 → 分鐘/公里
const speedToPace = (speed: number): string => {
  if (!speed || speed === 0) return '--';
  const paceSeconds = 1000 / speed;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  return `${mins}'${secs.toString().padStart(2, '0')}"`;
};

// 秒 → 時分秒
const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// 日期格式化
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', {
    month: 'long', day: 'numeric', weekday: 'short',
  });
};

export default function Records() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('strava_token');
      if (!token) { setError('找不到 Token，請重新登入'); return; }

      const res = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=30',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      // 只篩選跑步
      const runs = data.filter((a: StravaActivity) =>
        a.type === 'Run' || a.type === 'VirtualRun' || a.type === 'TrailRun'
      );
      setActivities(runs);
    } catch (e) {
      setError('載入失敗，請下拉重新整理');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchActivities(); }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          colors={['#030712', '#0f172a', '#2e1065', '#d946ef']}
          locations={[0, 0.3, 0.7, 1.0]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Activity color="#06b6d4" size={22} />
            <Text style={styles.title}>跑步紀錄</Text>
            <Text style={styles.count}>
              {activities.length > 0 ? `共 ${activities.length} 筆` : ''}
            </Text>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#06b6d4" />
              <Text style={styles.loadingText}>載入中...</Text>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchActivities(true)}
                  tintColor="#06b6d4"
                />
              }
            >
              {activities.length === 0 ? (
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>目前沒有跑步紀錄</Text>
                </View>
              ) : (
                activities.map((activity) => (
                  <BlurView key={activity.id} intensity={25} tint="dark" style={styles.card}>
                    {/* 卡片頂部：名稱 + 日期 */}
                    <View style={styles.cardTop}>
                      <Text style={styles.activityName} numberOfLines={1}>
                        {activity.name}
                      </Text>
                      <Text style={styles.activityDate}>
                        {formatDate(activity.start_date_local)}
                      </Text>
                    </View>

                    {/* 主要數據 */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {(activity.distance / 1000).toFixed(2)}
                        </Text>
                        <Text style={styles.statLabel}>公里</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {formatDuration(activity.moving_time)}
                        </Text>
                        <Text style={styles.statLabel}>時間</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {speedToPace(activity.average_speed)}
                        </Text>
                        <Text style={styles.statLabel}>均速配速</Text>
                      </View>
                    </View>

                    {/* 次要數據 */}
                    <View style={styles.secondaryRow}>
                      <View style={styles.secondaryItem}>
                        <TrendingUp color="#94a3b8" size={13} />
                        <Text style={styles.secondaryText}>
                          爬升 {Math.round(activity.total_elevation_gain)} m
                        </Text>
                      </View>
                      <View style={styles.secondaryItem}>
                        <Zap color="#94a3b8" size={13} />
                        <Text style={styles.secondaryText}>
                          最速 {speedToPace(activity.max_speed)}
                        </Text>
                      </View>
                      {activity.average_heartrate && (
                        <View style={styles.secondaryItem}>
                          <Clock color="#94a3b8" size={13} />
                          <Text style={styles.secondaryText}>
                            均心率 {Math.round(activity.average_heartrate)} bpm
                          </Text>
                        </View>
                      )}
                    </View>
                  </BlurView>
                ))
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  safeArea: { flex: 1 },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginLeft: 8, flex: 1 },
  count: { fontSize: 13, color: '#64748b' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  errorText: { color: '#f43f5e', fontSize: 14 },
  emptyText: { color: '#64748b', fontSize: 14 },
  card: {
    borderRadius: 20, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', backgroundColor: 'rgba(15,23,42,0.5)',
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  activityName: { fontSize: 15, fontWeight: '600', color: '#ffffff', flex: 1, marginRight: 8 },
  activityDate: { fontSize: 12, color: '#64748b' },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748b' },
  divider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },
  secondaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  secondaryItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  secondaryText: { fontSize: 12, color: '#94a3b8' },
});