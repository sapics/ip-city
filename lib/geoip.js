const fs = require('fs');
const net = require('net');
const path = require('path');
const exec = require('child_process').exec;

const utils = require('./utils');
const fsWatcher = require('./fsWatcher');
const async = require('async');
const isCountry = require('../package.json').name.indexOf('country') > 0
var watcherName = 'dataWatcher';

var geodatadir = global.geodatadir || process.env.npm_config_geodatadir || process.env.GEODATADIR;
if(!geodatadir && process.argv) {
	for(var i = 0; i < process.argv.length; ++i){
		if(process.argv[i].indexOf('--geodatadir=') === 0){
			geodatadir = process.argv[i].slice(13);
			break;
		}
	}
}
geodatadir = path.resolve(
	__dirname,
	geodatadir || '../data/'
);

var dataFiles = {
	city: path.join(geodatadir, 'geoip-city.dat'),
	city6: path.join(geodatadir, 'geoip-city6.dat'),
	cityNames: path.join(geodatadir, 'geoip-city-names.dat'),
	country: path.join(geodatadir, 'geoip-country.dat'),
	country6: path.join(geodatadir, 'geoip-country6.dat')
};

var cache4 = {
	firstIP: null,
	lastIP: null,
	lastLine: 0,
	recordSize: 26
};

var cache6 = {
	firstIP: null,
	lastIP: null,
	lastLine: 0,
	recordSize: 34
};

const RECORD_SIZE = 10;
const RECORD_SIZE6 = 18;

var sub1Json;
var sub2Json;
var cityJson;
var countryJson = require('../node_modules/countries-list/countries.min.json');
var continentJson = require('../node_modules/countries-list/continents.min.json');
var timezoneJson;
function getLenStr(str, len){
	while(str.length < len){
		str = '0' + str;
	}
	return str;
}
function setRecord(buffer, geodata, offset, locBuffer){
	var locId = buffer.readUInt32BE(offset, offset + 2);
	if(-1 >>> locId){
		var locOffset = locId * 14;
		geodata.country = locBuffer.toString('utf8', locOffset, locOffset + 2);
		var sub1 = locBuffer.readUInt16BE(locOffset + 2, locOffset + 4);
		var sub2 = locBuffer.readUInt16BE(locOffset + 4, locOffset + 6);
		if(sub1 > 0) geodata.state1 = sub1Json[sub1];
		if(sub2 > 0) geodata.state2 = sub2Json[sub2];
		var metro = locBuffer.readUInt16BE(locOffset + 6, locOffset + 8);
		if(metro > 0) geodata.metro = metro;
		var city = locBuffer.readUInt32BE(locOffset + 8, locOffset + 12);
		if(city > 0) geodata.city = cityJson[city];
		var timezone = locBuffer.readUInt16BE(locOffset + 12, locOffset + 14);
		if(timezone > 0) geodata.timezone = timezoneJson[timezone];
	}
	var lat = buffer.readInt32BE(offset + 2, offset + 6) / 10000;
	var lon = buffer.readInt32BE(offset + 6, offset + 10) / 10000;
	geodata.ll = [lat, lon];
	var postcode1 = buffer.readInt16BE(offset + 10, offset + 12);
	var postcode2 = buffer.readUInt32BE(offset + 12, offset + 16);
	var postcode, tmp;
	if(postcode1 === 0){
		postcode = postcode2.toString(36);
	} else if(postcode1 < 0){
		tmp = (-postcode1).toString(36);
		postcode = postcode2.toString(36);
		postcode = getLenStr(postcode.slice(0, -tmp[1]), tmp[0]-0) + '-' + getLenStr(postcode.slice(-tmp[1]), tmp[1]-0);
	} else if(postcode1 < 10){
		postcode = postcode2.toString(36)
		while(postcode.length < postcode1){
			postcode = '0' + postcode;
		}
	} else if(postcode < 100){
		postcode = getLenStr(postcode2.toString(36), (postcode1[0]-0) + (postcode1[1]-0));
		postcode = postcode.slice(0, postcode1[0]-0) + '-' + postcode.slice(postcode1[0]-0);
	} else {
		postcode = postcode1.toString(36) + postcode2.toString(36);
	}
	geodata.post_code = postcode;
}

