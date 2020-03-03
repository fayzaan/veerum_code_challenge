import React from 'react'
import logo from './logo.svg'
import './App.css'
import Map from './Components/Map'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Films from './Services/Films'
import {withStyles} from "@material-ui/core"
import InputBase from '@material-ui/core/InputBase'
import SearchIcon from '@material-ui/icons/Search'
import FormHelperText from '@material-ui/core/FormHelperText'

const styles = (theme) => ({
  root: {},
  logo: {
    marginRight: '40px',
    height: '20px'
  },
  searchIcon: {
    width: '40px',
    top: 0,
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 7),
    transition: theme.transitions.create('width'),
    width: '300px'
  }
})

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      loading: false,
      pending: false,
      limitPerQuery: 100,
      timeout: null,
      mapService: null,
      showNoResultsMessage: false
    }
    this.onMapInitialized = this.onMapInitialized.bind(this)
    this.onFilterChange = this.onFilterChange.bind(this)
    this.loadFilms = this.loadFilms.bind(this)
    this.showNoResultsMessage = this.showNoResultsMessage.bind(this)
    this.hideNoResultsMessage = this.hideNoResultsMessage.bind(this)
  }
  componentDidMount() {

  }
  onMapInitialized (mapService) {
    this.setState({mapService}, this.loadFilms)
  }
  loadFilms (params) {
    // to handle cases where user changes input while another query is already in progress
    if (this.state.loading) {
      this.setState({pending: true})
      return
    }
    this.setState({loading: true, pending: false}, () => {
      const {limitPerQuery: limit} = this.state

      if (!params) {params = {}}

      // destroy all current rendered markers
      this.state.mapService.destroyMarkers()
      this.hideNoResultsMessage()

      // to identify how many calls to make
      Films.count(params)
        .then(total => {
          let calls = Math.ceil(total/limit)

          console.log('Films.count.then', params, total)
          if (!total) {
            this.showNoResultsMessage()
          }

          let requests = []

          for (let i = 0; i < calls; i++) {
            // make a call per limit until we have got all results
            requests.push(
              Films.get({limit, offset: limit * i, ...params})
              .then(films => {
                films
                .forEach(event => {
                  this.state.mapService.addMarker(event)
                })
              })
            )
          }

          Promise.all(requests)
            .then(() => {
              this.setState({loading: false})
              if (this.state.pending) {
                this.loadFilms({filter: this.state.filter})
              }
            })
        })
    })
  }
  onFilterChange (e) {
    let timeout = null

    if (this.state.timeout) {
      clearTimeout(this.state.timeout)
    }

    // call after timeout so that we give user the chance to finish typing the query before making api calls
    timeout = setTimeout(() => {
      this.loadFilms({filter: this.state.filter})
    }, 500)

    this.setState({filter: e.target.value, timeout})
  }
  showNoResultsMessage () {
    this.setState({showNoResultsMessage: true})
  }
  hideNoResultsMessage () {
    this.setState({showNoResultsMessage: false})
  }
  render () {
    const {classes} = this.props
    const {showNoResultsMessage} = this.state
    return (
      <div className="App">
        <AppBar>
          <Toolbar>
            <img className={classes.logo} src={logo} />
            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <SearchIcon />
              </div>
              <InputBase
                placeholder="type a movie title, director, or actor"
                onChange={this.onFilterChange}
                classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput,
                }}
                inputProps={{ 'aria-label': 'search' }}
              />
            </div>
            {showNoResultsMessage && <FormHelperText>No Results Found, try a different search</FormHelperText>}
          </Toolbar>
        </AppBar>
        <Map onInitialized={this.onMapInitialized} />
      </div>
    )
  }
}

export default withStyles(styles)(App)
