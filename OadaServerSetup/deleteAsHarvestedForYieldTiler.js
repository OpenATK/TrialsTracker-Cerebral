var harvest = require('./getHarvest.js');
var csvjson = require('csvjson');
var rr = require('recursive-readdir');
var fs = require('fs');
var oada = require('@oada/oada-cache').default;
var Promise = require('bluebird');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var CONNECTION;

var yield_data_directory = process.argv[2] || 'YieldData';
var domain = process.argv[3] || 'vip3.ecn.purdue.edu';
var token = process.argv[4] || 'def';

var tree = {
	'bookmarks': {
		'_type': 'application/vnd.oada.bookmarks.1+json',
		'_rev': '0-0',
		'harvest': {
			'_type': 'application/vnd.oada.harvest.1+json',
			'_rev': '0-0',
			'as-harvested': {
				'_type': 'application/vnd.oada.as-harvested.1+json',
				'_rev': '0-0',
				'yield-moisture-dataset': {
					'_type': 'application/vnd.oada.as-harvested.yield-moisture-dataset.1+json',
					'_rev': '0-0',
					'crop-index': {
						'*': {
							'_type': 'application/vnd.oada.as-harvested.yield-moisture-dataset.1+json',
							'_rev': '0-0',
							'geohash-length-index': {
								'*': {
									'_type': 'application/vnd.oada.as-harvested.yield-moisture-dataset.1+json',
									'_rev': '0-0',
									'geohash-index': {
										'*': {
                      '_type': 'application/vnd.oada.as-harvested.yield-moisture-dataset.1+json',
                      '_rev': '0-0',
										}
									}
								}
							}
						}
					}
				},
      },
			'tiled-maps': {
				'_type': 'application/vnd.oada.tiled-maps.1+json',
				'_rev': '0-0',
        'dry-yield-map': {
          '_type': 'application/vnd.oada.tiled-maps.dry-yield-map.1+json',
					'_rev': '0-0',
					'crop-index': {
						'*': {
            '_type': 'application/vnd.oada.tiled-maps.dry-yield-map.1+json',
							'_rev': '0-0',
							'geohash-length-index': {
								'*': {
                  '_type': 'application/vnd.oada.tiled-maps.dry-yield-map.1+json',
									'_rev': '0-0',
									'geohash-index': {
										'*': {
                      '_type': 'application/vnd.oada.tiled-maps.dry-yield-map.1+json',
										}
									}
								}
							}
						}
					}
				},
			}
		},
	}
};

function readData(directory) {
  return oada.connect({
    domain: 'https://'+domain,
    token: token,
  }).then((conn) => {
    CONNECTION = conn;
    return CONNECTION.resetCache().then(() => {
      rr('./' + directory, (err,files) => {
        files = files.filter((file) => {
          return (file.substr(-3) === 'csv');
        })
        return Promise.map(files, (file) => {
          console.log('Processing ' + file);
          var options = { delimiter : ','};
          var data = fs.readFileSync(file, { encoding : 'utf8'});
          var jsonCsvData = csvjson.toObject(data, options);
          return harvest.getAsHarvested(jsonCsvData).then((asHarvested) => {
            return harvest.deleteAsHarvested(asHarvested, CONNECTION, tree).then(() => {
              return harvest.getTiledMaps(asHarvested, [1,2,3,4,5,6,7]).then((tiledMaps) => {
                return harvest.deleteTiledMaps(tiledMaps, CONNECTION, tree)
              }, {concurrency: 1})
            }, {concurrency: 1})
          }, {concurrency: 1})
        }, {concurrency: 1})
      })
        /*    }).then(() => {
      return CONNECTION.disconnect();*/
    })
  })
}

readData(yield_data_directory)
