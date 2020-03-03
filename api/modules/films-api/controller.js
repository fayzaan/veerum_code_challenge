const films = require('../socrata-films-sf')
const locations = require('../../locations')
const api = {}

api.get = async (req, res) => {
  console.log('controller.get', req.query)
  try {
    const data = await films.get(req.query)

    data.forEach(event => {
      let location = locations[event.locations]

      if (location) {
        event.location = location.geometry.location
      }
    })

    res.jsonapi.send({data, success: true})
  } catch (e) {
    console.log('get failed', e)
    res.jsonapi.error(e)
    res.jsonapi.send()
  }
}

api.count = async (req, res) => {
  console.log('controller.count', req.query)
  try {
    const data = await films.count(req.query)

    res.jsonapi.send({...data, success: true})
  } catch (e) {
    console.log('get failed', e)
    res.jsonapi.error(e)
    res.jsonapi.send()
  }
}

module.exports = api
