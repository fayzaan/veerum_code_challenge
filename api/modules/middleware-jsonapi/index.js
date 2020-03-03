const wrapper = function (req, res) {
  this.req = req
  this.res = res

  this.errors = []
}

wrapper.prototype.send = function (data) {
  let json = {}

  if (this.errors.length) {
    json.errors = this.errors
    let status = 200

    this.errors.forEach(err => {
      status = Math.max(status, parseInt(err.status))
    })

    this.res.status(status)
  } else {
    json.data = data
  }

  json.authors = [
    {
      name: 'Mohammed Faizan Qureshi'
    }
  ]

  return this.res.send(json)
}

wrapper.prototype.error = function (error) {
  if (!error.status) {
    error = {
      status: '500',
      title: 'Internal Server Error - Malformed Error',
      detail: JSON.stringify(error)
    }
  }

  this.errors.push(error)

  return this
}

module.exports = {
  middleware: function () {
    return function (req, res, next) {
      res.jsonapi = new wrapper(req, res)

      next()
    }
  }
}
