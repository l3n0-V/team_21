import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * ProgressRing - A circular progress indicator with color interpolation
 *
 * @param {number} percentage - Progress value (0-100)
 * @param {number} size - Diameter of the ring (default: 48)
 * @param {number} strokeWidth - Thickness of the ring (default: 4)
 * @param {boolean} animate - Whether to animate the ring (default: true)
 */
export default function ProgressRing({
  percentage = 0,
  size = 48,
  strokeWidth = 4,
  animate = true
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    if (animate) {
      // Animate from 0 to target percentage
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: 800,
        useNativeDriver: true, // Better performance
      }).start();
    } else {
      animatedValue.setValue(percentage);
    }
  }, [percentage, animate]);

  // Calculate stroke dash offset for progress
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  // Color interpolation: Red (0%) → Yellow (50%) → Green (100%)
  const getColor = (pct) => {
    if (pct < 34) {
      // Red zone (0-33%)
      return '#EF4444'; // red-500
    } else if (pct < 67) {
      // Yellow zone (34-66%)
      return '#F59E0B'; // amber-500
    } else {
      // Green zone (67-100%)
      return '#10B981'; // emerald-500
    }
  };

  const progressColor = getColor(percentage);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background ring (gray) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress ring (colored, animated) */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
    </View>
  );
}
