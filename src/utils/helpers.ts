import { ViewStyle } from 'react-native';

export const getLabelStyle = (
  position: 'top' | 'bottom',
  width: number | 'auto',
  leftAdjust: number,
): ViewStyle => ({
  width: width === 'auto' ? undefined : width,
  top: position === 'top' ? -35 : 25,
  left: -5 + leftAdjust,
});
