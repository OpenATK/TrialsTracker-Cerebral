import { Module } from 'cerebral'
import { 
  endMarkerDrag,
  doneMovingMap,
  handleCurrentLocationButton,
  handleFieldNoteClick,
  handleLocationFound,
	handleMapClick,
  handleMapMoved,
  markerDragged,
  startMarkerDrag,
  startMovingMap,
  undoDrawPoint,
  toggleLayer,
  toggleNotesVisible,
} from './sequences';

export default Module({

	state: {
		layers: {},
		//center: [40.739618459,-79.685532363],
		center: [40.98551896940516, -86.18823766708374],
		moving: false,
		geohashPolygons: [],
		zoom: 15,
		isLoading: false,
		dragging_marker: false,
		crop_layers: {},
	},
  
  signals: {
    currentLocationButtonClicked: handleCurrentLocationButton,
    fieldNoteClicked: handleFieldNoteClick,
    locationFound: handleLocationFound,
    mapMoved: [
      ...handleMapMoved, ...doneMovingMap,
    ],
    mapMoveStarted: startMovingMap,    
    markerDragEnded: endMarkerDrag,
    markerDragStarted: startMarkerDrag,
    markerDragged,
    mouseDownOnMap: handleMapClick,
    toggleLayer,
    toggleNotesVisible: toggleNotesVisible,
    undoButtonClicked: undoDrawPoint,
  }
})