function setCountryInfo(geodata){
	geodata.country_code = geodata.country;
	if(countryJson[geodata.country]){
		Object.assign(geodata, countryJson[geodata.country]);
		if(geodata.continent && continentJson[geodata.continent]){
			geodata.continent_name = continentJson[geodata.continent];
		}
	}
	return geodata;
}

function lookup4(ip) {
	var fline = 0;
	var cline = cache4.lastLine;
	var line, offset;
	var buffer = cache4.mainBuffer;
	var recordSize = cache4.recordSize;
	var geodata = {};
	for(;;) {
		line = fline + cline >> 1;
		if(buffer.readUInt32BE(offset = line * recordSize) > ip){
			if(cline === line){
				return null;
			}
			cline = line;
			continue;
		}
		if (buffer.readUInt32BE(offset + 4) < ip) {
			if(fline === line){
				return null;
			}
			fline = line
			continue;
		}
		offset += 8;
		if(recordSize === RECORD_SIZE){
			geodata.country = buffer.toString('utf8', offset, offset + 2);
		} else {
			setRecord(buffer, geodata, offset, cache4.locationBuffer);
		}
		return setCountryInfo(geodata);
	}
}

// XXX We only use the first 8 bytes of an IPv6 address
// This identifies the network, but not the host within
// the network.  Unless at some point of time we have a
// global peace treaty and single subnets span multiple
// countries, this should not be a problem.
function readipv6(start, offset){
	return cache6.mainBuffer.readBigUInt64BE(start + offset * 8);
}

function lookup6(ip) {
	var fline = 0;
	var cline = cache6.lastLine;
	var line, offset;
	var recordSize = cache6.recordSize;
	var geodata = {};

	for(;;) {
		line = fline + cline >> 1;
		if(readipv6(offset = line * recordSize, 0) > ip) {
			if(cline === line) {
				return null;
			}
			cline = line;
			continue;
		}
		
		if(readipv6(offset, 1) < ip) {
			if(fline === line) {
				return null;
			}
			fline = line;
			continue;
		}

		offset += 16;
		if(recordSize === RECORD_SIZE6){
			geodata.country = cache6.mainBuffer.toString('utf8', offset, offset + 2);
		} else {
			setRecord(cache6.mainBuffer, geodata, offset, cache4.locationBuffer);
		}
		return setCountryInfo(geodata);
	}
}

function get4mapped(ip) {
  var ipv6 = ip.toUpperCase();
  var v6prefixes = ['0:0:0:0:0:FFFF:', '::FFFF:'];
  for (var i = 0; i < v6prefixes.length; i++) {
		var v6prefix = v6prefixes[i];
		if (ipv6.startsWith(v6prefix)) {
			return ipv6.substring(v6prefix.length);
		}
  }
  return null;
}

