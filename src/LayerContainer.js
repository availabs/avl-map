import { hasValue } from "@availabs/avl-components"

import DefaultHoverComp from "./components/DefaultHoverComp"

import get from "lodash.get"

let id = -1;
const getLayerId = () => `avl-layer-${ ++id }`;

const DefaultCallback = () => null;

const DefaultOptions = {
  setActive: true,
  isDynamic: false,
  filters: {},
  modals: {},
  mapActions: [],
  sources: [],
  layers: [],
  isVisible: true,
  toolbar: ["toggle-visibility"],
  legend: null,
  infoBoxes: [],
  state: {},
  mapboxMap: null
}

class LayerContainer {
  constructor(options = {}) {

    const Options = { ...DefaultOptions, ...options };
    for (const key in Options) {
      this[key] = Options[key];
    }

    this.id = getLayerId();

    this.layerVisibility = {};

    this.needsRender = this.setActive;

    this.callbacks = [];
    this.hoveredFeatures = new Map();

    this.dispatchUpdate = () => {};

    this.updateState = this.updateState.bind(this);
  }
  _init(mapboxMap, falcor) {
    this.mapboxMap = mapboxMap;
    this.falcor = falcor;
    return this.init(mapboxMap, falcor);
  }
  init(mapboxMap, falcor) {
    return Promise.resolve();
  }

// Don't attach any state directly to layers.
// Use this function to update layer state.
// This function causes an update in React through the map component.
// The React update will cause rerenders in layer components.
// Layer components, modals, infoboxes, etc., should pull from layer.state.
  updateState(newState) {
    if (typeof newState === "function") {
      this.state = newState(this.state);
    }
    else {
      this.state = { ...this.state, ...newState };
    }
    this.dispatchUpdate(this, this.state);
  }

  _onAdd(mapboxMap, falcor, updateHover) {
    this.sources.forEach(({ id, source }) => {
      if (!mapboxMap.getSource(id)) {
        mapboxMap.addSource(id, source);
      }
    });
    this.layers.forEach(layer => {
      if (!mapboxMap.getLayer(layer.id)) {
        mapboxMap.addLayer(layer, layer.beneath);
        if (!this.isVisible) {
          this._setVisibilityNone(mapboxMap, layer.id);
        }
        else {
          this.layerVisibility[layer.id] = mapboxMap.getLayoutProperty(layer.id, "visibility");
        }
      }
    });
    if (this.onHover) {
      this.addHover(mapboxMap, updateHover);
    }
    if (this.onClick) {
      this.addClick(mapboxMap);
    }
    return this.onAdd(mapboxMap, falcor);
  }
  onAdd(mapboxMap, falcor) {
    return Promise.resolve();
  }

  addClick(mapboxMap) {
    const click = ({ point, features, lngLat }) => {
      const properties = features.map(({ properties }) => ({ ...properties }));
      this.onClick.callback.call(this, properties, lngLat, point);
    };

    this.onClick.layers.forEach(layerId => {
      const callback = click.bind(this);
      this.callbacks.push({
        action: "click",
        callback,
        layerId
      });
      mapboxMap.on("click", layerId, callback);
    });
  }

  hoverLeave(mapboxMap, layerId) {
    if (!this.hoveredFeatures.has(layerId)) return;

console.log(this.hoveredFeatures, layerId, this.hoveredFeatures.get(layerId))
    this.hoveredFeatures.get(layerId).forEach(value => {
console.log(value)
      mapboxMap.setFeatureState(value, { hover: false });
    });
    this.hoveredFeatures.delete(layerId);
  }

  addHover(mapboxMap, updateHover) {

    const callback = get(this, ["onHover", "callback"], DefaultCallback).bind(this),
      HoverComp = get(this, ["onHover", "HoverComp"], DefaultHoverComp);

    const mousemove = (layerId, { point, features, lngLat }) => {

      const hoveredFeatures = this.hoveredFeatures.get(layerId) || new Map();
      this.hoveredFeatures.set(layerId, new Map());

      features.forEach(({ id, source, sourceLayer }) => {
        if ((id === undefined) || (id === null)) return;

        if (hoveredFeatures.has(id)) {
          this.hoveredFeatures.get(layerId).set(id, hoveredFeatures.get(id));
          hoveredFeatures.delete(id);
        }
        else {
          const value = { id, source, sourceLayer };
          this.hoveredFeatures.get(layerId).set(id, value);
          mapboxMap.setFeatureState(value, { hover: true });
        }
      });
      hoveredFeatures.forEach(value => {
        mapboxMap.setFeatureState(value, { hover: false });
      })

      const data = callback(layerId, features, lngLat);

      if (hasValue(data)) {
        updateHover({
          pos: [point.x, point.y],
          type: "hover-layer-move",
          HoverComp,
          layer: this,
          lngLat,
          data
        });
      }
    };

    const mouseleave = (layerId, e) => {
      this.hoverLeave(mapboxMap, layerId);
      updateHover({
        type: "hover-layer-leave",
        layer: this
      });
    };

    this.onHover.layers.forEach(layerId => {
      let callback = mousemove.bind(this, layerId);
      this.callbacks.push({
        action: "mousemove",
        callback,
        layerId
      });
      mapboxMap.on("mousemove", layerId, callback);

      callback = mouseleave.bind(this, layerId);
      this.callbacks.push({
        action: "mouseleave",
        callback,
        layerId
      });
      mapboxMap.on("mouseleave", layerId, callback);
    }, this);
  }

  _onRemove(mapboxMap) {
    while (this.callbacks.length) {
      const { action, layerId, callback } = this.callbacks.pop();
      mapboxMap.off(action, layerId, callback);
    }
    this.layers.forEach(({ id }) => {
      mapboxMap.removeLayer(id);
    });
    this.onRemove(mapboxMap);
  }
  onRemove(mapboxMap) {

  }

  fetchData(falcor) {
    return Promise.resolve();
  }
  render(mapboxMap, falcor) {

  }

  receiveProps(props, mapboxMap, falcor) {

  }

  toggleVisibility(mapboxMap) {
    this.isVisible = !this.isVisible;
    this.layers.forEach(({ id }) => {
      if (this.isVisible) {
        this._setVisibilityVisible(mapboxMap, id);
      }
      else {
        this._setVisibilityNone(mapboxMap, id);
      }
    });
  }
  _setVisibilityVisible(mapboxMap, layerId) {
    if (this.layerVisibility[layerId] !== "none") {
      mapboxMap.setLayoutProperty(layerId, "visibility", "visible");
    }
  }
  _setVisibilityNone(mapboxMap, layerId) {
    const visibility = mapboxMap.getLayoutProperty(layerId, "visibility");
    if (visibility === "none") {
      this.layerVisibility[layerId] = "none";
    }
    else {
      mapboxMap.setLayoutProperty(layerId, "visibility", "none");
    }
  }
  setLayerVisibility(mapboxMap, layer, visibility) {
    const isVisible = this.isVisible && (visibility === "visible");
    this.layerVisibility[layer.id] = visibility;

    visibility = isVisible ? "visible" : "none";
    mapboxMap.setLayoutProperty(layer.id, "visibility", visibility);
  }

  onFilterChange(filterName, newValue, prevValue) {

  }

  onMapStyleChange(mapboxMap, falcor, updateHover) {
    this._onAdd(mapboxMap, falcor, updateHover)
      .then(() => this.render(mapboxMap, falcor))
  }
}
export { LayerContainer };
