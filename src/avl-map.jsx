import React from "react";
import mapboxgl from "mapbox-gl";

import get from "lodash/get";

import { useSetSize, useFalcor } from "~/modules/avl-components/src";
// import {  } from 'modules/avl-components/src'

import Sidebar from "./components/Sidebar";
import {
  HoverCompContainer,
  PinnedHoverComp,
} from "./components/HoverCompContainer";
import InfoBoxes from "./components/InfoBoxContainer";
import DraggableModal from "./components/DraggableModal";
import MapAction from "./components/MapAction";

import 'mapbox-gl/dist/mapbox-gl.css'

export const DefaultStyles = [
  { name: "Dark", style: "mapbox://styles/am3081/ckm85o7hq6d8817nr0y6ute5v" },
  { name: "Light", style: "mapbox://styles/am3081/ckm86j4bw11tj18o5zf8y9pou" },
  {
    name: "Satellite",
    style: "mapbox://styles/am3081/cjya6wla3011q1ct52qjcatxg",
  },
  {
    name: "Satellite Streets",
    style: "mapbox://styles/am3081/cjya70364016g1cpmbetipc8u",
  },
];

const DefaultMapOptions = {
  center: [-74.180647, 42.58],
  minZoom: 2,
  zoom: 10,
  preserveDrawingBuffer: true,
  // style: "mapbox://styles/am3081/cjqqukuqs29222sqwaabcjy29",
  styles: DefaultStyles,
  attributionControl: false,
  logoPosition: "bottom-left",
};

const DefaultSidebar = {
  tabs: ["layers", "styles"],
  title: "",
  togglePosition: "top",
};

let idCounter = 0;
const getUniqueId = () => `unique-id-${++idCounter}`;

// const noRefBox = () => ({ width: 0, height: 0 });

const DefaultStaticOptions = {
  size: [80, 50],
  center: [-74.180647, 42.58],
  zoom: 2.5,
};
const getStaticImageUrl = (style, options = {}) => {
  const { size, center, zoom } = { ...DefaultStaticOptions, ...options };
  return (
    `https://api.mapbox.com/styles/v1/${style.slice(16)}/static/` +
    `${center},${zoom}/${size.join("x")}` +
    `?attribution=false&logo=false&access_token=${mapboxgl.accessToken}`
  );
};

