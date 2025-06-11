import React from 'react';
import { Animated, ViewStyle } from 'react-native';

interface PlaneProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Plane: React.FC<PlaneProps> = ({ x, y, width, height }) => {
  const animatedValue = React.useRef(new Animated.Value(x)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: x,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [x, animatedValue]);

  const planeStyle: ViewStyle = {
    position: 'absolute',
    left: animatedValue,
    top: y,
    width: width,
    height: height,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <Animated.View style={planeStyle}>
      {/* 비행기 모양을 위한 삼각형 */}
      <Animated.View
        style={{
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderStyle: 'solid',
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderBottomWidth: 16,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: '#FFFFFF',
          transform: [{ rotate: '0deg' }],
        }}
      />
    </Animated.View>
  );
};

export default Plane; 