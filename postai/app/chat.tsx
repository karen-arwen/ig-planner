import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatStore } from '@/store/chatStore';
import { usePhotosStore } from '@/store/photosStore';
import { useFeedStore } from '@/store/feedStore';
import { useStudioStore } from '@/store/studioStore';
import type { Design } from '@/types';
import { sendMessageWithActions, loadVisionPhotos } from '@/services/ami';
import { COLORS, GRADIENTS } from '@/constants/colors';
import type { AmiActionType, ChatMessage } from '@/types';

const QUICK_REPLIES = [
  'Organiza meu feed',
  'Escreve legendas',
  'Resolve pra mim',
  'Planeja minha semana',
  'Post de emergência',
];

function describeAction(action: AmiActionType): string {
  switch (action.type) {
    case 'REORGANIZE_FEED':
      return `✨ Feed reorganizado (${action.order.length} fotos)`;
    case 'SET_CAPTION':
      return `✍️ Legenda salva`;
    case 'SET_STATUS':
      return `✓ Status → ${action.status}`;
    case 'MOVE_TO_FEED':
      return `📌 ${action.photoIds.length} foto(s) movidas`;
    case 'SCHEDULE_POST':
      return `🗓️ Agendado para ${action.date}`;
    case 'CREATE_DESIGN':
      return '🎨 Design criado no Studio';
    default:
      return '✓ Ação executada';
  }
}

function ActionChip({ label }: { label: string }) {
  return (
    <View style={styles.actionChip}>
      <Text style={styles.actionChipText}>{label}</Text>
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAmi = message.role === 'assistant';
  return (
    <View style={[styles.bubbleWrap, isAmi ? styles.bubbleLeft : styles.bubbleRight]}>
      {isAmi && (
        <LinearGradient colors={GRADIENTS.primary} style={styles.amiAvatar}>
          <Ionicons name="sparkles" size={12} color="#fff" />
        </LinearGradient>
      )}
      <View style={styles.bubbleCol}>
        <View style={[styles.bubble, isAmi ? styles.bubbleAmi : styles.bubbleUser]}>
          <Text style={[styles.bubbleText, isAmi ? styles.textAmi : styles.textUser]}>
            {message.content}
          </Text>
          <Text style={[styles.bubbleTime, isAmi && styles.bubbleTimeAmi]}>
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {isAmi && message.executedActions && message.executedActions.length > 0 && (
          <View style={styles.chips}>
            {message.executedActions.map((label, i) => (
              <ActionChip key={i} label={label} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const { messages, isLoading, addMessage, setLoading } = useChatStore();
  const photos = usePhotosStore((s) => s.photos);
  const { updatePhoto, reorderPhotos } = usePhotosStore();
  const posts = useFeedStore((s) => s.posts);
  const addDesign = useStudioStore((s) => s.addDesign);

  // Whether to attach photo images for vision (toggle per message)
  const [visionEnabled, setVisionEnabled] = useState(true);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMsg);
    setInput('');
    setLoading(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const allMessages = [...messages, userMsg];

      // Load actual images for Ami to see (inbox photos, up to 8)
      let visionPhotos: Awaited<ReturnType<typeof loadVisionPhotos>> = [];
      if (visionEnabled && photos.length > 0) {
        const inboxPhotos = photos.filter((p) => p.status === 'inbox' || p.status === 'pronto');
        visionPhotos = await loadVisionPhotos(inboxPhotos.slice(0, 8));
      }

      const { reply, actions } = await sendMessageWithActions(allMessages, {
        photos,
        feedSize: posts.length,
        userName: 'Karen',
        visionPhotos,
      });

      const executedLabels: string[] = [];
      for (const action of actions) {
        try {
          if (action.type === 'CREATE_DESIGN') {
            const design: Design = {
              id: `design_${Date.now()}`,
              title: 'Design da Ami',
              slides: action.slides,
              createdAt: new Date().toISOString(),
              status: 'rascunho',
            };
            addDesign(design);
            executedLabels.push('🎨 Design criado no Studio');
          } else {
            executeAction(action, updatePhoto, reorderPhotos);
            executedLabels.push(describeAction(action));
          }
        } catch (e) {
          console.warn('[Chat] Action failed:', action.type, e);
        }
      }

      addMessage({
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        executedActions: executedLabels,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[Chat] Ami error:', msg);
      addMessage({
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: 'Ops, tive um probleminha de conexão 😅 Verifica o .env e tenta de novo.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.hero} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.headerName}>Ami</Text>
            <Text style={styles.headerStatus}>
              {isLoading ? '✦ trabalhando...' : '● online'}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing indicator */}
        {isLoading && (
          <View style={styles.typing}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.typingAvatar}>
              <Ionicons name="sparkles" size={10} color="#fff" />
            </LinearGradient>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.typingText}>Ami está pensando...</Text>
            </View>
          </View>
        )}

        {/* Quick replies (only when few messages) */}
        {messages.length <= 1 && (
          <FlatList
            horizontal
            data={QUICK_REPLIES}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => sendMessage(item)}
              >
                <Text style={styles.quickChipText}>{item}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChipList}
            style={{ flexGrow: 0 }}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          {/* Vision toggle */}
          <TouchableOpacity
            style={[styles.visionBtn, visionEnabled && styles.visionBtnOn]}
            onPress={() => setVisionEnabled((v) => !v)}
          >
            <Ionicons
              name="eye"
              size={18}
              color={visionEnabled ? COLORS.primary : COLORS.textLight}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Manda mensagem para a Ami..."
            placeholderTextColor={COLORS.textLight}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <LinearGradient
              colors={input.trim() ? GRADIENTS.primary : ['#E5E7EB', '#E5E7EB']}
              style={styles.sendBtnInner}
            >
              <Ionicons
                name="send"
                size={17}
                color={input.trim() ? '#fff' : COLORS.textLight}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function executeAction(
  action: AmiActionType,
  updatePhoto: (id: string, updates: any) => void,
  reorderPhotos: (orderedIds: string[]) => void
) {
  switch (action.type) {
    case 'REORGANIZE_FEED':
      reorderPhotos(action.order);
      break;
    case 'SET_CAPTION':
      updatePhoto(action.photoId, {
        caption: action.caption,
        hashtags: action.hashtags,
        status: 'pronto' as const,
      });
      break;
    case 'SET_STATUS':
      updatePhoto(action.photoId, { status: action.status });
      break;
    case 'MOVE_TO_FEED':
      for (const id of action.photoIds) {
        updatePhoto(id, { status: 'pronto' as const });
      }
      break;
    case 'SCHEDULE_POST':
      updatePhoto(action.photoId, {
        scheduledDate: action.date,
        status: 'agendado' as const,
      });
      break;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  headerStatus: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 },

  msgList: { padding: 16, paddingBottom: 8 },

  bubbleWrap: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleCol: { flexDirection: 'column', maxWidth: '78%', gap: 6 },

  amiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  bubble: { borderRadius: 18, padding: 12 },
  bubbleAmi: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleUser: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  textAmi: { color: COLORS.text },
  textUser: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: COLORS.textLight, marginTop: 4, textAlign: 'right' },
  bubbleTimeAmi: { textAlign: 'left' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionChip: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  actionChipText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },

  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  typingText: { fontSize: 13, color: COLORS.textMuted },

  quickChipList: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  quickChip: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  quickChipText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  visionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  visionBtnOn: {
    backgroundColor: COLORS.primaryContainer,
  },
  sendBtn: { flexShrink: 0 },
  sendBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