const InitialState = {
  map: null,
  initializedLayers: [],
  activeLayers: [],
  dynamicLayers: [],
  layersLoading: {},
  hoverData: {
    data: new Map(),
    pos: [0, 0],
    lngLat: {},
  },
  pinnedHoverComps: [],
  pinnedMapMarkers: [],
  mapStyles: [],
  styleIndex: 0,
  sidebarTabIndex: 0,
  modalData: [],
  prevLayerStates: {},
  layerStates: {},
  prevLayerProps: {},
};
const Reducer = (state, action) => {
  const { type, ...payload } = action;
  switch (type) {
    case "init-layer":
      return {
        ...state,
        initializedLayers: [...state.initializedLayers, payload.layer.id]
      };
    case "loading-start":
      return {
        ...state,
        layersLoading: {
          ...state.layersLoading,
          [payload.layerId]:
            get(state, ["layersLoading", payload.layerId], 0) + 1,
        },
      };
    case "loading-stop":
      return {
        ...state,
        // activeLayers: [...state.activeLayers],
        layersLoading: {
          ...state.layersLoading,
          [payload.layerId]: Math.max(
            0,
            state.layersLoading[payload.layerId] - 1
          ),
        },
      };
    case "activate-layer":
      return {
        ...state,
        activeLayers: [payload.layer, ...state.activeLayers],
        layerStates: {
          ...state.layerStates,
          [payload.layer.id]: payload.layer.state,
        },
        /*prevLayerStates: {
          ...state.prevLayerStates,
          [payload.layer.id]: payload.layer.state,
        },*/
      };
    case "deactivate-layer":
      return {
        ...state,
        activeLayers: state.activeLayers.filter(
          ({ id }) => id !== payload.layerId
        ),
        layerStates: {
          ...state.layerStates,
          [payload.layerId]: {},
        },
        prevLayerStates: {
          ...state.layerStates,
          [payload.layerId]: {},
        },
      };
    case "hover-layer-move": {
      const { data, layer, HoverComp, pinnable, sortOrder, ...rest } = payload;
      state.hoverData.data.set(layer.id, {
        data,
        HoverComp,
        layer,
        pinnable,
        sortOrder,
      });
      return {
        ...state,
        hoverData: {
          ...state.hoverData,
          ...rest,
        },
      };
    }
    case "hover-layer-leave": {
      const { layer } = payload;
      state.hoverData.data.delete(layer.id);
      return {
        ...state,
        hoverData: {
          ...state.hoverData,
        },
      };
    }
    case "pin-hover-comp": {
      if (!state.hoverData.data.size) return state;

      const newPinned = {
        id: getUniqueId(),
        HoverComps: [...state.hoverData.data.values()]
          .filter(({ pinnable }) => pinnable)
          .sort((a, b) => a.sortOrder - b.sortOrder),
        ...payload,
      };
      if (newPinned.HoverComps.length) {
        payload.marker.addTo(state.map);
        return {
          ...state,
          pinnedHoverComps: [...state.pinnedHoverComps, newPinned],
        };
      }
      return state;
    }

    case "remove-pinned":
      return {
        ...state,
        pinnedHoverComps: state.pinnedHoverComps.filter((phc) => {
          if (phc.id !== payload.id) return true;
          phc.marker.remove();
          return false;
        }),
      };
    case "add-dynamic-layer":
      return {
        ...state,
        dynamicLayers: [...state.dynamicLayers, payload.layer],
      };
    case "remove-dynamic-layer":
      return {
        ...state,
        dynamicLayers: state.dynamicLayers.filter(
          ({ id }) => id !== payload.layer.id
        ),
      };
    case "show-modal": {
      const { layerId, modalKey } = payload;
      if (
        state.modalData.reduce(
          (a, c) => a || (c.layerId === layerId && c.modalKey === modalKey),
          false
        )
      )
        return state;
      return {
        ...state,
        modalData: [...state.modalData, { layerId, modalKey, zIndex: 0 }],
      };
    }
    case "bring-modal-to-front": {
      const { layerId, modalKey } = payload;
      return {
        ...state,
        modalData: state.modalData.map((md) => ({
          ...md,
          zIndex: md.layerId === layerId && md.modalKey === modalKey ? 10 : 0,
        })),
      };
    }
    // case "update-modal-data": {
    //   const { layerId, modalKey, data } = payload;
    //   return {
    //     ...state,
    //     modalData: state.modalData.map(md => {
    //       if ((md.layerId === layerId) && (md.modalKey === modalKey)) {
    //         return { ...md, data };
    //       }
    //       return md;
    //     })
    //   }
    // }
    case "close-modal":
      return {
        ...state,
        modalData: state.modalData.filter(
          ({ layerId, modalKey }) =>
            !(layerId === payload.layerId && modalKey === payload.modalKey)
        ),
      };
    case "layer-update": {
      const { layer, newState } = payload;
      return {
        ...state,
        layerStates: {
          ...state.layerStates,
          [layer.id]: newState,
        },
      };
    }
    // case "layer-updated": {
    //   const { layer } = payload;
    //   return {
    //     ...state,
    //     prevLayerStates: {
    //       ...state.prevLayerStates,
    //       [layer.id]: state.layerStates[layer.id],
    //     },
    //   };
    // }
    case "update-prev": {
      const { layerProps, updateProps, updateStates } = payload;
      let prevLayerProps = state.prevLayerProps;
      if (updateProps.length) {
        prevLayerProps = {
          ...state.prevLayerProps,
          ...updateProps.reduce((a, c) => {
            a[c.id] = get(layerProps, c.id, {});
            return a;
          }, {})
        }
      }
      let prevLayerStates = state.prevLayerStates;
      if (updateStates.length) {
        prevLayerStates = {
          ...state.prevLayerStates,
          ...updateStates.reduce((a, c) => {
            a[c.id] = get(state.layerStates, c.id, {});
            return a;
          }, {})
        }
      }
      return {
        ...state,
        prevLayerProps,
        prevLayerStates
      }
    }
    case "set-map-style":
    case "switch-tab":
    case "map-loaded":
    case "update-state":
      return {
        ...state,
        ...payload,
      };
    default:
      return state;
  }
};

