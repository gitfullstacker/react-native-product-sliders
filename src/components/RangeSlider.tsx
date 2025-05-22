import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  I18nManager,
  LayoutChangeEvent,
  PanResponder,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

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
  const [sliderLayout, setSliderLayout] = useState({
    width: 0,
    x: 0,
  });
  const [thumbWidth, setThumbWidth] = useState(0);
  const lowPan = useRef(new Animated.Value(0)).current;
  const highPan = useRef(new Animated.Value(0)).current;
  const activeThumb = useRef<'low' | 'high' | null>(null);
  const isRTL = I18nManager.isRTL;
  const sliderRef = useRef<View>(null);

  useEffect(() => {
    if (!sliderLayout.width) return;

    const availableWidth = sliderLayout.width - thumbWidth;
    const lowPosition = ((lowValue - min) / (max - min)) * availableWidth;
    const highPosition = ((highValue - min) / (max - min)) * availableWidth;

    lowPan.setValue(isRTL ? availableWidth - highPosition : lowPosition);
    highPan.setValue(isRTL ? availableWidth - lowPosition : highPosition);
  }, [min, max, lowValue, highValue, sliderLayout.width, thumbWidth, isRTL]);

  const handleContainerLayout = () => {
    sliderRef.current?.measure((x, y, width, height, pageX) => {
      setSliderLayout({ width, x: pageX });
    });
  };

  const handleThumbLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setThumbWidth(width);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (_, gestureState) => {
      if (disabled || !sliderLayout.width) return;

      // Get touch position relative to slider
      const touchX = gestureState.x0 - sliderLayout.x;
      const lowThumbX = (lowPan as any)._value;
      const highThumbX = (highPan as any)._value;

      const lowDistance = Math.abs(touchX - lowThumbX);
      const highDistance = Math.abs(touchX - highThumbX);

      activeThumb.current = lowDistance < highDistance ? 'low' : 'high';
      onSlidingStart?.(lowValue, highValue);
    },
    onPanResponderMove: (_, gestureState) => {
      if (disabled || !sliderLayout.width || !activeThumb.current) return;

      // Calculate position relative to slider
      let relativeX = gestureState.moveX - sliderLayout.x - thumbWidth / 2;
      if (isRTL) {
        relativeX = sliderLayout.width - thumbWidth - relativeX;
      }

      const availableWidth = sliderLayout.width - thumbWidth;
      const boundedX = Math.max(0, Math.min(relativeX, availableWidth));
      const stepSize = availableWidth / ((max - min) / step);
      const steppedX = step > 0 ? Math.round(boundedX / stepSize) * stepSize : boundedX;

      const pan = activeThumb.current === 'low' ? lowPan : highPan;
      const otherPan = activeThumb.current === 'low' ? highPan : lowPan;

      // Enforce minimum range
      if (activeThumb.current === 'low') {
        if (steppedX + minRange * stepSize > (otherPan as any)._value) return;
      } else {
        if (steppedX - minRange * stepSize < (otherPan as any)._value) return;
      }

      pan.setValue(steppedX);

      // Calculate values with proper step precision
      const currentLowRaw = min + ((lowPan as any)._value / availableWidth) * (max - min);
      const currentHighRaw = min + ((highPan as any)._value / availableWidth) * (max - min);

      // Format values based on step precision
      const decimalPlaces = step.toString().split('.')[1]?.length || 0;
      const currentLow = parseFloat(currentLowRaw.toFixed(decimalPlaces));
      const currentHigh = parseFloat(currentHighRaw.toFixed(decimalPlaces));

      onRangeChange?.(currentLow, currentHigh);
    },
    onPanResponderRelease: () => {
      if (!activeThumb.current) return;

      const availableWidth = sliderLayout.width - thumbWidth;
      const currentLow = min + ((lowPan as any)._value / availableWidth) * (max - min);
      const currentHigh = min + ((highPan as any)._value / availableWidth) * (max - min);
      onSlidingComplete?.(currentLow, currentHigh);
      activeThumb.current = null;
    },
  });

  const selectedTrackLeft = Animated.add(lowPan, thumbWidth / 2);
  const selectedTrackWidth = Animated.subtract(highPan, lowPan);

  const renderMarkers = () => {
    if (!showMarkers || !sliderLayout.width) return null;

    const markers = [];
    const steps = (max - min) / step;
    const markerWidth = sliderLayout.width / steps;

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

  const getLabelContainerStyle = (): StyleProp<ViewStyle> => {
    return [
      defaultStyles.labelContainer,
      getLabelStyle(labelPosition, labelWidth, labelLeftAdjustment),
    ];
  };

  const getCurrentValue = (thumbType: 'low' | 'high') => {
    const panValue = thumbType === 'low' ? (lowPan as any)._value : (highPan as any)._value;
    const availableWidth = sliderLayout.width - thumbWidth;
    const valueRaw = min + (panValue / availableWidth) * (max - min);
    const decimalPlaces = step.toString().split('.')[1]?.length || 0;
    return parseFloat(valueRaw.toFixed(decimalPlaces));
  };

  return (
    <View ref={sliderRef} style={defaultStyles.container} onLayout={handleContainerLayout}>
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
          <View style={getLabelContainerStyle()}>{renderLabel(getCurrentValue('low'), 'low')}</View>
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
          <View style={getLabelContainerStyle()}>
            {renderLabel(getCurrentValue('high'), 'high')}
          </View>
        )}
      </Animated.View>

      <View style={defaultStyles.touchableArea} {...panResponder.panHandlers} />
    </View>
  );
};

export default RangeSlider;
