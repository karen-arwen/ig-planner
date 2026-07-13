import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';

// This tab just redirects to the chat modal
export default function AmiTab() {
  const router = useRouter();

  useEffect(() => {
    // Small delay so the tab animation can complete
    const t = setTimeout(() => {
      router.push('/chat');
    }, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} />
    </View>
  );
}
