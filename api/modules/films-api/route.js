const ctrl = require('./controller')

module.exports = function (app, jsonapi) {
  app.get('/api/films', jsonapi(), ctrl.get)
  app.get('/api/films/count', jsonapi(), ctrl.count)
}
