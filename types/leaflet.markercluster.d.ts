import "leaflet";

declare module "leaflet" {
  function markerClusterGroup(options?: object): MarkerClusterGroup;

  interface MarkerClusterGroup extends Layer {
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    clearLayers(): this;
  }
}

declare module "leaflet.markercluster";
