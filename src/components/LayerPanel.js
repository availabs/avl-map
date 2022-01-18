import React from "react";

import get from "lodash.get";

import {
  useTheme,
  ColorBar,
  DummyLegendTools,
  useLegendReducer,
} from "@availabs/avl-components";

import {
  Select

} from 'components/avl-components/src'

import {
  useSidebarContext,
} from './CollapsibleSidebar'

const LayerPanel = ({ layer, layersLoading, ...rest }) => {
  const [open, setOpen] = React.useState(true),
    toggleOpen = React.useCallback(
      (e) => {
        setOpen(!open);
      },
      [open, setOpen]
    );

  const theme = useTheme();

  const filters = React.useMemo(() => {
    return Object.values(layer.filters).map(
      ({ name, type, layerId, active = true, ...rest }, i) => {
        if (!active) return;
        switch (type) {
          default:
            return (
              <div
                className={`pt-2 ${theme.bg} p-1 rounded`}
                key={`${layerId}-${name}`}
              >
                <div className="text-base leading-4 mb-1">{name}</div>
                <Select {...rest} removable={rest.multi ? true : false} />
              </div>
            );
        }
      }
    );
  }, [layer.filters, theme]);

  return (
    <div className={`${theme.menuBg} p-1 mb-1 rounded relative`}>
      <div
        className={`
        absolute top-0 bottom-0 left-0 right-0 z-10 opacity-50
        ${Boolean(layersLoading[layer.id]) ? "block" : "hidden"}
        ${theme.sidebarBg}
      `}
      />

      <LayerHeader
        layer={layer}
        {...rest}
        open={open}
        toggleOpen={toggleOpen}
      />

      <div style={{ display: open ? "block" : "none" }}>
       {/* {!layer.legend ? null : <LegendControls layer={layer} {...rest} />}*/}
        {filters}
      </div>
    </div>
  );
};
export default LayerPanel;

export const Icon = ({
  onClick,
  cursor = "cursor-pointer",
  className = "",
  style = {},
  children,
}) => {
  const theme = useTheme();
  return (
    <div
      onClick={onClick}
      className={`
        ${cursor} ${className} transition h-6 w-6
        hover:${theme.menuTextActive} flex items-center justify-center
      `}
      style={{ ...style }}
    >
      {children}
    </div>
  );
};
const LayerHeader = ({ layer, toggleOpen, open, MapActions }) => {
  const theme = useTheme();

  return (
    <div className={`flex flex-col px-1 ${theme.bg} rounded`}>
      <div className="flex items-center">
        <Icon cursor="cursor-move">
          <span className="fa fa-bars mr-1" />
        </Icon>
        <div className="font-semibold text-lg leading-5">{layer.name}</div>
        <div className="flex-1 flex justify-end">
          {!layer.isDynamic ? null : (
            <Icon onClick={(e) => MapActions.removeDynamicLayer(layer)}>
              <span className="fa fa-trash" />
            </Icon>
          )}
          <Icon onClick={(e) => MapActions.removeLayer(layer)}>
            <span className="fa fa-times" />
          </Icon>
          <Icon onClick={toggleOpen}>
            <span className={`fa fa-sm ${open ? "fa-minus" : "fa-plus"}`} />
          </Icon>
        </div>
      </div>
      <div className="flex items-center" style={{ marginTop: "-0.25rem" }}>
        {layer.toolbar.map((tool, i) => (
          <LayerTool
            MapActions={MapActions}
            layer={layer}
            tool={tool}
            key={i}
          />
        ))}
      </div>
    </div>
  );
};

const LegendControls = ({ layer, MapActions }) => {
  const theme = useTheme();

  const {
    extendSidebar,
    passCompProps,
    closeExtension,
    open,
  } = useSidebarContext();

  const range = get(layer, ["legend", "range"], []);

  const [toolState, dispatch] = useLegendReducer(range.length);

  const updateLegend = React.useCallback(
    (update) => {
      MapActions.updateLegend(layer, update);
    },
    [layer, MapActions]
  );

  const ref = React.useRef();

  const onClick = React.useCallback(
    (e) => {
      if (open === 2) return closeExtension();

      const rect = ref.current.getBoundingClientRect();
      const compProps = { layer, range, updateLegend, dispatch, toolState };
      extendSidebar({
        Comp: LegendSidebar,
        compProps,
        top: `calc(${rect.top}px - 0.5rem)`,
      });
    },
    [
      ref,
      extendSidebar,
      closeExtension,
      open,
      layer,
      range,
      updateLegend,
      dispatch,
      toolState,
    ]
  );

  React.useEffect(() => {
    passCompProps({ layer, range, updateLegend, dispatch, toolState });
  }, [layer, range, updateLegend, toolState, passCompProps, dispatch]);

  return (
    <div
      ref={ref}
      className={`
      mt-1 ${theme.bg} hover:${theme.accent1}
      px-1 pb-1 rounded transition relative cursor-pointer
    `}
      onClick={onClick}
    >
      <div>Legend Controls</div>
      <ColorBar colors={range} small />
    </div>
  );
};
const LegendSidebar = ({ layer, range, updateLegend, dispatch, toolState }) => {
  const theme = useTheme();
  return (
    <div
      className={`
        p-1 rounded-r cursor-auto ${theme.sidebarBg} w-full
      `}
    >
      <div className={`${theme.menuBg} relative p-1 rounded`}>
        <div className={`rounded p-1 ${theme.bg}`}>
          <DummyLegendTools
            layer={layer}
            current={range}
            updateLegend={updateLegend}
            dispatch={dispatch}
            {...toolState}
          />
        </div>
      </div>
    </div>
  );
};

const checkDefaultTools = (tool) => {
  if (typeof tool !== "string") return tool;

  switch (tool) {
    case "toggle-visibility":
      return {
        tooltip: "Toogle Visibility",
        icon: (layer) => (layer.isVisible ? "fa-eye" : "fa-eye-slash"),
        action: ({ toggleVisibility }, layer) => toggleVisibility(layer),
      };
    default:
      return {
        tooltip: `Unknown Tool "${tool}"`,
        icon: "fa-frown",
        action: (e) => {},
      };
  }
};

const LayerTool = ({ tool, MapActions, layer }) => {
  const Tool = React.useMemo(() => {
    return checkDefaultTools(tool);
  }, [tool]);

  const action = React.useCallback(
    (e) => {
      Tool.action(MapActions, layer);
    },
    [Tool, MapActions, layer]
  );

  const icon = typeof Tool.icon === "function" ? Tool.icon(layer) : Tool.icon;

  return (
    <Icon onClick={action}>
      <span className={`fa fa-sm ${icon}`} />
    </Icon>
  );
};
