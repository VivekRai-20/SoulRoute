import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useWellbeing } from '@/context/WellbeingContext';
import { Palette, Spacing, Typography, Radius } from '@/constants/Theme';

// ─── Resource Data (Verified URLs) ──────────────────────────────────────────

type ResourceType = 'Video' | 'Article' | 'Tool';

interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  desc: string;
  source: string;
  url: string;
  color?: string;
  icon?: IconName;
}

const RESOURCES_UNDERSTAND: Resource[] = [
  {
    id: 'u1', title: 'The Social Dilemma', type: 'Video',
    desc: 'How apps are designed to exploit your attention.',
    source: 'Netflix / YouTube', url: 'https://www.youtube.com/watch?v=uaaC57tcci0',
    icon: 'MonitorPlay', color: '#E3F2FD',
  },
  {
    id: 'u2', title: 'Do smartphones cause brain drain?', type: 'Video',
    desc: 'The neuroscience of screen fatigue explained.',
    source: 'TED-Ed', url: 'https://www.youtube.com/watch?v=RcGyVTAoXEU',
    icon: 'Brain', color: '#E8F5E9',
  },
  {
    id: 'u3', title: 'Understanding Digital Wellbeing', type: 'Article',
    desc: 'Science-backed insights on screen impact.',
    source: 'Mental Health Fndn', url: 'https://www.mentalhealth.org.uk',
    icon: 'BookOpen', color: '#FFF3E0',
  },
  {
    id: 'u4', title: 'Dopamine & Phone Habits', type: 'Video',
    desc: 'Why you keep reaching for your phone.',
    source: 'YouTube', url: 'https://www.youtube.com/watch?v=MB5IX-np5fE',
    icon: 'Zap', color: '#F3E5F5',
  },
];

const RESOURCES_RECOVER: Resource[] = [
  {
    id: 'r1', title: '2-Min Breathing Exercise', type: 'Video',
    desc: 'Box breathing to instantly lower stress.',
    source: 'YouTube', url: 'https://www.youtube.com/watch?v=tEmt1Znux58',
    icon: 'Wind', color: '#E0F2F1',
  },
  {
    id: 'r2', title: 'Pomodoro Focus Timer', type: 'Tool',
    desc: 'Structured work/rest cycles for recovery.',
    source: 'Pomofocus', url: 'https://pomofocus.io',
    icon: 'Timer', color: '#FFF8E1',
  },
  {
    id: 'r3', title: 'Digital Detox Guide', type: 'Article',
    desc: 'Step-by-step plan to reset your baseline.',
    source: 'NHS Mental Health', url: 'https://www.nhs.uk/mental-health/',
    icon: 'RefreshCw', color: '#F3E5F5',
  },
  {
    id: 'r4', title: 'Anxiety & Stress Relief', type: 'Video',
    desc: 'Science-based grounding techniques.',
    source: 'YouTube', url: 'https://www.youtube.com/watch?v=ZToicYcHIOU',
    icon: 'Activity', color: '#E8F5E9',
  },
];

const RESOURCES_OVERLOAD: Resource[] = [
  {
    id: 'o1', title: 'Manage Notification Fatigue', type: 'Video',
    desc: 'Take back control of your attention.',
    source: 'YouTube', url: 'https://www.youtube.com/watch?v=awAMTQZmvPE',
    icon: 'BellOff', color: '#FFF3E0',
  },
  {
    id: 'o2', title: 'How to Break Phone Addiction', type: 'Video',
    desc: 'Practical strategies to reduce compulsive use.',
    source: 'YouTube', url: 'https://www.youtube.com/watch?v=NUMa0QkPzns',
    icon: 'Smartphone', color: '#FCE4EC',
  },
  {
    id: 'o3', title: 'Center for Humane Technology', type: 'Article',
    desc: 'Research on tech design and wellbeing.',
    source: 'humanetech.com', url: 'https://www.humanetech.com',
    icon: 'Shield', color: '#E8F5E9',
  },
  {
    id: 'o4', title: 'Indistractable — Nir Eyal', type: 'Article',
    desc: 'Master internal triggers before external ones.',
    source: 'nirandfar.com', url: 'https://www.nirandfar.com',
    icon: 'Target', color: '#E3F2FD',
  },
];

