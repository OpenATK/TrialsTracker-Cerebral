import { equals, when, set, unset, toggle, wait } from 'cerebral/operators';
import polygonsIntersect from '../map/utils/polygonsIntersect';
import computeBoundingBox from '../map/utils/computeBoundingBox'
import gaussian from 'gaussian';
import gjArea from '@mapbox/geojson-area';
import { sequence } from 'cerebral'
import uuid from 'uuid';
import rmc from 'random-material-color';
import _ from 'lodash';
import Color from 'color';
import * as yieldMod from '../yield/sequences.js';
import * as map from '../map/sequences.js';
import { state, props } from 'cerebral/tags'
import * as oada from '@oada/cerebral-module/sequences'
const dist = require('gaussian')(0, 1);

let tree = {
  '_type': 'application/vnd.oada.bookmarks.1+json',
  '_rev': '0-0',
  'notes': {
    '_type': 'application/vnd.oada.yield.1+json',
    '_rev': '0-0',
    '*': {
      '_type': 'application/vnd.oada.yield.1+json',
      '_rev': '0-0',
    }
  }
}

export const fetch = sequence('notes.fetch', [
	({props}) => ({
  path: '/bookmarks/notes',
    tree: tree.notes,
    /*
    watch: {
      signal: 'notes.handleWatchUpdate',
    },
    */
	}),
	oada.get,
	mapOadaToRecords,
])

export const oadaUpdateNote = [
	({props, state}) => ({
		data: props.note,
		type: 'application/vnd.oada.yield.1+json',
    path: '/bookmarks/notes/'+props.note.id,
    connection_id: state.get('notes.connection_id'),
    tree
	}),
	oada.put,
]

export const getNoteStats = sequence('notes.getNoteStats', [
	set(state`notes.${props`type`}.${props`id`}.stats.computing`, true),
	({state, props}) => ({
		polygon:  state.get(`notes.${props.type}.${props.id}.geometry.geojson.coordinates.0`),
		bbox: state.get(`notes.${props.type}.${props.id}.geometry.bbox`),
	}),
	yieldMod.getPolygonStats,
	({state, props}) => ({note: state.get(`notes.${props.type}.${props.id}`)}),
	unset(state`notes.${props`type`}.${props`id`}.stats.computing`),
])

export function getStats({state, props}) {
	let notes = state.get(`notes.${props.type}`);
	return Promise.map(Object.keys(notes || {}), (id) => {
    state.set(`notes.${props.type}.${id}.stats`, {computing:true})
    let polygon;
    let bbox;
    if (notes[id].geometry && notes[id].geometry.geojson) {
      polygon = notes[id].geometry.geojson.coordinates[0];
      bbox = _.clone(notes[id].geometry.bbox);
    } else {
      polygon = [];
      bbox = []
    }
    return {
      id,
      polygon,
      bbox,
      type: props.type
    }
	}).then((polygons) => {
		polygons = polygons.filter((polygon) => (polygon) ? true: false);
		return {polygons}
	})
}

function setStats({props, state}) {
	return Promise.map(props.polygons || [], (obj) => {
		if (!_.isEmpty(obj.stats)) {
			state.set(`notes.${obj.type}.${obj.id}.stats`, obj.stats);
		}
		state.unset(`notes.${obj.type}.${obj.id}.stats.computing`);
		return obj
	}).then((polygons) => {
		return {polygons}
	})
}

export const handleWatchUpdate = sequence('notes.handleWatchUpdate', [
	({state, props}) => {
	},
	fetch,
])

export const doneClicked = [
	set(props`type`, state`notes.selected_note.type`),
	set(props`id`, state`notes.selected_note.id`),
	set(props`note`, state`notes.${props`type`}.${props`id`}`),
	set(state`app.view.editing`, false), 
  getNoteStats,
	oadaUpdateNote,
];

export const init = sequence('notes.init', [
  set(state`notes.connection_id`, props`connection_id`),
  oada.connect,
	//	set(state`notes.loading`, true),
	//assumes oada has been initialized with a domain and valid token
	fetch,
	getTagsList,
	set(state`notes.loading`, false),
	set(props`type`, `notes`),
  getStats,
  yieldMod.getPolygonStats,
  setStats,
  when(state`fields.records`), {
    true: [
      mapFieldsToNotes,
      set(props`type`, 'fields'),
      getStats,
      yieldMod.getPolygonStats,
      setStats,
    ],
    false: [
    ]
  },
  getNoteComparisons,

])

export const expandComparisonsClicked = [
  toggle(state`notes.${props`type`}.${props`id`}.expanded`)
]

