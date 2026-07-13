import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePhotosStore } from '@/store/photosStore';
import { useFeedStore } from '@/store/feedStore';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { CONFIG } from '@/constants/config';
import PhotoPickerButton from '@/components/photos/PhotoPickerButton';

const { width } = Dimensions.get('window');

type ActionButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  sublabel?: string;
  onPress: () => void;
  primary?: boolean;
};

function ActionButton({ icon, label, sublabel, onPress, primary }: ActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, primary && styles.actionBtnPrimary]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, primary && styles.actionIconPrimary]}>
        <Ionicons name={icon} size={22} color={primary ? COLORS.white : COLORS.primary} />
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionLabel, primary && styles.actionLabelPrimary]}>{label}</Text>
        {sublabel && (
          <Text style={[styles.actionSublabel, primary && styles.actionSublabelPrimary]}>
            {sublabel}
          </Text>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={primary ? 'rgba(255,255,255,0.6)' : COLORS.textLight}
      />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const photos = usePhotosStore((s) => s.photos);
  const posts = useFeedStore((s) => s.posts);
  const inboxCount = photos.filter((p) => p.status === 'inbox').length;
  const readyCount = photos.filter((p) => p.status === 'pronto').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={GRADIENTS.dark} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Olá, Karen ✨</Text>
              <Text style={styles.subGreeting}>{CONFIG.APP_NAME} — sua assistente de conteúdo</Text>
            </View>
            <TouchableOpacity
              style={styles.amiButton}
              onPress={() => router.push('/chat')}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.amiGradient}>
                <Text style={styles.amiEmoji}>🤖</Text>
              </LinearGradient>
              <View style={styles.amiDot} />
            </TouchableOpacity>
          </View>

          {/* Stats bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{inboxCount}</Text>
              <Text style={styles.statLabel}>na inbox</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{readyCount}</Text>
              <Text style={styles.statLabel}>prontos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>no feed</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Next post card */}
        {posts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próxima publicação</Text>
            <View style={styles.nextPostCard}>
              <View style={styles.nextPostInfo}>
                <Text style={styles.nextPostStatus}>🟢 Pronto para publicar</Text>
                <Text style={styles.nextPostCaption} numberOfLines={2}>
                  {posts[0]?.caption || 'Sem legenda ainda'}
                </Text>
                <Text style={styles.nextPostDate}>
                  {posts[0]?.scheduledDate ?? 'Sem data agendada'}
                </Text>
              </View>
              <View style={styles.nextPostActions}>
                <TouchableOpacity style={styles.approveBtn}>
                  <Text style={styles.approveBtnText}>Aprovar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O que vamos fazer?</Text>

          <PhotoPickerButton />

          <ActionButton
            icon="grid"
            label="Organizar meu feed"
            sublabel="A Ami reorganiza tudo"
            onPress={() => router.push('/(tabs)/feed')}
          />
          <ActionButton
            icon="calendar"
            label="Planejar minha semana"
            sublabel="Calendário inteligente"
            onPress={() => router.push('/(tabs)/calendar')}
          />
          <ActionButton
            icon="albums"
            label="Ver minha inbox"
            sublabel={inboxCount > 0 ? `${inboxCount} itens esperando` : 'Vazio por enquanto'}
            onPress={() => router.push('/(tabs)/inbox')}
          />
          <ActionButton
            icon="chatbubble-ellipses"
            label="Perguntar para a Ami"
            sublabel="Chat com sua assistente"
            onPress={() => router.push('/chat')}
            primary
          />
        </View>

        {/* Lazy buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atalhos rápidos</Text>
          <View style={styles.lazyGrid}>
            {LAZY_BUTTONS.map((btn) => (
              <TouchableOpacity
                key={btn.label}
                style={styles.lazyBtn}
                activeOpacity={0.7}
                onPress={() => router.push('/chat')}
              >
                <Text style={styles.lazyEmoji}>{btn.emoji}</Text>
                <Text style={styles.lazyLabel}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const LAZY_BUTTONS = [
  { emoji: '✨', label: 'Resolve pra mim' },
  { emoji: '🔄', label: 'Não gostei, refaz' },
  { emoji: '🗓️', label: 'Organizar o mês' },
  { emoji: '⚡', label: 'Post de emergência' },
  { emoji: '⏱️', label: 'Só 5 minutos' },
  { emoji: '✈️', label: 'Sumir uma semana' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },

  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  amiButton: { position: 'relative' },
  amiGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amiEmoji: { fontSize: 22 },
  amiDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.tabBar,
  },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },

  nextPostCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  nextPostInfo: { marginBottom: 12 },
  nextPostStatus: { fontSize: 12, color: COLORS.success, fontWeight: '600', marginBottom: 6 },
  nextPostCaption: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  nextPostDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  nextPostActions: { flexDirection: 'row', gap: 8 },
  approveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  editBtn: {
    flex: 1,
    backgroundColor: COLORS.borderLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 14 },

  actionBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  actionLabelPrimary: { color: COLORS.white },
  actionSublabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  actionSublabelPrimary: { color: 'rgba(255,255,255,0.7)' },

  lazyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  lazyBtn: {
    width: (width - 60) / 3,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  lazyEmoji: { fontSize: 22, marginBottom: 6 },
  lazyLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
});
