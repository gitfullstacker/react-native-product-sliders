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
import { SliderProps } from '../types';
import { getLabelStyle } from '../utils/helpers';

const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  value: propValue = min,
  disabled = false,
  onValueChange,
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
  const [internalValue, setInternalValue] = useState(propValue);
  const pan = useRef(new Animated.Value(0)).current as any;
  const isRTL = I18nManager.isRTL;

  useEffect(() => {
    setInternalValue(propValue);
    updateThumbPosition(propValue);
  }, [propValue]);

  const updateThumbPosition = (value: number) => {
    if (!sliderWidth) return;

    const availableWidth = sliderWidth - thumbWidth;
    const position = ((value - min) / (max - min)) * availableWidth;
    pan.setValue(isRTL ? availableWidth - position : position);
  };

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setSliderWidth(width);
    updateThumbPosition(internalValue);
  };

  const handleThumbLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setThumbWidth(width);
    updateThumbPosition(internalValue);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => {
      onSlidingStart?.(internalValue);
    },
    onPanResponderMove: (_, gestureState) => {
      if (disabled || !sliderWidth) return;

      let newX = gestureState.moveX - thumbWidth * 2;
      if (isRTL) {
        newX = sliderWidth - thumbWidth - (gestureState.moveX - thumbWidth * 2);
      }

      const availableWidth = sliderWidth - thumbWidth;
      const boundedX = Math.max(0, Math.min(newX, availableWidth));
      const stepSize = availableWidth / ((max - min) / step);
      const steppedX = Math.round(boundedX / stepSize) * stepSize;

      pan.setValue(steppedX);

      const newValue = min + (steppedX / availableWidth) * (max - min);
      setInternalValue(newValue);
      onValueChange?.(newValue);
    },
    onPanResponderRelease: () => {
      onSlidingComplete?.(internalValue);
    },
  });

  const selectedTrackWidth = pan.interpolate({
    inputRange: [0, sliderWidth - thumbWidth],
    outputRange: [0, sliderWidth - thumbWidth],
    extrapolate: 'clamp',
  });

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

  const getLabelContainerStyle = (): StyleProp<ViewStyle> => {
    return [
      defaultStyles.labelContainer,
      getLabelStyle(labelPosition, labelWidth, labelLeftAdjustment),
    ];
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
              width: selectedTrackWidth,
              [isRTL ? 'right' : 'left']: 0,
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
            transform: [{ translateX: pan }],
            [isRTL ? 'right' : 'left']: 0,
          },
        ]}
        {...panResponder.panHandlers}>
        {renderLabel && <View style={getLabelContainerStyle()}>{renderLabel(internalValue)}</View>}
      </Animated.View>

      <View style={defaultStyles.touchableArea} {...panResponder.panHandlers} />
    </View>
  );
};

export default Slider;