export const cancelNoteButtonClicked = [
  set(state`app.view.editing`, false),
  unset(state`notes.selected_note`),
  unset(state`notes.${props`type`}.${props`id`}`)
]

export const toggleNoteDropdown = [
  set(state`app.view.note_dropdown.note`, props`id`),
  toggle(state`app.view.note_dropdown.visible`),
];

export const editNoteButtonClicked = [
  set(state`app.view.editing`, true),
	set(state`notes.selected_note.id`, props`id`),
	set(state`notes.selected_note.type`, props`type`),
  toggleNoteDropdown,
]

export const tagAdded = [
  set(state`app.model.tag_input_text`, ''),
	addTagToNote, {
		error: [
			set(state`notes.${props`type`}.${props`id`}.tag_error`, props`message`),
      wait(2000), {
				continue: [
    			unset(state`notes.${props`type`}.${props`id`}.tag_error`),
				]
			}
		],
		success: [
	    addTagToAllTagsList, 
		]
	},
];

export const tagRemoved = [
  unset(state`notes.${props`type`}.${props`id`}.tags.${props`idx`}`),
	removeTagFromAllTagsList,
];

export const noteListClicked = [
	unset(state`notes.selected_note`),
  set(state`app.view.editing`, false),
];

export const exitNoteEditMode = [
];

export const tabClicked = [
  set(state`notes.tab`, props`tab`),
];

export const unwatchNote = sequence('notes.unwatchNote', [
])

export const deleteNoteButtonClicked = [
	set(props`note`, state`notes.${props`type`}.${props`id`}`),
	set(state`app.view.editing`, false),
	checkTags,
	({state, props}) => ({
		path: '/bookmarks/notes/'+props.id,
    connection_id: state.get('notes.connection_id'),
	}),
	oada.oadaDelete,
	unwatchNote,
	fetch,
	unset(state`notes.selected_note`),
];


export const noteTextChanged = [
  set(state`notes.${props`type`}.${props`id`}.text`, props`value`)
];

export const tagTextChanged = [
	unset(state`notes.${props`type`}.${props`id`}.tag_error`),
  set(state`app.model.tag_input_text`, props`value`),
];

export const addNoteButtonClicked = [
//TODO: perhaps restrict whether a note can be added while another is editted
	unset(state`notes.selected_note`),
	createNote, 
	({props, state}) => ({
		data: props.note,
		type: 'application/vnd.oada.yield.1+json',
    path: '/bookmarks/notes/'+props.note.id,
    connection_id: state.get('notes.connection_id'),
		tree,
	}),
  oada.put,
  fetch,
	equals(state`notes.tab`), {
		0: [set(props`type`, 'notes')],
		1: [set(props`type`, 'fields')],
		2: [],
	},
	set(state`notes.selected_note.id`, props`note.id`),
	set(state`notes.selected_note.type`, props`type`),
	set(state`app.view.editing`, true),
];

export const showHideButtonClicked = [
  changeShowHide, 
];

export const noteClicked = [
	map.mapToNotePolygon,
  when(state`app.view.editing`), {
    true: [],
		false: [
			set(state`notes.selected_note.id`, props`id`),
			set(state`notes.selected_note.type`, props`type`),
    ],
  },
];

function mapOadaToRecords({state, props}) {
	state.set('map.layers.Notes', {visible: true});
  state.set('notes.notes', {});
  let id = state.get('notes.connection_id');
	let notes =  state.get(`oada.${id}.bookmarks.notes`);
	return Promise.map(Object.keys(notes || {}), (key) => {
		// ignore reserved keys used by oada
		if (key.charAt(0) !== '_') state.set(`notes.notes.${key}`, notes[key])
		return
	}).then(() => { return})
}

function getTagsList({state}) {
	let tags = {}
	let notes = state.get(`notes.notes`);
	return Promise.map(Object.keys(notes || {}), (key) => {
		return Promise.map(notes[key].tags || [], (tag) => {
			tags[tag] = tags[tag] || {text: tag, references: 0}
			tags[tag].references++
			return
		})
	}).then(() => {
		state.set(`app.model.tags`, tags)
		return
	})
}

function changeShowHide ({props, state}) {
  var geometryVisible = state.get(`notes.${props`type`}.${props.id}.geometry`, 'visible');
  if (geometryVisible) {
    state.set(`notes.${props`type`}.${props.id}.geometry.visible`, false);
  } else {
    state.set(`notes.${props`type`}.${props.id}.geometry.visible`, true);
  }
};

