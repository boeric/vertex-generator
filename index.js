/* eslint-disable no-console */
/* global mapboxgl, turf, d3 */

let currentSpeed = 35;

// My personal mapbox token, please don't use
mapboxgl.accessToken = 'pk.eyJ1IjoiYm9lcmljIiwiYSI6IkZEU3BSTjQifQ.XDXwKy2vBdzFEjndnE4N7Q';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v9',
  center: [-122, 37.35],
  zoom: 12,
});

const distanceContainer = document.getElementById('distance');

// GeoJSON object to hold our measurement features
const geojson = {
  type: 'FeatureCollection',
  features: [],
};

// Used to draw a line between points
const linestring = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [],
  },
  properties: {
    id: String(new Date().getTime()),
  },
};

map.on('load', () => {
  map.addSource('geojson', {
    type: 'geojson',
    data: geojson,
  });

  // Add styles to the map
  map.addLayer({
    id: 'measure-points',
    type: 'circle',
    source: 'geojson',
    paint: {
      'circle-radius': 5,
      'circle-color': '#000',
    },
    filter: ['in', '$type', 'Point'],
  });

  map.addLayer({
    id: 'measure-lines',
    type: 'line',
    source: 'geojson',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': '#000',
      'line-width': 2.5,
    },
    filter: ['in', '$type', 'LineString'],
  });

  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['measure-points'] });

    // Remove the linestring from the group, so we can redraw it based on the points
    // collection
    if (geojson.features.length > 1) geojson.features.pop();

    // Clear the Distance container to populate it with a new value
    distanceContainer.innerHTML = '';

    // If a feature was clicked, remove it from the map
    if (features.length) {
      // eslint-disable-next-line prefer-destructuring
      const id = features[0].properties.id;
      geojson.features = geojson.features.filter((point) => {
        return point.properties.id !== id;
      });
    } else {
      const point = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            e.lngLat.lng,
            e.lngLat.lat,
          ],
        },
        properties: {
          id: String(new Date().getTime()),
          speed: currentSpeed,
        },
      };
      geojson.features.push(point);
    }

    if (geojson.features.length > 1) {
      linestring.geometry.coordinates = geojson.features.map((point) => {
        return point.geometry.coordinates;
      });

      geojson.features.push(linestring);

      // Populate the distanceContainer with total distance
      const value = document.createElement('pre');
      value.textContent = `Total distance: ${turf.lineDistance(linestring).toLocaleString()}km`;
      distanceContainer.appendChild(value);
    }

    map.getSource('geojson').setData(geojson);
  });
});

map.on('mousemove', (e) => {
  if (!map.loaded()) {
    return;
  }

  const features = map.queryRenderedFeatures(e.point, { layers: ['measure-points'] });
  // UI indicator for clicking/hovering a point on the map
  map.getCanvas().style.cursor = (features.length) ? 'pointer' : 'crosshair';
});

const button = d3.select('#getJson');
button.on('click', () => {
  const output = d3.select('#output');
  output.text(JSON.stringify(geojson, null, 2));
});

// eslint-disable-next-line func-names
d3.selectAll("input[name='speed']").on('change', function () {
  currentSpeed = +this.value;
  console.log(currentSpeed);
});