function preload(callback) {
	var datFile, datFile6;
	var datSize, datSize6;
	var locFile, locSize, locBuffer;
	var tmpBuffer, tmpBuffer6
	// preload the data
	var funcs
	if(isCountry){
		funcs = [
			function(cb){
				fs.open(dataFiles.country, 'r', function(err, fd){
					datFile = fd;
					cache4.recordSize = RECORD_SIZE;
					cb(err);
				});
			},
			function(cb){
				fs.open(dataFiles.country6, 'r', function(err, fd){
					datFile6 = fd;
					cache6.recordSize = RECORD_SIZE6;
					cb(err);
				});
			}
		]
	} else {
		funcs = [
			function(cb){
				fs.open(dataFiles.city, 'r', function(err, fd){
					datFile = fd;
					cb(err);
				});
			},
			function(cb){
				fs.open(dataFiles.city6, 'r', function(err, fd){
					datFile6 = fd;
					cb(err);
				});
			},
			function(cb){
				fs.open(dataFiles.cityNames, 'r', function(err, fd){
					locFile = fd;
					cb(err);
				});
			},
			function(cb){
				fs.fstat(locFile, function(err, stats){
					locSize = stats.size;
					locBuffer = Buffer.alloc ? Buffer.alloc(locSize) : new Buffer(locSize);
					cb(err);
				});
			},
			function(cb){
				fs.read(locFile, locBuffer, 0, locSize, 0, function(err){
					fs.close(locFile, function(){}); // close the file
					cb(err);
				});
			},
			function(cb){
				fs.readFile(path.join(geodatadir, 'geoip-city-sub1.json'), 'utf8', function(err, data){
					sub1JsonTmp = JSON.parse(data);
					cb(err);
				});
			},
			function(cb){
				fs.readFile(path.join(geodatadir, 'geoip-city-sub2.json'), 'utf8', function(err, data){
					sub2JsonTmp = JSON.parse(data);
					cb(err);
				});
			},
			function(cb){
				fs.readFile(path.join(geodatadir, 'geoip-city.json'), 'utf8', function(err, data){
					cityJsonTmp = JSON.parse(data);
					cb(err);
				});
			},
			function(cb){
				fs.readFile(path.join(geodatadir, 'geoip-city-timezone.json'), 'utf8', function(err, data){
					timezoneJsonTmp = JSON.parse(data);
					cb(err);
				});
			}
		]
	}

	funcs.push(
		function(cb){
			fs.fstat(datFile, function(err, stats){
				datSize = stats.size;
				cb(err);
			})
		},
		function(cb){
			fs.read(datFile, tmpBuffer, 0, datSize, 0, function(err){
				tmpBuffer = Buffer.alloc ? Buffer.alloc(datSize) : new Buffer(datSize);
				fs.close(datFile, function(){}); // close the file
				cb(err);
			});
		},
		function(cb){
			fs.fstat(datFile6, function(err, stats){
				datSize6 = stats.size;
				cb(err);
			})
		},
		function(cb){
			tmpBuffer6 = Buffer.alloc ? Buffer.alloc(datSize6) : new Buffer(datSize6);
			fs.read(datFile6, tmpBuffer6, 0, datSize6, 0, function(err){
				fs.close(datFile6, function(){});
				cb(err);
			});
		},
		function(cb){
			cache4.mainBuffer = tmpBuffer;
			cache4.lastLine = (datSize / cache4.recordSize) - 1;
			cache4.lastIP = tmpBuffer.readUInt32BE((cache4.lastLine * cache4.recordSize) + 4);
			cache4.firstIP = tmpBuffer.readUInt32BE(0);
		
			cache6.mainBuffer = tmpBuffer6;
			cache6.lastLine = (datSize6 / cache6.recordSize) - 1;
			cache6.lastIP = readipv6(cache6.lastLine * cache6.recordSize , 1);
			cache6.firstIP = readipv6(0, 0);
			if(!isCountry){
				sub1Json = sub1JsonTmp;
				sub2Json = sub2JsonTmp;
				cityJson = cityJsonTmp;
				timezoneJson = timezoneJsonTmp;
				cache4.locationBuffer = locBuffer;
			}
			cb();
		}
	)
	if(callback){
		async.series(funcs, function(err){
			if(err) console.warn(err);
			callback(err);
		});
	} else {
		if(isCountry){
			datFile = fs.openSync(dataFiles.country, 'r');
			cache4.recordSize = RECORD_SIZE;
			datFile6 = fs.openSync(dataFiles.country6, 'r');
			cache6.recordSize = RECORD_SIZE6;
		} else {
			datFile = fs.openSync(dataFiles.city, 'r');
			datFile6 = fs.openSync(dataFiles.city6, 'r');
			locFile = fs.openSync(dataFiles.cityNames, 'r');
			locSize = fs.fstatSync(locFile).size;
			cache4.locationBuffer = locBuffer = Buffer.alloc ? Buffer.alloc(locSize) : new Buffer(locSize);
			fs.readSync(locFile, locBuffer, 0, locSize, 0);
			fs.closeSync(locFile);
			sub1Json = JSON.parse(fs.readFileSync(path.join(geodatadir, 'geoip-city-sub1.json'), 'utf8'));
			sub2Json = JSON.parse(fs.readFileSync(path.join(geodatadir, 'geoip-city-sub2.json'), 'utf8'));
			cityJson = JSON.parse(fs.readFileSync(path.join(geodatadir, 'geoip-city.json'), 'utf8'));
			timezoneJson = JSON.parse(fs.readFileSync(path.join(geodatadir, 'geoip-city-timezone.json'), 'utf8'));
		}

		datSize = fs.fstatSync(datFile).size;
		tmpBuffer = Buffer.alloc ? Buffer.alloc(datSize) : new Buffer(datSize);
		fs.readSync(datFile, tmpBuffer, 0, datSize, 0);
		fs.closeSync(datFile);

		datSize6 = fs.fstatSync(datFile6).size;
		tmpBuffer6 = Buffer.alloc ? Buffer.alloc(datSize6) : new Buffer(datSize6);
		fs.readSync(datFile6, tmpBuffer6, 0, datSize6, 0);
		fs.closeSync(datFile6);

		cache4.mainBuffer = tmpBuffer;
		cache4.lastLine = (datSize / cache4.recordSize) - 1;
		cache4.lastIP = tmpBuffer.readUInt32BE((cache4.lastLine * cache4.recordSize) + 4);
		cache4.firstIP = tmpBuffer.readUInt32BE(0);

		cache6.mainBuffer = tmpBuffer6;
		cache6.lastLine = (datSize6 / cache6.recordSize) - 1;
		cache6.lastIP = readipv6(cache6.lastLine * cache6.recordSize , 1);
		cache6.firstIP = readipv6(0, 0);
	}
}

