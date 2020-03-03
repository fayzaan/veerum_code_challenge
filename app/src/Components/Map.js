import React,{Component} from 'react'
import propTypes from 'prop-types'
import {v4 as uuid} from 'uuid'
const mapboxgl = require('mapbox-gl/dist/mapbox-gl')

class Map extends Component {
  constructor (props) {
    super(props)
    this.state = {
      elementId: props.elementId || 'map_container',
      markers: {},
      popups: {}
    }
    this.addMarker = this.addMarker.bind(this)
    this.makePopup = this.makePopup.bind(this)
    this.destroyMarkers = this.destroyMarkers.bind(this)
    this.destroyPopups = this.destroyPopups.bind(this)
  }
  componentDidMount() {
    const {elementId} = this.state
    mapboxgl.accessToken = 'pk.eyJ1IjoiZmF5emFhbiIsImEiOiJjazc5Ym13dG4wcm9lM2ZwY3UycXpzOHVvIn0.7A3IKd_Pq4q5Rb7BBnFJzw';
    let map = new mapboxgl.Map({
      container: elementId,
      center: [-122.4194183, 37.774929],
      zoom: 12,
      style: 'mapbox://styles/mapbox/streets-v11'
    });

    this.setState({map}, () => {
      this.state.map.resize()
      this.props.onInitialized({
        addMarker: this.addMarker,
        destroyMarkers: this.destroyMarkers
      })
    })
  }
  addMarker (event) {
    let {markers} = this.state
    let id = uuid()
    let el = document.createElement('div')
    el.className = 'marker'

    let marker = new mapboxgl
      .Marker(el)
      .setLngLat(event.location)
      .setPopup(this.makePopup(event, id))
      .addTo(this.state.map)

    markers[id] = marker
    this.setState({markers})
  }
  makePopup (event, id) {
    let {popups} = this.state
    let popup = new mapboxgl
      .Popup({offset: 15})
      .setHTML(
        `
          <h3>${event.title} (${event.release_year})</h3>
          <p>${event.locations}</p>
          <p>${event.director}</p>
          <p>${[event.actor_1, event.actor_2, event.actor_3].join(', ')}</p>
        `
      )
    popups[id] = popup
    this.setState({popups})
    return popup
  }
  destroyMarkers (ids) {
    let {markers} = this.state

    // destroy all
    if (!ids) {
      ids = Object.keys(markers)
    }

    // should be array so we can handle it all in loop
    if (!Array.isArray(ids)) {
      ids = [ids]
    }

    ids
      .forEach(id => {
        markers[id].remove()
        delete markers[id]
        this.destroyPopups(id)
      })

    this.setState({markers})
  }
  destroyPopups (ids) {
    let {popups} = this.state

    // destroy all
    if (!ids) {
      ids = Object.keys(popups)
    }

    // should be array so we can handle it all in loop
    if (!Array.isArray(ids)) {
      ids = [ids]
    }

    ids
      .forEach(id => {
        popups[id].remove()
        delete popups[id]
      })

    this.setState({popups})
  }
  render () {
    const {elementId} = this.state
    return (
      <div style={{height: '100%', width: '100%'}} id={elementId} />
    )
  }
}

Map.propTypes = {
  onInitialized: propTypes.func
}

export default Map
