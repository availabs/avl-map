import React from "react"

import { Select, useTheme,/*CollapsibleSidebar*/ } from "components/avl-components/src"

import { CollapsibleSidebar, useSidebarContext } from './CollapsibleSidebar'

import LayerPanel from "./LayerPanel"

const LayersTab = ({ inactiveLayers, activeLayers, MapActions, ...rest }) => {

  const theme = useTheme();
  
  return (
    <>
      { !inactiveLayers.length ? null :
        <div className={ `mb-1 p-1 ${ theme.menuBg } ${theme.rounded}` }>
          <div className={ `p-1 ${ theme.bg } ${theme.rounded}` }>
            <Select options={ inactiveLayers }
              placeholder="Add a Layer..."
              accessor={ ({ name }) => name }
              value={ null } multi={ false }
              searchable={ false }
              onChange={ MapActions.addLayer }/>
          </div>
        </div>
      }
      { activeLayers.map((layer,i) =>
          <LayerPanel
            key={ i } { ...rest }
            layer={ layer } MapActions={ MapActions }/>
        )
      }
    </>
  )
}
const StylesTab = ({ mapStyles, styleIndex, MapActions, mapboxMap }) => {

  const theme = useTheme();

  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (loading) {
      const done = () => setLoading(false);
      mapboxMap.once("style.load", done);
      return () => mapboxMap.off("style.load", done);
    }
  }, [loading, mapboxMap]);

  const updateStyle = React.useCallback(index => {
    setLoading(true);
    MapActions.setMapStyle(index);
  }, [MapActions]);

  return (
    <div className={ `${ theme.menuBg } ${theme.rounded}` }>

      <div className={ `
        absolute top-0 bottom-0 left-0 right-0 opacity-50 z-10
        ${ theme.sidebarBg } ${ loading ? "block" : "hidden" }
      ` }/>

      <div className={ `${ theme.bg } p-1 ${theme.rounded} relative` }>

        { mapStyles.map(({ name, imageUrl }, i) =>
            <div key={ i } className={ `
              ${ i === 0 ? "" : "mt-1" } p-1 ${theme.rounded} hover:${ theme.menuTextActive }
              flex items-center hover:${ theme.accent2 } transition
              ${ i === styleIndex ?
                `border-r-4 ${ theme.borderInfo } ${ theme.accent2 }` :
                `${ theme.accent1 } cursor-pointer`
              }
            ` } onClick={ i === styleIndex ? null : e => updateStyle(i) }>
              <img src={ imageUrl } alt={ name } className={`${theme.rounded}`}/>
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
    icon: "fa fa-filter",
    Component: LayersTab
  },
  styles: {
    icon: "fa fa-layer-group",
    Component: StylesTab
  }
}

const Tab = ({i, icon, MapActions, sidebarTabIndex}) => {
    const {open, doToggle} = useSidebarContext();
    const theme = { ...useTheme() };
    return (
      <div key={ i } onClick={ e => {
        //console.log('onclick', open, doToggle)
        if((!open) || (open && i === sidebarTabIndex)  ) {
          doToggle()
        }

        MapActions.setSidebarTab(i) 
      }}
        className={ `
           rounded-t-lg 
           inline-block
        ` }>
        <div className={ `
            w-10 h-11 hover:text-yellow-600 text-xs
            ${i === 0 ? 'rounded-tl-lg ' : '' }
            ${ open && i === sidebarTabIndex ?
              'bg-blue-500 text-white' :
              ` cursor-pointer hover:bg-gray-200`
            } 
            flex items-center justify-center
          ` }>
            <span className={ `fa fa-lg ${ icon }` }/>
          </div>
          
        </div>
    )
}

const Sidebar = ({ open, sidebarTabIndex, MapActions, tabs, title, children, togglePosition, showSidebar, sidebarTabPosition, ...rest }) => {

  const c = useSidebarContext();
  const Tabs = React.useMemo(() => {
    return tabs.map(tab => {
      if (tab in SidebarTabs) {
        return SidebarTabs[tab];
      }
      return tab;
    })
  }, [tabs]);

  const theme = { ...useTheme() };

  return (
    <CollapsibleSidebar
      togglePosition={ togglePosition }
      minWidth={'w-10'}
      startOpen={ Boolean(open) && Boolean(showSidebar) }
      showToggle={ false }
      placeBeside={ children }>

      { !showSidebar ? null :
        <div className={ `h-full overflow-hidden rounded flex ${sidebarTabPosition === 'top' ? 'flex-col' : '' }`}  style={{background: 'rgba(255,255,255, 0.5)'}}>
          
          <div className={`mb-1 rounded-t-lg flex ${sidebarTabPosition === 'top' ? '' : 'flex-col items-center'}`} style={{background: 'rgba(255,255,255, 0.7)'}}>
            { Tabs.map(({ icon }, i) => (
              <Tab icon={icon} key={i} i={i} MapActions={ MapActions } sidebarTabIndex={ sidebarTabIndex}/>)
            )
          }
          </div>

          <div className='flex-1 p-2 overflow-x-scroll'>
            { 
              !title ? null :
              <div className="text-xl font-bold ml-1">
                { title }
              </div>
            }
            { Tabs.map(({ Component }, i) => (
                <div key={ i } className="relative z-10 overflow-auto h-full scrollbar-sm"
                  style={ { display: i === sidebarTabIndex ? "block" : "none" } }>
                  <Component { ...rest } MapActions={ MapActions }/>
                </div>
              ))
            }
          </div>
        </div>
      }

    </CollapsibleSidebar>
  )
}
export default Sidebar;
