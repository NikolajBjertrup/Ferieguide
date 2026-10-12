import { StatusBar } from 'expo-status-bar';
import { Text, View, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ButtonComponent from '../components/ButtonComponent';
import { GlobalStyle } from '../styles/GlobalStyle';

// Gæst: viser én side med titel og sidens blokke (tekst og billeder).
// Udlejeren styrer selv rækkefølgen – et billede kan sagtens ligge øverst.
// `route.params.pageId` kommer fra navigation.navigate('Page', { pageId }) i GuideScreen.
export default function PageScreen({ navigation, route, pages }) {
  const { pageId } = route.params;

  // Vi sendte kun id'et med, så vi finder selv siden i den aktuelle state
  const page = pages.find((p) => p.id === pageId);

  return (
    <View style={GlobalStyle.pageContainer}>
      <ScrollView contentContainerStyle={GlobalStyle.pageScroll}>
        <View style={GlobalStyle.pageTitleRow}>
          <Ionicons name={page.icon} size={32} color={GlobalStyle.colors.accent} />
          <Text style={GlobalStyle.pageTitle}>{page.title}</Text>
        </View>

        {/* Sidens blokke vises i rækkefølge: tekst som tekst, billeder som billeder.
            Vi bruger map() og ikke FlatList, fordi vi allerede er inde i en ScrollView. */}
        {page.blocks.map((block) =>
          block.type === 'text' ? (
            <View key={block.id} style={GlobalStyle.pageBlock}>
              {!!block.title && <Text style={GlobalStyle.pageBlockTitle}>{block.title}</Text>}
              <Text style={GlobalStyle.pageBody}>{block.text}</Text>
            </View>
          ) : (
            <Image
              key={block.id}
              source={{ uri: block.url }}
              style={GlobalStyle.pageBlockImage}
              resizeMode="cover"
            />
          )
        )}

        <View style={GlobalStyle.pageBackButton}>
          <ButtonComponent
            title="Tilbage til guiden"
            type="secondary"
            width={260}
            height={60}
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}
