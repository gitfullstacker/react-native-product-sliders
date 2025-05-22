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
  const [sliderLayout, setSliderLayout] = useState({
    width: 0,
    x: 0,
  });
  const [thumbWidth, setThumbWidth] = useState(0);
  const [internalValue, setInternalValue] = useState(propValue);
  const pan = useRef(new Animated.Value(0)).current;
  const isRTL = I18nManager.isRTL;
  const sliderRef = useRef<View>(null);

  useEffect(() => {
    setInternalValue(propValue);
    updateThumbPosition(propValue);
  }, [propValue]);

  const updateThumbPosition = (value: number) => {
    if (!sliderLayout.width) return;

    const availableWidth = sliderLayout.width - thumbWidth;
    const position = ((value - min) / (max - min)) * availableWidth;
    pan.setValue(isRTL ? availableWidth - position : position);
  };

  const handleContainerLayout = () => {
    sliderRef.current?.measure((x, y, width, height, pageX) => {
      setSliderLayout({ width, x: pageX });
      updateThumbPosition(internalValue);
    });
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
    // Update the onPanResponderMove handler
    onPanResponderMove: (_, gestureState) => {
      if (disabled || !sliderLayout.width) return;

      // Calculate position relative to slider
      const absoluteX = gestureState.moveX;
      let relativeX = absoluteX - sliderLayout.x - thumbWidth / 2;

      if (isRTL) {
        relativeX = sliderLayout.width - thumbWidth - relativeX;
      }

      const availableWidth = sliderLayout.width - thumbWidth;
      const boundedX = Math.max(0, Math.min(relativeX, availableWidth));
      const stepSize = availableWidth / ((max - min) / step);
      const steppedX = step > 0 ? Math.round(boundedX / stepSize) * stepSize : boundedX;

      pan.setValue(steppedX);

      const newValueRaw = min + (steppedX / availableWidth) * (max - min);

      // Format value based on step precision
      const decimalPlaces = step.toString().split('.')[1]?.length || 0;
      const newValue = parseFloat(newValueRaw.toFixed(decimalPlaces));

      setInternalValue(newValue);
      onValueChange?.(newValue);
    },
    onPanResponderRelease: () => {
      onSlidingComplete?.(internalValue);
    },
  });

  const selectedTrackWidth = pan.interpolate({
    inputRange: [0, sliderLayout.width - thumbWidth],
    outputRange: [0, sliderLayout.width - thumbWidth],
    extrapolate: 'clamp',
  });

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

  return (
    <View ref={sliderRef} style={defaultStyles.container} onLayout={handleContainerLayout}>
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
