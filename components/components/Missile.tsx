import React from 'react';
import { Animated, ViewStyle } from 'react-native';

interface MissileProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Missile: React.FC<MissileProps> = ({ x, y, width, height }) => {
  const animatedValue = React.useRef(new Animated.Value(y)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: y,
      duration: 50,
      useNativeDriver: true,
    }).start();
  }, [y, animatedValue]);

  const missileStyle: ViewStyle = {
    position: 'absolute',
    left: x,
    top: animatedValue,
    width: width,
    height: height,
    backgroundColor: '#F44336',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <Animated.View style={missileStyle}>
      {/* 미사일 모양을 위한 작은 원 */}
      <Animated.View
        style={{
          width: 6,
          height: 6,
          backgroundColor: '#FF5722',
          borderRadius: 3,
        }}
      />
    </Animated.View>
  );
};

export default Missile; 