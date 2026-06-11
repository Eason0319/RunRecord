import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Heart,
  TrendingUp,
  Wind,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ────────── 工具函式 ──────────
const speedToPace = (speed: number): string => {
  if (!speed || speed === 0) return '--';
  const paceSeconds = 1000 / speed;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  return `${mins}'${secs.toString().padStart(2, '0')}"`;
};

const speedToPaceNum = (speed: number): number => {
  if (!speed || speed === 0) return 0;
  return Math.round(1000 / speed);
};

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
};

const downsample = (arr: number[], maxPoints = 60): number[] => {
  if (arr.length <= maxPoints) return arr;
  const step = Math.floor(arr.length / maxPoints);
  return arr.filter((_, i) => i % step === 0).slice(0, maxPoints);
};

// ────────── 型別 ──────────
type SplitMetric = {
  distance: number;
  elapsed_time: number;
  moving_time: number;
  split: number;
  average_speed: number;
  average_heartrate?: number;
  average_cadence?: number;
  elevation_difference: number;
  pace_zone: number;
};

type BestEffort = {
  name: string;
  moving_time: number;
  elapsed_time: number;
};

type ActivityDetail = {
  id: number;
  name: string;
  type: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  suffer_score?: number;
  perceived_exertion?: number;
  kilojoules?: number;
  calories?: number;
  device_name?: string;
  splits_metric?: SplitMetric[];
  best_efforts?: BestEffort[];
  description?: string;
};

type Streams = {
  heartrate?: { data: number[] };
  cadence?: { data: number[] };
  velocity_smooth?: { data: number[] };
  altitude?: { data: number[] };
  distance?: { data: number[] };
  watts?: { data: number[] };
  temp?: { data: number[] };
  time?: { data: number[] };
};

// ────────── 區塊元件 ──────────
const SectionCard = ({
  title,
  icon,
  color,
  children,
  collapsible = false,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  collapsible?: boolean;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <BlurView intensity={25} tint="dark" style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => collapsible && setCollapsed(!collapsed)}
        activeOpacity={collapsible ? 0.7 : 1}
      >
        <View style={[styles.sectionIconBg, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {collapsible && (
          collapsed
            ? <ChevronDown color="#64748b" size={18} />
            : <ChevronUp color="#64748b" size={18} />
        )}
      </TouchableOpacity>
      {!collapsed && <View style={styles.sectionBody}>{children}</View>}
    </BlurView>
  );
};

const StatGrid = ({ items }: { items: { label: string; value: string; sub?: string }[] }) => (
  <View style={styles.statGrid}>
    {items.map((item, i) => (
      <View key={i} style={styles.statGridItem}>
        <Text style={styles.statGridValue}>{item.value}</Text>
        <Text style={styles.statGridLabel}>{item.label}</Text>
        {item.sub && <Text style={styles.statGridSub}>{item.sub}</Text>}
      </View>
    ))}
  </View>
);

const StreamChart = ({
  data,
  color,
  label,
  unit,
}: {
  data: number[];
  color: string;
  label: string;
  unit: string;
}) => {
  const sampled = downsample(data);
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  return (
    <View style={styles.chartWrapper}>
      <View style={styles.chartLabelRow}>
        <Text style={styles.chartLabel}>{label}</Text>
        <Text style={styles.chartRange}>
          {Math.round(min)} – {Math.round(max)} {unit}
        </Text>
      </View>
      <LineChart
        data={{ labels: [], datasets: [{ data: sampled, strokeWidth: 2 }] }}
        width={SCREEN_WIDTH - 64}
        height={90}
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
          color: (opacity = 1) => color.replace('1)', `${opacity})`),
        }}
        style={{ paddingRight: 0, paddingLeft: 0, marginVertical: 4 }}
      />
    </View>
  );
};

