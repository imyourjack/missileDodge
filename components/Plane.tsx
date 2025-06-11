import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';

interface PlaneProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Plane: React.FC<PlaneProps> = memo(({ x, y, width, height }) => {
  return (
    <View
      style={[
        styles.plane,
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
  plane: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
    borderRadius: 50, // 완전한 원형
    borderWidth: 2,
    borderColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

Plane.displayName = 'Plane';

export default Plane; 