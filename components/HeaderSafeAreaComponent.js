import { Platform } from 'react-native';
// Bevidst react-native-screens' egen SafeAreaView og ikke den fra react-native-safe-area-context:
// den fra safe-area-context måler fra appens yderste lag og kender kun statuslinjen, ikke
// topbjælken. Denne måler fra selve skærmen, hvor topbjælken er regnet med. Det er den samme,
// som React Navigation v7 bruger (ScreenStackItem). Den eksporteres ikke fra pakkens index,
// derfor den lange sti.
import { SafeAreaView } from 'react-native-screens/src/components/safe-area/SafeAreaView';

import { GlobalStyle } from '../styles/GlobalStyle';

// Fra iOS 26 lægger react-native-screens (Expo SDK 58) skærmen ind BAG topbjælken
// og forventer, at navigationen selv skubber indholdet ned. Det gør React Navigation v7,
// men ikke v6, som vi bruger – derfor dækkede topbjælken toppen af alle skærme.
// Under iOS 26 og på Android placerer systemet allerede skærmen under bjælken,
// så her returneres indholdet uændret.
// Kan fjernes, når appen opgraderes til React Navigation v7.
const IOS_26_OR_HIGHER = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) >= 26;

const TOP_EDGE = { top: true };

export default function HeaderSafeAreaComponent({ children }) {
  if (!IOS_26_OR_HIGHER) {
    return children;
  }
  return (
    <SafeAreaView edges={TOP_EDGE} style={GlobalStyle.headerSafeArea}>
      {children}
    </SafeAreaView>
  );
}
