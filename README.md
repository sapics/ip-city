# geoip-country [![NPM version](https://badge.fury.io/js/geoip-country.svg)](https://badge.fury.io/js/geoip-country)

Less memory usage version of [geoip-lite](https://github.com/bluesmoon/node-geoip) by limiting to country information.
This product includes GeoLite2 ipv4 and ipv6 country data which created by MaxMind, available from https://www.maxmind.com.
The database of this product **updates twice a weekly**.

**You should read this README and the LICENSE and EULA files carefully before deciding to use this product.**<br>
**After v4, LICENSE for the database was changed. If you need to use this product with previous LICENSE, please use v3.**


## Synopsis

```javascript
var geoip = require('geoip-country');

var ip = "207.97.227.239";
var geo = geoip.lookup(ip);

console.log(geo);
{
  country_code: 'US', // "2 letter" ISO-3166-1 alpha-2 country code
  country: 'US',      // alias of country_code
  country_name: 'United States',
  country_name_native: 'United States',
  phone: [ 1 ],
  continent: 'NA',
  capital: 'Washington D.C.',
  currency: [ 'USD', 'USN', 'USS' ],
  languages: [ 'en' ],
  continent_name: 'North America'
}
```


## Installation

  $ npm install geoip-country


## API

geoip-country is completely synchronous.  There are no callbacks involved.  All blocking file IO is done at startup time, so all runtime
calls are executed in-memory and are fast.  Startup may take up to 20ms while it reads into memory and indexes data files.

### Looking up an IP address ###

If you have an IP address in dotted quad notation, IPv6 colon notation, or a 32 bit unsigned integer (treated
as an IPv4 address), pass it to the `lookup` method.  Note that you should remove any `[` and `]` around an
IPv6 address before passing it to this method.

```javascript
var geo = geoip.lookup(ip);
```

If the IP address was found, the `lookup` method returns an object with the following structure:

```javascript
{
  country_code: 'CN',
  country: 'CN',
  country_name: 'China',
  country_native_name: '中国'
  phone: [ 86 ],
  capital: 'Beijing',
  currency: [ 'CNY' ],
  languages: [ 'zh' ],
  continent: 'AS',
  continent_name: 'Asia',
}
```

If the IP address was not found, the `lookup` returns `null`

We use two databases. One is `geolite2 country database` for linking `ip address` to `country_code`.
Second database is [Countries](https://github.com/annexare/Countries) database which is published under MIT License for linking `country_code` to `country_name`, `capital`, `continent`, etc.


### Update database API [Added at v4.1.0]

You can update country database with `updateDatabase` method.

```javascript
  geoip.updateDatabase(license_key, callback);
```

`license_key` is a license key which provided by MaxMind.
You can get GeoLite2 license key as [instructions](https://dev.maxmind.com/geoip/geoip2/geolite2/).

By setting the environmental variable `GEOLITE2_LICENSE_KEY`, you can update with

```javascript
  geoip.updateDatabase(callback);
```


## Built-in Updater

This package contains an update script that can pull the files from MaxMind and handle the conversion from CSV.
A npm script alias has been setup to make this process easy. Please keep in mind this requires internet and MaxMind
rate limits that amount of downloads on their servers.

```shell
npm run updatedb --license_key=YOUR_GEOLITE2_LICENSE_KEY
	or
GEOLITE2_LICENSE_KEY=YOUR_GEOLITE2_LICENSE_KEY node scripts/updatedb.js
```

_YOUR_GEOLITE2_LICENSE_KEY should be replaced by a valid GeoLite2 license key. Please [follow instructions](https://dev.maxmind.com/geoip/geoip2/geolite2/) provided by MaxMind to obtain a license key._


## Custom Directory for database files

You can store the database files in custom directory with the environment variable `GEODATADIR` or CLI parameter `--geodatadir=XXXXX`.
For creating or updating the database files in custom directory, you need to run built-in updater as documented above with setting the environment variable `GEODATADIR` or CLI parameter `--geodatadir=XXXXX`.
If you have no write-access to the `geoip-country` directory, it would be better to set the environment `GEOTMPDATADIR` or CLI parameter `--geotmpdatadir=YYYYY` for temporary directory when updating the database files.


## Use ip-location-db database

You can use [ip-location-db](https://github.com/sapics/ip-location-db) database with the environment variable `IP_LOCATION_DB` or CLI parameter `--ip_location_db=XXXXX`. For example, if you want to use `geolite2-geo-whois-asn-country`, you can update the database by executing `npm run updatedb --ip_location_db=geolite2-geo-whois-asn`.

If you cannot use `geolite2` licence for your use-case, the licence issue can be circumvented by replacing the database in [ip-location-db](https://github.com/sapics/ip-location-db), as there is also a [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed) license database in [ip-location-db](https://github.com/sapics/ip-location-db).


## License and EULA

Please carefully read the LICENSE and EULA files. This package comes with certain restrictions and obligations, most notably:
 - You cannot prevent the library from updating the databases.
 - You cannot use the GeoLite2 data:
   - for FCRA purposes,
   - to identify specific households or individuals.

You can read [the latest version of GeoLite2 EULA](https://www.maxmind.com/en/geolite2/eula).
GeoLite2 database is provided under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) by [MaxMind](https://www.maxmind.com/), so, you must create attribusion to [MaxMind](https://www.maxmind.com/) for using GeoLite2 database.


The license for the software itself is an Apache License 2.0 by [geoip-country](https://github.com/sapics/geoip-country).
This software is created from the repository [geoip-lite/node-geoip](https://github.com/geoip-lite/node-geoip).
The software license of [geoip-lite/node-geoip](https://github.com/geoip-lite/node-geoip) is Apache License 2.0.


## References
  - <a href="https://www.maxmind.com/en/geolite2/eula">GeoLite2 EULA</a>
  - <a href="https://www.maxmind.com/app/iso3166">Documentation from MaxMind</a>
  - <a href="https://en.wikipedia.org/wiki/ISO_3166">ISO 3166 (1 & 2) codes</a>
  - <a href="https://en.wikipedia.org/wiki/List_of_FIPS_region_codes">FIPS region codes</a>
  - <a href="https://github.com/annexare/Countries">annexare/Countries</a>
