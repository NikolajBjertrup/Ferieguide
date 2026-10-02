import { StatusBar } from 'expo-status-bar';
import { Text, View, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ButtonComponent from '../components/ButtonComponent';
import { GlobalStyle } from '../styles/GlobalStyle';

// Gæst: viser én side med topbillede, titel og sidens blokke (tekst og billeder).
// `route.params.pageId` kommer fra navigation.navigate('Page', { pageId }) i GuideScreen.
export default function PageScreen({ navigation, route, pages }) {
  const { pageId } = route.params;

  // Vi sendte kun id'et med, så vi finder selv siden i den aktuelle state
  const page = pages.find((p) => p.id === pageId);

  return (
    <View style={GlobalStyle.pageContainer}>
      <ScrollView contentContainerStyle={GlobalStyle.pageScroll}>
        <Image source={page.image} style={GlobalStyle.pageImage} resizeMode="cover" />

        <View style={GlobalStyle.pageTitleRow}>
          <Ionicons name={page.icon} size={32} color={GlobalStyle.colors.accent} />
          <Text style={GlobalStyle.pageTitle}>{page.title}</Text>
        </View>

        {/* Sidens blokke vises i rækkefølge: tekst som tekst, billeder som billeder.
            Vi bruger map() og ikke FlatList, fordi vi allerede er inde i en ScrollView. */}
        {page.blocks.map((block) =>
          block.type === 'text' ? (
            <Text key={block.id} style={GlobalStyle.pageBody}>
              {block.text}
            </Text>
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
