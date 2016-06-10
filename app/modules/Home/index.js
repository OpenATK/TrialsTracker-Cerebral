import uuid from 'uuid';
import tree from './stateTree.js';

import { selectNote } from './chains';
import { textInputChanged } from './chains';
import { changeSortMode } from './chains';
import { changeShowHideState } from './chains';
import { addNewNote } from './chains';
import { removeNote } from './chains';
import { getYieldData } from './chains';
import { handleAuth } from './chains';
import { handleRequestResponse } from './chains';
import { initialize } from './chains';
import { handleNoteClick } from './chains';

import { drawComplete } from './mapchain';
import { handleMouseDown } from './mapchain';
import { mouseMoveOnmap } from './mapchain';
import { mouseUpOnmap } from './mapchain';
import { ToggleMap } from './mapchain';
import { drawOnMap } from './mapchain';
import { handleDoneDrawing } from './mapchain';

export default (options = {}) => {
  
  return (module, controller) => {
    module.addState(
      tree
    );

    module.addSignals({

      init: [
        ...initialize
      ],

      mapDoubleClicked: [
        ...handleMouseDown, drawComplete,
      ],

      doneDrawingButtonClicked: [
        ...drawComplete,
      ],
    
      recievedRequestResponse: [
        ...handleRequestResponse,
      ],

      recievedAccessToken: [
        ...handleAuth,
      ],

      mapMoved: [
        ...getYieldData
      ],

      sortingTabClicked: [
        ...changeSortMode
      ],

      noteClicked: [
        ...handleNoteClick
      ], 

      deleteNoteButtonClicked: [
        ...removeNote
      ],
 
      noteTextChanged: [
        ...textInputChanged
      ],

      mouseDownOnMap: [
        ...handleMouseDown
      ],

      mouseMoveOnMap: [
        ...mouseMoveOnmap
      ],

      mouseUpOnMap: [
        ...mouseUpOnmap
      ],

      ToggleMapp: [
        ...ToggleMap
      ],

      DrawMode: [
        ...drawOnMap
      ],

      showHideButtonClicked: [
        ...changeShowHideState
      ],


      addNoteButtonClicked: [
        ...addNewNote,
      ],

    })
  };
}
