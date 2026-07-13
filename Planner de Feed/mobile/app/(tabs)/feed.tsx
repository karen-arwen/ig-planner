import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePhotosStore } from '@/store/photosStore';
import { useFeedStore } from '@/store/feedStore';
import { COLORS, GRADIENTS } from '@/constants/colors';
import type { Photo } from '@/types';

const { width } = Dimensions.get('window');
const CELL = (width - 4) / 3;

function EmptyFeed({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📸</Text>
      <Text style={styles.emptyTitle}>Feed vazio por enquanto</Text>
      <Text style={styles.emptyText}>
        Adicione fotos na tela Início para começar a montar seu feed.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <Text style={styles.emptyBtnText}>Adicionar fotos</Text>
      </TouchableOpacity>
    </View>
  );
}

function PhotoCell({ photo, index }: { photo: Photo; index: number }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.cell}
      onPress={() => router.push(`/photo/${photo.id}`)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: photo.uri }} style={styles.cellImage} />
      <View style={styles.cellOverlay}>
        <Text style={styles.cellIndex}>{index + 1}</Text>
        {photo.status === 'pronto' && (
          <View style={styles.cellBadge}>
            <Text style={styles.cellBadgeText}>✓</Text>
          </View>
        )}
      </View>
      {photo.category !== 'outro' && (
        <View style={styles.cellCategory}>
          <Text style={styles.cellCategoryText}>{CATEGORY_EMOJI[photo.category] ?? '📷'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const photos = usePhotosStore((s) => s.photos);
  const { posts, isOrganizing, setOrganizing } = useFeedStore();

  // Mostra fotos inbox + prontas no grid
  const feedPhotos = photos.filter(
    (p) => p.status === 'inbox' || p.status === 'pronto' || p.status === 'agendado'
  );

  async function handleOrganizeByAI() {
    if (feedPhotos.length === 0) {
      Alert.alert('Inbox vazia', 'Adicione fotos primeiro na tela Início.');
      return;
    }
    setOrganizing(true);
    // Abre o chat para a Ami reorganizar
    setTimeout(() => {
      setOrganizing(false);
      router.push('/chat');
    }, 500);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.dark} style={styles.header}>
        <Text style={styles.headerTitle}>Meu Feed</Text>
        <Text style={styles.headerSub}>
          {feedPhotos.length} foto{feedPhotos.length !== 1 ? 's' : ''}
        </Text>
      </LinearGradient>

      {feedPhotos.length === 0 ? (
        <EmptyFeed onAdd={() => router.push('/(tabs)')} />
      ) : (
        <>
          <FlatList
            data={feedPhotos}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item, index }) => (
              <PhotoCell photo={item} index={index} />
            )}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />

          {/* Bottom actions */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.organizeBtn}
              onPress={handleOrganizeByAI}
              disabled={isOrganizing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                style={styles.organizeBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isOrganizing ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color={COLORS.white} />
                    <Text style={styles.organizeBtnText}>Organizar com IA</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => router.push('/chat')}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const CATEGORY_EMOJI: Partial<Record<string, string>> = {
  selfie: '🤳',
  look: '👗',
  produto: '📦',
  viagem: '✈️',
  evento: '🎉',
  comida: '🍽️',
  maquiagem: '💄',
  livro: '📚',
  setup: '💻',
  patrocinado: '💼',
  pessoal: '💜',
  bastidores: '🎬',
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

  grid: { paddingTop: 2 },
  row: { gap: 2 },

  cell: {
    width: CELL,
    height: CELL,
    position: 'relative',
  },
  cellImage: { width: '100%', height: '100%' },
  cellOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cellIndex: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cellBadge: {
    backgroundColor: COLORS.success,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  cellCategory: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  cellCategoryText: { fontSize: 14 },

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

  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  organizeBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  organizeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  organizeBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  chatBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
