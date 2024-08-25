function checkMemory(){
	const used = process.memoryUsage()
	const messages = []
	for (let key in used) {
	  messages.push(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
	}
	console.log(new Date(), messages.join(', '))
}

console.log('Memory usage before loading library')
checkMemory();

var timeStart = Date.now();
var geoip = require('../lib/geoip');
var timeEnd = Date.now();
console.log('Library load time: %d ms', timeEnd - timeStart);

console.log('Memory usage after loading library')
checkMemory();
