import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePhotosStore } from '@/store/photosStore';
import { COLORS, GRADIENTS } from '@/constants/colors';
import type { Photo, PhotoStatus } from '@/types';

const STATUS_CONFIG: Record<PhotoStatus, { label: string; color: string; bg: string; emoji: string }> = {
  inbox: { label: 'Inbox', color: COLORS.warning, bg: '#FEF3C7', emoji: '📥' },
  pronto: { label: 'Pronto', color: COLORS.success, bg: '#D1FAE5', emoji: '✅' },
  agendado: { label: 'Agendado', color: COLORS.primary, bg: COLORS.primaryContainer, emoji: '🗓️' },
  publicado: { label: 'Publicado', color: COLORS.textMuted, bg: COLORS.borderLight, emoji: '✓' },
  arquivo: { label: 'Arquivo', color: COLORS.textLight, bg: COLORS.borderLight, emoji: '📁' },
};

const QUALITY_COLOR: Record<string, string> = {
  otima: COLORS.success,
  boa: '#3B82F6',
  regular: COLORS.warning,
  ruim: COLORS.error,
};

const CATEGORY_LABELS: Record<string, string> = {
  selfie: 'Selfie',
  look: 'Look',
  produto: 'Produto',
  viagem: 'Viagem',
  evento: 'Evento',
  comida: 'Comida',
  maquiagem: 'Maquiagem',
  livro: 'Livro',
  setup: 'Setup',
  patrocinado: 'Patrocinado',
  pessoal: 'Pessoal',
  bastidores: 'Bastidores',
  outro: 'Outro',
};

function PhotoCard({ photo, onPress }: { photo: Photo; onPress: () => void }) {
  const cfg = STATUS_CONFIG[photo.status];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <Image source={{ uri: photo.uri }} style={styles.cardThumb} />
      <View style={styles.cardBody}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <Text style={styles.cardCategory}>
            {CATEGORY_LABELS[photo.category] ?? 'Foto'}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusPillText, { color: cfg.color }]}>
              {cfg.emoji} {cfg.label}
            </Text>
          </View>
        </View>

        {/* Caption or note */}
        {photo.caption ? (
          <Text style={styles.cardCaption} numberOfLines={2}>
            "{photo.caption}"
          </Text>
        ) : photo.analysisNote ? (
          <Text style={styles.cardNote} numberOfLines={2}>
            {photo.analysisNote}
          </Text>
        ) : null}

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          <View style={[styles.qualityDot, { backgroundColor: QUALITY_COLOR[photo.quality] ?? COLORS.textLight }]} />
          <Text style={styles.qualityText}>{photo.quality}</Text>
          {photo.hashtags && photo.hashtags.length > 0 && (
            <Text style={styles.cardHashtags} numberOfLines={1}>
              {photo.hashtags.slice(0, 3).join(' ')}
            </Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ alignSelf: 'center' }} />
    </TouchableOpacity>
  );
}

export default function InboxScreen() {
  const router = useRouter();
  const photos = usePhotosStore((s) => s.photos);

  const inbox = photos.filter((p) => p.status === 'inbox');
  const pronto = photos.filter((p) => p.status === 'pronto');
  const agendado = photos.filter((p) => p.status === 'agendado');
  const allActive = [...inbox, ...pronto, ...agendado];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.hero} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <Text style={styles.headerSub}>
          {allActive.length > 0
            ? `${allActive.length} foto${allActive.length !== 1 ? 's' : ''} esperando`
            : 'Tudo organizado ✨'}
        </Text>
      </LinearGradient>

      {/* Status chips */}
      {allActive.length > 0 && (
        <View style={styles.chips}>
          {[
            { key: 'inbox', count: inbox.length },
            { key: 'pronto', count: pronto.length },
            { key: 'agendado', count: agendado.length },
          ]
            .filter((x) => x.count > 0)
            .map((x) => {
              const cfg = STATUS_CONFIG[x.key as PhotoStatus];
              return (
                <View key={x.key} style={[styles.chip, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.chipText, { color: cfg.color }]}>
                    {cfg.emoji} {x.count} {cfg.label}
                  </Text>
                </View>
              );
            })}
        </View>
      )}

      {allActive.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📥</Text>
          <Text style={styles.emptyTitle}>Inbox vazia!</Text>
          <Text style={styles.emptyText}>
            Adicione fotos na tela Início — elas aparecem aqui para a Ami organizar.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)')}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.emptyBtnGradient}>
              <Text style={styles.emptyBtnText}>Ir para o Início</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={allActive}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PhotoCard
              photo={item}
              onPress={() => router.push(`/photo/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom bar */}
      {allActive.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.amiBtn}
            onPress={() => router.push('/chat')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              style={styles.amiBtnInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.amiBtnText}>Pedir para a Ami organizar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  list: { padding: 16, paddingTop: 12 },

  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginBottom: 10,
    padding: 12,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
    marginRight: 12,
    flexShrink: 0,
  },
  cardBody: { flex: 1, justifyContent: 'space-between' },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardCategory: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  statusPill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  cardCaption: {
    fontSize: 12,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: 4,
  },
  cardNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginBottom: 4,
  },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  qualityDot: { width: 7, height: 7, borderRadius: 4 },
  qualityText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  cardHashtags: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primary,
    marginLeft: 4,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  emptyBtn: { borderRadius: 16, overflow: 'hidden' },
  emptyBtnGradient: { paddingHorizontal: 28, paddingVertical: 14 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  bottomBar: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  amiBtn: { borderRadius: 16, overflow: 'hidden' },
  amiBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  amiBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
