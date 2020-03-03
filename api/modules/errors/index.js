const error_codes = require('error_codes')
const DEFAULT_ERROR_CODE = 'InternalServerError'

module.exports = function (code) {
  if (!code || !error_codes[code]) { code = DEFAULT_ERROR_CODE }

  return Object.assign({}, error_codes[code])
}
