module.exports = function (app) {
  const jsonapi = require('./modules/middleware-jsonapi').middleware

  const films = require('./modules/films-api/route')

  films(app, jsonapi)
}
