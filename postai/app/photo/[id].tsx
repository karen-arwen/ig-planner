import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePhotosStore } from '@/store/photosStore';
import { generateCaption } from '@/services/ami';
import { COLORS, GRADIENTS } from '@/constants/colors';

export default function PhotoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { photos, updatePhoto, removePhoto } = usePhotosStore();
  const [generatingCaption, setGeneratingCaption] = useState(false);

  const photo = photos.find((p) => p.id === id);

  if (!photo) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Foto não encontrada</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  async function handleGenerateCaption() {
    if (!photo) return;
    setGeneratingCaption(true);
    try {
      const result = await generateCaption(
        photo.analysisNote ?? '',
        photo.category
      );
      updatePhoto(photo.id, {
        caption: result.caption,
        hashtags: result.hashtags,
        status: 'pronto',
      });
      Alert.alert('✅ Legenda criada!', result.caption);
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar a legenda. Verifique sua chave da API.');
    } finally {
      setGeneratingCaption(false);
    }
  }

  function handleDelete() {
    Alert.alert('Remover foto', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          removePhoto(photo.id);
          router.back();
        },
      },
    ]);
  }

  const STATUS_NEXT: Record<string, string> = {
    inbox: 'pronto',
    pronto: 'agendado',
    agendado: 'publicado',
    publicado: 'arquivo',
    arquivo: 'inbox',
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Foto</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
          <Ionicons name="trash-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <Image
          source={{ uri: photo.uri }}
          style={styles.photo}
          resizeMode="cover"
        />

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{photo.category}</Text>
            </View>
            <View style={[styles.badge, styles.badgeQuality]}>
              <Text style={styles.badgeText}>Qualidade: {photo.quality}</Text>
            </View>
          </View>

          {photo.analysisNote && (
            <Text style={styles.note}>💡 {photo.analysisNote}</Text>
          )}

          {/* Status */}
          <TouchableOpacity
            style={styles.statusRow}
            onPress={() =>
              updatePhoto(photo.id, {
                status: STATUS_NEXT[photo.status] as typeof photo.status,
              })
            }
          >
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{photo.status}</Text>
              <Ionicons name="swap-horizontal" size={14} color={COLORS.primary} />
            </View>
          </TouchableOpacity>

          {/* Caption */}
          {photo.caption ? (
            <View style={styles.captionBox}>
              <Text style={styles.captionLabel}>Legenda</Text>
              <Text style={styles.caption}>{photo.caption}</Text>
              {photo.hashtags?.length ? (
                <Text style={styles.hashtags}>{photo.hashtags.join(' ')}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, generatingCaption && styles.actionBtnDisabled]}
            onPress={handleGenerateCaption}
            disabled={generatingCaption}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.actionBtnGrad}>
              {generatingCaption ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>
                    {photo.caption ? 'Refazer legenda' : 'Gerar legenda com IA'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push(`/editor/${photo.id}` as any)}
          >
            <Ionicons name="color-palette-outline" size={18} color={COLORS.primary} />
            <Text style={styles.secondaryBtnText}>Editar foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/chat')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.primary} />
            <Text style={styles.secondaryBtnText}>Pedir para a Ami</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  photo: { width: '100%', height: 400 },

  infoSection: { padding: 20 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeQuality: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  note: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, marginBottom: 16 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusLabel: { fontSize: 14, color: COLORS.textMuted },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  captionBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  captionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6 },
  caption: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  hashtags: { fontSize: 12, color: COLORS.primary, marginTop: 8 },

  actions: { padding: 20, gap: 10 },
  actionBtn: { borderRadius: 14, overflow: 'hidden' },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  actionBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    paddingVertical: 14,
  },
  secondaryBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: COLORS.textMuted },
  backLink: { color: COLORS.primary, marginTop: 12, fontWeight: '600' },
});
