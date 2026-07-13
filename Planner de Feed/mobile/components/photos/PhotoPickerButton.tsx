import { Alert, TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { usePhotosStore } from '@/store/photosStore';
import { analyzePhoto } from '@/services/ami';
import { COLORS } from '@/constants/colors';
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        // Converte para base64 para análise
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;
        if (apiKey) {
          analysis = await analyzePhoto(base64);
        }
      } catch {
        // Sem API key ou erro: usa defaults
      }

      analyzed.push({
        id: `photo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        uri: asset.uri,
        width: asset.width ?? 1080,
        height: asset.height ?? 1080,
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
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        {isAnalyzing ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="images" size={22} color={COLORS.primary} />
        )}
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>
          {isAnalyzing ? 'Analisando fotos...' : 'Adicionar fotos'}
        </Text>
        <Text style={styles.sublabel}>
          {isAnalyzing ? 'A Ami está classificando' : 'Da galeria do celular'}
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
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
  },
  btnDisabled: { opacity: 0.7 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  sublabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
