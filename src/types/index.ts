export type LabelPosition = 'top' | 'bottom';

export type SliderBaseProps = {
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  thumbStyle?: object;
  trackStyle?: object;
  selectedTrackStyle?: object;
  markerStyle?: object;
  showMarkers?: boolean;
  labelPosition?: LabelPosition;
  labelWidth?: number | 'auto';
  labelLeftAdjustment?: number;
  renderLabel?: (value: number, thumb?: string) => React.ReactNode;
  renderMarker?: (value: number) => React.ReactNode;
};

export type SliderProps = SliderBaseProps & {
  value?: number;
  onValueChange?: (value: number) => void;
  onSlidingStart?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
};

export type RangeSliderProps = SliderBaseProps & {
  minRange?: number;
  lowValue?: number;
  highValue?: number;
  onRangeChange?: (low: number, high: number) => void;
  onSlidingStart?: (low: number, high: number) => void;
  onSlidingComplete?: (low: number, high: number) => void;
};
