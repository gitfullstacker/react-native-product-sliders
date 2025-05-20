import React, { useEffect, useRef, useState } from 'react';
import { Animated, I18nManager, PanResponder, StyleProp, View, ViewStyle } from 'react-native';

import { defaultStyles } from '../styles';
import { RangeSliderProps } from '../types';
import { getLabelStyle } from '../utils/helpers';

const RangeSlider: React.FC<RangeSliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  minRange = 1,
  lowValue = min,
  highValue = max,
  disabled = false,
  onRangeChange,
  onSlidingStart,
  onSlidingComplete,
  thumbStyle = {},
  trackStyle = {},
  selectedTrackStyle = {},
  markerStyle = {},
  showMarkers = false,
  labelPosition = 'top',
  labelWidth = 'auto',
  labelLeftAdjustment = 0,
  renderLabel,
  renderMarker,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(0);
  const lowPan = useRef(new Animated.Value(0)).current as any;
  const highPan = useRef(new Animated.Value(0)).current as any;
  const activeThumb = useRef<'low' | 'high' | null>(null);
  const isRTL = I18nManager.isRTL;

  useEffect(() => {
    if (!sliderWidth) return;

    const availableWidth = sliderWidth - thumbWidth;
    const lowPosition = ((lowValue - min) / (max - min)) * availableWidth;
    const highPosition = ((highValue - min) / (max - min)) * availableWidth;

    lowPan.setValue(isRTL ? availableWidth - highPosition : lowPosition);
    highPan.setValue(isRTL ? availableWidth - lowPosition : highPosition);
  }, [min, max, lowValue, highValue, sliderWidth, thumbWidth, isRTL]);

  const handleContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setSliderWidth(width);
  };

  const handleThumbLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setThumbWidth(width);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gestureState) => {
      if (disabled || !sliderWidth) return;

      const touchX = gestureState.x0;
      const lowThumbX = lowPan._value;
      const highThumbX = highPan._value;

      const lowDistance = Math.abs(touchX - lowThumbX);
      const highDistance = Math.abs(touchX - highThumbX);

      activeThumb.current = lowDistance < highDistance ? 'low' : 'high';

      onSlidingStart?.(lowValue, highValue);
    },
    onPanResponderMove: (_, gestureState) => {
      if (disabled || !sliderWidth || !activeThumb.current) return;

      let newX = gestureState.moveX - thumbWidth * 2;
      if (isRTL) {
        newX = sliderWidth - thumbWidth - (gestureState.moveX - thumbWidth * 2);
      }

      const availableWidth = sliderWidth - thumbWidth;
      const boundedX = Math.max(0, Math.min(newX, availableWidth));
      const stepSize = availableWidth / ((max - min) / step);
      const steppedX = Math.round(boundedX / stepSize) * stepSize;

      const pan = activeThumb.current === 'low' ? lowPan : highPan;
      const otherPan = activeThumb.current === 'low' ? highPan : lowPan;

      if (activeThumb.current === 'low') {
        if (steppedX + (minRange < 1 ? 1 : minRange) * stepSize > otherPan._value) return;
      } else {
        if (steppedX - (minRange < 1 ? 1 : minRange) * stepSize < otherPan._value) return;
      }

      pan.setValue(steppedX);

      const currentLow = min + (lowPan._value / availableWidth) * (max - min);
      const currentHigh = min + (highPan._value / availableWidth) * (max - min);
      onRangeChange?.(currentLow, currentHigh);
    },
    onPanResponderRelease: () => {
      if (!activeThumb.current) return;

      const currentLow = min + (lowPan._value / (sliderWidth - thumbWidth)) * (max - min);
      const currentHigh = min + (highPan._value / (sliderWidth - thumbWidth)) * (max - min);
      onSlidingComplete?.(currentLow, currentHigh);
      activeThumb.current = null;
    },
  });

  const selectedTrackLeft = Animated.add(lowPan, thumbWidth / 2);
  const selectedTrackWidth = Animated.subtract(highPan, lowPan);

  const renderMarkers = () => {
    if (!showMarkers || !sliderWidth) return null;

    const markers = [];
    const steps = (max - min) / step;
    const markerWidth = sliderWidth / steps;

    for (let i = 0; i <= steps; i++) {
      const markerValue = min + i * step;
      markers.push(
        <View
          key={`marker-${i}`}
          style={[defaultStyles.marker, markerStyle, { left: i * markerWidth - 1 }]}>
          {renderMarker?.(markerValue)}
        </View>,
      );
    }

    return <View style={defaultStyles.markerContainer}>{markers}</View>;
  };

  const getLabelContainerStyle = (thumbType: 'low' | 'high'): StyleProp<ViewStyle> => {
    return [
      defaultStyles.labelContainer,
      getLabelStyle(labelPosition, labelWidth, labelLeftAdjustment),
      thumbType === 'high' ? styles.highThumbLabel : {},
    ];
  };

  const getCurrentValue = (thumbType: 'low' | 'high') => {
    const panValue = thumbType === 'low' ? lowPan._value : highPan._value;
    return min + (panValue / (sliderWidth - thumbWidth)) * (max - min);
  };

  return (
    <View style={defaultStyles.container} onLayout={handleContainerLayout}>
      <View style={defaultStyles.trackContainer}>
        <View style={[defaultStyles.track, trackStyle]} />
        <Animated.View
          style={[
            defaultStyles.selectedTrack,
            selectedTrackStyle,
            {
              [isRTL ? 'right' : 'left']: selectedTrackLeft,
              width: selectedTrackWidth,
            },
          ]}
        />
      </View>

      {renderMarkers()}

      <Animated.View
        onLayout={handleThumbLayout}
        style={[
          defaultStyles.thumb,
          thumbStyle,
          {
            transform: [{ translateX: lowPan }],
            [isRTL ? 'right' : 'left']: 0,
          },
        ]}
        {...panResponder.panHandlers}>
        {renderLabel && (
          <View style={getLabelContainerStyle('low')}>
            {renderLabel(getCurrentValue('low'), 'low')}
          </View>
        )}
      </Animated.View>

      <Animated.View
        style={[
          defaultStyles.thumb,
          thumbStyle,
          {
            transform: [{ translateX: highPan }],
            [isRTL ? 'right' : 'left']: 0,
          },
        ]}
        {...panResponder.panHandlers}>
        {renderLabel && (
          <View style={getLabelContainerStyle('high')}>
            {renderLabel(getCurrentValue('high'), 'high')}
          </View>
        )}
      </Animated.View>

      <View style={defaultStyles.touchableArea} {...panResponder.panHandlers} />
    </View>
  );
};

const styles = {
  highThumbLabel: {
    // Additional styling for high thumb label if needed
  },
};

export default RangeSlider;
