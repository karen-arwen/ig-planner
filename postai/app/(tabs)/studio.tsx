import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStudioStore } from '@/store/studioStore';
import { sendMessageWithActions } from '@/services/ami';
import { COLORS, GRADIENTS } from '@/constants/colors';
import type { Design, DesignSlide } from '@/types';

const { width: W } = Dimensions.get('window');
const GRID_COLS = 2;
const GRID_GAP = 12;
const SLIDE_W = (W - 32 - GRID_GAP) / GRID_COLS;
const SLIDE_H = SLIDE_W * 1.35;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexAlpha(hex: string, alpha: number) {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return hex.replace(/^(#[0-9a-fA-F]{6}).*$/, `$1${a}`);
}

// ─── Slide card ───────────────────────────────────────────────────────────────

function SlideCard({
  slide,
  index = 0,
  width = SLIDE_W,
  height = SLIDE_H,
  onPress,
}: {
  slide: DesignSlide;
  index?: number;
  width?: number;
  height?: number;
  onPress?: () => void;
}) {
  const hasBg2 = !!slide.bg2;
  const content = (
    <SlideContent slide={slide} index={index} width={width} height={height} />
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
      style={[styles.slideBase, { width, height, borderRadius: 16, overflow: 'hidden' }]}
    >
      {hasBg2 ? (
        <LinearGradient
          colors={[slide.bg, slide.bg2!]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={{ flex: 1, backgroundColor: slide.bg }}>
          {content}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Slide content renderer ───────────────────────────────────────────────────

function SlideContent({
  slide,
  index,
  width,
  height,
}: {
  slide: DesignSlide;
  index: number;
  width: number;
  height: number;
}) {
  // Scale all sizes relative to the design base (380px wide)
  const s = Math.min(width / 380, height / 512);
  const pad = Math.max(16, 20 * s);
  const layout = slide.layout;

  // ── TITLE / COVER slide ──────────────────────────────────────────────────
  if (layout === 'title') {
    return (
      <View style={{ flex: 1, padding: pad }}>
        {/* Top decoration */}
        <View style={styles.row}>
          <Text style={{ color: hexAlpha(slide.accentColor, 0.5), fontSize: 11 * s }}>✦ ✦ ✦</Text>
        </View>

        {/* Center content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
          {slide.emoji ? (
            <Text style={{ fontSize: 36 * s, marginBottom: 12 * s }}>{slide.emoji}</Text>
          ) : null}
          <Text
            style={{
              fontSize: 24 * s,
              fontWeight: '900',
              color: slide.textColor,
              lineHeight: 30 * s,
              letterSpacing: -0.5,
            }}
          >
            {slide.headline}
          </Text>
          <View
            style={{
              width: 40 * s,
              height: 3 * s,
              backgroundColor: slide.accentColor,
              borderRadius: 2,
              marginTop: 14 * s,
              marginBottom: 10 * s,
            }}
          />
          {slide.subtext ? (
            <Text
              style={{
                fontSize: 11 * s,
                color: hexAlpha(slide.textColor, 0.7),
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {slide.subtext}
            </Text>
          ) : null}
        </View>

        {/* Bottom corner */}
        <View style={[styles.row, { justifyContent: 'flex-end' }]}>
          <Text style={{ color: hexAlpha(slide.accentColor, 0.4), fontSize: 9 * s }}>✧</Text>
        </View>
      </View>
    );
  }

  // ── CENTER slide ─────────────────────────────────────────────────────────
  if (layout === 'center') {
    return (
      <View style={{ flex: 1, padding: pad, justifyContent: 'center', alignItems: 'center' }}>
        {/* Decorative top */}
        <Text style={{ color: hexAlpha(slide.accentColor, 0.5), fontSize: 12 * s, marginBottom: 10 * s }}>
          ✦
        </Text>

        {slide.emoji ? (
          <Text style={{ fontSize: 40 * s, marginBottom: 14 * s }}>{slide.emoji}</Text>
        ) : null}

        <Text
          style={{
            fontSize: 20 * s,
            fontWeight: '800',
            color: slide.textColor,
            textAlign: 'center',
            lineHeight: 26 * s,
          }}
        >
          {slide.headline}
        </Text>

        <View
          style={{
            width: 36 * s,
            height: 2.5 * s,
            backgroundColor: slide.accentColor,
            borderRadius: 2,
            marginTop: 14 * s,
            marginBottom: 10 * s,
          }}
        />

        {slide.subtext ? (
          <Text
            style={{
              fontSize: 11 * s,
              color: hexAlpha(slide.textColor, 0.65),
              textAlign: 'center',
              lineHeight: 16 * s,
            }}
          >
            {slide.subtext}
          </Text>
        ) : null}

        <Text style={{ color: hexAlpha(slide.accentColor, 0.35), fontSize: 11 * s, marginTop: 14 * s }}>
          ✦
        </Text>
      </View>
    );
  }

  // ── SPLIT slide (numbered) ────────────────────────────────────────────────
  if (layout === 'split') {
    const numLabel = slide.headline.match(/^(\d+)/)?.[1];
    const title = numLabel
      ? slide.headline.replace(/^\d+[\.\):\s]*/, '').trim()
      : slide.headline;
    const displayNum = numLabel ?? String(index).padStart(2, '0');

    return (
      <View style={{ flex: 1, padding: pad }}>
        {/* Number anchor */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 * s }}>
          <Text
            style={{
              fontSize: 42 * s,
              fontWeight: '900',
              color: slide.accentColor,
              lineHeight: 48 * s,
              letterSpacing: -2,
            }}
          >
            {displayNum}
          </Text>
        </View>

        {/* Divider */}
        <View
          style={{
            width: '100%',
            height: 1 * s,
            backgroundColor: hexAlpha(slide.accentColor, 0.2),
            marginVertical: 12 * s,
          }}
        />

        {/* Content */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {title ? (
            <Text
              style={{
                fontSize: 17 * s,
                fontWeight: '800',
                color: slide.textColor,
                lineHeight: 22 * s,
                marginBottom: 10 * s,
              }}
            >
              {title}
            </Text>
          ) : null}
          {slide.subtext ? (
            <Text
              style={{
                fontSize: 12 * s,
                color: hexAlpha(slide.textColor, 0.7),
                lineHeight: 18 * s,
              }}
            >
              {slide.subtext}
            </Text>
          ) : null}
        </View>

        {/* Bottom accent */}
        <View
          style={{
            width: 28 * s,
            height: 3 * s,
            backgroundColor: slide.accentColor,
            borderRadius: 2,
            marginTop: 12 * s,
          }}
        />
      </View>
    );
  }

  // ── QUOTE slide ───────────────────────────────────────────────────────────
  if (layout === 'quote') {
    return (
      <View style={{ flex: 1, padding: pad, justifyContent: 'center', alignItems: 'center' }}>
        {/* Large quote mark */}
        <Text
          style={{
            fontSize: 72 * s,
            color: hexAlpha(slide.accentColor, 0.35),
            lineHeight: 64 * s,
            fontWeight: '900',
            marginBottom: 4 * s,
          }}
        >
          "
        </Text>

        <Text
          style={{
            fontSize: 16 * s,
            fontWeight: '700',
            color: slide.textColor,
            textAlign: 'center',
            lineHeight: 22 * s,
            fontStyle: 'italic',
          }}
        >
          {slide.headline}
        </Text>

        <View
          style={{
            width: 32 * s,
            height: 2 * s,
            backgroundColor: slide.accentColor,
            borderRadius: 2,
            marginTop: 16 * s,
            marginBottom: 10 * s,
          }}
        />

        {slide.subtext ? (
          <Text
            style={{
              fontSize: 10 * s,
              color: hexAlpha(slide.textColor, 0.6),
              textAlign: 'center',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {slide.subtext}
          </Text>
        ) : null}
      </View>
    );
  }

  // ── TOP / BOTTOM (default fallback) ──────────────────────────────────────
  const isBottom = layout === 'bottom';
  return (
    <View
      style={{
        flex: 1,
        padding: pad,
        justifyContent: isBottom ? 'flex-end' : 'flex-start',
      }}
    >
      {slide.emoji ? (
        <Text style={{ fontSize: 28 * s, marginBottom: 8 * s }}>{slide.emoji}</Text>
      ) : null}
      <Text
        style={{
          fontSize: 19 * s,
          fontWeight: '800',
          color: slide.textColor,
          lineHeight: 25 * s,
          marginBottom: 8 * s,
        }}
      >
        {slide.headline}
      </Text>
      {slide.subtext ? (
        <Text style={{ fontSize: 11 * s, color: hexAlpha(slide.textColor, 0.7), lineHeight: 16 * s }}>
          {slide.subtext}
        </Text>
      ) : null}
      <View
        style={{
          width: 28 * s,
          height: 3 * s,
          backgroundColor: slide.accentColor,
          borderRadius: 2,
          marginTop: 12 * s,
        }}
      />
    </View>
  );
}

// ─── Design card (grid) ───────────────────────────────────────────────────────

function DesignCard({ design, onPress }: { design: Design; onPress: () => void }) {
  const firstSlide = design.slides[0];
  if (!firstSlide) return null;
  return (
    <TouchableOpacity style={styles.designCard} onPress={onPress} activeOpacity={0.8}>
      <SlideCard slide={firstSlide} index={0} width={SLIDE_W} height={SLIDE_H} />
      <View style={{ marginTop: 8 }}>
        <Text style={styles.designCardTitle} numberOfLines={1}>{design.title}</Text>
        <Text style={styles.designCardSub}>{design.slides.length} slides · {design.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Template definitions ─────────────────────────────────────────────────────

const TEMPLATES: Array<{ name: string; icon: string; slides: Omit<DesignSlide, 'id'>[] }> = [
  {
    name: 'Editorial Dark',
    icon: '🖤',
    slides: [
      { layout: 'title', bg: '#0F0A1E', bg2: '#1E1B4B', headline: 'título do carrossel', subtext: 'arrasta →', emoji: '✦', textColor: '#fff', accentColor: '#A78BFA' },
      { layout: 'split', bg: '#fff', headline: '01', subtext: 'Descrição do primeiro ponto. Seja específica e gere curiosidade.', textColor: '#0F0A1E', accentColor: '#7C3AED' },
      { layout: 'split', bg: '#F5F3FF', headline: '02', subtext: 'Segundo ponto do carrossel com mais detalhes e valor.', textColor: '#0F0A1E', accentColor: '#7C3AED' },
      { layout: 'split', bg: '#fff', headline: '03', subtext: 'Terceiro ponto. Cada slide = uma ideia clara.', textColor: '#0F0A1E', accentColor: '#7C3AED' },
      { layout: 'quote', bg: '#7C3AED', headline: 'frase de impacto que gera compartilhamento.', subtext: 'salva antes de sumir 🔖', textColor: '#fff', accentColor: '#F9A8D4' },
    ],
  },
  {
    name: 'Rosa Soft',
    icon: '🌸',
    slides: [
      { layout: 'title', bg: '#FDF2F8', headline: 'título principal aqui', subtext: 'swipe →', emoji: '🌸', textColor: '#831843', accentColor: '#EC4899' },
      { layout: 'split', bg: '#fff', headline: '01', subtext: 'Conteúdo do primeiro slide. Algo útil, honesto e que ressoa.', textColor: '#1C1917', accentColor: '#EC4899' },
      { layout: 'split', bg: '#FDF2F8', headline: '02', subtext: 'Segundo ponto. Mantenha o ritmo e a consistência visual.', textColor: '#1C1917', accentColor: '#EC4899' },
      { layout: 'quote', bg: '#EC4899', headline: 'uma frase bonita que representa você.', textColor: '#fff', accentColor: '#FDF2F8' },
    ],
  },
  {
    name: 'Creme Editorial',
    icon: '☕',
    slides: [
      { layout: 'center', bg: '#FAF7F2', headline: 'título centrado e elegante', emoji: '✿', textColor: '#1C1917', accentColor: '#92400E' },
      { layout: 'split', bg: '#fff', headline: '01', subtext: 'Conteúdo com tom editorial. Menos é mais.', textColor: '#1C1917', accentColor: '#92400E' },
      { layout: 'split', bg: '#FAF7F2', headline: '02', subtext: 'Segunda ideia. Mantenha a paleta consistente.', textColor: '#1C1917', accentColor: '#92400E' },
      { layout: 'quote', bg: '#1C1917', headline: 'a frase final que fica na memória.', textColor: '#FAF7F2', accentColor: '#D4A86A' },
    ],
  },
  {
    name: 'Dark Academia',
    icon: '📚',
    slides: [
      { layout: 'title', bg: '#1C1917', bg2: '#292524', headline: 'título misterioso e envolvente', emoji: '📜', textColor: '#F5F0EB', accentColor: '#D4A86A' },
      { layout: 'split', bg: '#F5F0EB', headline: '01', subtext: 'Conteúdo com tom intelectual. Referências, reflexões, profundidade.', textColor: '#1C1917', accentColor: '#92400E' },
      { layout: 'split', bg: '#FAF7F2', headline: '02', subtext: 'Mais conteúdo de qualidade. A estética dark academia atrai quem lê de verdade.', textColor: '#1C1917', accentColor: '#92400E' },
      { layout: 'quote', bg: '#1C1917', headline: 'a citação perfeita que encerra o carrossel.', textColor: '#F5F0EB', accentColor: '#D4A86A' },
    ],
  },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StudioScreen() {
  const router = useRouter();
  const { designs, addDesign, removeDesign } = useStudioStore();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  function createFromTemplate(template: typeof TEMPLATES[0]) {
    const design: Design = {
      id: `design_${Date.now()}`,
      title: template.name,
      slides: template.slides.map((s, i) => ({ ...s, id: `s${i}` })),
      createdAt: new Date().toISOString(),
      status: 'rascunho',
    };
    addDesign(design);
    setSelectedDesign(design);
  }

  async function handleGenerateWithAmi() {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const { reply, actions } = await sendMessageWithActions(
        [
          {
            id: 'gen',
            role: 'user',
            content: `Cria um carrossel para Instagram sobre: "${aiPrompt.trim()}". Use 4-6 slides com conteúdo RICO e ESPECÍFICO em português. Slide 1 com layout "title" impactante, slides do meio com layout "split" e número grande (01, 02...), último slide com layout "quote" com frase de impacto. Escolha uma paleta de cores premium e consistente.`,
            timestamp: new Date().toISOString(),
          },
        ],
        { userName: 'Karen' }
      );

      const designAction = actions.find((a) => a.type === 'CREATE_DESIGN');
      if (designAction && designAction.type === 'CREATE_DESIGN') {
        const design: Design = {
          id: `design_${Date.now()}`,
          title: aiPrompt.trim().slice(0, 45),
          slides: designAction.slides,
          createdAt: new Date().toISOString(),
          status: 'rascunho',
        };
        addDesign(design);
        setSelectedDesign(design);
        setAiPrompt('');
      } else {
        Alert.alert('Ami respondeu', reply);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Erro', msg);
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Design viewer ──
  if (selectedDesign) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.viewerHeader}>
          <TouchableOpacity onPress={() => setSelectedDesign(null)} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.viewerTitle} numberOfLines={1}>{selectedDesign.title}</Text>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              Alert.alert('Deletar design?', 'Essa ação não pode ser desfeita.', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Deletar', style: 'destructive', onPress: () => { removeDesign(selectedDesign.id); setSelectedDesign(null); } },
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
        >
          {selectedDesign.slides.map((slide, i) => (
            <View key={slide.id} style={styles.viewerSlideWrap}>
              <Text style={styles.pageIndicator}>{i + 1} / {selectedDesign.slides.length}</Text>
              <SlideCard
                slide={slide}
                index={i + 1}
                width={W - 32}
                height={(W - 32) * 1.35}
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.viewerFooter}>
          <Text style={styles.viewerFooterText}>← arrasta para ver todos os slides →</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main list view ──
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <LinearGradient colors={GRADIENTS.hero} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.headerTitle}>Studio</Text>
          <Text style={styles.headerSub}>Carrosseis e designs para o Instagram</Text>
        </LinearGradient>

        {/* Ami generator */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>✦ Criar com a Ami</Text>
          <View style={styles.amiCard}>
            <TextInput
              style={styles.amiInput}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder="Sobre o que é o carrossel? Ex: 5 hábitos de manhã, look do dia, dicas de pele..."
              placeholderTextColor={COLORS.textLight}
              multiline
            />
            <TouchableOpacity
              style={[styles.amiBtn, (!aiPrompt.trim() || isGenerating) && { opacity: 0.45 }]}
              onPress={handleGenerateWithAmi}
              disabled={!aiPrompt.trim() || isGenerating}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.amiBtnInner}>
                {isGenerating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="sparkles" size={16} color="#fff" />
                )}
                <Text style={styles.amiBtnText}>
                  {isGenerating ? 'Gerando...' : 'Gerar carrossel'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Templates prontos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.name}
                onPress={() => createFromTemplate(t)}
                activeOpacity={0.8}
                style={styles.templateCard}
              >
                <SlideCard
                  slide={{ ...t.slides[0], id: 'preview' } as DesignSlide}
                  index={0}
                  width={130}
                  height={175}
                />
                <Text style={styles.templateName}>{t.icon} {t.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* My designs */}
        {designs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Meus designs · {designs.length}</Text>
            <View style={styles.grid}>
              {designs.map((d) => (
                <DesignCard key={d.id} design={d} onPress={() => setSelectedDesign(d)} />
              ))}
            </View>
          </View>
        )}

        {designs.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎨</Text>
            <Text style={styles.emptyTitle}>Studio vazio</Text>
            <Text style={styles.emptySub}>Peça para a Ami criar ou escolha um template acima</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 48 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },

  // Ami card
  amiCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  amiInput: { fontSize: 14, color: COLORS.text, minHeight: 56, marginBottom: 14 },
  amiBtn: { borderRadius: 14, overflow: 'hidden' },
  amiBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  amiBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Templates
  templateCard: { alignItems: 'center', gap: 8 },
  templateName: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  designCard: { width: SLIDE_W },
  designCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  designCardSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },

  // Slide base
  slideBase: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },

  // Viewer
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: 12,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  viewerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: COLORS.text },

  viewerSlideWrap: {
    width: W,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 10,
  },
  pageIndicator: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1 },

  viewerFooter: { padding: 16, alignItems: 'center' },
  viewerFooterText: { fontSize: 12, color: COLORS.textLight },
});
