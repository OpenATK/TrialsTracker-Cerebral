import React from 'react';
import { connect } from '@cerebral/react';
import { FeatureGroup, LayersControl, GeoJSON } from 'react-leaflet';
import './map.css';
import RasterLayer from '../RasterLayer/index.js';
import {state, signal} from 'cerebral/tags'
import uuid from 'uuid'
const { Overlay } = LayersControl;

export default connect({
  layers: state`map.layers`,
	notes: state`notes.notes`,
	notesVisible: state`notes.visible`,
  selectedNote: state`notes.notes.${state`notes.selected_note`}`,
	editing: state`app.view.editing`,
  index: state`yield.index`,
  fields: state`notes.fields`,
  domain: state`Connections.oada_domain`,
	isLoading: state`map.isLoading`,
	geohashPolygons: state`map.geohashPolygons`,

	noteClicked: signal`notes.noteClicked`,
},

class LayerControl extends React.Component {

	render() {

		let notePolygons = Object.keys(this.props.notes).filter(id => 
			this.props.notes[id].geometry 
			&& this.props.notes[id].geometry.geojson 
			&& this.props.notes[id].geometry.geojson.coordinates[0].length > 0
		).map(id => {
			return <GeoJSON 
      className={'note-polygon'}
      data={this.props.notes[id].geometry.geojson} 
      color={this.props.notes[id].color} 
  	  style={{fillOpacity:0.4}}
	    onClick={() => this.props.noteClicked({id})}
      dragging={true} 
			key={'note-'+id+'-polygon'+uuid()} //TODO: don't do this
		/>})

    return (
      <LayersControl 
				position='topright'>
				{this.props.geohashPolygons.length ? <Overlay 
          name='Geohash Polygons'>
				  <FeatureGroup>
					  {this.props.geohashPolygons.map(polygon => <GeoJSON 
              className={'geohash-polygon'}
							data={polygon} 
							style={{fillOpacity:0.0, strokeWidth: 1}}                                  
              key={uuid.v4()}
					  />)}
         </FeatureGroup>
				</Overlay> : null }

				{this.props.layers.Fields ? <Overlay 
          checked={this.props.layers.Fields.visible}
          name='Fields'>
				  <FeatureGroup>
					  {Object.keys(this.props.fields || {}).map(field => <GeoJSON 
							className={'field-polygon'}
							onClick={() => this.props.noteClicked({id:field, type: 'fields'})}
							color={this.props.fields[field].color} 
							style={{color: this.props.fields[field].color}}
              data={this.props.fields[field].geometry.geojson} 
              key={field}
					  />)}
         </FeatureGroup>
				</Overlay> : null }
				{Object.keys(this.props.index || {}).map(crop => 
					<Overlay 
          checked={this.props.layers[crop.charAt(0).toUpperCase() + crop.slice(1)].visible}
          name={crop.charAt(0).toUpperCase() + crop.slice(1)}
          key={crop+'-overlay'}>
          <RasterLayer
            key={'RasterLayer-'+crop}
            layer={crop}
            geohashGridlines={false}
            tileGridlines={false}
					/>
				</Overlay> : null )}
				{this.props.layers.Notes ? <Overlay 
					checked={this.props.layers.Notes.visible}
					name='Notes'
					key={'notes-polygons'}>
				  <FeatureGroup>
						{notePolygons}
					</FeatureGroup>
				</Overlay> : null}
			</LayersControl>
    )
  }
})
