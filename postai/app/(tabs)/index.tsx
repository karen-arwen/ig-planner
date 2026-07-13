import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePhotosStore } from '@/store/photosStore';
import { useFeedStore } from '@/store/feedStore';
import { COLORS, GRADIENTS } from '@/constants/colors';
import PhotoPickerButton from '@/components/photos/PhotoPickerButton';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const photos = usePhotosStore((s) => s.photos);
  const posts = useFeedStore((s) => s.posts);
  const inboxCount = photos.filter((p) => p.status === 'inbox').length;
  const readyCount = photos.filter((p) => p.status === 'pronto').length;
  const scheduledCount = photos.filter((p) => p.status === 'agendado').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Hero Header ── */}
        <LinearGradient
          colors={GRADIENTS.hero}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Top row */}
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>Oi, Karen ✨</Text>
              <Text style={styles.heroSub}>Vamos cuidar do seu feed?</Text>
            </View>
            <TouchableOpacity
              style={styles.amiBtn}
              onPress={() => router.push('/chat')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#A78BFA', '#EC4899']} style={styles.amiBtnGradient}>
                <Ionicons name="sparkles" size={20} color="#fff" />
              </LinearGradient>
              <View style={styles.amiOnlineDot} />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard value={inboxCount} label="na inbox" emoji="📥" />
            <StatCard value={readyCount} label="prontos" emoji="✅" />
            <StatCard value={scheduledCount} label="agendados" emoji="🗓️" />
          </View>
        </LinearGradient>

        {/* ── Ami suggestion card ── */}
        <TouchableOpacity
          style={styles.amiCard}
          onPress={() => router.push('/chat')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={GRADIENTS.soft} style={styles.amiCardGradient}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.amiCardAvatar}>
              <Ionicons name="sparkles" size={18} color="#fff" />
            </LinearGradient>
            <View style={styles.amiCardText}>
              <Text style={styles.amiCardTitle}>Ami</Text>
              <Text style={styles.amiCardMsg}>
                {inboxCount > 0
                  ? `Tenho ${inboxCount} foto${inboxCount > 1 ? 's' : ''} esperando para organizar 💜`
                  : 'Adicione fotos e me chame para organizar tudo!'}
              </Text>
            </View>
            <View style={styles.amiCardArrow}>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Add photos ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adicionar fotos</Text>
          <PhotoPickerButton />
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navegar</Text>
          <View style={styles.quickGrid}>
            <QuickAction
              emoji="🖼️"
              label="Meu Feed"
              sublabel="Visualizar e organizar"
              onPress={() => router.push('/(tabs)/feed')}
            />
            <QuickAction
              emoji="🗓️"
              label="Calendário"
              sublabel="Planejar publicações"
              onPress={() => router.push('/(tabs)/calendar')}
            />
            <QuickAction
              emoji="📥"
              label="Inbox"
              sublabel={inboxCount > 0 ? `${inboxCount} itens` : 'Vazia'}
              onPress={() => router.push('/(tabs)/inbox')}
            />
            <QuickAction
              emoji="💬"
              label="Chat Ami"
              sublabel="Resolver tudo com IA"
              onPress={() => router.push('/chat')}
              highlight
            />
          </View>
        </View>

        {/* ── Lazy shortcuts ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atalhos rápidos</Text>
          <View style={styles.lazyGrid}>
            {LAZY_SHORTCUTS.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={styles.lazyBtn}
                onPress={() => router.push('/chat')}
                activeOpacity={0.7}
              >
                <Text style={styles.lazyEmoji}>{s.emoji}</Text>
                <Text style={styles.lazyLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ value, label, emoji }: { value: number; label: string; emoji: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  emoji,
  label,
  sublabel,
  onPress,
  highlight,
}: {
  emoji: string;
  label: string;
  sublabel: string;
  onPress: () => void;
  highlight?: boolean;
}) {
  const CARD_W = (width - 52) / 2;
  return (
    <TouchableOpacity
      style={[styles.quickAction, { width: CARD_W }, highlight && styles.quickActionHighlight]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={styles.quickActionEmoji}>{emoji}</Text>
      <Text style={[styles.quickActionLabel, highlight && styles.quickActionLabelHL]}>{label}</Text>
      <Text style={[styles.quickActionSub, highlight && styles.quickActionSubHL]}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const LAZY_SHORTCUTS = [
  { emoji: '✨', label: 'Resolve pra mim' },
  { emoji: '🔄', label: 'Refaz tudo' },
  { emoji: '📅', label: 'Planejar o mês' },
  { emoji: '⚡', label: 'Post urgente' },
  { emoji: '⏱️', label: 'Só 5 minutos' },
  { emoji: '✈️', label: 'Sumir 1 semana' },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroGreeting: { fontSize: 26, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  amiBtn: { position: 'relative' },
  amiBtnGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amiOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#4C1D95',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Ami card
  amiCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  amiCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  amiCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  amiCardText: { flex: 1 },
  amiCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  amiCardMsg: { fontSize: 13, color: COLORS.text, marginTop: 2, lineHeight: 18 },
  amiCardArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(124,58,237,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },

  // Quick actions 2×2 grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionHighlight: {
    backgroundColor: COLORS.primary,
  },
  quickActionEmoji: { fontSize: 24, marginBottom: 8 },
  quickActionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  quickActionLabelHL: { color: '#fff' },
  quickActionSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  quickActionSubHL: { color: 'rgba(255,255,255,0.7)' },

  // Lazy shortcuts 3-col grid
  lazyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  lazyBtn: {
    width: (width - 52) / 3,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  lazyEmoji: { fontSize: 22, marginBottom: 6 },
  lazyLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
});
