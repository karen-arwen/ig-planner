import { Alert, TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePhotosStore, persistPhotoUri } from '@/store/photosStore';
import { analyzePhoto } from '@/services/ami';
import { COLORS, GRADIENTS } from '@/constants/colors';
import type { Photo, PhotoCategory, PhotoQuality } from '@/types';

export default function PhotoPickerButton() {
  const { addPhotos, setAnalyzing, isAnalyzing } = usePhotosStore();

  async function pickPhotos() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permissão necessária',
        'Precisamos acessar sua galeria para importar fotos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],  // replaces deprecated MediaTypeOptions.Images
      allowsMultipleSelection: true,
      quality: 0.8,
      exif: false,
    });

    if (result.canceled || !result.assets.length) return;

    setAnalyzing(true);

    const analyzed: Photo[] = [];

    for (const asset of result.assets) {
      let analysis = { category: 'outro', quality: 'boa', colors: [] as string[], note: '' };

      try {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;
        if (apiKey) {
          analysis = await analyzePhoto(base64);
        }
      } catch {
        // Without API key or on error: use defaults
      }

      const photoId = `photo_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      // Copy to Documents so the file survives app restarts
      const stableUri = await persistPhotoUri(asset.uri, photoId);

      analyzed.push({
        id: photoId,
        uri: stableUri,
        width: asset.width ?? 1080,
        height: asset.height ?? 1080,
        editedUri: undefined,
        category: analysis.category as PhotoCategory,
        quality: analysis.quality as PhotoQuality,
        status: 'inbox',
        colors: analysis.colors,
        analysisNote: analysis.note,
        createdAt: new Date().toISOString(),
      });
    }

    addPhotos(analyzed);
    setAnalyzing(false);

    Alert.alert(
      '✅ Fotos importadas!',
      `${analyzed.length} foto${analyzed.length > 1 ? 's' : ''} adicionada${analyzed.length > 1 ? 's' : ''} à sua inbox.`
    );
  }

  return (
    <TouchableOpacity
      style={[styles.btn, isAnalyzing && styles.btnDisabled]}
      onPress={pickPhotos}
      disabled={isAnalyzing}
      activeOpacity={0.75}
    >
      <LinearGradient
        colors={isAnalyzing ? ['#E5E7EB', '#E5E7EB'] : GRADIENTS.soft}
        style={styles.iconWrap}
      >
        {isAnalyzing ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="images" size={22} color={COLORS.primary} />
        )}
      </LinearGradient>
      <View style={styles.textWrap}>
        <Text style={styles.label}>
          {isAnalyzing ? 'Analisando com Ami...' : 'Adicionar fotos'}
        </Text>
        <Text style={styles.sublabel}>
          {isAnalyzing ? 'Isso pode demorar um pouco' : 'Da galeria do celular · Ami analisa'}
        </Text>
      </View>
      {!isAnalyzing && (
        <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  btnDisabled: { opacity: 0.65 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textWrap: { flex: 1 },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  sublabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
