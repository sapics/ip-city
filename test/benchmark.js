const fs = require('fs')
const path = require('path')

var isGeoipLite = process.argv.includes('geoip-lite')
var type = isGeoipLite ? 'geoip-lite' : 'this library'

var t1 = Date.now()
var geoip = require(isGeoipLite ? 'geoip-lite' : '../lib/geoip')
var t2 = Date.now()
console.log("Took %d ms to startup", t2 - t1)

try{
	var ips = fs.readFileSync(path.resolve(__dirname, 'ips.txt'), 'utf8').split('\n')
}catch(e){
	console.error("Please run create_ips.js first")
	process.exit(1)
}

var n = ips.length
var r

var ts = Date.now()
for(var ip of ips){
	r = geoip.lookup(ip)
}
var te = Date.now()

console.log(type)
console.log("%d ips %d ms (%s ip/s) (%s μs/ip)", n, te-ts, (n*1000 / (te-ts)).toFixed(3), ((te-ts) / n * 1000).toFixed(3))
