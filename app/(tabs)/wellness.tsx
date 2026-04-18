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

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Fire-and-forget — never await in a press handler
const openUrl = (url: string) => { Linking.openURL(url); };
const callPhone = (number: string) => { Linking.openURL(`tel:${number}`); };

// ─── Data (Verified URLs) ─────────────────────────────────────────────────────

interface ProHelp {
  id: string; name: string; type: string; desc: string;
  cta: string; icon: IconName; action: () => void;
}

const PRO_HELP: ProHelp[] = [
  {
    id: 'p1', name: 'Kiran Mental Health', type: 'National Helpline',
    desc: 'Govt. of India 24×7 mental health support. Free and confidential.',
    cta: 'Call Now', icon: 'Phone',
    action: () => callPhone('18005990019'),
  },
  {
    id: 'p2', name: 'AASRA', type: 'Crisis Helpline',
    desc: '24×7 crisis support and suicide prevention.',
    cta: 'Call Now', icon: 'PhoneCall',
    action: () => callPhone('+919820466726'),
  },
  {
    id: 'p3', name: 'Practo', type: 'Doctor Finder',
    desc: 'Find licensed psychologists and counselors near you.',
    cta: 'Find a Doctor', icon: 'Search',
    action: () => openUrl('https://www.practo.com'),
  },
  {
    id: 'p4', name: 'Fortis Mental Health', type: 'Hospital Network',
    desc: 'Book in-person or online psychiatric consultations.',
    cta: 'Visit Website', icon: 'Globe',
    action: () => openUrl('https://www.fortishealthcare.com'),
  },
];

interface Program {
  id: string; title: string; desc: string; duration: string; icon: IconName; color: string;
  url: string;
}

const GUIDED_PROGRAMS: Program[] = [
  {
    id: 'g1', title: '3-Day Digital Reset', duration: '3 Days',
    desc: 'A structured protocol to regain control of your screen time.',
    icon: 'RefreshCw', color: '#E0F2F1',
    url: 'https://www.humanetech.com',
  },
  {
    id: 'g2', title: 'Notification Detox', duration: '1 Day',
    desc: 'Quiet the noise and reclaim deep focus.',
    icon: 'BellOff', color: '#FFF3E0',
    url: 'https://www.nirandfar.com',
  },
  {
    id: 'g3', title: 'Burnout Recovery', duration: '7 Days',
    desc: 'A science-backed gentle path back to balance.',
    icon: 'Battery', color: '#FCE4EC',
    url: 'https://www.helpguide.org',
  },
  {
    id: 'g4', title: 'Focus Rebuilding', duration: '5 Days',
    desc: 'Restore deep work capacity step by step.',
    icon: 'Target', color: '#E8F5E9',
    url: 'https://www.calnewport.com',
  },
];

interface Assessment { id: string; title: string; purpose: string; source: string; url: string; }

const ASSESSMENTS: Assessment[] = [
  { id: 'a1', title: 'Stress Self-Check', purpose: 'Assess your current stress levels.', source: 'Mind UK', url: 'https://www.mind.org.uk' },
  { id: 'a2', title: 'Anxiety Indicator', purpose: 'Understand your anxiety patterns.', source: 'NHS', url: 'https://www.nhs.uk/mental-health/' },
  { id: 'a3', title: 'Burnout Risk Profile', purpose: 'Are you approaching occupational burnout?', source: 'Mental Health Fndn', url: 'https://www.mentalhealth.org.uk' },
  { id: 'a4', title: 'Screen Habit Audit', purpose: 'Measure digital dependency levels.', source: 'Verywell Mind', url: 'https://www.verywellmind.com' },
];

