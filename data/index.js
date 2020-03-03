module.exports = function () {
  require('dotenv').config()
  const Bluebird = require('bluebird')
  const Soda = require('soda-js')
  const axios = require('axios')
  const fs = require('fs')

  const PROMISE_CONCURRENCY = parseInt(process.env.PROMISE_CONCURRENCY)
  const QUERY_LIMIT = parseInt(process.env.QUERY_LIMIT)
  const DATASET_SOURCE = process.env.DATASET_SOURCE
  const DATASET_ID = process.env.DATASET_ID
  const GEOCODE_URL = process.env.GEOCODE_URL
  const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY
  const CITY = process.env.CITY
  const STATE_CODE = process.env.STATE_CODE
  const STATE = process.env.STATE
  const COUNTRY_CODE = process.env.COUNTRY_CODE
  const LOCATION_BOUNDS = process.env.LOCATION_BOUNDS
  const OUTPUT_FILE_NAME = process.env.OUTPUT_FILE_NAME

  console.log('params', {
    PROMISE_CONCURRENCY,
    QUERY_LIMIT,
    DATASET_ID,
    DATASET_SOURCE,
    GEOCODE_URL,
    GEOCODE_API_KEY,
    CITY,
    STATE,
    STATE_CODE,
    COUNTRY_CODE,
    LOCATION_BOUNDS,
    OUTPUT_FILE_NAME
  })

  this.locations = {}
  this.queue = {}

  // https://github.com/johan/world.geo.json/blob/master/countries/USA/CA/San%20Francisco.geo.json?short_path=dc8f7a6
  // let bounding = turf.bbox({"type":"FeatureCollection","properties":{"kind":"state","state":"CA"},"features":[
  //     {"type":"Feature","properties":{"kind":"county","name":"San Francisco","state":"CA"},"geometry":{"type":"MultiPolygon","coordinates":[[[[-122.4281,37.7068],[-122.5048,37.7068],[-122.5158,37.7835],[-122.4062,37.8108],[-122.3569,37.7287],[-122.3898,37.7068]]]]}}
  //   ]})
  //
  // bounding box based on above geom: [-122.5158, 37.7068, -122.3569, 37.8108]
  // used in Geocode query below, see geocode() method

  function getData () {
    return new Promise((resolve, reject) => {
      try {
        const consumer = new Soda.Consumer(DATASET_SOURCE)

        consumer
          .query()
          .withDataset(DATASET_ID)
          .select("locations")
          .where("locations IS NOT NULL")
          .limit(QUERY_LIMIT)
          .getRows()
          .on('success', function (rows) {
            resolve(rows)
          })
          .on('error', function (err) {
            reject(err)
          })
      } catch (e) {
        reject(e)
      }
    })
  }

  function writeToFile (data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(OUTPUT_FILE_NAME, JSON.stringify(data, null, 2), err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  function processData (data) {
    return Bluebird.map(data, event => {
      return getLocation(event.locations)
    }, {concurrency: PROMISE_CONCURRENCY})
  }

  function getLocation (address) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('getLocation', address)
        if (this.queue[address]) {
          this.queue[address]
            .then(resolve)
            .catch(reject)
        } else if (this.locations[address]) {
          resolve(this.locations[address])
        } else {
          this.queue[address] = geocode(address)
            .then(res => {
              delete this.queue[address]
              if (!res || !res.data || !res.data.results || !res.data.results.length) {
                console.error('location not found', res, address)
                resolve() // silent fail so that rest of the queries continue
              } else {
                this.locations[address] = res.data.results[0]
                resolve(this.locations[address])
              }
            })
            .catch(e => {
              delete this.queue[address]
              reject(e)
            })
        }
      }, )
    })
  }

  function geocode (address) {
    if (!containsCity(address)) {
      address = `${address}, ${CITY}`
    }

    if (!containsState(address)) {
      address = `${address}, ${STATE_CODE}`
    }

    // we append the state and city, country to help geocode service to identify the right location
    // bounds also help to bias the results more prominently
    return axios
      .get(
        GEOCODE_URL,
        {
          params: {
            address: address,
            components: `country:${COUNTRY_CODE}`,
            bounds: LOCATION_BOUNDS,
            key: GEOCODE_API_KEY
          }
        }
      )
      .then((data) => {
        return data
      })
      .catch((e) => {
        console.log('error', e)
        return e
      })
  }

  function containsCity (address) {
    return address.toLowerCase().indexOf(CITY) !== -1
  }

  function containsState (address) {
    return address.toLowerCase().indexOf(STATE_CODE) !== -1 || address.toLowerCase().indexOf(STATE) !== -1
  }

  function start () {
    getData()
      .then(function (data) {
        processData(data)
          .then(function () {
            writeToFile(this.locations)
              .then(() => {
                console.log('ALL DONE')
              })
          })
      })
      .catch(function (err) {
        console.log('error: ', err)
      })
  }

  start()
}()
