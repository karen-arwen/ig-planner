import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePhotosStore } from '@/store/photosStore';
import { useFeedStore } from '@/store/feedStore';
import { sendMessageWithActions } from '@/services/ami';
import { COLORS, GRADIENTS } from '@/constants/colors';
import type { Photo } from '@/types';

const { width } = Dimensions.get('window');
const CELL = (width - 3) / 3; // 3 cols, 1px gaps

const CATEGORY_EMOJI: Record<string, string> = {
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

function PhotoCell({ photo, index }: { photo: Photo; index: number }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.cell}
      onPress={() => router.push(`/photo/${photo.id}`)}
      activeOpacity={0.88}
    >
      <Image source={{ uri: photo.uri }} style={styles.cellImage} />

      {/* Position number */}
      <View style={styles.cellNumBg}>
        <Text style={styles.cellNum}>{index + 1}</Text>
      </View>

      {/* Status dot */}
      {photo.status === 'pronto' && <View style={styles.readyDot} />}
      {photo.status === 'agendado' && <View style={[styles.readyDot, styles.scheduledDot]} />}

      {/* Category emoji */}
      {photo.category !== 'outro' && (
        <Text style={styles.cellEmoji}>{CATEGORY_EMOJI[photo.category] ?? '📷'}</Text>
      )}
    </TouchableOpacity>
  );
}

function EmptyFeed({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🖼️</Text>
      <Text style={styles.emptyTitle}>Feed ainda vazio</Text>
      <Text style={styles.emptyText}>
        Adicione fotos na tela Início para montar seu feed do Instagram.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onAdd}>
        <LinearGradient colors={GRADIENTS.primary} style={styles.emptyBtnGradient}>
          <Ionicons name="images" size={16} color="#fff" />
          <Text style={styles.emptyBtnText}>Adicionar fotos</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const photos = usePhotosStore((s) => s.photos);
  const reorderPhotos = usePhotosStore((s) => s.reorderPhotos);
  const updatePhoto = usePhotosStore((s) => s.updatePhoto);
  const { posts, isOrganizing, setOrganizing } = useFeedStore();

  const feedPhotos = photos.filter(
    (p) => p.status === 'inbox' || p.status === 'pronto' || p.status === 'agendado'
  );

  const readyCount = feedPhotos.filter((p) => p.status === 'pronto').length;

  async function handleOrganize() {
    if (feedPhotos.length === 0) {
      Alert.alert('Feed vazio', 'Adicione fotos primeiro na tela Início.');
      return;
    }
    setOrganizing(true);
    try {
      const { reply, actions } = await sendMessageWithActions(
        [
          {
            id: 'org_req',
            role: 'user',
            content:
              'Reorganize todas as fotos do feed na melhor ordem para o Instagram, intercalando categorias e cores. Liste todos os IDs na nova ordem.',
            timestamp: new Date().toISOString(),
          },
        ],
        { photos: feedPhotos, userName: 'Karen' }
      );

      let didReorganize = false;
      for (const action of actions) {
        if (action.type === 'REORGANIZE_FEED') {
          reorderPhotos(action.order);
          didReorganize = true;
        } else if (action.type === 'SET_CAPTION') {
          updatePhoto(action.photoId, {
            caption: action.caption,
            hashtags: action.hashtags,
          });
        }
      }

      Alert.alert(
        didReorganize ? '✨ Feed organizado!' : '💬 Ami respondeu',
        reply
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Feed] Organizar com IA:', msg);
      Alert.alert('Erro na Ami', msg.slice(0, 400));
    } finally {
      setOrganizing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.hero} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Meu Feed</Text>
            <Text style={styles.headerSub}>
              {feedPhotos.length} foto{feedPhotos.length !== 1 ? 's' : ''}
              {readyCount > 0 ? ` · ${readyCount} prontas` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.chatFab}
            onPress={() => router.push('/chat')}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {feedPhotos.length === 0 ? (
        <EmptyFeed onAdd={() => router.push('/(tabs)')} />
      ) : (
        <>
          {/* Instagram grid preview */}
          <FlatList
            data={feedPhotos}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item, index }) => <PhotoCell photo={item} index={index} />}
            ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
            columnWrapperStyle={{ gap: 1.5 }}
            contentContainerStyle={{ gap: 0 }}
            showsVerticalScrollIndicator={false}
          />

          {/* Bottom action bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.organizeBtn}
              onPress={handleOrganize}
              disabled={isOrganizing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                style={styles.organizeBtnInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isOrganizing ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.organizeBtnText}>Ami organizando...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.organizeBtnText}>Organizar com Ami</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  chatFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cell: {
    width: CELL,
    height: CELL,
    position: 'relative',
    backgroundColor: COLORS.borderLight,
  },
  cellImage: { width: '100%', height: '100%' },
  cellNumBg: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  cellNum: { color: '#fff', fontSize: 10, fontWeight: '700' },
  readyDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  scheduledDot: { backgroundColor: COLORS.primary },
  cellEmoji: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    fontSize: 13,
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
  emptyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  bottomBar: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  organizeBtn: { borderRadius: 16, overflow: 'hidden' },
  organizeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  organizeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
