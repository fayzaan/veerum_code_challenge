const express = require('express')
const cors = require('cors')
const app = express()
const routes = require('./routes')

require('dotenv').config()

const port = process.env.PORT || 3000

app.use(cors())

routes(app)

app.listen(port)

console.log(`VEERUM RESTful API connected on: ${port}`)
