

const map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap © CARTO'
      })
    })
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([23.7275, 37.9838]),
    zoom: 6
  })
});

const vectorSource = new ol.source.Vector();

const vectorLayer = new ol.layer.Vector({
  source: vectorSource
});

map.addLayer(vectorLayer);

const locations = [];
let nextId = 1;

map.on('singleclick', function(event) {
  const coords = ol.proj.toLonLat(event.coordinate);
  const feature = new ol.Feature({
    geometry: new ol.geom.Point(event.coordinate)
  });
  vectorSource.addFeature(feature);
  
  const newLocation = {
    id: nextId,
    name: 'Location ' + nextId,
    lon: coords[0],
    lat: coords[1],
    feature: feature
  };
  
  locations.push(newLocation);
  nextId++;
  renderLocations();
});

function renderLocations() {
  const locationsList = document.getElementById("locations");
  locationsList.innerHTML = "";
  locations.forEach(location => {
    const liLocation = document.createElement("li");
    liLocation.textContent = location.name;
    locationsList.appendChild(liLocation);
  });
}