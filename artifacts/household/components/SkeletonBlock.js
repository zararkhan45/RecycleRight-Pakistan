/**
 * Polish pass — NEW reusable shimmer placeholder.
 *
 * Used by HomeDashboardScreen and PickupHistoryScreen to render a soft
 * pulsing block while mock data is "loading" (1.2s simulated). Animates
 * opacity between 0.3 and 0.8 in a continuous Animated.loop.
 *
 * Props:
 *   - width        number | string  (e.g. 120 or '60%')
 *   - height       number           (defaults to 14)
 *   - borderRadius number           (defaults to 6)
 *   - style        extra style overrides
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { colors } from '../../collector/theme.js';

export default function SkeletonBlock({
  width = '100%',
  height = 14,
  borderRadius = 6,
  style,
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceAlt,
  },
});
