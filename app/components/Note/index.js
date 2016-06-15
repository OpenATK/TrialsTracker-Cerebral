import React, { PropTypes } from 'react';
import { Decorator as Cerebral, Link } from 'cerebral-view-react';
import TextAreaAutoSize from 'react-textarea-autosize';
import EditTagsBar from './editTagsBar.js';
import uuid from 'uuid';
import styles from './note.css';
import Color from 'color'; 

@Cerebral((props) => {
  return {
    selectedNote: ['home', 'model', 'selected_note'],
    note: ['home', 'model', 'notes', props.id],
    text: ['home', 'model', 'notes', props.id, 'text'],
    tags: ['home', 'model', 'notes', props.id, 'tags'],
    selected: ['home', 'model', 'notes', props.id, 'selected'],
    drawMode: ['home', 'view', 'drawMode'],
    geometryVisible: ['home', 'model', 'notes', props.id, 'geometry_visible'],
  };
})

class Note extends React.Component {
 
  static propTypes = {
    text: PropTypes.string,
    showHide: PropTypes.string,
  };

  generateTextColor(color) {
    var hsvColor = Color(color).hsv();
    hsvColor.v *= 0.8;
    hsvColor = Color(hsvColor);
    return Color(hsvColor).hexString();
  };

  render() {
    var tags = [];
    var self = this;
    _.each(this.props.tags, function(tag) {
//      if (self.state.editTags && self.state.note.id === self.state.selectedNote) {
//        tags.push(React.createElement("div", {key:uuid.v4(), className: "tag"}, React.createElement("button", {key:uuid.v4(), onClick:self.removeTag.bind(null, tag)}, "X"), tag));
//      } else {
        tags.push(<span className={styles.tag} key={uuid.v4()}>{tag}</span>);
//      }
    });
    const signals = this.props.signals.home;
/*
        <button 
          type="button" 
          className={styles['note-show-hide-button']} 
          onClick={() => signals.showHideButtonClicked({id: this.props.id})}
          >{this.props.geometryVisible ? 'Hide' : 'Show'}
        </button>
*/ 
    var textColor = this.generateTextColor(this.props.note.color);
    return (
      <div 
        key={uuid.v4()}
        style={{backgroundColor:this.props.note.color, borderColor:this.props.note.color}} 
        color={textColor}
        className={styles[this.props.selected ? 'selected-note' : 'note']} 
        onClick={() => signals.noteClicked({note:this.props.id})}
      >
     
        <button
          type="button" 
          className={styles[this.props.drawMode ? 'done-drawing-button' : 'hidden']}
          onClick={() => signals.doneDrawingButtonClicked({drawMode:false, id:this.props.id})}
          >{'Done Drawing'}
        </button>

        <TextAreaAutoSize 
          key={uuid.v4()} 
          style={{backgroundColor:this.props.note.color}} 
          value={this.props.text} 
          minRows={1} 
          color={textColor}
          className={styles['note-text-input']} 
          onChange={(e) => signals.noteTextChanged.sync({value: e.target.value, noteId:this.props.id})}
        ></TextAreaAutoSize>

  
        <hr/>
        {'Area: ' + this.props.note.area + ' acres'}
        <br/>
        {'Yield: ' + this.props.note.mean + ' bu/ac'}
        <button type="button" className={styles[this.props.selected ? 'note-remove-button' : 'hidden']} onClick={() => signals.deleteNoteButtonClicked({id:this.props.id})}>Delete Note</button>
        <button type="button" className={styles[this.props.selected ? 'note-edit-tags-button' : 'hidden']} >Edit Tags</button>
        <EditTagsBar id={this.props.id} color={this.props.note.color}/>
      </div>
    );
  }
}
export default Note;