const RESOURCES_SLEEP: Resource[] = [
  {
    id: 's1', title: 'Blue Light & Sleep Science', type: 'Article',
    desc: 'How screens disrupt your circadian rhythm.',
    source: 'Sleep Foundation', url: 'https://www.sleepfoundation.org',
    icon: 'Moon', color: '#EDE7F6',
  },
  {
    id: 's2', title: 'Ambient Sound for Deep Sleep', type: 'Tool',
    desc: 'Rain, white noise & nature sounds.',
    source: 'A Soft Murmur', url: 'https://asoftmurmur.com',
    icon: 'Music', color: '#E0F7FA',
  },
  {
    id: 's3', title: 'Perfect Sleep Routine', type: 'Video',
    desc: 'Science-backed wind-down protocol.',
    source: 'YouTube', url: 'https://www.youtube.com/watch?v=30VMIEmA114',
    icon: 'Clock', color: '#FBE9E7',
  },
  {
    id: 's4', title: 'Healthy Sleep Habits', type: 'Article',
    desc: 'Mayo Clinic guide to sleep hygiene.',
    source: 'Mayo Clinic', url: 'https://www.mayoclinic.org',
    icon: 'Bed', color: '#F0F4F3',
  },
];

const RESOURCES_FOCUS: Resource[] = [
  {
    id: 'f1', title: 'Deep Work Strategy', type: 'Article',
    desc: 'Cal Newport on distraction-free performance.',
    source: 'calnewport.com', url: 'https://www.calnewport.com',
    icon: 'BookOpen', color: '#E3F2FD',
  },
  {
    id: 'f2', title: 'Pomodoro Focus Timer', type: 'Tool',
    desc: 'Beat procrastination with structured cycles.',
    source: 'Pomofocus', url: 'https://pomofocus.io',
    icon: 'Zap', color: '#FFF8E1',
  },
  {
    id: 'f3', title: 'The Focus Formula', type: 'Video',
    desc: 'Neuroscience of sustained attention.',
    source: 'YouTube', url: 'https://www.youtube.com/watch?v=MB5IX-np5fE',
    icon: 'Headphones', color: '#F1F8E9',
  },
  {
    id: 'f4', title: 'HBR: Managing Your Attention', type: 'Article',
    desc: 'Executive tactics for deep concentration.',
    source: 'Harvard Business Review', url: 'https://hbr.org',
    icon: 'TrendingUp', color: '#E8F5E9',
  },
];

// ─── Open URL (Performance: non-blocking, instant) ───────────────────────────

