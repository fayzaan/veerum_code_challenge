import axios from 'axios'

const baseUrl = process.env.REACT_APP_API_URL

export default {
  get: function (params) {
    return axios.get(`${baseUrl}/films`, {params})
      .then(res => res.data.data.data
          .filter(event => event.location)
      )
  },
  count: function (params) {
    return axios.get(`${baseUrl}/films/count`, {params})
      .then(res => res.data.data.count)
  }
}
