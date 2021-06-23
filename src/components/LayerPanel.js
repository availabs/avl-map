import React from "react"

import get from "lodash.get"

import {
  useTheme,
  ColorBar,
  DummyLegendTools,
  useLegendReducer,
  useSidebarContext,
  Select
} from "@availabs/avl-components"


const LayerPanel = ({ layer, layersLoading, customTheme, ...rest }) => {

  const [open, setOpen] = React.useState(true),
    toggleOpen = React.useCallback(e => {
      setOpen(!open);
    }, [open, setOpen]);

  const theme = { ...useTheme(), ...customTheme }

  const filters = React.useMemo(() => {
    return Object.values(layer.filters)
      .map(({ name, type, layerId, active=true, ...rest }, i) => {
        if(!active) return 
        switch (type) {
          default:
            return (
              <div className={ `mt-1 p-1` }
                key={ `${ layerId }-${ name }` }>
                <div className="text-sm text-npmrds-100 leading-4 pb-1">
                  { name }
                </div>
                <Select 
                  customTheme={customTheme} { ...rest } 
                  removable={rest.multi ? true : false}
                />
              </div>
            )
        }
      });
  }, [layer.filters, theme]);

  return (
    <div className={ `relative` }>

      <div className={ `
        absolute top-0 bottom-0 left-0 right-0 z-10 opacity-50
        ${ Boolean(layersLoading[layer.id]) ? "block" : "hidden" }
        ${ theme.sidebarBg }
      ` }/>

      <LayerHeader layer={ layer } { ...rest }
        open={ open } toggleOpen={ toggleOpen } customTheme={customTheme}/>
      <div style={ { display: open ? "block" : "none" } }>
        { !layer.legend ? null :
          <LegendControls layer={ layer } { ...rest } customTheme={customTheme}/>
        }
        <div className={`p-2 ${theme.accent1} mt-1`}>
        { filters }
        </div>
      </div>
    </div>
  )
}
export default LayerPanel;

export const Icon = ({ onClick, cursor="cursor-pointer", className="", style={}, children }) => {
  const theme = useTheme();
  return (
    <div onClick={ onClick }
      className={ `
        ${ cursor } ${ className } transition h-6 w-6
        hover:${ theme.menuTextActive } flex items-center justify-center
      ` }
      style={ { ...style } }>
      { children }
    </div>
  )
}

const LayerHeader = ({ layer, toggleOpen, open, MapActions, customTheme }) => {
  const theme = { ...useTheme(), ...customTheme }
  return (
    <div className={ `flex flex-col px-1 pb-4 pt-1 ${ theme.accent2 } border-l-4 border-red-400` }>
      <div className="flex items-center">
        <Icon cursor="cursor-move">
          <span className="fa fa-bars mr-1"/>
        </Icon>
        <div className="font-medium text-sm leading-5">
          { layer.name }
        </div>
        <div className="flex-1 flex justify-end">
          { !layer.isDynamic ? null :
            <Icon onClick={ e => MapActions.removeDynamicLayer(layer) }>
              <span className="fa fa-trash"/>
            </Icon>
          }
          <Icon onClick={ e => MapActions.removeLayer(layer) }>
            <span className="fa fa-times"/>
          </Icon>
          <Icon onClick={ toggleOpen }>
            <span className={ `fa fa-sm ${ open ? 'fa-minus' : 'fa-plus' }` }/>
          </Icon>
        </div>
      </div>
      <div className="flex items-center"
        style={ { marginTop: "-0.25rem" } }>
        { layer.toolbar.map((tool, i) =>
            <LayerTool MapActions={ MapActions }
              layer={ layer } tool={ tool } key={ i }/>
          )
        }
      </div>
    </div>
  )
}

const LegendControls = ({ layer, MapActions,customTheme }) => {

  const { extendSidebar, passCompProps, closeExtension, open } = useSidebarContext();

  const { range, type, types } = get(layer, "legend", {});

  const [toolState, dispatch] = useLegendReducer(range.length);

  const updateLegend = React.useCallback(update => {
    MapActions.updateLegend(layer, update);
  }, [layer, MapActions]);

  const theme = { ...useTheme(), ...customTheme },
    ref = React.useRef();

  const onClick = React.useCallback(e => {
    if (open === 2) return closeExtension();

    const rect = ref.current.getBoundingClientRect();
    const compProps = { layer, range, updateLegend, dispatch, toolState, customTheme };
    extendSidebar({ Comp: LegendSidebar, compProps, top: `calc(${ rect.top }px - 0.5rem)` });
  }, [ref, extendSidebar, closeExtension, open, layer, range, updateLegend, dispatch, toolState,customTheme]);

  React.useEffect(() => {
    passCompProps({ layer, updateLegend, dispatch, toolState, range, type, types,customTheme });
  }, [layer, range, type, types, updateLegend, toolState, passCompProps, dispatch, customTheme]);

  return (
    <div ref={ ref } className={ `
      mt-1 ${ theme.accent1 } hover:${ theme.accent2 }
      px-3 pt-2 pb-4 transition relative cursor-pointer
    ` } onClick={ onClick }>

      <div className={`${theme.menuText}`}>Legend Controls</div>
      <ColorBar colors={ range } small/>

    </div>
  )
}
const LegendSidebar = ({ toolState, customTheme,...props }) => {
  const theme = { ...useTheme(), ...customTheme }
  return (
    <div className={ `
      p-1 cursor-auto bg-npmrds-800 w-full
    ` }>
      <div className={ `${ theme.siderbarBg } relative` }>
        <div className={ ` p-1 ${ theme.accent1 } text-npmrds-100` }>

          <DummyLegendTools { ...props } { ...toolState }/>

        </div>
      </div>
    </div>
  )
}

const checkDefaultTools = tool => {
  if (typeof tool !== "string") return tool;

  switch (tool) {
    case "toggle-visibility":
      return {
        tooltip: "Toogle Visibility",
        icon: layer => layer.isVisible ? "fa-eye" : "fa-eye-slash",
        action: ({ toggleVisibility }, layer) => toggleVisibility(layer)
      };
    default:
      return {
        tooltip: `Unknown Tool "${ tool }"`,
        icon: "fa-thumbs-down",
        action: e => {}
      };
  }
}

const LayerTool = ({ tool, MapActions, layer }) => {

  const Tool = React.useMemo(() => {
    return checkDefaultTools(tool);
  }, [tool]);

  const action = React.useCallback(e => {
    Tool.action(MapActions, layer);
  }, [Tool, MapActions, layer]);

  const icon = typeof Tool.icon === "function" ? Tool.icon(layer) : Tool.icon;

  return (
    <Icon onClick={ action }>
      <span className={ `fa fa-sm ${ icon }` }/>
    </Icon>
  )
};
