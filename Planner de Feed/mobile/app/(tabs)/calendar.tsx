import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { COLORS, GRADIENTS } from '@/constants/colors';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Posts de exemplo (futuramente vem do feedStore)
const EXAMPLE_POSTS = [
  { date: new Date(), label: 'Carrossel livros', type: 'pessoal' },
  { date: addMonths(new Date(), 0), label: 'Look do dia', type: 'look' },
];

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function CalendarScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = getDay(monthStart);

  const postsOnDate = (date: Date) =>
    EXAMPLE_POSTS.filter((p) => isSameDay(p.date, date));

  const selectedPosts = selectedDate ? postsOnDate(selectedDate) : [];

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={GRADIENTS.dark} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Weekday headers */}
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {Array.from({ length: startOffset }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {days.map((day) => {
            const dayPosts = postsOnDate(day);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const todayDay = isToday(day);
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  todayDay && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                    todayDay && !isSelected && styles.dayNumberToday,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                {dayPosts.length > 0 && (
                  <View style={styles.dotRow}>
                    {dayPosts.slice(0, 3).map((_, i) => (
                      <View key={i} style={[styles.dot, isSelected && styles.dotSelected]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected day posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedDate
              ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
              : 'Selecione um dia'}
          </Text>
          {selectedPosts.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>Nenhum post agendado</Text>
              <TouchableOpacity
                style={styles.addPostBtn}
                onPress={() => router.push('/chat')}
              >
                <Ionicons name="add" size={16} color={COLORS.primary} />
                <Text style={styles.addPostBtnText}>Agendar com a Ami</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedPosts.map((post, i) => (
              <View key={i} style={styles.postCard}>
                <View style={[styles.postDot, { backgroundColor: COLORS.primary }]} />
                <View>
                  <Text style={styles.postLabel}>{post.label}</Text>
                  <Text style={styles.postType}>{post.type}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Plan with AI */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.planBtn}
            onPress={() => router.push('/chat')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={GRADIENTS.primary} style={styles.planBtnGradient}>
              <Ionicons name="sparkles" size={18} color={COLORS.white} />
              <Text style={styles.planBtnText}>Planejar o mês com a Ami</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    textTransform: 'capitalize',
  },

  content: { paddingBottom: 40 },

  weekdaysRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    marginBottom: 4,
  },
  dayCellSelected: { backgroundColor: COLORS.primary },
  dayCellToday: { borderWidth: 1.5, borderColor: COLORS.primary },
  dayNumber: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  dayNumberSelected: { color: COLORS.white, fontWeight: '700' },
  dayNumberToday: { color: COLORS.primary, fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.secondary },
  dotSelected: { backgroundColor: COLORS.white },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textTransform: 'capitalize',
  },

  emptyDay: { alignItems: 'center', paddingVertical: 20 },
  emptyDayText: { color: COLORS.textMuted, fontSize: 14, marginBottom: 12 },
  addPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addPostBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },

  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  postDot: { width: 10, height: 10, borderRadius: 5 },
  postLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  postType: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  planBtn: { borderRadius: 14, overflow: 'hidden' },
  planBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  planBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
