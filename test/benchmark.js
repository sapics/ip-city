var assert = require('assert');
var t1 =+ new Date();
var geoip = require('../lib/geoip');
var t2 =+ new Date();

var t3 =+ new Date();
var geoipLite = require('geoip-lite');
var t4 =+ new Date();

var utils = require('../lib/utils');
if (process.argv.length > 2) {
	console.dir(geoip.lookup(process.argv[2]));
	var t3 =+ new Date();
	console.log('Startup: %dms, exec: %dms', t2 - t1, t3 - t2);
	process.exit();
}

var f = [];
var ip;
var n = 1000000;
var nf = [];
var r;
var ips = []
var minipv4 = utils.aton4('1.0.0.0'), maxipv4 = utils.aton4('224.0.0.0');
var minipv6 = utils.aton6('2001:200::'), maxipv6 = utils.aton6('2c0f:ffff::');
for (var i = 0; i < n; i++) {
	if (i & 1) {
		ip = Math.round((Math.random() * 0xff000000)+ 0xffffff);
		if(ip < minipv4 || ip > maxipv4) continue;
		ip = utils.ntoa4(ip);
	} else {
		ip = '2001:' +
			Math.round(Math.random()*0xffff).toString(16) + ':' +
			Math.round(Math.random()*0xffff).toString(16) + ':' +
			Math.round(Math.random()*0xffff).toString(16) + ':' +
			Math.round(Math.random()*0xffff).toString(16) + ':' +
			Math.round(Math.random()*0xffff).toString(16) + ':' +
			Math.round(Math.random()*0xffff).toString(16) + ':' +
			Math.round(Math.random()*0xffff).toString(16) + '';
		var ipn = utils.aton6(ip);
		if(ipn < minipv6 || ipn > maxipv6) continue;
	}

	if(utils.isPrivateIP(ip)) continue;

	ips.push(ip);
}

n = ips.length;
var ts =+ new Date();
for(var ip of ips){
	r = geoip.lookup(ip);
}
var te =+ new Date();

console.log("geoip-country")
console.log("%d ips %d ms (%s ip/s) (%s ms/ip)", n, te-ts, (n*1000 / (te-ts)).toFixed(3), ((te-ts) / n).toFixed(6));
console.log("Took %d ms to startup", t2 - t1);


var ts =+ new Date();
for(var ip of ips){
	r = geoipLite.lookup(ip);
}
var te =+ new Date();

console.log("geoip-lite")
console.log("%d ips %d ms (%s ip/s) (%s ms/ip)", n, te-ts, (n*1000 / (te-ts)).toFixed(3), ((te-ts) / n).toFixed(6));
console.log("Took %d ms to startup", t4 - t3);
