import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Skia for real-time filter preview
import {
  Canvas,
  Image as SkiaImage,
  ColorMatrix,
  useImage,
  makeImageFromEncoded,
} from '@shopify/react-native-skia';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

import { usePhotosStore } from '@/store/photosStore';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { buildColorMatrix, FILTER_PRESETS, FilterPreset, DEFAULT_EDITS } from '@/constants/filters';
import { applyAIEdit } from '@/services/imageAI';
import type { PhotoEdits } from '@/types';

const { width: W, height: SCREEN_H } = Dimensions.get('window');
const CANVAS_H = SCREEN_H * 0.52;

type EditorTab = 'filtros' | 'ajustar' | 'texto' | 'ia';

// ─── Slider component ─────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackW = W - 64;

  return (
    <View style={slStyles.row}>
      <Text style={slStyles.label}>{label}</Text>
      <View style={slStyles.trackWrap}>
        <View style={slStyles.track}>
          <View style={[slStyles.fill, { width: `${pct}%` }]} />
        </View>
        {/* Touch area for dragging */}
        <View
          style={slStyles.hitArea}
          onTouchStart={(e) => {
            const x = e.nativeEvent.locationX;
            const ratio = Math.max(0, Math.min(1, x / trackW));
            const raw = min + ratio * (max - min);
            const snapped = Math.round(raw / step) * step;
            onChange(Math.max(min, Math.min(max, snapped)));
          }}
          onTouchMove={(e) => {
            const x = e.nativeEvent.locationX;
            const ratio = Math.max(0, Math.min(1, x / trackW));
            const raw = min + ratio * (max - min);
            const snapped = Math.round(raw / step) * step;
            onChange(Math.max(min, Math.min(max, snapped)));
          }}
        />
      </View>
      <Text style={slStyles.value}>
        {formatValue ? formatValue(value) : Math.round(value * 100)}
      </Text>
    </View>
  );
}

const slStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  label: { width: 90, fontSize: 13, fontWeight: '600', color: COLORS.text },
  trackWrap: { flex: 1, position: 'relative', height: 28, justifyContent: 'center' },
  hitArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  track: {
    height: 4,
    backgroundColor: COLORS.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  value: { width: 38, fontSize: 12, color: COLORS.textMuted, textAlign: 'right' },
});

