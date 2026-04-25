import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors } from '../theme';

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

function MapView({ style, children }) {
  const childArray = React.Children.toArray(children).filter(Boolean);
  const markerCount = childArray.filter(
    (c) => c && c.type && (c.type.displayName === 'Marker' || c.type.__isMarker),
  ).length;

  return (
    <View style={[styles.canvas, style]}>
      <View style={styles.gridOverlay} />
      <View style={styles.gridOverlayDiag} />
      <View style={styles.centerWrap} pointerEvents="none">
        <Text style={styles.title}>Map preview</Text>
        <Text style={styles.subtitle}>
          Lahore · {markerCount > 0 ? `${markerCount} marker${markerCount === 1 ? '' : 's'}` : 'interactive on device'}
        </Text>
      </View>
      <View style={styles.childLayer} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

function Marker({ children }) {
  return <View style={styles.markerStub}>{children}</View>;
}
Marker.displayName = 'Marker';
Marker.__isMarker = true;

function Polyline() {
  return null;
}
Polyline.displayName = 'Polyline';

function Circle() {
  return null;
}
Circle.displayName = 'Circle';

function Callout({ children }) {
  return <View>{children}</View>;
}
Callout.displayName = 'Callout';

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#E8F0EE',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
    borderColor: '#D2DDDA',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  gridOverlayDiag: {
    position: 'absolute',
    top: -200,
    left: -100,
    width: 800,
    height: 800,
    transform: [{ rotate: '12deg' }],
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderColor: '#CFDAD7',
    opacity: 0.35,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted || '#6B7280',
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  childLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  markerStub: {
    margin: 6,
  },
});

export default MapView;
export { Marker, Polyline, Circle, Callout };
