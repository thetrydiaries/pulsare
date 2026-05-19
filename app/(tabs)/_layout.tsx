import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';
import { View, StyleSheet, Platform } from 'react-native';
import Text from '@/components/ui/Text';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Text
        variant="label"
        color={focused ? Colors.tealText : Colors.textTertiary}
        size={11}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 0.5,
          borderTopColor: Colors.border,
          height: Platform.select({ web: 52, default: 64 }),
          paddingBottom: Platform.select({ web: 4, default: 12 }),
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="today" focused={focused} />,
          tabBarAccessibilityLabel: 'Today',
        }}
      />
      <Tabs.Screen
        name="galaxy"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="galaxy" focused={focused} />,
          tabBarAccessibilityLabel: 'Galaxy',
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="learn" focused={focused} />,
          tabBarAccessibilityLabel: 'Learn',
        }}
      />
      {/* Profile is accessed via the settings icon on the home screen, not the tab bar */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
});
