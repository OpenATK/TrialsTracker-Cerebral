import uuid from 'uuid';
import rmc from 'random-material-color';
import Color from 'color';

var stateTree = {

  model: {
    user: {},
    'yield_data_index': {},
    notes: initial_notes(),
    tags: initial_tags(),
    fields: {}, 
  },
  view: {
    server: {
      offline: true,
      domain: '',
      token: {},
    },
    map: {
      moving: false,
      geohashes_to_draw: {},
      geohashes_on_screen: {},
      current_location: {},
      map_location: [],
      map_zoom: 15,
      crop_layers: {},
      $isLoading: true,
      drawing_note_polygon: false,
      dragging_marker: false,
    },
    tag_input_text: '',
    crop_dropdown_visible: false,
    notifications: [],
    sort_mode: 'all', //'all' 'fields' 'tags'
    drag_mode: false,
    editing_note: false,
    domain_modal: {
      text: 'yield.oada-dev.com',
      visible: false,
    }, 
    legends: {
      corn: [{
        value: 130,
        color: {
          r: 255,
          g: 0,
          b: 0, 
          a: 255,
        },
      },{
        value: ((225-130)/2)+130,
        color: {
          r: 255,
          g: 255,
          b: 0,
          a: 255,
        },
      },{ 
        value: 225,
        color: {
          r: 0,
          g: 255,
          b: 0,
          a: 255,
        },
      }],

      soybeans: [{ 
        value: 30,
        color: { 
          r: 255,
          g: 0,
          b: 0,
          a: 255,
        },
      },{
        value: ((65-30)/2)+30,
        color: {
          r: 255,
          g: 255,
          b: 0,
          a: 255,
        }, 
      },{
        value: 65,
        color: {
          r: 0,
          g: 255,
          b: 0,
          a: 255,
        },
      }],
      wheat: [{ 
        value: 40,
        color: { 
          r: 255,
          g: 0,
          b: 0,
          a: 255,
        },
      },{
        value: ((80-40)/2)+40,
        color: {
          r: 255,
          g: 255,
          b: 0,
          a: 255,
        }, 
      },{
        value: 80,
        color: {
          r: 0,
          g: 255,
          b: 0,
          a: 255,
        },
      }],
    },
  }
}; 

function initial_tags() {
  var text1 = 'herbicide';
  var text2 = 'low area';
  var tags_list = {};
  tags_list[text1] = {text: text1, references: 1};
  tags_list[text2] = {text: text2, references: 1};
  return tags_list;
}

function initial_notes() { 
  var notes_list = {};
  for (var i = 1; i<3;i++) {
    var time = new Date(2015, 5, 17, 15);
    var col = '#'+(Math.round(Math.random()* 127) + 127).toString(16)+(Math.round(Math.random()* 127) + 127).toString(16)+(Math.round(Math.random()* 127) + 127).toString(16);
    var note = {
      time: time,
      text: 'n-serve test',
      tags: [],//['application', 
      fields: {},
      area: 12.439745214592033,
      color: '#E91E63',
      stats: {
        corn: { 
          area_sum: 14.017808080808045,
          weight_sum: 3089.313640255855,
          count: 5167,
          mean_yield: 220.38492911637678, 
        },
      },
      geometry: { 
        geojson: {
         "type":"Polygon",
         "coordinates":[[
            [-86.18823766708374, 40.98551896940516],
            [-86.19110226631165, 40.98552706833876],
            [-86.1913275718689, 40.98535699052452],
            [-86.19170308113097, 40.985138318404545],
            [-86.19222879409789, 40.985178813296294],
            [-86.19241118431091, 40.98515451636424],
            [-86.19241118431091, 40.984895348531936],
            [-86.19245409965515, 40.98470097198927],
            [-86.19280815124512, 40.984514693931644],
            [-86.1928939819336, 40.98437700981173],
            [-86.19293689727783, 40.984182631741305],
            [-86.18823766708374, 40.9841988299357]
          ]]
        },
        bbox: {
          north: 40.98552706833876,
          south: 40.9841988299357,
          east: -86.18823766708374,
          west: -86.19293689727783,
        },
        centroid: [40.9848629491, -86.1905872822], 
        visible: true,
      },
      tags_modal_visibility: false,
      completions: [],
      selected: false,
    };
    if (i === 2) {
      var time = new Date(2015, 9, 22, 18);
      var col = '#cce6ff';
      var text = 'low area';
      note = {
        text: 'rootworm damage',
        time: time,
        tags: ['low area'],
        area: 0.9776069561840566,
        color: '#8BC34A',
        stats: {
          corn: {
            area_sum: 0.9599224747474746,
            weight_sum: 123.93012176598845,
            count: 346,
            mean_yield: 129.1043027183946, 
          },
        },
        fields: {},
        geometry: {
          geojson: {
            "type":"Polygon",
            "coordinates":[[
              [-86.20242118835448, 40.96346998610047],
              [-86.2027645111084, 40.96377784775565],
              [-86.20293617248535, 40.9637292381161],
              [-86.20330095291138, 40.963680628440756],
              [-86.20330095291138, 40.96338896963673],
              [-86.20340824127196, 40.9632107330664],
              [-86.20280742645264, 40.96311351291606]
            ]]
          },
          bbox: {
            north: 40.96377784775565,
            south: 40.96311351291606,
            east: -86.20242118835448,
            west: -86.20340824127196,
          },
          centroid: [40.963445,-86.2029147], 
          visible: true,
        },
        tags_modal_visibility: false,
        completions: [],
        selected: false,
      }
    }
    note.order = i;
    note.id = uuid.v4();
    note.font_color = getFontColor(note.color); 
    notes_list[note.id] = note;
  }
  return notes_list;
}

function getFontColor(color) {
  var L = Color(color).luminosity();
  if (L > 0.179) {
    return '#000000';
  } else {
    return '#ffffff';
  }
}

export default stateTree; 