function createNote({props, state}) {
  var note = {
    created: Date.now(),
    id: uuid.v4(),
    text: '',
    tags: [],
    fields: {},
    geometry: { 
      visible: true,
    },
    color: rmc.getColor(),
    completions: [],
    stats: {},
  };
  note.font_color = getFontColor(note.color);
	return { note }
};

function getFontColor(color) {
  var L = Color(color).luminosity();
  if (L > 0.179) {
    return '#000000';
  } else {
    return '#ffffff';
  }
}

function checkTags ({props, state}) {
  var allTags = state.get(`app.model.tags`);
	var noteTags = state.get(`notes.${props.type}.${props.id}.tags`);
	if (!noteTags) return
  noteTags.forEach((tag) => {
    if (allTags[tag].references <= 1) {
      state.unset(`app.model.tags`, tag); 
    }
  })
}

function addTagToNote({props, state, path}) {
	var tags = state.get(`notes.${props.type}.${props.id}.tags`);
	props.text = props.text.toLowerCase().trim();
	if (props.text === '') {
		return path.error({message: 'Tag text required'})
	} else if (tags.indexOf(props.text) > -1) {
		return path.error({message: 'Tag already applied'})
	} else {
		state.push(`notes.${props.type}.${props.id}.tags`, props.text);
		return path.success()
	}
};

function addTagToAllTagsList({props, state}) {
  var allTags = state.get(`app.model.tags`);
  if (!allTags[props.text]) {
    state.set(`app.model.tags.${props.text}`, { 
      text: props.text,
      references: 1
    });
  } else {
    state.set(`app.model.tags.${props.text}.references`, allTags[props.text].references+1);
  }
};

function removeTagFromAllTagsList({props, state}) {
  var refs = state.get(`app.model.tags.${props.tag}.references`);
  if (refs === 0) {
		state.unset(`app.model.tags.${props.tag}`);
  } else {
    state.set(`app.model.tags'.${props.tag}.references`, refs - 1);
  }
};

function mapFieldsToNotes({state, props}) {
	let fields = state.get('fields.records');
	let notes = {};
	return Promise.map(Object.keys(fields || {}), (key) => {
	let bbox = computeBoundingBox(fields[key].boundary.geojson);           
		return notes[key] = {
			created: Date.now(),
			id: key,
			text: key,
			tags: [],
			geometry: {
				geojson: fields[key].boundary.geojson,
				centroid:[
					(bbox.north + bbox.south)/2, 
					(bbox.east + bbox.west)/2
				],
				visible: true,
				bbox,
				area: gjArea.geometry(fields[key].boundary.geojson)/4046.86,
			},
			color: rmc.getColor(),
			completions: [],
			stats: {},
		};
	}).then(() => {
		state.set(`notes.fields`, notes)
		return
	})
}

function getNoteComparisons({props, state}) {
	var notes = state.get('notes.notes');
  var fields = state.get('notes.fields');
  if (fields && notes) {
    return Promise.map(Object.keys(notes), (noteId) => {
      if (notes[noteId].geometry.geojson.coordinates[0].length > 3) {
        return Promise.map(Object.keys(fields), (fieldId) => {
          if (polygonsIntersect(fields[fieldId].geometry.geojson.coordinates[0], notes[noteId].geometry.geojson.coordinates[0])) {
            if (fields[fieldId].stats) {
              return Promise.map(Object.keys(fields[fieldId].stats), (crop) => {
								if (notes[noteId].stats[crop]) {
									var fieldStats = fields[fieldId].stats[crop];
                  var noteStats = notes[noteId].stats[crop];
                  var differenceMeans = fieldStats.yield.mean - noteStats.yield.mean;
                  var standardError = Math.pow((fieldStats.yield.variance/fieldStats.count) + (noteStats.yield.variance/noteStats.count), 0.5);
                  var zScore = Math.abs(differenceMeans)/standardError;
                  var pValue = zScore > 0 ? 2*(1 - dist.cdf(zScore)) : 2*(dist.cdf(zScore))
                  var comparison = {
                    differenceMeans,
                    standardError,
                    zScore,
                    pValue,
                    signficantDifference: pValue < 0.05
                  }
                  state.set(`notes.fields.${fieldId}.notes.${noteId}.${crop}.comparison`, comparison);
                  state.set(`notes.notes.${noteId}.fields.${fieldId}.${crop}.comparison`, comparison);
                  return
                } else return
              })
            } else return
          } else return
        })
      } else return
    }).then((result) => {
      return
		}).catch((error) => {
			console.log(error)
      return
		})
  } else return
}
