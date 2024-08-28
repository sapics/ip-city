const fs = require('fs')
const path = require('path')
var utils = require('../lib/utils')

var n = 1000000;
var ip;
var ips = []
var minipv4 = utils.aton4('1.0.0.0'), maxipv4 = utils.aton4('224.0.0.0');
var minipv6 = utils.aton6('2001:200::'), maxipv6 = utils.aton6('2c0f:ffff::');
for (var i = 0;; ++i) {
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
	if(ips.length >= n) break;
}

n = ips.length;

fs.writeFileSync(path.resolve(__dirname, 'ips.txt'), ips.join('\n'))
