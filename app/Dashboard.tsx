// 在檔案最頂部加上這兩行 import
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// 1. 新增從這裡引入 SafeAreaProvider 與 SafeAreaView
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Activity,
  AlertTriangle,
  Brain,
  Calendar,
  Compass,
  TrendingUp,
  User,
  Zap
} from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const heartRateData = [120, 135, 155, 142, 168, 175, 160, 145, 150, 140];

const logout = async () => {
  await AsyncStorage.removeItem('strava_token');
  router.replace('/');
};
// 在 export default function App() 改為：

export default function Dashboard({ route }: any) {
  const { accessToken } = useLocalSearchParams<{ accessToken: string }>();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    // 2. 在最外層包裝 SafeAreaProvider
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* 全螢幕霓虹漸層背景 */}
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          colors={['#030712', '#0f172a', '#2e1065', '#d946ef']}
          locations={[0, 0.3, 0.7, 1.0]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* 3. 這裡的 SafeAreaView 現在是來自新套件 */}
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

            {/* Header 頂部導覽 */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>晚安, 跑者</Text>
                <Text style={styles.subGreeting}>AI 已同步您今日的 Strava 記錄</Text>
              </View>
              {/* 點頭像即可登出 */}
              <TouchableOpacity style={styles.avatar} onPress={logout}>
                <User color="#fff" size={20} />
              </TouchableOpacity>
            </View>

            {/* Strava 數據主卡片 */}
            <BlurView intensity={30} tint="dark" style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Activity color="#06b6d4" size={20} />
                </View>
                <Text style={styles.cardTitle}>今日跑步表現 (Strava)</Text>
              </View>

              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statLabel}>距離</Text>
                  <Text style={styles.statValue}>8.54 <Text style={styles.statUnit}>km</Text></Text>
                </View>
                <View>
                  <Text style={styles.statLabel}>平均配速</Text>
                  <Text style={styles.statValue}>5'12" <Text style={styles.statUnit}>/km</Text></Text>
                </View>
                <View>
                  <Text style={styles.statLabel}>時間</Text>
                  <Text style={styles.statValue}>44:22</Text>
                </View>
              </View>

              {/* 心率流線圖表 */}
              <Text style={styles.chartTitle}>心率區間走勢 (bpm)</Text>
              <View style={[styles.chartContainer, { marginLeft: -16 }]}>
                <LineChart
                  data={{
                    labels: [],
                    datasets: [{
                      data: heartRateData,
                      strokeWidth: 3
                    }]
                  }}
                  width={SCREEN_WIDTH - 32}
                  height={100}
                  withDots={false}
                  withInnerLines={false}
                  withOuterLines={false}
                  withHorizontalLabels={false}
                  withVerticalLabels={false}
                  bezier
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: '#0f172a',
                    backgroundGradientFromOpacity: 0,
                    backgroundGradientTo: '#0f172a',
                    backgroundGradientToOpacity: 0,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16
                    }
                  }}
                  style={{
                    marginVertical: 4,
                    paddingRight: 0,
                    paddingLeft: 0,
                  }}
                />
              </View>
            </BlurView>

            {/* AI 分析標題 */}
            <View style={styles.sectionHeader}>
              <Brain color="#d946ef" size={20} />
              <Text style={styles.sectionTitle}>AI 智慧運動生醫鏡片</Text>
            </View>

            {/* AI 整體建議卡片 */}
            <BlurView intensity={25} tint="dark" style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <Zap color="#22d3ee" size={18} />
                <Text style={[styles.aiCardTitle, { color: '#22d3ee' }]}>整體生理反饋</Text>
              </View>
              <Text style={styles.aiContent}>
                今日有氧耐力表現優異。後半程心率控制穩定，乳酸閾值有所提升。建議明晚進行低強度恢復跑。
              </Text>
            </BlurView>

            {/* AI 配速建議卡片 */}
            <BlurView intensity={25} tint="dark" style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <TrendingUp color="#38bdf8" size={18} />
                <Text style={[styles.aiCardTitle, { color: '#38bdf8' }]}>動態配速優化</Text>
              </View>
              <Text style={styles.aiContent}>
                在第 5 公里上坡路段配速過急，導致心率短暫飆升至無氧區間。下次遇到同路段，建議步頻提高 5%，步伐縮小以維持體能。
              </Text>
            </BlurView>

            {/* AI 未來訓練計畫 */}
            <BlurView intensity={25} tint="dark" style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <Calendar color="#c084fc" size={18} />
                <Text style={[styles.aiCardTitle, { color: '#c084fc' }]}>下階段課表預測</Text>
              </View>
              <Text style={styles.aiContent}>
                根據超補償週期預測，週四適合進行 5 組 800 公尺的亞索跑（間歇訓練），目標配速 4'45"，藉此突破最大攝氧量瓶頸。
              </Text>
            </BlurView>

            {/* AI 受傷風險警告 */}
            <BlurView intensity={40} tint="dark" style={[styles.glassCard, styles.dangerCard]}>
              <View style={styles.cardHeader}>
                <AlertTriangle color="#f43f5e" size={18} />
                <Text style={[styles.aiCardTitle, { color: '#f43f5e', fontWeight: '700' }]}>受傷風險警告</Text>
              </View>
              <Text style={styles.aiContent}>
                偵測到右腳步頻觸地時間（GCT）不對稱度增加 3.2%。結合過往疲勞指數，右側比目魚肌與跟腱有輕度過載風險，請加強跑後滾筒放鬆。
              </Text>
            </BlurView>

          </ScrollView>
        </SafeAreaView>

        {/* 齊平的底部導覽列 Tab Bar */}
        <BlurView intensity={40} tint="dark" style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('dashboard')}>
            <Activity color={activeTab === 'dashboard' ? '#06b6d4' : '#94a3b8'} size={24} />
            <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>總覽</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('./records')}>
            <Activity color={activeTab === 'ai' ? '#d946ef' : '#94a3b8'} size={24} />
            <Text style={[styles.tabLabel, activeTab === 'ai' && styles.tabLabelActive]}>紀錄</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('explore')}>
            <Compass color={activeTab === 'explore' ? '#38bdf8' : '#94a3b8'} size={24} />
            <Text style={[styles.tabLabel, activeTab === 'explore' && styles.tabLabelActive]}>探索</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
            <User color={activeTab === 'profile' ? '#94a3b8' : '#94a3b8'} size={24} />
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>我的</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subGreeting: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  glassCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  dangerCard: {
    borderColor: 'rgba(244, 63, 94, 0.3)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  aiCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748b',
  },
  chartTitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: -10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
    paddingLeft: 4,
    zIndex: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  aiContent: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.70)',
    overflow: 'hidden',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  tabLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});