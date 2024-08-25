var geoip = require('../lib/geoip');

module.exports = {
	testLookup: function(test) {
		test.expect(3);

		var actual = geoip.lookup('1.0.2.0');
		test.ok(actual, 'should return data about IPv4.');
		console.log(actual);

		actual = geoip.lookup('2001:4860:b002::68');
		test.ok(actual, 'should return data about IPv6.');
		console.log(actual);

		var actual = geoip.lookup("23.240.63.68");
		test.equal(actual.country, "US");

		test.done();
	},

	testIPv4MappedIPv6: function (test) {
		test.expect(1);

		var actual = geoip.lookup("::ffff:2.29.0.82");
		test.ok(actual, 'should return data about IPv4.');
		console.log(actual);

		test.done();
	}
};
