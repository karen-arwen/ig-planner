import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePhotosStore } from '@/store/photosStore';
import { COLORS, GRADIENTS } from '@/constants/colors';
import type { Photo, PhotoStatus } from '@/types';

const STATUS_CONFIG: Record<PhotoStatus, { label: string; color: string; emoji: string }> = {
  inbox: { label: 'Na inbox', color: COLORS.warning, emoji: '📥' },
  pronto: { label: 'Pronto', color: COLORS.success, emoji: '✅' },
  agendado: { label: 'Agendado', color: COLORS.primary, emoji: '🗓️' },
  publicado: { label: 'Publicado', color: COLORS.textMuted, emoji: '✓' },
  arquivo: { label: 'Arquivo', color: COLORS.textLight, emoji: '📁' },
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

function PhotoItem({ photo, onPress }: { photo: Photo; onPress: () => void }) {
  const statusCfg = STATUS_CONFIG[photo.status];
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemCategory}>
            {CATEGORY_LABELS[photo.category] ?? 'Outro'}
          </Text>
          <View style={[styles.statusBadge, { borderColor: statusCfg.color }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.emoji} {statusCfg.label}
            </Text>
          </View>
        </View>
        {photo.analysisNote && (
          <Text style={styles.itemNote} numberOfLines={2}>
            {photo.analysisNote}
          </Text>
        )}
        {photo.caption && (
          <Text style={styles.itemCaption} numberOfLines={1}>
            "{photo.caption}"
          </Text>
        )}
        <View style={styles.qualityRow}>
          <View style={[styles.qualityDot, { backgroundColor: QUALITY_COLOR[photo.quality] }]} />
          <Text style={styles.qualityText}>
            Qualidade: {photo.quality}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

export default function InboxScreen() {
  const router = useRouter();
  const photos = usePhotosStore((s) => s.photos);

  const grouped = {
    inbox: photos.filter((p) => p.status === 'inbox'),
    pronto: photos.filter((p) => p.status === 'pronto'),
    agendado: photos.filter((p) => p.status === 'agendado'),
  };

  const allActive = [
    ...grouped.inbox,
    ...grouped.pronto,
    ...grouped.agendado,
  ];

  if (allActive.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={GRADIENTS.dark} style={styles.header}>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Text style={styles.headerSub}>Tudo que você jogou aqui</Text>
        </LinearGradient>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📥</Text>
          <Text style={styles.emptyTitle}>Inbox vazia</Text>
          <Text style={styles.emptyText}>
            Adicione fotos na tela Início e elas aparecem aqui para a Ami organizar.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.emptyBtnText}>Ir para o Início</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={GRADIENTS.dark} style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <Text style={styles.headerSub}>{allActive.length} itens</Text>
      </LinearGradient>

      {/* Summary chips */}
      <View style={styles.chips}>
        {Object.entries(grouped).map(([status, items]) =>
          items.length > 0 ? (
            <View key={status} style={styles.chip}>
              <Text style={styles.chipText}>
                {STATUS_CONFIG[status as PhotoStatus].emoji} {items.length}{' '}
                {STATUS_CONFIG[status as PhotoStatus].label}
              </Text>
            </View>
          ) : null
        )}
      </View>

      <FlatList
        data={allActive}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PhotoItem
            photo={item}
            onPress={() => router.push(`/photo/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom: Organize all */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.organizeBtn}
          onPress={() => router.push('/chat')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            style={styles.organizeBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="sparkles" size={18} color={COLORS.white} />
            <Text style={styles.organizeBtnText}>Organizar tudo com a Ami</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const QUALITY_COLOR: Record<string, string> = {
  otima: COLORS.success,
  boa: '#3B82F6',
  regular: COLORS.warning,
  ruim: COLORS.error,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  chips: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  list: { paddingHorizontal: 16, paddingBottom: 16 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: COLORS.borderLight,
  },
  itemInfo: { flex: 1 },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemCategory: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  itemNote: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  itemCaption: { fontSize: 12, color: COLORS.text, fontStyle: 'italic', marginBottom: 4 },
  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qualityDot: { width: 6, height: 6, borderRadius: 3 },
  qualityText: { fontSize: 11, color: COLORS.textMuted },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },

  bottomBar: { padding: 16, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
  organizeBtn: { borderRadius: 14, overflow: 'hidden' },
  organizeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  organizeBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
