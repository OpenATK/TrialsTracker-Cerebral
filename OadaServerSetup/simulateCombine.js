var _ = require('lodash');
var md5 = require('md5');
var urlLib = require('url');
var csvjson = require('csvjson');
var uuid = require('uuid');
var gh = require('ngeohash');
var rr = require('recursive-readdir');
var fs = require('fs');
var oada = require('../src/oadaLib')
var PouchDB = require('pouchdb');
var Promise = require('bluebird');
var uuid = require('uuid');
var axios = require('axios');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var rawData = {};
var tiledMaps = {};
var tradeMoisture = {
  soybeans:  13,
  corn: 15,
  wheat: 13,
};
var TOKEN = 'def'
var DOMAIN = 'vip3.ecn.purdue.edu'
var sampleRate = 1; // msg/s
var knownTree = {};

var setupTree = {
	bookmarks: {
		_type: 'application/vnd.oada.harvest.1+json',
		_rev: '0-0',
		harvest: {
			_type: 'application/vnd.oada.harvest.1+json',
			_rev: '0-0',
			'as-harvested': {
				_type: 'application/vnd.oada.as-harvested.1+json',
				_rev: '0-0',
				'yield-moisture-dataset': {
					_type: 'application/vnd.oada.as-harvested.yield-moisture-dataset.1+json',
					_rev: '0-0',
					'crop-index': {
						'*': {
							_type: 'application/vnd.oada.as-harvested.yield-moisture-dataset.1+json',
							_rev: '0-0',
							'geohash-length-index': {
								'*': {
									_type: 'application/vnd.oada.as-harvested.yield-moisture-dataset.1+json',
									_rev: '0-0',
									'geohash-index': {
										'*': {
											_type: 'application/vnd.oada.as-harvested.yield-moisture-dataset.1+json',
										}
									}
								}
							}
						}
					}
				},
			},
		},
	}
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

readData('./flow_rate.csv')

function readData(file) {
  var options = { delimiter : ','};
	var data = fs.readFileSync(file, { encoding: 'utf8'});
	var csvData = csvjson.toObject(data, options);
	return processData(csvData);
}

async function processData(data) {
	//	return Promise.mapSeries(data, (row, i) => {
	await asyncForEach(data, async (row, i) => {
    geohash = gh.encode(row.lat, row.lon, 7);
    var cropType = 'Wheat';
		cropType = cropType.replace(/\w\S*/g, txt => txt.toLowerCase());

		let template = {
			area: { units: 'acres' },
			weight: { units: 'bushels' },
			moisture: {
				units: '%H2O',
				value: tradeMoisture[cropType]
			},
			location: { datum: 'WGS84' },
			cropType,
		}
		let template_id = md5(JSON.stringify(template));

    // Add the data point
    var id = uuid();
    var pt = {
      id,
      template: template_id,
			//moisture: row['Moisture(%)'],
      location: {
        lat: row.lat,
        lon: row.lon,
      },
    };

		var val = +row.data; // bu/s
		//console.log(val)
		pt.speed = row.speed;
    pt.area = (row.speed*5280/3600)*(row['Swath Width(ft)'] || 30)/43560.0;
		//    pt.weight = val*pt.area;
		pt.weight = val * sampleRate;

    if (isNaN(pt.weight)) {
      console.log('````````````NEW ONE``````````');
      console.log(val);
      console.log(row['Speed(mph)']);
      console.log(row['Swath Width(ft)']);
      console.log(pt.area);
			console.log(pt.weight);
			return
		}
		var id = md5(JSON.stringify(pt));
		pt.id = id;

		let stuff = {
			data: {
				[id]: pt
			}
		}

		let url = 'https://'+DOMAIN+'/bookmarks/harvest/as-harvested/yield-moisture-dataset/crop-index/'+cropType+'/geohash-length-index/geohash-7/geohash-index/'+geohash;
		let dt = (i > 0) ? (row.ts - data[i-1].ts)*1000 : 1000;
			await Promise.delay(dt)
			await oada.smartPut({
				url,
				setupTree,
				token: TOKEN,
				data: stuff
			})
		//		})
	})
}