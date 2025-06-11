import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

interface MissileProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Missile: React.FC<MissileProps> = memo(({ x, y, width, height }) => {
  return (
    <View
      style={[
        styles.missile,
        {
          width,
          height,
          transform: [
            { translateX: x },
            { translateY: y },
          ],
        },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  missile: {
    position: 'absolute',
    backgroundColor: '#F44336',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#D32F2F',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
});

Missile.displayName = 'Missile';

export default Missile; 