const EmptyArray = [];
const EmptyObject = {};

// const toolbarFuncRunner = args => {
//   if (!args.length) return [];
//   const [arg, ...rest] = args;
//   if (typeof arg === "function") {
//     return [arg(...toolbarFuncRunner(rest))];
//   }
//   return [arg, ...toolbarFuncRunner(rest)];
// }
// const toolbarFuncArgs = ({ action }, layer, MapActions, map) => (
//   action.map(action => {
//     if (typeof action === "function") return action;
//     if (typeof action === "string") {
//       const [arg1, arg2] = action.split(".");
//       if (arg1 === "map") {
//         return arg2 ? MapActions[arg2] : map;
//       }
//       else if ((arg1 === "this") && arg2) {
//         return layer[arg2].bind(layer);
//       }
//     }
//     return action;
//   })
// )

const AvlMap = (props) => {
  const {
    accessToken,
    mapOptions = EmptyObject,
    layers = EmptyArray,
    sidebar = EmptyObject,
    layerProps = EmptyObject,
    navigationControl = "bottom-right",
    CustomSidebar = null
  } = props;

  const sidebarProps = React.useMemo(() => {
    if (typeof sidebar !== "object") {
      return {
        showSidebar: Boolean(sidebar),
      };
    }
    return {
      showSidebar: true,
      ...sidebar,
    };
  }, [sidebar]);

  const { falcor } = useFalcor();

  const [state, dispatch] = React.useReducer(Reducer, InitialState);

  const updateHover = React.useCallback((hoverData) => {
    dispatch(hoverData);
  }, []);

  const projectLngLat = React.useCallback(
    (lngLat) => {
      return state.map.project(!lngLat?.lng || !lngLat?.lat ? {lng: 0, lat: 0} : lngLat);
    },
    [state.map]
  );

  const updateFilter = React.useCallback(
    (layer, filterName, value) => {
      if (!get(layer, ["filters", filterName], null)) return;

      dispatch({ type: "loading-start", layerId: layer.id });

      const prevValue = layer.filters[filterName].value;

      layer.filters = {
        ...layer.filters,
        [filterName]: {
          ...layer.filters[filterName],
          prevValue,
          value,
        },
      };

      const props = get(layerProps, layer.id, {});

      Promise.resolve(layer.onFilterChange(filterName, value, prevValue, props))
        .then(() => layer.fetchData(falcor, props))
        .then(() => layer.render(state.map, falcor, props))
        .then(() => {
          dispatch({ type: "loading-stop", layerId: layer.id });
        });
    },
    [state.map, falcor, layerProps]
  );

  const fetchData = React.useCallback(
    (layer) => {
      dispatch({ type: "loading-start", layerId: layer.id });

      Promise.resolve(layer.fetchData(falcor))
        .then(() => layer.render(state.map, falcor))
        .then(() => {
          dispatch({ type: "loading-stop", layerId: layer.id });
        });
    },
    [state.map, falcor]
  );

  const updateLegend = React.useCallback(
    (layer, update) => {
      if (!get(layer, "legend", null)) return;

      // console.log("update Legend", layer.legend, update);
      layer.legend = {
        ...layer.legend,
        ...update,
      };
      layer.render(state.map, falcor);

      dispatch({ type: "update-state" });
    },
    [state.map, falcor]
  );

  const addDynamicLayer = React.useCallback((layer) => {
    layer.isDynamic = true;

    dispatch({
      type: "add-dynamic-layer",
      layer,
    });
  }, []);
  const removeDynamicLayer = React.useCallback(
    (layer) => {
      layer._onRemove(state.map);

      dispatch({
        type: "remove-dynamic-layer",
        layer,
      });
    },
    [state.map]
  );
  const toggleVisibility = React.useCallback(
    (layer) => {
      layer.toggleVisibility(state.map);

      dispatch({ type: "update-state" });
    },
    [state.map]
  );
  const addLayer = React.useCallback(
    (layer) => {
      layer._onAdd(state.map, falcor, updateHover);
      // .then(() => layer.render(state.map, falcor));

      dispatch({
        type: "activate-layer",
        layer,
      });
    },
    [state.map, falcor, updateHover]
  );
  const removeLayer = React.useCallback(
    (layer) => {
      layer._onRemove(state.map);

      dispatch({
        type: "deactivate-layer",
        layerId: layer.id,
      });
    },
    [state.map]
  );
  const setSidebarTab = React.useCallback((sidebarTabIndex) => {
    dispatch({
      type: "switch-tab",
      sidebarTabIndex,
    });
  }, []);

  const showModal = React.useCallback((layerId, modalKey) => {
    dispatch({
      type: "show-modal",
      layerId,
      modalKey,
    });
  }, []);
  const closeModal = React.useCallback((layerId, modalKey) => {
    dispatch({
      type: "close-modal",
      layerId,
      modalKey,
    });
  }, []);
  const bringModalToFront = React.useCallback((layerId, modalKey) => {
    dispatch({
      type: "bring-modal-to-front",
      layerId,
      modalKey,
    });
  }, []);

  const removePinnedHoverComp = React.useCallback((id) => {
    dispatch({
      type: "remove-pinned",
      id,
    });
  }, []);
  const addPinnedHoverComp = React.useCallback(
    ({ lngLat, hoverData }) => {
      const marker = new mapboxgl.Marker().setLngLat(lngLat).addTo(state.map);
      dispatch({
        type: "pin-hover-comp",
        marker,
        lngLat,
      });
    },
    [state.map]
  );

  const saveMapAsImage = React.useCallback(
    (fileName = "map.png") => {
      const canvas = state.map.getCanvas();
      const a = document.createElement("a");
      a.download = fileName;
      a.href = canvas.toDataURL();
      a.click();
    },
    [state.map]
  );

  const setMapStyle = React.useCallback(
    (styleIndex) => {

      const geojsonSources = state.activeLayers.reduce((a, c) => {
        c.sources.forEach(({ id, source: { type } }) => {
          if (type === "geojson") {
            a.push(id);
          }
        });
        return a;
      }, []);

      const geojsonData = geojsonSources.reduce((a, c) => {
        const source = state.map.getSource(c);
        if (source) {
          a[c] = source._data;
        }
        return a;
      }, {});

      state.map.once("style.load", (e) => {
        state.activeLayers
          .slice()
          .reverse()
          .reduce((promise, layer) => {
            return promise.then(() =>
              layer.onMapStyleChange(state.map, falcor, updateHover, geojsonData)
            );
          }, Promise.resolve());
      });

      state.activeLayers.forEach((layer) => {
        layer._onRemove(state.map);
      });
      state.map.setStyle(state.mapStyles[styleIndex].style);
      dispatch({
        type: "set-map-style",
        styleIndex,
      });
    },
    [state.map, state.mapStyles, state.activeLayers, updateHover, falcor]
  );

  const MapActions = React.useMemo(
    () => ({
      toggleVisibility,
      addLayer,
      removeLayer,
      addDynamicLayer,
      removeDynamicLayer,
      updateLegend,
      setSidebarTab,
      showModal,
      closeModal,
      updateFilter,
      fetchData,
      removePinnedHoverComp,
      addPinnedHoverComp,
      bringModalToFront,
      projectLngLat,
      saveMapAsImage,
    }),
    [
      toggleVisibility,
      addLayer,
      removeLayer,
      addDynamicLayer,
      removeDynamicLayer,
      updateLegend,
      setSidebarTab,
      fetchData,
      saveMapAsImage,
      showModal,
      closeModal,
      updateFilter,
      bringModalToFront,
      removePinnedHoverComp,
      addPinnedHoverComp,
      projectLngLat,
    ]
  );

  const MapOptions = React.useRef({ ...DefaultMapOptions, ...mapOptions });

  const id = React.useRef(props.id || getUniqueId());

  // LOAD MAPBOX GL MAP
  React.useEffect(() => {
    if (!accessToken) return;

    mapboxgl.accessToken = accessToken;

    const regex = /^mapbox:\/\/styles\//;

    const { style, styles, ...Options } = MapOptions.current;

    const mapStyles = styles.map((style) => ({
      ...style,
      imageUrl: getStaticImageUrl(style.style, { center: Options.center }),
    }));
    let styleIndex = 0;

    if (regex.test(style)) {
      const index = mapStyles.reduce((a, c, i) => {
        return c.style === style ? i : a;
      }, -1);
      if (index === -1) {
        mapStyles.unshift({
          name: "Unspecified Style",
          style,
          imageUrl: getStaticImageUrl(style, Options),
        });
      } else {
        styleIndex = index;
      }
    }

    const map = new mapboxgl.Map({
      container: id.current,
      ...Options,
      style: mapStyles[styleIndex].style,
    });

    if (navigationControl) {
      map.addControl(new mapboxgl.NavigationControl(), navigationControl);
    }

    map.on("move", (e) => {
      dispatch({ type: "update-state", mapMoved: performance.now() });
    });

    map.once("load", (e) => {
      dispatch({ type: "map-loaded", map, mapStyles, styleIndex });
    });

    return () => map.remove();
  }, [accessToken,navigationControl]);

  const initializingLayers = React.useRef([]);

  // INITIALIZE LAYERS
  React.useEffect(() => {
    if (!state.map) return;

    [...layers, ...state.dynamicLayers]
      .filter(({ id }) => !initializingLayers.current.includes(id))
      .reverse()
      .reduce((promise, layer) => {
        dispatch({ type: "init-layer", layer });

        initializingLayers.current.push(layer.id);

        layer.dispatchStateUpdate = (layer, newState) => {
          dispatch({
            type: "layer-update",
            newState,
            layer,
          });
        };

        layer.props = get(layerProps, layer.id, {});

        for (const filterName in layer.filters) {
          layer.filters[filterName].onChange = (v) =>
            updateFilter(layer, filterName, v);
        }

        layer.toolbar.forEach((tool) => {
          if (typeof tool.action === "function") {
            tool.actionFunc = tool.action.bind(layer);
          }
        });

        layer.mapActions.forEach((action) => {
          action.actionFunc = action.action.bind(layer);
        });

        return promise
          .then(() => layer._init(state.map, falcor, MapActions))
          .then(() => {
            if (layer.setActive) {
              layer.fetchData(falcor)
                .then(() => layer._onAdd(state.map, falcor, updateHover))
                .then(() => dispatch({ type: "activate-layer", layer }));
            }
          });
      }, Promise.resolve());
  }, [
    state.map,
    state.dynamicLayers,
    falcor,
    layers,
    MapActions,
    updateFilter,
    updateHover,
    // state.initializedLayers,
    layerProps,
  ]);

  const pinHoverComp = React.useCallback(
    ({ lngLat }) => {
      const marker = new mapboxgl.Marker().setLngLat(lngLat);
      dispatch({
        type: "pin-hover-comp",
        marker,
        lngLat,
      });
    },
    [state.map]
  );

  const hovering = Boolean(state.hoverData.data.size);

  // APPLY CLICK LISTENER TO MAP TO ALLOW PINNED HOVER COMPS
  React.useEffect(() => {
    if (!hovering) return;

    state.map.on("click", pinHoverComp);

    return () => state.map.off("click", pinHoverComp);
  }, [state.map, pinHoverComp, hovering]);

  const loadingLayers = React.useMemo(() => {
    // console.log('LL?', layers, state)
    return [...layers, ...state.dynamicLayers].filter((layer) =>
      Boolean(state.layersLoading[layer.id])
    );
  }, [layers, state.dynamicLayers, state.layersLoading]);

  const { HoverComps, ...hoverData } = React.useMemo(() => {
    const HoverComps = [...state.hoverData.data.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
    return { ...state.hoverData, show: Boolean(HoverComps.length), HoverComps };
  }, [state.hoverData]);

console.log("HOVER COMPS:", HoverComps, state.hoverData)

  // DETERMINE ACTIVE AND INACTIVE LAYERS
  const inactiveLayers = React.useMemo(() => {
    return [...layers, ...state.dynamicLayers].filter((layer) => {
      return (
        !state.initializedLayers.includes(layer.id) ||
        !state.activeLayers.includes(layer)
      );
    });
  }, [
    layers,
    state.dynamicLayers,
    state.initializedLayers,
    state.activeLayers,
  ]);

  // SEND PROPS TO ACTIVE LAYERS
  // React.useEffect(() => {
  //   state.activeLayers.forEach((layer) => {
  //     const props = get(layerProps, layer.id, {}),
  //       prevProps = get(state.prevLayerProps, layer.id, {});
  //     if (props) {
  //       layer.receiveProps(props, state.map, falcor, MapActions);
  //     }
  //   });
  // }, [state.map, falcor, state.activeLayers, layerProps, MapActions]);

  // CHECK FOR LAYER STATE UPDATE
  // React.useEffect(() => {
  //   state.activeLayers.forEach((layer) => {
  //     const layerState = get(state.layerStates, layer.id, {}),
  //       prevLayerState = get(state.prevLayerStates, layer.id, {});
  //     if (layerState !== prevLayerState) {
  //       dispatch({
  //         type: "layer-updated",
  //         layer,
  //       });
  //       layer.render(state.map, falcor)
  //     }
  //   });
  // }, [state.layerStates, state.prevLayerStates, state.map, falcor]);

  // CHECK FOR LAYER PROPS CHANGE OR LAYER STATE CHANGE
  React.useEffect(() => {
    const needsFetch = [],
      needsRender = [];

    state.activeLayers.forEach((layer) => {
      layer.props = get(layerProps, layer.id, {});

      const props = get(layerProps, layer.id, null),
        prevProps = get(state.prevLayerProps, layer.id, null);

      if (props !== prevProps) {
        needsFetch.push(layer);
        return;
      }

      const layerState = get(state.layerStates, layer.id, null),
        prevLayerState = get(state.prevLayerStates, layer.id, null);

      if (layerState !== prevLayerState) {
        needsRender.push(layer);
      }
    });

    needsFetch.forEach((layer) => {
      fetchData(layer);
    });
    needsRender.forEach((layer) => {
      layer.render(state.map, falcor);
    });

    if (needsFetch.length || needsRender.length) {
      dispatch({
        type: "update-prev",
        layerProps,
        updateProps: needsFetch,
        updateStates: needsRender
      });
    }

  }, [
    state.activeLayers,
    layerProps,
    state.prevLayerProps,
    state.layerStates,
    state.prevLayerStates,
    state.map,
    falcor,
    fetchData,
  ]);

  const ref = React.useRef(null),
    size = useSetSize(ref);

  const Modals = React.useMemo(() => {
    return state.modalData.reduce((a, md) => {
      const { modal, layer } = state.activeLayers.reduce((a, c) => {
        return c.id === md.layerId
          ? { modal: get(c, ["modals", md.modalKey]), layer: c }
          : a;
      }, {});
      if (modal) {
        a.push({ ...modal, modalData: md, layer });
      }
      return a;
    }, []);
  }, [state.activeLayers, state.modalData]);

  const AllMapActions = React.useMemo(() => {
    return { ...MapActions, setMapStyle };
  }, [MapActions, setMapStyle]);

  const mapActions = React.useMemo(() => {
    return state.activeLayers.reduce((a, c) => {
      const actions = get(c, "mapActions", []).map((action) => ({
        action,
        layer: c,
      }));
      return [...a, ...actions];
    }, []);
  }, [state.activeLayers]);

  const getRect = React.useCallback(() => {
    if (ref.current) {
      return ref.current.getBoundingClientRect();
    }
    return { width: 0, height: 0 };
  }, []);

  const { width, height } = getRect();
  React.useEffect(() => {
    if (state.map) {
      state.map.resize();
    }
  }, [width, height, state.map]);

  return (
    <div ref={ref} className="w-full h-full relative focus:outline-none">
      <div id={id.current} className="w-full h-full relative" />

      {CustomSidebar ?
        <CustomSidebar
          mapboxMap={state.map}
          layerStates={state.layerStates}
          sidebarTabIndex={state.sidebarTabIndex}
          mapStyles={state.mapStyles}
          styleIndex={state.styleIndex}
          layersLoading={state.layersLoading}
          inactiveLayers={inactiveLayers}
          activeLayers={state.activeLayers}
          loadingLayers={loadingLayers}
          MapActions={AllMapActions}
        />
      :
      <Sidebar
        {...DefaultSidebar}
        {...sidebarProps}
        togglePosition={
          mapActions.length ? "middle" : sidebarProps.togglePosition
        }
        mapboxMap={state.map}
        layerStates={state.layerStates}
        sidebarTabIndex={state.sidebarTabIndex}
        mapStyles={state.mapStyles}
        styleIndex={state.styleIndex}
        layersLoading={state.layersLoading}
        inactiveLayers={inactiveLayers}
        activeLayers={state.activeLayers}
        loadingLayers={loadingLayers}
        MapActions={AllMapActions}
      >
        <div className="absolute top-0">
          {mapActions.map(({ action, layer }, i) => (
            <MapAction
              key={`${layer.id}-${i}`}
              layer={layer}
              {...action}
              MapActions={AllMapActions}
              mapboxMap={state.map}
              layerStates={state.layerStates}
              layersLoading={state.layersLoading}
              inactiveLayers={inactiveLayers}
              activeLayers={state.activeLayers}
              loadingLayers={loadingLayers}
            />
          ))}
        </div>
      </Sidebar>
      }
      <InfoBoxes
        activeLayers={state.activeLayers}
        layersLoading={state.layersLoading}
        loadingLayers={loadingLayers}
        inactiveLayers={inactiveLayers}
        MapActions={AllMapActions}
        mapboxMap={state.map}
        layerStates={state.layerStates}
      />

      <div
        className={`
        absolute top-0 bottom-0 left-0 right-0 z-50
        pointer-events-none overflow-hidden
      `}
      >
        {Modals.map(({ modalData, ...data }) => (
          <DraggableModal
            key={`${modalData.layerId}-${modalData.modalKey}`}
            {...data}
            bounds={size}
            modalData={modalData}
            MapActions={AllMapActions}
            mapboxMap={state.map}
            layerStates={state.layerStates}
            activeLayers={state.activeLayers}
            layersLoading={state.layersLoading}
            loadingLayers={loadingLayers}
            inactiveLayers={inactiveLayers}
          />
        ))}

        {state.pinnedHoverComps.map(
          ({ HoverComps, data, id, ...hoverData }) => (
            <PinnedHoverComp
              {...hoverData}
              {...size}
              remove={removePinnedHoverComp}
              project={projectLngLat}
              key={id}
              id={id}
            >
              {HoverComps.map(({ HoverComp, data, layer }, i) => (
                <HoverComp
                  key={layer.id}
                  layer={layer}
                  data={data}
                  activeLayers={state.activeLayers}
                  layersLoading={state.layersLoading}
                  loadingLayers={loadingLayers}
                  inactiveLayers={inactiveLayers}
                  MapActions={AllMapActions}
                  mapboxMap={state.map}
                  layerStates={state.layerStates}
                  pinned={true}
                />
              ))}
            </PinnedHoverComp>
          )
        )}

        {!Boolean(state.hoverData.data.size) ? null : (
          <HoverCompContainer {...hoverData} {...size} project={projectLngLat}>
            {HoverComps.map(({ HoverComp, data, layer }, i) => (
              <HoverComp
                key={layer.id}
                layer={layer}
                data={data}
                activeLayers={state.activeLayers}
                layersLoading={state.layersLoading}
                loadingLayers={loadingLayers}
                inactiveLayers={inactiveLayers}
                MapActions={AllMapActions}
                mapboxMap={state.map}
                layerStates={state.layerStates}
                pinned={false}
              />
            ))}
          </HoverCompContainer>
        )}
      </div>
    </div>
  );
};
export { AvlMap };

// const useCheckLayerProps = (activeLayers, layerProps) => {
//   const prevLayerProps = React.useRef({});
//   React.useEffect(() => {}, [activeLayers, layerProps]);
// };
