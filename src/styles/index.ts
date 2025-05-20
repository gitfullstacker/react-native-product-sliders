import { StyleSheet } from 'react-native';

export const defaultStyles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  labelContainer: {
    alignItems: 'center',
    left: '-200%',
    position: 'absolute',
    top: -35,
    width: 100,
  },
  marker: {
    backgroundColor: '#999',
    height: 5,
    width: 1,
  },
  markerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 20,
    width: '100%',
  },
  selectedTrack: {
    backgroundColor: '#2f80ed', // Selected track color
    borderRadius: 2,
    height: 4,
  },
  thumb: {
    backgroundColor: '#ffffff',
    borderColor: '#2f80ed',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    position: 'absolute',
    width: 20,
  },
  touchableArea: {
    ...StyleSheet.absoluteFillObject,
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
  },
  trackContainer: {
    backgroundColor: '#d3d3d3',
    borderRadius: 2,
    height: 4, // Base track color
  },
});
