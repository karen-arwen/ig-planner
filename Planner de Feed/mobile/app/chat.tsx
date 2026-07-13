import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatStore } from '@/store/chatStore';
import { usePhotosStore } from '@/store/photosStore';
import { useFeedStore } from '@/store/feedStore';
import { sendMessageToAmi } from '@/services/ami';
import { COLORS, GRADIENTS } from '@/constants/colors';
import type { ChatMessage } from '@/types';

const QUICK_REPLIES = [
  'Organiza meu feed',
  'Escreve uma legenda',
  'Cria um carrossel',
  'Planeja minha semana',
  'Resolve pra mim',
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAmi = message.role === 'assistant';
  return (
    <View style={[styles.bubbleWrap, isAmi ? styles.bubbleWrapLeft : styles.bubbleWrapRight]}>
      {isAmi && (
        <LinearGradient colors={GRADIENTS.primary} style={styles.amiAvatar}>
          <Text style={styles.amiAvatarText}>A</Text>
        </LinearGradient>
      )}
      <View style={[styles.bubble, isAmi ? styles.bubbleAmi : styles.bubbleUser]}>
        <Text style={[styles.bubbleText, isAmi ? styles.bubbleTextAmi : styles.bubbleTextUser]}>
          {message.content}
        </Text>
        <Text style={[styles.bubbleTime, isAmi && styles.bubbleTimeAmi]}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
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
  const posts = useFeedStore((s) => s.posts);

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
      const reply = await sendMessageToAmi(allMessages, {
        photos,
        feedSize: posts.length,
        userName: 'Karen',
      });

      const amiMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      addMessage(amiMsg);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content:
          'Ops, tive um problema de conexão. 😅 Verifique sua chave da API no .env e tente de novo.',
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMsg);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.dark} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <LinearGradient colors={GRADIENTS.primary} style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>A</Text>
          </LinearGradient>
          <View>
            <Text style={styles.headerName}>Ami</Text>
            <Text style={styles.headerStatus}>
              {isLoading ? 'digitando...' : 'online'}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.typingIndicator}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.typingAvatar}>
              <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>A</Text>
            </LinearGradient>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.typingText}>Ami está pensando...</Text>
            </View>
          </View>
        )}

        {/* Quick replies */}
        {messages.length <= 1 && (
          <View style={styles.quickRepliesWrap}>
            <FlatList
              horizontal
              data={QUICK_REPLIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.quickReply}
                  onPress={() => sendMessage(item)}
                >
                  <Text style={styles.quickReplyText}>{item}</Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRepliesList}
            />
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Fale com a Ami..."
            placeholderTextColor={COLORS.textLight}
            multiline
            maxLength={1000}
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <LinearGradient
              colors={input.trim() ? GRADIENTS.primary : ['#E5E7EB', '#E5E7EB']}
              style={styles.sendBtnGradient}
            >
              <Ionicons
                name="send"
                size={18}
                color={input.trim() ? COLORS.white : COLORS.textLight}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  headerName: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  headerStatus: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  keyboardView: { flex: 1 },

  messagesList: { padding: 16, paddingBottom: 8 },

  bubbleWrap: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleWrapLeft: { justifyContent: 'flex-start' },
  bubbleWrapRight: { justifyContent: 'flex-end' },

  amiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  amiAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },

  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    padding: 12,
  },
  bubbleAmi: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextAmi: { color: COLORS.text },
  bubbleTextUser: { color: COLORS.white },
  bubbleTime: { fontSize: 10, color: COLORS.textLight, marginTop: 4, textAlign: 'right' },
  bubbleTimeAmi: { textAlign: 'left' },

  typingIndicator: {
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
  },
  typingText: { fontSize: 13, color: COLORS.textMuted },

  quickRepliesWrap: { paddingVertical: 8 },
  quickRepliesList: { paddingHorizontal: 16, gap: 8 },
  quickReply: {
    backgroundColor: '#EDE9FE',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  quickReplyText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

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
  sendBtn: { flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