// ─── Main editor ──────────────────────────────────────────────────────────────

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const photo = usePhotosStore((s) => s.photos.find((p) => p.id === id));
  const updatePhoto = usePhotosStore((s) => s.updatePhoto);

  const initialEdits: PhotoEdits = photo?.edits ?? { ...DEFAULT_EDITS };
  const [brightness, setBrightness] = useState(initialEdits.brightness);
  const [contrast, setContrast] = useState(initialEdits.contrast);
  const [saturation, setSaturation] = useState(initialEdits.saturation);
  const [filterName, setFilterName] = useState(initialEdits.filterName);
  const [overlayText, setOverlayText] = useState(initialEdits.textOverlay?.text ?? '');
  const [overlayColor, setOverlayColor] = useState(initialEdits.textOverlay?.color ?? '#FFFFFF');

  const [activeTab, setActiveTab] = useState<EditorTab>('filtros');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiModalVisible, setAiModalVisible] = useState(false);

  const sourceUri = photo?.editedUri ?? photo?.uri ?? '';
  const skiaImage = useImage(sourceUri);
  const colorMatrix = buildColorMatrix(brightness, contrast, saturation);

  // ── Apply filter preset ──
  const applyFilter = useCallback((preset: FilterPreset) => {
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setFilterName(preset.name);
  }, []);

  // ── Save edited photo ──
  async function handleSave() {
    if (!photo) return;
    setIsSaving(true);
    try {
      // Use expo-image-manipulator for actual pixel export with adjustments
      // (Skia makeImageSnapshot could be used here too)
      const actions: ImageManipulator.Action[] = [];

      // For now save with resize to ensure quality
      const result = await ImageManipulator.manipulateAsync(
        sourceUri,
        actions,
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Store edits as metadata + the result URI
      updatePhoto(photo.id, {
        editedUri: result.uri,
        edits: {
          brightness,
          contrast,
          saturation,
          filterName,
          textOverlay: overlayText
            ? { text: overlayText, x: 0.5, y: 0.85, size: 18, color: overlayColor }
            : undefined,
        },
      });

      Alert.alert('✅ Salvo!', 'Edição salva com sucesso.');
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Erro', msg);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Reset ──
  function handleReset() {
    setBrightness(0);
    setContrast(1);
    setSaturation(1);
    setFilterName('Normal');
    setOverlayText('');
  }

  // ── AI edit ──
  async function handleAiEdit() {
    if (!photo || !aiPrompt.trim()) return;
    setIsAiEditing(true);
    setAiModalVisible(false);
    try {
      const { localUri } = await applyAIEdit({
        photoId: photo.id,
        localUri: sourceUri,
        prompt: aiPrompt.trim(),
        strength: 0.65,
      });
      updatePhoto(photo.id, { editedUri: localUri });
      Alert.alert('✨ Edição com IA aplicada!', 'A foto foi editada. Você pode ajustar ainda mais com os filtros.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Erro na IA', msg);
    } finally {
      setIsAiEditing(false);
      setAiPrompt('');
    }
  }

  if (!photo) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 20, color: COLORS.text }}>Foto não encontrada.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Editor</Text>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.topBtn} onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Canvas with live filter ── */}
      <View style={styles.canvasWrap}>
        {skiaImage ? (
          <Canvas style={{ width: W, height: CANVAS_H }}>
            <SkiaImage
              image={skiaImage}
              x={0}
              y={0}
              width={W}
              height={CANVAS_H}
              fit="contain"
            >
              <ColorMatrix matrix={colorMatrix} />
            </SkiaImage>
          </Canvas>
        ) : (
          <View style={[styles.canvasWrap, { alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        )}

        {/* Text overlay preview */}
        {overlayText.length > 0 && (
          <View style={styles.textOverlayWrap}>
            <Text style={[styles.textOverlay, { color: overlayColor }]}>{overlayText}</Text>
          </View>
        )}

        {/* AI loading overlay */}
        {isAiEditing && (
          <View style={styles.aiLoadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.aiLoadingText}>Ami está editando com IA...</Text>
          </View>
        )}
      </View>

      {/* ── Bottom panel ── */}
      <View style={styles.panel}>
        {/* Tab selector */}
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, activeTab === t.id && styles.tabActive]}
              onPress={() => setActiveTab(t.id as EditorTab)}
            >
              <Ionicons
                name={t.icon as any}
                size={18}
                color={activeTab === t.id ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'filtros' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTER_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.name}
                  style={[styles.filterChip, filterName === preset.name && styles.filterChipActive]}
                  onPress={() => applyFilter(preset)}
                >
                  {/* Mini preview using just color accent */}
                  <View style={[styles.filterThumb, { backgroundColor: getFilterColor(preset) }]} />
                  <Text style={[styles.filterLabel, filterName === preset.name && styles.filterLabelActive]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {activeTab === 'ajustar' && (
            <View style={styles.adjustPanel}>
              <Slider
                label="Brilho"
                value={brightness}
                min={-1}
                max={1}
                onChange={setBrightness}
                formatValue={(v) => (v >= 0 ? `+${Math.round(v * 100)}` : `${Math.round(v * 100)}`)}
              />
              <Slider
                label="Contraste"
                value={contrast}
                min={0}
                max={2}
                onChange={setContrast}
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />
              <Slider
                label="Saturação"
                value={saturation}
                min={0}
                max={2}
                onChange={setSaturation}
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />
            </View>
          )}

          {activeTab === 'texto' && (
            <View style={styles.textPanel}>
              <TextInput
                style={styles.textInput}
                value={overlayText}
                onChangeText={setOverlayText}
                placeholder="Digite um texto sobre a foto..."
                placeholderTextColor={COLORS.textLight}
                multiline
                maxLength={120}
              />
              <Text style={styles.textPanelLabel}>Cor do texto</Text>
              <View style={styles.colorRow}>
                {TEXT_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, overlayColor === c && styles.colorDotActive]}
                    onPress={() => setOverlayColor(c)}
                  />
                ))}
              </View>
            </View>
          )}

          {activeTab === 'ia' && (
            <View style={styles.aiPanel}>
              <Text style={styles.aiTitle}>Editar com Inteligência Artificial</Text>
              <Text style={styles.aiDesc}>
                Descreva o estilo que quer aplicar. A IA vai recriar a foto com essa estética.
              </Text>
              <View style={styles.aiExamples}>
                {AI_PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={styles.aiExampleChip}
                    onPress={() => setAiPrompt(p)}
                  >
                    <Text style={styles.aiExampleText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.aiInput}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder="Ex: fantasia de acotar, cores vibrantes, iluminação dramática..."
                placeholderTextColor={COLORS.textLight}
                multiline
              />
              <TouchableOpacity
                style={[styles.aiBtn, (!aiPrompt.trim() || isAiEditing) && styles.aiBtnDisabled]}
                onPress={handleAiEdit}
                disabled={!aiPrompt.trim() || isAiEditing}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.aiBtnInner}>
                  {isAiEditing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="sparkles" size={18} color="#fff" />
                  )}
                  <Text style={styles.aiBtnText}>
                    {isAiEditing ? 'Editando...' : 'Aplicar edição com IA'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.aiNote}>
                Requer chave fal.ai no .env · Plano gratuito disponível em fal.ai
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFilterColor(preset: FilterPreset): string {
  const s = Math.min(255, Math.round((preset.saturation / 2) * 180 + 40));
  const b = Math.min(255, Math.round((preset.brightness + 1) / 2 * 255));
  if (preset.name === 'P&B') return '#888888';
  if (preset.name === 'Neon') return '#9900FF';
  if (preset.name === 'Drama') return '#1A1A2E';
  if (preset.name === 'Vintage') return '#D4AA70';
  if (preset.name === 'Quente') return '#FF7F50';
  if (preset.name === 'Frio') return '#4682B4';
  return `hsl(${s}, 60%, ${b > 128 ? 70 : 45}%)`;
}

const TABS = [
  { id: 'filtros', label: 'Filtros', icon: 'color-wand' },
  { id: 'ajustar', label: 'Ajustar', icon: 'options' },
  { id: 'texto', label: 'Texto', icon: 'text' },
  { id: 'ia', label: 'IA', icon: 'sparkles' },
];

const TEXT_COLORS = ['#FFFFFF', '#000000', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'];

const AI_PROMPTS = [
  'fantasia de acotar',
  'estética y2k vibrante',
  'foto de revista de moda',
  'iluminação cinematográfica',
  'cores de anime japonês',
  'editorial minimalista',
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#000',
  },
  topBtn: { padding: 8 },
  topTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetText: { fontSize: 13, color: COLORS.textMuted },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  canvasWrap: {
    width: W,
    height: CANVAS_H,
    backgroundColor: '#111',
    position: 'relative',
  },
  textOverlayWrap: {
    position: 'absolute',
    bottom: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  textOverlay: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  aiLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  aiLoadingText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  panel: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 4,
  },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 3,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  tabLabelActive: { color: COLORS.primary, fontWeight: '700' },

  tabContent: { flex: 1 },

  // Filters tab
  filterRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  filterChip: {
    alignItems: 'center',
    gap: 6,
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterChipActive: { borderColor: COLORS.primary },
  filterThumb: { width: 58, height: 58, borderRadius: 10 },
  filterLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  filterLabelActive: { color: COLORS.primary, fontWeight: '700' },

  // Adjust tab
  adjustPanel: { padding: 20 },

  // Text tab
  textPanel: { padding: 20 },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 80,
    marginBottom: 16,
  },
  textPanelLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 10 },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: COLORS.primary, transform: [{ scale: 1.15 }] },

  // AI tab
  aiPanel: { padding: 20 },
  aiTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  aiDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 16 },
  aiExamples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  aiExampleChip: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#333',
  },
  aiExampleText: { color: COLORS.primaryLight, fontSize: 12, fontWeight: '500' },
  aiInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    minHeight: 70,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  aiBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  aiBtnDisabled: { opacity: 0.5 },
  aiBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  aiBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  aiNote: { fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 16 },
});
