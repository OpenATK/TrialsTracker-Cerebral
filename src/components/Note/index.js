import React, { PropTypes } from 'react';
import {connect} from 'cerebral-view-react'
import TextAreaAutoSize from 'react-textarea-autosize';
import EditTagsBar from './editTagsBar.js';
import uuid from 'uuid';
import styles from './note.css';
import fastyles from '../css/font-awesome.min.css';
import Color from 'color'; 
import FontAwesome from 'react-fontawesome';

export default connect(props => ({
  note: `app.model.notes.${props.id}`,
  text: `app.model.notes.${props.id}.text`,
  tags: `app.model.notes.${props.id}.tags`,
  selected: `app.model.notes.${props.id}.selected`,
  editing: 'app.view.editing_note',
  geometryVisible: `app.model.notes.${props.id}.geometry_visible`,
  drawMode: 'app.view.draw_mode',
  noteFields: `app.model.notes.${props.id}.fields`,
  fields: 'app.model.fields',
}), {
  deleteNoteButtonClicked: 'app.deleteNoteButtonClicked',
  doneDrawingButtonClicked: 'app.doneDrawingButtonClicked',
  editNoteButtonClicked: 'app.editNoteButtonClicked',
  noteClicked: 'app.noteClicked',
  noteTextChanged: 'app.noteTextChanged',
},

  class Note extends React.Component {

    handleNoteClick(evt) {
      if (!this.props.drawMode) {
        if (!this.props.selected) this.props.noteClicked({note:this.props.id})
      }
    }
    
    validatePolygon() {
      if (this.props.note.geometry.coordinates[0].length >= 3) {
        if (this.props.note.text !== '') {
          this.props.doneDrawingButtonClicked({drawMode:false, id:this.props.id})
        }
      }
    }

    render() {
      var yields = [];
      if (this.props.note.stats.computing) {
        yields.push(
          <div
            key={'yield-waiting-div-'+this.props.note.id}
            className={styles['yield-info']}>
          <span
            key={'yield-waiting-1-'+this.props.note.id}
            className={styles[this.props.note.stats.computing ? 
              'yield-text': 'hidden']}>
              {'Yield: '}
          </span>
          <span
            key={'yield-waiting-2-'+this.props.note.id}
            className={styles[this.props.note.stats.computing ? 
              'blinker': 'hidden']}>
              {'...'}
          </span>
          </div>
        )
      } else {
        Object.keys(this.props.note.stats).forEach((crop) => {
          if (!isNaN(this.props.note.stats[crop].mean_yield)) {
            yields.push(

            <span
              key={this.props.note.id+'-yield-text-'+crop}
              className={styles['yield-text']}>
                {'Yield: ' + this.props.note.stats[crop].mean_yield.toFixed(2) + ' bu/ac'}
            </span>

            )
          }
        })
      }

      var fieldComparisons = [];
      Object.keys(this.props.noteFields).forEach((field) => {
        Object.keys(this.props.note.stats).forEach((crop) => {
          if (!isNaN(this.props.note.stats[crop].mean_yield)) {
            var sign = (this.props.noteFields[field][crop].difference > 0) ? '+' : '';
            fieldComparisons.push(

              <span
                key={this.props.note.id+'-'+field+'-comparison'}
                className={styles['field-comparison']}>
                {field + ': '+ this.props.fields[field].stats[crop].mean_yield.toFixed(2) +
                 ' (' + sign + (this.props.noteFields[field][crop].difference).toFixed(2) + ') bu/ac' }
              </span>

            );
            fieldComparisons.push(
              <br/>
            );
          }
        })
      })

      return (
        <div 
          style={{backgroundColor:this.props.note.color, borderColor:this.props.note.color, color:this.props.note.font_color, order: this.props.note.order}} 
          className={styles[this.props.selected ? 'selected-note' : 'note']} 
          onClick={(e) => this.handleNoteClick(e)}>
          <div
            className={styles['note-upper']}>
            <TextAreaAutoSize
              className={styles[this.props.note.font_color == '#ffffff' ? 
              'note-text-input-white' : 'note-text-input-black']}
              id={this.props.id+'-input'}
              value={this.props.text} 
              onChange={(e) => this.props.noteTextChanged({value: e.target.value, noteId:this.props.id})}
              style={{
                backgroundColor:this.props.note.color, 
                color:this.props.note.font_color, 
              }} 
              minRows={1} 
              tabIndex={1}
              autoFocus={this.props.editing}
              placeholder='Type note description here...'
              readOnly={this.props.editing ? false : "readonly"}
            />
            <FontAwesome 
              name='pencil'
              style={{
                color:this.props.note.font_color, 
              }}
              className={styles[this.props.selected && !this.props.editing ? 
                'edit-note-button' : 'hidden']}
              onClick={() => this.props.editNoteButtonClicked({})}
            />
            <FontAwesome 
              name='trash'
              style={{
                color:this.props.note.font_color, 
              }}
              className={styles[this.props.selected && this.props.editing ? 
               'delete-note-button' : 'hidden']}
              onClick={() => this.props.deleteNoteButtonClicked({id:this.props.id, drawMode: false})}
            />
          </div>
          <hr 
            className={styles[this.props.note.area ? 
              'hr' : 'hidden']}
            style={{backgroundColor:this.props.note.font_color}} 
            noshade
          />
          <div
            className={styles[this.props.note.area ?
              'note-middle' : 'hidden']}>
            {this.props.note.area ? 
              'Area: ' + this.props.note.area.toFixed(2) + ' acres' : null}
            <br/>
            {yields}
            <br/>
            {fieldComparisons}
          </div>
          <hr 
            noshade
            style={{backgroundColor:this.props.note.font_color}} 
            className={styles[this.props.editing && this.props.selected ? 
              'hr' : 'hidden']}
          />
          <div
            className={styles['note-lower']}>
            <EditTagsBar 
              id={this.props.id} 
            />
            <FontAwesome 
              tabIndex={2}
              className={styles[this.props.selected && this.props.editing ?
                'done-editing-button' : 'hidden']}
              name='check'
              onClick={() => this.validatePolygon()}
            />
          </div>
        </div>
      )
    }
  }
)
