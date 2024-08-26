# geoip-city [![NPM version](https://badge.fury.io/js/geoip-city.svg)](https://badge.fury.io/js/geoip-city)

A native nodejs API to get geolocation information from ip address.

This library is fork of the [geoip-lite](https://github.com/bluesmoon/node-geoip) which provides a very fast ip to geolocation API by loading the ip to geolocation database into memory.
However, because the database contains city and coordinate information, etc., its size exceeds 120 MB, which means that it uses a lot of memory and takes a long time before the first execution.

`geoip-city` reduces memory usage and faster startup and faster lookup by database customization.
Futhermore, we add the other information `capital`, `continent_name`, `languages`, etc., from v5.
You can check the `test/benchmark.js` after updating `geoip-lite` database.

| benchmark (node v20) | database size | startup time | lookup time |
| ---- | ---- | ---- |  ---- | 
| geoip-city<br>(default) | 37 MB | 40 ms | 0.00151 ms/ip |
| geoip-city<br>(add all custome fields) | 72 MB | 52 ms | 0.00158 ms/ip |
| geoip-lite | 124MB | 52 ms | 0.00237 ms/ip |


This product includes GeoLite2 ipv4 and ipv6 city data created by [MaxMind](http://maxmind.com/).
The database of this product **updates twice a weekly**.

**You should read this README and the LICENSE and EULA files carefully before deciding to use this product.**<br>
**After v4, LICENSE for the GeoLite2 database was changed. If you need to use this product with previous LICENSE, please use v3.**


## Synopsis

```javascript
var geoip = require('geoip-city');

var ip = "207.97.227.239";
var geo = geoip.lookup(ip);

console.log(geo);
{
  country: 'FR',
  region1: 'NOR',
  state1: 'Normandy',
  region2: '27', 
  state2: 'Eure',
  city: 'Heudicourt',
  timezone: 'Europe/Paris',
  latitude: 49.3335, // custom field
  longitude: 1.6566, // custom field
  area: 5,           // custom field
  postcode: 27860,   // custom field
  name: 'France',
  native: 'France',
  phone: [ 33 ],
  continent: 'NA',
  capital: 'Paris',
  currency: [ 'EUR' ],
  languages: [ 'fr' ],
  continent_name: 'Europe'
}
```


## Installation

```bash
$ npm i geoip-city
```


## API

geoip-city is completely synchronous. There are no callbacks involved. All blocking file IO is done at startup time, so all runtime
calls are executed in-memory and are fast. Startup may take up to 50ms while it reads into memory and indexes data files.


### Looking up an IP address ###

If you have an IP address in dotted quad notation, IPv6 colon notation, or a 32 bit unsigned integer (treated
as an IPv4 address), pass it to the `lookup` method.

```javascript
var geo = geoip.lookup(ip);
```

If the IP address was not found, the `lookup` returns `null`.

We use two databases for getting `ip address` to `geo` data.
First is `GeoLite2 country` database for linking `ip address` to `geo-location`.
Second database is [Countries](https://github.com/annexare/Countries) database which is published under MIT License for linking `country` to `languages`, `capital`, `continent`, etc.


### Field description

Note that as far as possible, the same field names as in `geoip-lite` are used, but some different field names are used.

| `geoip-coutry` | `geoip-lite` | description |
| ---- | ---- | ---- |
| country | country | "2 letter" country code defined at ISO-3166-1 alpha-2 |
| region1 | region | region code which is short code for state1 |
| state1  | ❌️ | first sub divition name |
| region2 | ❌️ | region code which is short code for state2 |
| state2  | ❌️ | second sub divition name |
| metro   | metro | Geolocation target code from Google |
| city    | city | city name |
| timezone | timezone | The time zone associated with location |
| latitude<br>custom field | ll[0] | geographic coordinate |
| longitude<br>custom field | ll[1] | geographic coordinate |
| area<br>custom field | area | The radius in kilometers around the specified location where the IP address is likely to be |
| postcode<br>custom field | ❌️ | postcode |
| name | ❌️ | country name from `country code` |
| native | ❌️ | country name in native language from `country code` |
| phone | ❌️ | country calling codes from `country code` |
| continent | ❌️ | continent short code from `country code` |
| continent_name | ❌️ | continent name from `country code` |
| capital | ❌️ | capital name from `country code` |
| currency | ❌️ | List of commonly used currencies from `country code` |
| languages | ❌️ | List of commonly used languages from `country code` |


## Built-in Updater

This package contains an update script that can pull the files from MaxMind and handle the conversion from CSV.
A npm script alias has been setup to make this process easy. Please keep in mind this requires internet and MaxMind
rate limits that amount of downloads on their servers.

```bash
npm run updatedb --license_key=YOUR_GEOLITE2_LICENSE_KEY
	or
GEOLITE2_LICENSE_KEY=YOUR_GEOLITE2_LICENSE_KEY node scripts/updatedb.js
```

_YOUR_GEOLITE2_LICENSE_KEY should be replaced by a valid GeoLite2 license key. Please [follow instructions](https://dev.maxmind.com/geoip/geoip2/geolite2/) provided by MaxMind to obtain a license key._


### Update database API [Added at v4.1.0]

You can update city database with `updateDatabase` method.

```javascript
  geoip.updateDatabase(license_key, callback);
```

`license_key` is a license key which provided by MaxMind.
You can get GeoLite2 license key as [instructions](https://dev.maxmind.com/geoip/geoip2/geolite2/).

By setting the environmental variable `GEOLITE2_LICENSE_KEY`, you can update with

```javascript
  geoip.updateDatabase(callback);
```


## Customize database fields

You can add fields `latitude`, `longitude`, `area`, `postcode` with the environmental variable `GEO_ADD_FIELDS=latitude,longitude,area,postcode` or CLI parameter `--geoip_add_fields=latitude,longitude,area,postcode`.
Note that when using `geoip.lookup()` and updating the database, the fields must always be the same.


## Change language of fields city, state1, state2

You can change the language of some fields by setting CLI parameter `--geoip_language=ja` or environment `GEOIP_LANGUAGE=ja` when updating the database.
Supported languages are `de`, `en`, `es`, `fr`, `ja`, `pt-BR`, `ru`, `zh-CN`. (default is `en`)


## GeoIP2 database

You can use GeoIP2 paid database which has more accurate version of GeoLite2.
Please set CLI parameter `--geoip_series=GeoIP2` or environment `GEOIP_SERIES=GeoIP2` when updating the database.


## Custom Directory for database files

You can store the database files in custom directory with the environment variable `GEOIP_DATADIR` or CLI parameter `--geoip_datadir=XXXXX`.
For creating or updating the database files in custom directory, you need to run built-in updater as documented above with setting the environment variable `GEOIP_DATADIR` or CLI parameter `--geoip_datadir=XXXXX`.
If you have no write-access to the `geoip-city` directory, it would be better to set the environment `GEOIP_TMPDATADIR` or CLI parameter `--geoip_tmpdatadir=YYYYY` for temporary directory when updating the database files.


## License and EULA

Please carefully read the LICENSE and EULA files. This package comes with certain restrictions and obligations, most notably:
 - You cannot prevent the library from updating the databases.
 - You cannot use the GeoLite2 data:
   - for FCRA purposes,
   - to identify specific households or individuals.

You can read [the latest version of GeoLite2 EULA](https://www.maxmind.com/en/geolite2/eula).
GeoLite2 database is provided under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) by [MaxMind](https://www.maxmind.com/), so, you must create attribusion to [MaxMind](https://www.maxmind.com/) for using GeoLite2 database.


The license for the software itself is an Apache License 2.0 by [geoip-city](https://github.com/sapics/geoip-city).
This software is created from the repository [geoip-lite/node-geoip](https://github.com/geoip-lite/node-geoip).
The software license of [geoip-lite/node-geoip](https://github.com/geoip-lite/node-geoip) is Apache License 2.0.


## References
  - <a href="https://www.maxmind.com/en/geolite2/eula">GeoLite2 EULA</a>
  - <a href="https://www.maxmind.com/app/iso3166">Documentation from MaxMind</a>
  - <a href="https://en.wikipedia.org/wiki/ISO_3166">ISO 3166 (1 & 2) codes</a>
  - <a href="https://en.wikipedia.org/wiki/List_of_FIPS_region_codes">FIPS region codes</a>
  - <a href="https://github.com/annexare/Countries">annexare/Countries</a>