const DAILY_ACTIONS = [
  { id: 'd1', label: 'Step outside for 5 mins', icon: 'Sun' as IconName },
  { id: 'd2', label: 'Talk to someone you trust', icon: 'MessageCircle' as IconName },
  { id: 'd3', label: 'Take a break from screens', icon: 'MonitorOff' as IconName },
  { id: 'd4', label: '2-min breathing exercise', icon: 'Wind' as IconName },
  { id: 'd5', label: "Write 3 things you're grateful for", icon: 'Edit3' as IconName },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function WellnessScreen() {
  const { userStats } = useWellbeing() as any;

  const severity = useMemo(() => {
    const level = userStats?.fatigueScore?.level ?? 'low';
    if (level === 'critical' || level === 'high') return 'high';
    if (level === 'medium') return 'moderate';
    return 'low';
  }, [userStats]);

  const headerData = useMemo(() => {
    if (severity === 'high') return {
      title: 'Your patterns suggest you may benefit from deeper support.',
      sub: 'Screen time peaks indicate potential burnout.',
      gradient: ['#FCE4EC', '#F8BBD0'] as [string, string],
      accent: '#C2185B',
    };
    if (severity === 'moderate') return {
      title: 'Structured support can help guide you back to balance.',
      sub: 'Your usage shows moderate cognitive load.',
      gradient: ['#FFF3E0', '#FFE0B2'] as [string, string],
      accent: '#E65100',
    };
    return {
      title: 'Small daily actions build long-term resilience.',
      sub: 'Your baseline looks healthy — stay proactive.',
      gradient: ['#E0F2F1', '#B2DFDB'] as [string, string],
      accent: '#00796B',
    };
  }, [severity]);

  // ── Section Renderers ──

  const renderEmergency = useCallback(() => (
    <Animated.View entering={FadeInDown.duration(350)} style={s.section} key="emergency">
      <View style={s.emergencyCard}>
        <View style={s.emergencyRow}>
          <Icon name="AlertCircle" size={22} color="#C2185B" />
          <Text style={s.emergencyText}>
            If you feel overwhelmed or unsafe, talk to someone immediately.
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [s.emergencyBtn, pressed && s.pressed]}
          onPress={() => callPhone('18005990019')}
          android_ripple={{ color: '#9A0000' }}
        >
          <Icon name="Phone" size={14} color="#FFFFFF" />
          <Text style={s.emergencyBtnText}>Call Helpline Now</Text>
        </Pressable>
      </View>
    </Animated.View>
  ), []);

  const renderProHelp = useCallback(() => (
    <Animated.View entering={FadeInDown.duration(350).delay(60)} style={s.section} key="pro">
      <Text style={s.sectionTitle}>Professional Help</Text>
      {PRO_HELP.map(item => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [s.proCard, pressed && s.pressed]}
          onPress={item.action}
          android_ripple={{ color: 'rgba(45,106,79,0.1)' }}
        >
          <View style={s.proIconBg}>
            <Icon name={item.icon} size={22} color={Palette.tealDark} strokeWidth={2} />
          </View>
          <View style={s.proInfo}>
            <Text style={s.proType}>{item.type.toUpperCase()}</Text>
            <Text style={s.proName}>{item.name}</Text>
            <Text style={s.proDesc} numberOfLines={1}>{item.desc}</Text>
          </View>
          <View style={s.cta}>
            <Text style={s.ctaText}>{item.cta}</Text>
          </View>
        </Pressable>
      ))}
    </Animated.View>
  ), []);

  const renderPrograms = useCallback(() => (
    <Animated.View entering={FadeInDown.duration(350).delay(110)} style={s.section} key="programs">
      <Text style={s.sectionTitle}>Guided Support Programs</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
        {GUIDED_PROGRAMS.map(prog => (
          <Pressable
            key={prog.id}
            style={({ pressed }) => [s.guideCard, pressed && s.pressed]}
            onPress={() => openUrl(prog.url)}
            android_ripple={{ color: 'rgba(45,106,79,0.1)', borderless: false }}
          >
            <View style={[s.guideIcon, { backgroundColor: prog.color }]}>
              <Icon name={prog.icon} size={26} color={Palette.tealDark} />
            </View>
            <Text style={s.guideDuration}>{prog.duration}</Text>
            <Text style={s.guideTitle} numberOfLines={1}>{prog.title}</Text>
            <Text style={s.guideDesc} numberOfLines={2}>{prog.desc}</Text>
            <Text style={s.guideStart}>Start Program →</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Animated.View>
  ), []);

  const renderAssessments = useCallback(() => (
    <Animated.View entering={FadeInDown.duration(350).delay(160)} style={s.section} key="assess">
      <Text style={s.sectionTitle}>Self-Assessment</Text>
      {ASSESSMENTS.map(item => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [s.assessCard, pressed && s.pressed]}
          onPress={() => openUrl(item.url)}
          android_ripple={{ color: 'rgba(45,106,79,0.1)' }}
        >
          <View style={s.assessInfo}>
            <Text style={s.assessTitle}>{item.title}</Text>
            <Text style={s.assessPurpose}>{item.purpose}</Text>
            <Text style={s.assessSource}>By {item.source}</Text>
          </View>
          <View style={s.assessBtn}>
            <Icon name="ExternalLink" size={14} color={Palette.tealDark} />
            <Text style={s.assessBtnText}>Take</Text>
          </View>
        </Pressable>
      ))}
    </Animated.View>
  ), []);

  const renderDailyActions = useCallback(() => (
    <Animated.View entering={FadeInDown.duration(350).delay(210)} style={s.section} key="daily">
      <Text style={s.sectionTitle}>Daily Wellness Actions</Text>
      <View style={s.actionsGrid}>
        {DAILY_ACTIONS.map(action => (
          <View key={action.id} style={s.actionChip}>
            <Icon name={action.icon} size={14} color={Palette.tealDark} />
            <Text style={s.actionText}>{action.label}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  ), []);

  // Dynamic section order based on severity
  const sections = useMemo(() => {
    if (severity === 'high') {
      return [renderEmergency(), renderProHelp(), renderPrograms(), renderAssessments(), renderDailyActions()];
    }
    if (severity === 'moderate') {
      return [renderPrograms(), renderProHelp(), renderAssessments(), renderDailyActions(), renderEmergency()];
    }
    return [renderDailyActions(), renderAssessments(), renderPrograms(), renderProHelp(), renderEmergency()];
  }, [severity, renderEmergency, renderProHelp, renderPrograms, renderAssessments, renderDailyActions]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7FAF8" translucent={false} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(350)}>
          <LinearGradient
            colors={headerData.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.headerCard}
          >
            <Icon name="Heart" size={22} color={headerData.accent} style={{ marginBottom: 10 }} />
            <Text style={s.headerTitle}>{headerData.title}</Text>
            <Text style={s.headerSub}>{headerData.sub}</Text>
          </LinearGradient>
        </Animated.View>

        {sections}

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
  headerCard: { margin: Spacing.base, padding: Spacing.xl, borderRadius: Radius.lg, marginBottom: Spacing.md },
  headerTitle: {
    fontSize: Typography.size.xl, fontWeight: Typography.weight.bold,
    color: '#2D3433', lineHeight: 28, letterSpacing: -0.4, marginBottom: Spacing.xs,
  },
  headerSub: { fontSize: Typography.size.sm, color: '#2D3433', opacity: 0.78, fontWeight: '500' },

  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.size.lg, fontWeight: Typography.weight.bold,
    color: '#2D3433', letterSpacing: -0.3,
    paddingHorizontal: Spacing.base, marginBottom: Spacing.sm,
  },

  // Emergency
  emergencyCard: {
    marginHorizontal: Spacing.base, backgroundColor: '#FCE4EC',
    borderRadius: Radius.md, padding: Spacing.lg,
    borderLeftWidth: 4, borderLeftColor: '#C2185B',
  },
  emergencyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  emergencyText: { flex: 1, fontSize: Typography.size.base, fontWeight: '600', color: '#880E4F', lineHeight: 22 },
  emergencyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#C2185B', alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radius.full,
  },
  emergencyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: Typography.size.sm },

  // Pro Help
  proCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md,
    elevation: 2,
    shadowColor: 'rgba(45,106,79,0.06)', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 10,
  },
  proIconBg: {
    width: 46, height: 46, borderRadius: Radius.sm,
    backgroundColor: '#F0F4F3', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  proInfo: { flex: 1 },
  proType: { fontSize: 9, fontWeight: '700', color: Palette.tealDark, letterSpacing: 0.5, marginBottom: 4 },
  proName: { fontSize: Typography.size.base, fontWeight: '700', color: '#2D3433', marginBottom: 2 },
  proDesc: { fontSize: Typography.size.xs, color: '#596060' },
  cta: { backgroundColor: '#F0F4F3', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, marginLeft: Spacing.sm },
  ctaText: { fontSize: 11, fontWeight: '700', color: Palette.tealDark },

  // Programs
  hScroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: 6 },
  guideCard: {
    width: 195, backgroundColor: '#FFFFFF', borderRadius: Radius.md, padding: Spacing.lg,
    elevation: 2,
    shadowColor: 'rgba(45,106,79,0.05)', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 10,
  },
  guideIcon: {
    width: 52, height: 52, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  guideDuration: { fontSize: 10, fontWeight: '700', color: Palette.tealDark, textTransform: 'uppercase', marginBottom: 6 },
  guideTitle: { fontSize: Typography.size.md, fontWeight: '700', color: '#2D3433', marginBottom: 6 },
  guideDesc: { fontSize: Typography.size.sm, color: '#596060', lineHeight: 18, marginBottom: Spacing.md },
  guideStart: { fontSize: Typography.size.sm, fontWeight: '700', color: Palette.tealDark },

  // Assessments
  assessCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.base, marginBottom: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: '#E4E9E8', alignItems: 'center',
  },
  assessInfo: { flex: 1, paddingRight: Spacing.sm },
  assessTitle: { fontSize: Typography.size.base, fontWeight: '700', color: '#2D3433', marginBottom: 4 },
  assessPurpose: { fontSize: Typography.size.sm, color: '#596060', marginBottom: 4 },
  assessSource: { fontSize: 10, fontWeight: '600', color: '#9AB0A8' },
  assessBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0F4F3', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm,
  },
  assessBtnText: { fontSize: Typography.size.sm, fontWeight: '700', color: Palette.tealDark },

  // Daily Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.base, gap: Spacing.sm },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#FFFFFF', paddingHorizontal: Spacing.md, paddingVertical: 11,
    borderRadius: Radius.full, borderWidth: 1, borderColor: '#E4E9E8',
  },
  actionText: { fontSize: Typography.size.sm, fontWeight: '600', color: '#2D3433' },

  // Global press state
  pressed: { opacity: 0.72 },
});
