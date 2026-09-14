import { StatusBar } from 'expo-status-bar';
import { Text, View, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlobalStyle } from '../styles/GlobalStyle';

// Gæst: oversigt over de aktive sider som kort i to kolonner.
// `pages` kommer som prop fra App.js, `navigation` fra Stack.Screen.
export default function GuideScreen({ navigation, pages }) {
  // Gæsten må kun se sider, udlejeren har slået til
  const activePages = pages.filter((page) => page.active);

  return (
    <View style={GlobalStyle.guideContainer}>
      <FlatList
        data={activePages}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={GlobalStyle.guideRow}
        contentContainerStyle={GlobalStyle.guideList}
        ListEmptyComponent={
          <Text style={GlobalStyle.guideEmpty}>
            Der er ingen sider i guiden endnu. Udlejeren kan slå sider til under indstillinger.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [GlobalStyle.guideCard, pressed && GlobalStyle.guideCardPressed]}
            onPress={() => navigation.navigate('Page', { pageId: item.id })}
          >
            <View style={GlobalStyle.guideIconCircle}>
              <Ionicons name={item.icon} size={36} color={GlobalStyle.colors.accent} />
            </View>
            <Text style={GlobalStyle.guideCardTitle}>{item.title}</Text>
          </Pressable>
        )}
      />
      <StatusBar style="dark" />
    </View>
  );
}
