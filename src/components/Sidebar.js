import React from "react"

import { Select, useTheme, CollapsibleSidebar } from "@availabs/avl-components"

import LayerPanel from "./LayerPanel"

const LayersTab = ({ inactiveLayers, activeLayers, MapActions, ...rest }) => {

  const theme = useTheme();

  return (
    <>
      { !inactiveLayers.length ? null :
        <div className={ `mb-1 p-1 ${ theme.menuBg } rounded` }>
          <div className={ `p-1 ${ theme.bg } rounded` }>
            <Select options={ inactiveLayers }
              placeholder="Add a Layer..."
              accessor={ ({ name }) => name }
              value={ null } multi={ false }
              searchable={ false }
              onChange={ MapActions.addLayer }/>
          </div>
        </div>
      }
      { activeLayers.map(layer =>
          <LayerPanel key={ layer.id } { ...rest }
            layer={ layer } MapActions={ MapActions }/>
        )
      }
    </>
  )
}
const StylesTab = ({ mapStyles, styleIndex, MapActions }) => {

  const theme = useTheme();

  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (loading) {
      const done = () => setLoading(false);
      MapActions.mapboxMap.once("style.load", done);
      return () => MapActions.mapboxMap.off("style.load", done);
    }
  }, [loading, MapActions.mapboxMap]);

  const updateStyle = React.useCallback(index => {
    setLoading(true);
    MapActions.setMapStyle(index);
  }, [MapActions]);

  return (
    <div className={ `${ theme.menuBg } p-1 rounded` }>

      <div className={ `
        absolute top-0 bottom-0 left-0 right-0 opacity-50 z-10
        ${ theme.sidebarBg } ${ loading ? "block" : "hidden" }
      ` }/>

      <div className={ `${ theme.bg } p-1 rounded relative` }>

        { mapStyles.map(({ name, imageUrl }, i) =>
            <div key={ i } className={ `
              ${ i === 0 ? "" : "mt-1" } p-1 rounded hover:${ theme.menuTextActive }
              flex items-center hover:${ theme.accent2 } transition
              ${ i === styleIndex ?
                `border-r-4 ${ theme.borderInfo } ${ theme.accent2 }` :
                `${ theme.accent1 } cursor-pointer`
              }
            ` } onClick={ i === styleIndex ? null : e => updateStyle(i) }>
              <img src={ imageUrl } alt={ name } className="rounded"/>
              <div className="ml-2">{ name }</div>
            </div>
          )
        }

      </div>
    </div>
  )
}

const SidebarTabs = {
  layers: {
    icon: "fa fa-layer-group",
    Component: LayersTab
  },
  styles: {
    icon: "fa fa-map",
    Component: StylesTab
  }
}

const Sidebar = ({ open, sidebarTabIndex, MapActions, tabs, title, children, ...rest }) => {

  const Tabs = React.useMemo(() => {
    return tabs.map(tab => {
      if (tab in SidebarTabs) {
        return SidebarTabs[tab];
      }
      return tab;
    })
  }, [tabs]);

  const theme = useTheme();

  return (
    <CollapsibleSidebar startOpen={ open }
      placeBeside={ children }>

      <div className={ `p-1 h-full ${ theme.sidebarBg } rounded` }>
        { !title ? null :
          <div className="text-xl font-bold ml-1">
            { title }
          </div>
        }
        <div className="flex">
          { Tabs.map(({ icon }, i) => (
              <div key={ i } onClick={ e => MapActions.setSidebarTab(i) }
                className={ `
                  p-1 rounded-t-lg mb-1 ${ i > 0 ? "ml-1" : "" }
                  ${ theme.menuBg }
                ` }>
                <div className={ `
                    w-10 h-9 hover:${ theme.bg } rounded-t-lg transition
                    ${ i === sidebarTabIndex ?
                      `${ theme.bg } ${ theme.menuTextActive }` :
                      `${ theme.menuBg} cursor-pointer`
                    } hover:${ theme.menuTextActive }
                    flex items-center justify-center
                  ` }>
                  <span className={ `fa fa-lg ${ icon }` }/>
                </div>
              </div>
            ))
          }
        </div>
        { Tabs.map(({ Component }, i) => (
            <div key={ i } className="relative z-10"
              style={ { display: i === sidebarTabIndex ? "block" : "none" } }>
              <Component { ...rest } MapActions={ MapActions }/>
            </div>
          ))
        }
      </div>

    </CollapsibleSidebar>
  )
}
export default Sidebar;
