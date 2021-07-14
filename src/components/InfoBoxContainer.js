import React from "react"

import get from "lodash.get"

import { useTheme, Legend } from "@availabs/avl-components"

import { Icon } from "./LayerPanel"

const InfoBoxContainer = ({ activeLayers, width = 420, padding = 8, MapActions, ...props }) => {

  const [node, setNode] = React.useState();


  const [legendLayer, infoBoxLayers, infoBoxWidth] = activeLayers.reduce((a, c) => {
      if (c.legend) {
        a[0] = c;
      }
      if (c.infoBoxes.reduce((aa, cc) => {
            let show = Boolean(cc.show);
            if (typeof cc.show === "function") {
              show = cc.show(c);
            }
            return aa || show;
          }, false)
      ) {
        a[1].push(c);
        a[2] = Math.max(a[2],
          c.infoBoxes.reduce((aa, cc) => Math.max(aa, get(cc, "width", 0)), 0)
        );
      }
      return a;
    }, [null, [], width]);

  const theme = useTheme();


  return (
    <div ref={ setNode }
      className={ `
        absolute right-0 top-0 bottom-0
        flex flex-col items-end z-30
        pointer-events-none
      ` }
      style={ { padding: `${ padding }px` } }>

      { !legendLayer ? null :
        legendLayer.legend.show ?
        <LegendContainer
          { ...legendLayer.legend }
          MapActions={ MapActions } layer={ legendLayer }
          padding={ padding } infoBoxWidth={ infoBoxWidth }/>
        : null
      }

      { !infoBoxLayers.length ? null :
        <div className={ `
            ${ theme.sidebarBg } p-1
            scrollbar-sm overflow-y-auto overflow-x-visible
            pointer-events-auto
          ` }
          style={ {
            width: `${ infoBoxWidth - padding * 2 }px`
          } }>
          { infoBoxLayers.map((layer, i) =>
              <div key={ layer.id }
                className={ `
                  ${ i === 0 ? "" : "mt-1" }
                  ${ theme.menuBg } p-1 rounded
                ` }>
                { layer.infoBoxes
                    .filter(({ show }) => {
                      let bool = Boolean(show);
                      if (typeof show === "function") {
                        bool = show(layer);
                      }
                      return bool;
                    })
                    .map((box, ii) =>
                      <InfoBox key={ ii } { ...props } { ...box }
                        index={ ii } layer={ layer }
                        MapActions={ MapActions }
                        activeLayers={ activeLayers }
                        containerNode={ node }/>
                    )
                }
              </div>
            )
          }
        </div>
      }

    </div>
  )
}
export default InfoBoxContainer;

const InfoBox = ({ layer, Header, Component, index, MapActions, open = true, ...props }) => {

  const [isOpen, setOpen] = React.useState(open);

  const theme = useTheme();

  return (
    <div className={ `
      ${ theme.accent1 } px-1 ${ isOpen ? "pb-1" : "" }
      ${ index === 0 ? "" : "mt-1" }
    ` }>
      { !Header ? <div className="pt-1"/> :
          <div className={ `
            rounded text-lg font-bold
            flex items-center
          ` }>
            <div className={ `
              flex-1 ${ isOpen ? "opacity-100" : "opacity-50" } transition
            ` }>
              { typeof Header === "function" ?
                <Header layer={ layer }
                  MapActions={ MapActions }/> :
                Header
              }
            </div>
            <div className="text-base">
              <Icon onClick={ e => setOpen(!isOpen) }>
                <span className={ `fa fa-${ isOpen ? "minus" : "plus" }` }/>
              </Icon>
            </div>
        </div>
      }
      { !Component || !isOpen ? null :
        <div className={ `
          ${ theme.accent1 } ${theme.menuText} p-1
        ` }>
          { typeof Component === "function" ?
            <Component layer={ layer }
              MapActions={ MapActions }
              { ...props }/> :
            Component
          }
        </div>
      }
    </div>
  )
}

const LegendContainer = ({ infoBoxWidth, padding, width = 420, Title, MapActions, layer, ...props }) => {

  const theme = useTheme();

  return (
    <div className={ `
      ${ theme.sidebarBg } p-1 rounded pointer-events-auto
    ` }
    style={ {
      width: `${ Math.max(infoBoxWidth, width) - padding * 2 }px`,
      marginBottom: "-0.25rem"
    } }>
      <div className={ `${ theme.menuBg } p-1 ` }>
        <div className={ `${ theme.bg } px-3 pb-1` }>
          { Title ?
            <div className={`font-medium text-lg ${theme.menuText} py-1`}>
              { typeof Title === "function" ?
                <Title layer={ layer }
                  MapActions={ MapActions }/> :
                Title
              }
            </div> :
            <div className="pt-1"/>
          }
          <Legend { ...props }/>
        </div>
      </div>
    </div>
  )
}