const openUrl = (url: string) => {
  // Fire-and-forget — never await in a press handler
  Linking.openURL(url);
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResourcesScreen() {
  const { userStats } = useWellbeing() as any;

  const context = useMemo(() => {
    if (!userStats) {
      return { type: 'balanced', title: 'Finding Flow', sub: 'Your digital habits are looking balanced.', hint: 'Use this clarity to do deep, meaningful work.' };
    }
    const notifs = userStats.notificationCount ?? 0;
    const sessionAvg = userStats.unlockCount > 0 ? userStats.totalScreenTimeMs / userStats.unlockCount : 0;
    const fatigueLevel = userStats.fatigueScore?.level ?? 'low';
    const nightUsage = userStats.nightUsageMs ?? 0;

    if (nightUsage > 30 * 60000) return { type: 'sleep', title: 'Restless Nights?', sub: 'Late-night screen usage is high.', hint: 'Screens after 10 PM disrupt circadian rhythms.' };
    if (fatigueLevel === 'critical' || fatigueLevel === 'high') return { type: 'fatigue', title: 'Time to recharge', sub: 'Fatigue score is elevated today.', hint: 'Step away and ground yourself.' };
    if (notifs > 75) return { type: 'overload', title: 'You seem overstimulated', sub: 'Notification bursts are very high today.', hint: 'Constant interruptions drain cognitive energy.' };
    if (sessionAvg > 15 * 60000) return { type: 'sessions', title: 'Caught in a loop?', sub: 'Screen sessions are unusually long.', hint: 'Breaking long sessions preserves mental bandwidth.' };
    return { type: 'balanced', title: 'Finding Flow', sub: 'Your digital habits look balanced.', hint: 'Use this clarity to do deep, meaningful work.' };
  }, [userStats]);

  const priorityData = useMemo(() => {
    switch (context.type) {
      case 'overload': return { title: 'Reduce Overload', data: RESOURCES_OVERLOAD };
      case 'sessions': return { title: 'Break the Loop', data: RESOURCES_RECOVER };
      case 'fatigue': return { title: 'Recover Now', data: RESOURCES_RECOVER };
      case 'sleep': return { title: 'Sleep & Recharge', data: RESOURCES_SLEEP };
      default: return { title: 'Build Focus', data: RESOURCES_FOCUS };
    }
  }, [context.type]);

  const microActions = useMemo(() => {
    const all = [
      { id: 'm1', label: 'Take a 20-sec eye break', icon: 'Eye' },
      { id: 'm2', label: 'Turn off non-essential alerts', icon: 'BellOff' },
      { id: 'm3', label: 'Stand up and stretch', icon: 'Activity' },
      { id: 'm4', label: 'Drink a glass of water', icon: 'Droplet' },
      { id: 'm5', label: 'Enable Do Not Disturb', icon: 'Moon' },
    ];
    if (context.type === 'overload') return [all[1], all[4], all[0], all[2]];
    if (context.type === 'sleep') return [all[4], all[0], all[3], all[2]];
    return [all[0], all[2], all[3], all[1]];
  }, [context.type]);

  const getCtaLabel = (type: ResourceType) =>
    type === 'Video' ? 'Watch' : type === 'Article' ? 'Read' : 'Try';

  const getGradient = (): [string, string] => {
    switch (context.type) {
      case 'overload': return ['#FFF3E0', '#FFE0B2'];
      case 'fatigue': return ['#FCE4EC', '#F8BBD0'];
      case 'sleep': return ['#EDE7F6', '#D1C4E9'];
      default: return ['#E8F5E9', '#C8E6C9'];
    }
  };

  const getAccent = () => {
    switch (context.type) {
      case 'overload': return '#E65100';
      case 'fatigue': return '#C2185B';
      case 'sleep': return '#4527A0';
      default: return Palette.tealDark;
    }
  };

  const accentColor = getAccent();

  // useCallback so renderHorizontalList is stable across renders
  const renderHorizontalList = useCallback((title: string, data: Resource[]) => (
    <View style={s.section} key={title}>
      <Text style={s.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
        {data.map(res => (
          <Pressable
            key={res.id}
            style={({ pressed }) => [s.resCard, pressed && s.pressed]}
            onPress={() => openUrl(res.url)}
            android_ripple={{ color: 'rgba(45,106,79,0.1)', borderless: false }}
          >
            <View style={[s.resIcon, { backgroundColor: res.color }]}>
              <Icon name={res.icon as IconName} size={28} color={Palette.tealDark} strokeWidth={1.5} />
            </View>
            <Text style={s.resTitle} numberOfLines={2}>{res.title}</Text>
            <Text style={s.resSource}>{res.source}</Text>
            <Text style={s.resCta}>{getCtaLabel(res.type)} →</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  ), []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7FAF8" translucent={false} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(350)}>
        <LinearGradient colors={getGradient()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.headerCard}>
          <View style={[s.badge, { backgroundColor: accentColor + '22' }]}>
            <Icon name="Activity" size={11} color={accentColor} />
            <Text style={[s.badgeText, { color: accentColor }]}>{context.sub}</Text>
          </View>
          <Text style={s.headerTitle}>{context.title} — here's how to reset.</Text>
          <Text style={s.headerHint}>{context.hint}</Text>
        </LinearGradient>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Micro Actions */}
        <Animated.View entering={FadeInDown.duration(350).delay(60)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.microScroll}>
            {microActions.map(a => (
              <View key={a.id} style={s.microChip}>
                <Icon name={a.icon as IconName} size={13} color={Palette.tealDark} />
                <Text style={s.microText}>{a.label}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Priority Section */}
        <Animated.View entering={FadeInDown.duration(350).delay(120)} style={s.priorityWrapper}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{priorityData.title}</Text>
            <View style={s.recBadge}><Text style={s.recBadgeText}>Recommended</Text></View>
          </View>
          {priorityData.data.slice(0, 2).map(item => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [s.priorityCard, pressed && s.pressed]}
              onPress={() => openUrl(item.url)}
              android_ripple={{ color: 'rgba(45,106,79,0.1)' }}
            >
              <View style={[s.priorityIcon, { backgroundColor: item.color }]}>
                <Icon name={item.icon as IconName} size={26} color={Palette.tealDark} strokeWidth={1.5} />
              </View>
              <View style={s.priorityInfo}>
                <Text style={s.priorityMeta}>{item.type.toUpperCase()} • {item.source}</Text>
                <Text style={s.priorityTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.priorityDesc} numberOfLines={1}>{item.desc}</Text>
              </View>
              <View style={s.ctaBtn}>
                <Text style={s.ctaBtnText}>{getCtaLabel(item.type)}</Text>
              </View>
            </Pressable>
          ))}
        </Animated.View>

        {/* Category Sections */}
        <Animated.View entering={FadeInDown.duration(350).delay(180)}>
          {renderHorizontalList('Understand Your Fatigue', RESOURCES_UNDERSTAND)}
          {renderHorizontalList('Recover Now', RESOURCES_RECOVER)}
          {renderHorizontalList('Reduce Overload', RESOURCES_OVERLOAD)}
          {renderHorizontalList('Build Focus', RESOURCES_FOCUS)}
          {renderHorizontalList('Sleep & Recharge', RESOURCES_SLEEP)}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7FAF8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  scroll: { paddingBottom: Spacing.xl },

  // Header
  headerCard: { margin: Spacing.base, padding: Spacing.xl, borderRadius: Radius.lg },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, marginBottom: Spacing.sm,
  },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: {
    fontSize: Typography.size.xl, fontWeight: Typography.weight.bold,
    color: '#2D3433', lineHeight: 28, letterSpacing: -0.4, marginBottom: Spacing.xs,
  },
  headerHint: { fontSize: Typography.size.sm, color: '#2D3433', opacity: 0.75, lineHeight: 20, fontWeight: '500' },

  // Micro Actions
  microScroll: { paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.md },
  microChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', paddingHorizontal: Spacing.md, paddingVertical: 9,
    borderRadius: Radius.full, borderWidth: 1, borderColor: '#E4E9E8',
    elevation: 1,
  },
  microText: { fontSize: Typography.size.sm, color: '#2D3433', fontWeight: '600' },

  // Priority
  priorityWrapper: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.size.lg, fontWeight: Typography.weight.bold,
    color: '#2D3433', letterSpacing: -0.3, paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  recBadge: { backgroundColor: '#E4E9E8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm },
  recBadgeText: { fontSize: 9, color: '#596060', fontWeight: '700', textTransform: 'uppercase' },
  priorityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: 'rgba(45,106,79,0.06)', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 12,
  },
  priorityIcon: {
    width: 56, height: 56, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  priorityInfo: { flex: 1 },
  priorityMeta: { fontSize: 9, fontWeight: '700', color: Palette.tealDark, marginBottom: 4, letterSpacing: 0.4 },
  priorityTitle: { fontSize: Typography.size.base, fontWeight: '700', color: '#2D3433', marginBottom: 2 },
  priorityDesc: { fontSize: Typography.size.xs, color: '#596060' },
  ctaBtn: {
    backgroundColor: '#F0F4F3', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, marginLeft: Spacing.sm,
  },
  ctaBtnText: { fontSize: 11, color: Palette.tealDark, fontWeight: '700' },

  // Horizontal Categories
  section: { marginBottom: Spacing.xl },
  hScroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingTop: 4, paddingBottom: 6 },
  resCard: {
    width: 158, backgroundColor: '#FFFFFF', borderRadius: Radius.md, padding: Spacing.md,
    elevation: 2,
    shadowColor: 'rgba(45,106,79,0.05)', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 10,
  },
  resIcon: {
    width: 44, height: 44, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  resTitle: {
    fontSize: Typography.size.sm, fontWeight: '700', color: '#2D3433',
    lineHeight: 18, marginBottom: 4, minHeight: 36,
  },
  resSource: { fontSize: 10, color: '#9AB0A8', fontWeight: '500', marginBottom: Spacing.sm },
  resCta: { fontSize: Typography.size.xs, color: Palette.tealDark, fontWeight: '700' },

  // Press feedback
  pressed: { opacity: 0.75 },
});
