#San Francisco Movie Locations App

Purpose of the application is to show, visually, all the locations of movies shot in San Francisco. The application also allows you to filter by movie title, director, and actor names.

### Tech Stack

- ReactJS
- NodeJS
- SoQL/Soda-JS
- ExpressJS
- Mapbox GL

The data is loaded from [DataSF:Films](https://data.sfgov.org/Culture-and-Recreation/Film-Locations-in-San-Francisco/yitu-d5am) using Soda-JS to query in SoQL. The Locations.json file is referenced to map the human readable address to geocodes to get geographical coordinates to place markers on the map.

### Data

One of the problems with the data source is that it does not have geographic coords (lat/lng) to place the markers on the map. I tried using the `geocode()` method in the query, but it was failing no matter what I tried.

In order to get the geographic coords, I wrote a script in NodeJS that uses Google's Geocode API to map the human readable address to the first geocode result returned from Google and store it in a file.

I believe that since this is historical data that will not be changing, we should not have to call the Geocode API on every request. Even though we could cache this, it is better that we include the coordinates with the data for faster queries and to avoid exorbitant costs of running Geocode and trying to manage a caching service.

Due to limited time, I just had the NodeJS script write to a locations.json file, and that file is then used by the API to map addresses to location. Also note, locations are kept in memory and only queried for those that are not already in memory, so duplicate addresses will not trigger additional Geocode calls. 

For the rest of the data, it is queried from the source (listed above).

#### Steps to run local
- `npm install` (to install all dependencies)
- write `.env`, reference the `.env.sample` for what to write
- `node index.js` - this will query the DB, then run Geocode api against each row (as needed) and write to the output file specified in `.env`.

### API

I used NodeJS with ExpressJS for a simple server-side implementation. The API uses Soda-JS to run queries for the Data and then maps the address using the locations.json file before returning to the client. There are 2 endpoints, one to get the events, the other to return a count. 

By using Count, the client-side can determine the number of results it needs to render, and it can run multiple queries in parallel to help with speed.

For convenience, `locations.json` file is already populated and committed with the code, so you don't have to run the steps for loading Locations Data.

#### Steps to run local
- `npm install` (to install all dependencies)
- `node app.js` (to start the server) - defaults port `3000`

#### `/api/films`

Parameters:
- `filter` - `string` - (`%LIKE%` `director`, `title`, `actor_1`, `actor_2`, `actor_3`)
- `offset` - `integer` - skips results
- `limit` - `integer` - limits the results

returns 
```
{
    "data": {
        "data": [
            {
                "title": "180",
                "release_year": "2011",
                "locations": "Epic Roasthouse (399 Embarcadero)",
                "production_company": "SPI Cinemas",
                "director": "Jayendra",
                "writer": "Umarji Anuradha, Jayendra, Aarthi Sriram, & Suba ",
                "actor_1": "Siddarth",
                "actor_2": "Nithya Menon",
                "actor_3": "Priya Anand",
                "location": {
                    "lat": 37.7908379,
                    "lng": -122.3893566
                }
            }
        ],
        "success": true
    }
}
```

#### `/api/films/count`
- `filter` - `string` - (`%LIKE%` `director`, `title`, `actor_1`, `actor_2`, `actor_3`)

example: `/api/films/count?filter=sense8`

returns 
```
{
    "data": {
        "count": "46",
        "success": true
    }
}
```

### Client Application

This app was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Simple application, no routing required as it only has a single view. The application has a top navbar and a map, using Mapbox.

On initial load, application will first query `/films/count`, with no filters, to get a total and then load every 100 results, from `/api/films`, to try and load in parallel all the data.

There is ~3000 rows of data, and because it is in a very small area (San Francisco), loading all seems to work reasonably. Using bounding box, to filter, would not help much because its a small area and you would have to be really zoomed in to gain any advantages.

There is a filter at the top which triggers API calls with a timeout, to avoid spamming the API, and removes existing markers to render new ones.

### Future Improvements

We could write the data to a MongoDB, including the lat/lngs, so that we don't have to iterate over the rows and map from `locations.json`.

We could also take it a step further and create a dataset -> tileset using Mapbox Studio. There is very little metadata and it will be all in vector so the performance will be good and we can do local filtering using Mapbox.

### Environments

There is a `.env.sample` file in the `data` and `api` directories, the sensitive data has been excluded. For the `app`, because it is client-side and everything is exposed anyways (so nothing sensitive should ever be stored there), the `.env` is committed with the code deliberately.

### Tests
Currently no tests due to the limited time.
