import React, { Proptypes } from 'react';
import { connect } from 'cerebral-view-react';
import { CircleMarker, Polygon, Marker, Map, TileLayer, ImageOverlay, latLng, latLngBounds} from 'react-leaflet';
import styles from './map.css';
import uuid from 'uuid';
var GeoJSON = require('react-leaflet').GeoJson;
import gh from 'ngeohash';
import oadaIdClient from 'oada-id-client';
import { request } from 'superagent';
import RasterLayer from '../RasterLayer';
import Legend from '../Legend';
import fastyles from '../css/font-awesome.min.css';
import FontAwesome from 'react-fontawesome';
import MenuBar from '../MenuBar';

export default connect(props => ({
  notes: 'app.model.notes',
  selectedNote: 'app.model.selected_note',
  editing: 'app.view.editing',
  token: 'app.token',
  legends: 'app.view.legends',
  domain: 'app.model.domain',
  yieldDataIndex: 'app.model.yield_data_index',
  drawMode: 'app.view.draw_mode',
}), {
  toggleMap: 'app.ToggleMap',
  mouseDownOnMap: 'app.mouseDownOnMap',
  mouseMoveOnMap: 'app.mouseMoveOnMap',
  mouseUpOnMap: 'app.mouseUpOnMap',
  startStopLiveDataButtonClicked: 'app.startStopLiveDataButtonClicked',
  undoButtonClicked: 'app.undoButtonClicked',
  markerDragged: 'app.markerDragged',
},

class TrialsMap extends React.Component {

  validatePolygon(evt) {
    if (this.props.drawMode) {
      this.props.mouseDownOnMap({pt: evt.latlng})
    }
  }

  render() {
    var self = this;
    //var position = [40.98032883, -86.20182673]; // 40.97577156, -86.19773737    40.847044, -86.170438
    var position = [40.853989, -86.142021]; 
    var polygonList = [];
    Object.keys(this.props.notes).forEach(function(key) {
      var note = self.props.notes[key];
      if (note.geometry.coordinates[0].length > 0) {
        var geojson = note.geometry;
        polygonList.push(<GeoJSON 
          className={styles['note-polygon']}
          data={geojson} 
          color={note.color} 
          dragging={true} 
          key={uuid.v4()}
        />);
      }
    });

    var markerList = [];
    if (this.props.drawMode) {
      var note = this.props.notes[this.props.selectedNote];
      if (note.geometry.coordinates[0].length > 0) {
        var markerList = [];
        note.geometry.coordinates[0].forEach((pt, i)=> { 
          markerList.push(<Marker
            className={styles['selected-note-marker']}
            key={this.props.selectedNote+'-'+i} 
            position={[pt[1], pt[0]]}
            color={note.color}
            draggable={true}
            onDrag={(e)=>{this.props.markerDragged({lat: e.target._latlng.lat, lng:e.target._latlng.lng, idx: i})}}
          />);
        })
      }
    }
    
    var legends = [];
    if (this.props.token) {
      legends.push(<Legend 
        position={'bottomright'} 
        key={uuid.v4()}
       />);
    } else {
      legends = null;
    }

    var rasterLayers = [];
    Object.keys(this.props.yieldDataIndex).forEach((crop) => {
      rasterLayers.push(
        <RasterLayer
          key={'RasterLayer-'+crop}
          crop={crop}
          async={true}
          geohashGridlines={false}
          tileGridlines={false}
        />
      )
    })

    return (
      <div className={styles['map-panel']}>
        <MenuBar/>
        <Map 
          onLeafletMousedown={(evt)=>{this.validatePolygon(evt)}} 
          onLeafletMouseUp={ (e) => this.props.mouseUpOnMap({vertex_value: e.latlng, selected_note:this.props.selectedNote}) }
          dragging={true}
          center={position} 
          ref='map'
          zoom={15}>
          <div 
            className={styles[(this.props.drawMode) ? 
              'drawing-popup' : 'hidden']}>
            Tap the map to draw a polygon
          </div>
          <TileLayer
            url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          />
          {rasterLayers}
          <FontAwesome
            className={styles[this.props.editing ?
              'undo-button' : 'hidden']}
            name='undo'
            size='2x'
            onClick={() => this.props.undoButtonClicked({})}
          />
          <button 
            type="button" 
            id='start-stop-live-data-button'  
            onClick={(e) => this.props.startStopLiveDataButtonClicked({})}
            >{this.props.liveData ? 'Stop' : 'Start' }
          </button>
          {markerList}
          {polygonList}
          {legends}
        </Map> 
      </div>
    );
  }
})