// ────────── AI 分析元件 ──────────
const AIAnalysisCard = ({
  title,
  icon,
  color,
  prompt,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  prompt: string;
}) => {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const YOUR_BACKEND_URL = 'https://run-record-nine.vercel.app';

const analyze = async () => {
  setLoading(true);
  setResult(null);
  try {
    const response = await fetch(`${YOUR_BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    
    // 💡 關鍵修改：先將回傳結果當作「純文字」讀取出來
    const rawText = await response.text();
    console.log("伺服器原始回應狀態碼：", response.status);
    console.log("伺服器原始回應內容：", rawText);

    // 檢查 HTTP 狀態碼
    if (!response.ok) {
      setResult(`伺服器錯誤 (${response.status})，請查看終端機 Log。`);
      return;
    }

    // 確定沒有錯誤後，再手動把文字轉成 JSON
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.log("JSON 轉換失敗");
      setResult("後端回傳了非 JSON 的格式，請檢查 Vercel 狀態。");
      return;
    }

    if (data.result) {
      setResult(data.result);
    } else {
      setResult('無法取得分析結果');
    }
  } catch (e: any) {
    console.log("連線錯誤：", e.message);
    setResult(`連線失敗，請稍後再試`);
  } finally {
    setLoading(false);
  }
};

  return (
    <BlurView intensity={25} tint="dark" style={styles.aiCard}>
      <View style={styles.aiCardHeader}>
        <View style={[styles.sectionIconBg, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {!result && !loading && (
        <TouchableOpacity
          style={[styles.analyzeBtn, { borderColor: color }]}
          onPress={analyze}
        >
          <Text style={[styles.analyzeBtnText, { color }]}>開始分析</Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.aiLoading}>
          <ActivityIndicator size="small" color={color} />
          <Text style={styles.aiLoadingText}>AI 分析中...</Text>
        </View>
      )}

      {result && (
        <>
          <Text style={styles.aiResult}>{result}</Text>
          <TouchableOpacity style={styles.reanalyzeBtn} onPress={analyze}>
            <Text style={styles.reanalyzeBtnText}>重新分析</Text>
          </TouchableOpacity>
        </>
      )}
    </BlurView>
  );
};

const AIAnalysisView = ({
  detail,
  streams,
}: {
  detail: ActivityDetail;
  streams: Streams | null;
}) => {
  const splitsText = detail.splits_metric
    ?.map(s =>
      `第${s.split}km：配速${speedToPace(s.average_speed)}、` +
      `時間${formatDuration(s.moving_time)}、` +
      `心率${s.average_heartrate ? Math.round(s.average_heartrate) + 'bpm' : '無'}、` +
      `爬升${Math.round(s.elevation_difference)}m`
    ).join('\n') ?? '無分段資料';

  const cadenceData = streams?.cadence?.data ?? [];
  const avgCadence = cadenceData.length
    ? Math.round(cadenceData.reduce((a, b) => a + b, 0) / cadenceData.length * 2)
    : null;

  const half = Math.floor(cadenceData.length / 2);
  const firstHalfCadence = half > 0
    ? cadenceData.slice(0, half).reduce((a, b) => a + b, 0) / half * 2
    : null;
  const secondHalfCadence = half > 0
    ? cadenceData.slice(half).reduce((a, b) => a + b, 0) / half * 2
    : null;
  const cadenceDrop = firstHalfCadence && secondHalfCadence
    ? Math.round(firstHalfCadence - secondHalfCadence)
    : null;

  const resultPrompt = `你是一位專業的跑步教練與運動生理學家，請用繁體中文分析以下這次跑步表現，條列重點，每點2-3句話：

【基本數據】
距離：${(detail.distance / 1000).toFixed(2)} km
完成時間：${formatDuration(detail.moving_time)}
均速配速：${speedToPace(detail.average_speed)} /km
最速配速：${speedToPace(detail.max_speed)} /km
爬升：${Math.round(detail.total_elevation_gain)} m
平均心率：${detail.average_heartrate ? Math.round(detail.average_heartrate) + ' bpm' : '無資料'}
最高心率：${detail.max_heartrate ? Math.round(detail.max_heartrate) + ' bpm' : '無資料'}
平均步頻：${avgCadence ? avgCadence + ' spm' : '無資料'}
痛苦指數：${detail.suffer_score ?? '無資料'}

【每公里分段】
${splitsText}

請分析：
1. 配速策略評估（前後半段比較）
2. 心率控制與有氧效率
3. 整體表現優缺點
4. 具體改善建議`;

  const planPrompt = `你是一位專業的跑步教練，請用繁體中文根據以下這次跑步數據，規劃接下來7天的訓練課表：

【本次表現】
距離：${(detail.distance / 1000).toFixed(2)} km
時間：${formatDuration(detail.moving_time)}
均速配速：${speedToPace(detail.average_speed)} /km
平均心率：${detail.average_heartrate ? Math.round(detail.average_heartrate) + ' bpm' : '無資料'}
痛苦指數：${detail.suffer_score ?? '無資料'}
主觀疲勞：${detail.perceived_exertion ? detail.perceived_exertion + '/10' : '無資料'}
${detail.best_efforts?.length ? '最佳成績：' + detail.best_efforts.map(e => `${e.name} ${formatDuration(e.moving_time)}`).join('、') : ''}

請提供：
1. 恢復狀態評估
2. 未來7天訓練課表（每天列出：類型、距離、強度、目標）
3. 本週訓練重點`;

  const injuryPrompt = `你是一位專業的運動醫學專家，請用繁體中文評估以下跑步數據的受傷風險：

【數據】
距離：${(detail.distance / 1000).toFixed(2)} km
平均步頻：${avgCadence ? avgCadence + ' spm' : '無資料'}
前半段步頻：${firstHalfCadence ? Math.round(firstHalfCadence) + ' spm' : '無資料'}
後半段步頻：${secondHalfCadence ? Math.round(secondHalfCadence) + ' spm' : '無資料'}
步頻下降幅度：${cadenceDrop !== null ? cadenceDrop + ' spm' : '無資料'}
爬升：${Math.round(detail.total_elevation_gain)} m
平均心率：${detail.average_heartrate ? Math.round(detail.average_heartrate) + ' bpm' : '無資料'}
最高心率：${detail.max_heartrate ? Math.round(detail.max_heartrate) + ' bpm' : '無資料'}
痛苦指數：${detail.suffer_score ?? '無資料'}

請評估：
1. 整體受傷風險等級（低/中/高）及原因
2. 步頻變化的意義（疲勞程度分析）
3. 高風險部位預測
4. 具體預防與恢復建議`;

  return (
    <View>
      <AIAnalysisCard
        title="跑步結果分析"
        icon={<Activity color="#06b6d4" size={16} />}
        color="rgba(6,182,212,1)"
        prompt={resultPrompt}
      />
      <AIAnalysisCard
        title="訓練規劃建議"
        icon={<TrendingUp color="#38bdf8" size={16} />}
        color="rgba(56,189,248,1)"
        prompt={planPrompt}
      />
      <AIAnalysisCard
        title="受傷風險預測"
        icon={<AlertTriangle color="#f43f5e" size={16} />}
        color="rgba(244,63,94,1)"
        prompt={injuryPrompt}
      />
    </View>
  );
};

// ────────── 主頁面 ──────────
export default function ActivityDetail() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const [detail, setDetail] = useState<ActivityDetail | null>(null);
  const [streams, setStreams] = useState<Streams | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'data' | 'ai'>('data');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('strava_token');
      if (!token) { setError('找不到 Token，請重新登入'); return; }

      const [detailRes, streamsRes] = await Promise.all([
        fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=heartrate,cadence,velocity_smooth,altitude,distance,watts,temp,time&key_by_type=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      const detailData = await detailRes.json();
      const streamsData = await streamsRes.json();

      setDetail(detailData);
      setStreams(streamsData);
    } catch (e) {
      setError('載入失敗，請返回重試');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={[styles.container, styles.centered]}>
      <LinearGradient
        colors={['#030712', '#0f172a', '#2e1065', '#d946ef']}
        locations={[0, 0.3, 0.7, 1.0]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ActivityIndicator size="large" color="#06b6d4" />
      <Text style={styles.loadingText}>載入詳細資料中...</Text>
    </View>
  );

  if (error || !detail) return (
    <View style={[styles.container, styles.centered]}>
      <LinearGradient
        colors={['#030712', '#0f172a', '#2e1065', '#d946ef']}
        locations={[0, 0.3, 0.7, 1.0]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>返回</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#030712', '#0f172a', '#2e1065', '#d946ef']}
          locations={[0, 0.3, 0.7, 1.0]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea}>

          {/* Header */}
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color="#ffffff" size={22} />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={styles.headerName} numberOfLines={1}>{detail.name}</Text>
              <Text style={styles.headerDate}>
                {formatDate(detail.start_date_local)} · {formatTime(detail.start_date_local)}
              </Text>
            </View>
          </View>

          {/* 切換列 */}
          <View style={styles.toggleBar}>
            <TouchableOpacity
              style={[styles.toggleBtn, activeView === 'data' && styles.toggleBtnActive]}
              onPress={() => setActiveView('data')}
            >
              <Activity color={activeView === 'data' ? '#06b6d4' : '#64748b'} size={15} />
              <Text style={[styles.toggleText, activeView === 'data' && styles.toggleTextActive]}>
                數據
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, activeView === 'ai' && styles.toggleBtnActive]}
              onPress={() => setActiveView('ai')}
            >
              <Brain color={activeView === 'ai' ? '#d946ef' : '#64748b'} size={15} />
              <Text style={[styles.toggleText, activeView === 'ai' && styles.toggleTextActive]}>
                AI 分析
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {activeView === 'ai' ? (
              <AIAnalysisView detail={detail} streams={streams} />
            ) : (
              <>
                {/* ① 核心數據 */}
                <SectionCard title="核心數據" icon={<Activity color="#06b6d4" size={16} />} color="rgba(6,182,212,">
                  <StatGrid items={[
                    { label: '距離', value: `${(detail.distance / 1000).toFixed(2)}`, sub: 'km' },
                    { label: '時間', value: formatDuration(detail.moving_time) },
                    { label: '均速配速', value: speedToPace(detail.average_speed), sub: '/km' },
                    { label: '最速配速', value: speedToPace(detail.max_speed), sub: '/km' },
                    { label: '爬升', value: `${Math.round(detail.total_elevation_gain)}`, sub: 'm' },
                    { label: '總時間', value: formatDuration(detail.elapsed_time) },
                  ]} />
                </SectionCard>

                {/* ② 心肺數據 */}
                {(detail.average_heartrate || detail.average_cadence || detail.suffer_score) && (
                  <SectionCard title="心肺數據" icon={<Heart color="#f43f5e" size={16} />} color="rgba(244,63,94,">
                    <StatGrid items={[
                      ...(detail.average_heartrate ? [
                        { label: '平均心率', value: `${Math.round(detail.average_heartrate)}`, sub: 'bpm' },
                        { label: '最高心率', value: `${Math.round(detail.max_heartrate ?? 0)}`, sub: 'bpm' },
                      ] : []),
                      ...(detail.average_cadence ? [
                        { label: '平均步頻', value: `${Math.round(detail.average_cadence * 2)}`, sub: 'spm' },
                      ] : []),
                      ...(detail.suffer_score ? [
                        { label: '痛苦指數', value: `${detail.suffer_score}` },
                      ] : []),
                      ...(detail.perceived_exertion ? [
                        { label: '主觀疲勞', value: `${detail.perceived_exertion}`, sub: '/ 10' },
                      ] : []),
                    ]} />
                  </SectionCard>
                )}

                {/* ③ 能量數據 */}
                {(detail.calories || detail.kilojoules) && (
                  <SectionCard title="能量數據" icon={<Flame color="#f97316" size={16} />} color="rgba(249,115,22,">
                    <StatGrid items={[
                      ...(detail.calories ? [{ label: '消耗卡路里', value: `${Math.round(detail.calories)}`, sub: 'kcal' }] : []),
                      ...(detail.kilojoules ? [{ label: '輸出能量', value: `${Math.round(detail.kilojoules)}`, sub: 'kJ' }] : []),
                    ]} />
                  </SectionCard>
                )}

                {/* ④ 逐秒走勢 */}
                {streams && (
                  <SectionCard title="逐秒走勢" icon={<Zap color="#22d3ee" size={16} />} color="rgba(34,211,238," collapsible>
                    {streams.heartrate?.data && (
                      <StreamChart data={streams.heartrate.data} color="rgba(244,63,94,1)" label="心率" unit="bpm" />
                    )}
                    {streams.velocity_smooth?.data && (
                      <StreamChart data={streams.velocity_smooth.data.map(speedToPaceNum)} color="rgba(6,182,212,1)" label="配速（秒/公里）" unit="s/km" />
                    )}
                    {streams.altitude?.data && (
                      <StreamChart data={streams.altitude.data} color="rgba(132,204,22,1)" label="海拔" unit="m" />
                    )}
                    {streams.cadence?.data && (
                      <StreamChart data={streams.cadence.data.map(c => c * 2)} color="rgba(168,85,247,1)" label="步頻" unit="spm" />
                    )}
                    {streams.watts?.data && (
                      <StreamChart data={streams.watts.data} color="rgba(251,191,36,1)" label="功率" unit="W" />
                    )}
                  </SectionCard>
                )}

                {/* ⑤ 每公里分段 */}
                {detail.splits_metric && detail.splits_metric.length > 0 && (
                  <SectionCard title="每公里分段" icon={<TrendingUp color="#38bdf8" size={16} />} color="rgba(56,189,248," collapsible>
                    <View style={styles.splitsHeader}>
                      <Text style={[styles.splitCell, styles.splitHeaderText]}>公里</Text>
                      <Text style={[styles.splitCell, styles.splitHeaderText]}>配速</Text>
                      <Text style={[styles.splitCell, styles.splitHeaderText]}>時間</Text>
                      <Text style={[styles.splitCell, styles.splitHeaderText]}>心率</Text>
                      <Text style={[styles.splitCell, styles.splitHeaderText]}>爬升</Text>
                    </View>
                    {detail.splits_metric.map((split) => (
                      <View key={split.split} style={styles.splitRow}>
                        <Text style={styles.splitCell}>{split.split}</Text>
                        <Text style={[styles.splitCell, { color: '#06b6d4' }]}>
                          {speedToPace(split.average_speed)}
                        </Text>
                        <Text style={styles.splitCell}>{formatDuration(split.moving_time)}</Text>
                        <Text style={styles.splitCell}>
                          {split.average_heartrate ? `${Math.round(split.average_heartrate)}` : '--'}
                        </Text>
                        <Text style={[styles.splitCell, {
                          color: split.elevation_difference > 0 ? '#f97316' : '#22d3ee'
                        }]}>
                          {split.elevation_difference > 0 ? '+' : ''}{Math.round(split.elevation_difference)}m
                        </Text>
                      </View>
                    ))}
                  </SectionCard>
                )}

                {/* ⑥ 最佳成績 */}
                {detail.best_efforts && detail.best_efforts.length > 0 && (
                  <SectionCard title="最佳成績" icon={<Wind color="#c084fc" size={16} />} color="rgba(192,132,252," collapsible>
                    {detail.best_efforts.map((effort, i) => (
                      <View key={i} style={styles.effortRow}>
                        <Text style={styles.effortName}>{effort.name}</Text>
                        <Text style={styles.effortTime}>{formatDuration(effort.moving_time)}</Text>
                      </View>
                    ))}
                  </SectionCard>
                )}

                {/* ⑦ 裝置資訊 */}
                {detail.device_name && (
                  <SectionCard title="裝置" icon={<Clock color="#94a3b8" size={16} />} color="rgba(148,163,184,">
                    <Text style={styles.deviceText}>{detail.device_name}</Text>
                  </SectionCard>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

// ────────── 樣式 ──────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  safeArea: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  errorText: { color: '#f43f5e', fontSize: 14, marginBottom: 16 },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10,
  },
  backBtnText: { color: '#ffffff', fontSize: 14 },
  topHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  headerTitle: { flex: 1 },
  headerName: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  headerDate: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // 切換列
  toggleBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 4,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  toggleText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  toggleTextActive: { color: '#ffffff', fontWeight: '600' },

  scrollContainer: { paddingHorizontal: 16, paddingBottom: 40 },

  // Section Card
  sectionCard: {
    borderRadius: 20, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', backgroundColor: 'rgba(15,23,42,0.5)',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, paddingBottom: 12,
  },
  sectionIconBg: {
    width: 30, height: 30, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#ffffff' },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16 },

  // Stat Grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
  statGridItem: {
    width: '33%', alignItems: 'center', paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 1, marginRight: 1,
  },
  statGridValue: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  statGridLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  statGridSub: { fontSize: 10, color: '#475569' },

  // Chart
  chartWrapper: { marginBottom: 16 },
  chartLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  chartLabel: { fontSize: 12, color: '#94a3b8' },
  chartRange: { fontSize: 12, color: '#475569' },

  // Splits
  splitsHeader: {
    flexDirection: 'row', marginBottom: 6,
    paddingBottom: 8, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  splitHeaderText: { color: '#64748b', fontSize: 11 },
  splitRow: {
    flexDirection: 'row', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  splitCell: { flex: 1, fontSize: 13, color: '#cbd5e1', textAlign: 'center' },

  // Best Efforts
  effortRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  effortName: { fontSize: 13, color: '#cbd5e1' },
  effortTime: { fontSize: 13, color: '#06b6d4', fontWeight: '600' },

  // Device
  deviceText: { fontSize: 14, color: '#94a3b8' },

  // AI 分析
  aiCard: {
    borderRadius: 20, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', backgroundColor: 'rgba(15,23,42,0.5)',
  },
  aiCardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 14,
  },
  analyzeBtn: {
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  analyzeBtnText: { fontSize: 14, fontWeight: '600' },
  aiLoading: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, paddingVertical: 16,
  },
  aiLoadingText: { color: '#94a3b8', fontSize: 14 },
  aiResult: { fontSize: 14, color: '#cbd5e1', lineHeight: 24 },
  reanalyzeBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  reanalyzeBtnText: { fontSize: 13, color: '#475569' },
});