preload();

module.exports = {
	cmp: utils.cmp,

	lookup: function(ip) {
		var ipv = net.isIP(ip)
		if (ipv === 4) {
			return lookup4(utils.aton4(ip));
		}
		if (ipv === 6) {
			var ipv4 = get4mapped(ip);
			if (ipv4) {
				return lookup4(utils.aton4(ipv4));
			} else {
				return lookup6(utils.aton6n(ip));
			}
		}
		if (typeof ip === 'number') {
			return lookup4(ip);
		}
		return null;
	},

	pretty: function(n) {
		if (typeof n === 'string') {
			return n;
		} else if (typeof n === 'number') {
			return utils.ntoa4(n);
		} else if (n instanceof Array) {
			return utils.ntoa6(n);
		}
		return n;
	},

	/**
	 * @param {string} [license_key]
	 * 		Without license_key, you need to set GEOLITE2_LICENSE_KEY as environmental variable
	 * @param {function} [callback]
	 */
	updateDatabase(license_key, callback){
		var command = 'node ' + path.join(__dirname, '..', 'scripts', 'updatedb.js')
		var options = {encoding: 'utf-8'}
		if(typeof license_key === 'function'){
			callback = license_key
		} else {
			options.env = Object.assign({},
					process.env || {},
					{GEOLITE2_LICENSE_KEY: license_key})
		}
		if(!callback){
			callback = function(){}
		}

		exec(command, options, function(error, stdout, stderr){
			if(error){
				return callback(error, stdout, stderr);
			}
			//Reload data
			preload(callback);
		});
	},

	// Start watching for data updates. The watcher waits one minute for file transfer to 
	// completete before triggering the callback.
	startWatchingDataUpdate: function (callback) {
		fsWatcher.makeFsWatchFilter(watcherName, geodatadir, 60*1000, function () {
			preload(callback);
		});
	},

	// Stop watching for data updates.
	stopWatchingDataUpdate: function () {
		fsWatcher.stopWatching(watcherName);
	}
};
