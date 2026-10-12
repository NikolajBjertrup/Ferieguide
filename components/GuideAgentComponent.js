import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';

import { GlobalStyle as S } from '../styles/GlobalStyle';

// Selve huset med ansigt. `eye` er øjet, så den store figur kan lade det blinke.
function houseParts(eye) {
  return (
    <>
      <View style={S.agentChimney} />
      <View style={S.agentRoof} />
      <View style={S.agentBody}>
        <View style={S.agentEyes}>{eye}{eye}</View>
        <View style={S.agentSmile} />
        <View style={[S.agentCheek, S.agentCheekLeft]} />
        <View style={[S.agentCheek, S.agentCheekRight]} />
      </View>
    </>
  );
}

// Lille, stillestående udgave af hjælperen. Står ved dens beskeder i samtalen.
export function GuideAgentIcon() {
  return (
    <View style={S.agentIcon} accessible accessibilityRole="image" accessibilityLabel="FerieGuides hjælper">
      <View style={S.agentIconScale}>
        <View style={S.agentFigure}>{houseParts(<View style={S.agentEye} />)}</View>
      </View>
    </View>
  );
}

// Appens hjælper: et lille hus med ansigt, tegnet af simple former, og en taleboble.
// Figuren vipper og blinker roligt, medmindre brugeren har slået bevægelse fra i iOS.
// `small` er den lille udgave, der følger med videre i opsætningen; den står altid på én række.
// `children` vises under teksten i taleboblen, som en del af det hjælperen siger – fx en svarknap.
export default function GuideAgentComponent({ title, text, stacked = false, small = false, children }) {
  const bob = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animations = [];
    let cancelled = false;
    const step = (value, toValue, duration) => Animated.timing(value, { toValue, duration, useNativeDriver: true });
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced || cancelled) return;
      animations = [
        Animated.loop(Animated.sequence([step(bob, -6, 1500), step(bob, 0, 1500)])),
        Animated.loop(Animated.sequence([Animated.delay(3400), step(blink, 0.1, 90), step(blink, 1, 90)])),
      ];
      animations.forEach((animation) => animation.start());
    }).catch(() => {});
    return () => { cancelled = true; animations.forEach((animation) => animation.stop()); };
  }, [bob, blink]);

  // Animerede værdier kan ikke ligge i GlobalStyle, så kun selve bevægelsen står her.
  const eye = <Animated.View style={[S.agentEye, { transform: [{ scaleY: blink }] }]} />;

  return (
    <View style={[S.agentRow, small ? S.agentRowSmall : stacked && S.agentRowStacked]}>
      <View style={[S.agentCircle, small && S.agentCircleSmall]} accessible accessibilityRole="image" accessibilityLabel="FerieGuides hjælper">
        <View style={small && S.agentScaleSmall}>
          <Animated.View style={[S.agentFigure, { transform: [{ translateY: bob }] }]}>{houseParts(eye)}</Animated.View>
        </View>
      </View>
      <View style={[S.agentBubble, small ? S.agentBubbleSmall : stacked && S.agentBubbleStacked]}>
        {(small || !stacked) && <View style={S.agentBubbleTail} />}
        <View style={small ? S.agentBubbleBodySmall : S.agentBubbleBody}>
          <Text style={[S.agentBubbleTitle, small && S.agentBubbleTitleSmall]}>{title}</Text>
          <Text style={[S.agentBubbleText, small && S.agentBubbleTextSmall]}>{text}</Text>
          {children ? <View style={S.agentBubbleReply}>{children}</View> : null}
        </View>
      </View>
    </View>
  );
}
