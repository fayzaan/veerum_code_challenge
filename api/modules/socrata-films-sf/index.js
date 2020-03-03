const soda = require('soda-js')

const DATASET_SOURCE = process.env.DATASET_SOURCE
const DATASET_ID = process.env.DATASET_ID
const DEFAULT_LIMIT = process.env.DEFAULT_LIMIT

const films = {}

films.get = function (params) {
  return new Promise((resolve, reject) => {
    try {
      let {limit, offset} = params

      if (limit && !isNaN(parseInt(limit))) {
        limit = parseInt(limit)
      } else {
        limit = DEFAULT_LIMIT
      }

      let query = getQuery('*', params)

      if (offset && !isNaN(parseInt(offset))) {
        query.offset(offset)
      }

      query
        .limit(limit)
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

films.count = function (params) {
  return new Promise((resolve, reject) => {
    try {
      getQuery('count(*)', params)
        .getRows()
        .on('success', rows => {
          let data = rows[0]

          data.count = parseInt(data.count)

          resolve(data)
        })
        .on('error', err => {
          reject(err)
        })
    } catch (e) {
      reject(e)
    }
  })
}

function getQuery (select, params) {
  let consumer = new soda.Consumer(DATASET_SOURCE)
  let {filter} = params

  let query = consumer
    .query()
    .withDataset(DATASET_ID)
    .select(select)
    .where("locations IS NOT NULL")

  if (filter && typeof filter === 'string') {
    filter = filter.toLowerCase()
    query
      .where(`lower(director) LIKE "%${filter}%" OR lower(title) LIKE "%${filter}%" OR lower(actor_1) LIKE "%${filter}%" OR lower(actor_2) LIKE "%${filter}%" OR lower(actor_3) LIKE "%${filter}%"`)
  }

  return query
}

module.exports = films
