import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const PencilLoader = ({ size = 100, color = '#007AFF' }) => {
  const pencilRotation = useRef(new Animated.Value(0)).current;
  const circleProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(pencilRotation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(circleProgress, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const pencilStyle = {
    transform: [
      {
        rotate: pencilRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const circlePath = circleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.PI * 2],
  });

  return (
    <View style={[styles.container]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeDasharray={`${Math.PI * 90}, ${Math.PI * 90}`}
          strokeDashoffset={Animated.multiply(circlePath, 90)}
        />
      </Svg>
      <Animated.View style={[styles.pencilContainer, pencilStyle]}>
        <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
          <Path
            d="M20.71 5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM5.92 19H5v-.92l9.06-9.06.92.92L5.92 19z"
            fill={color}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    // alignItems: 'center',
    // alignSelf:"center"
    
  },
  pencilContainer: {
        alignSelf:"center",
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PencilLoader;