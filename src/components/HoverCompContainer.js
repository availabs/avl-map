import React from "react"

import { useTheme } from "@availabs/avl-components"

import { Icon } from "./LayerPanel"

const getTranslate = (pos, { width, height }) => {

  const gap = 30, padding = 10, { x, y } = pos;

  const yMax = height,
    yTrans = `max(
      ${ padding }px,
      min(calc(${ y }px - 50%), calc(${ yMax - padding }px - 100%))
    )`;
  if (x < width * 0.5) {
    return `translate(
      ${ x + gap }px,
      ${ yTrans }
    )`
  }
  return `translate(
    calc(-100% + ${ x - gap }px),
    ${ yTrans }
  )`
}

// const getPinnedTranslateOld = ({ x, y }) => {
//   const gap = 30;
//   return `translate(${ x + gap }px, calc(${ y - 20 }px - 50%))`;
// }

const getPinnedTranslate = ({ x, y }, orientation) => {

  const gap = 30;

  const yTrans = `calc(${ y }px - 50%)`;

  if (orientation === "right") {
    return `translate(
      ${ x + gap }px,
      ${ yTrans }
    )`
  }
  return `translate(
    calc(-100% + ${ x - gap }px),
    ${ yTrans }
  )`
}
const getTransform = ({ x }, orientation) => {
  if (orientation === "right") {
    return "translate(-50%, -50%) rotate(45deg) skew(-15deg, -15deg)"
  }
  return "translate(50%, -50%) rotate(45deg) skew(-15deg, -15deg)"
}

const RemoveButton = ({ orientation, children }) => {
  const theme = useTheme();
  return (
    <div style={ {
        transform: orientation === "left" ?
          "translate(-0.75rem, -0.75rem)" : "translate(0.75rem, -0.75rem)"
      } }
      className={ `
        ${ theme.bg }
        rounded absolute inline-block top-0 z-20
        ${ orientation === "left" ? "left-0" : "right-0" }
      ` }>
      { children }
    </div>
  )
}

export const PinnedHoverComp = ({ children, remove, id, project, lngLat, width }) => {

  const pos = project(lngLat);

  const orientation = React.useRef(pos.x < width * 0.5 ? "right" : "left");

  const style = React.useMemo(() => {
    return {
      top: "50%",
      transform: getTransform(pos, orientation.current)
    };
  }, [pos]);

  const theme = useTheme();

  return (
    <div className={ `
        absolute top-0 left-0 z-20 inline-block
        rounded whitespace-nowrap hover-comp
        pointer-events-auto
         ${ theme.sidebarBg }
        grid grid-cols-1 gap-1
      ` }
      style={ {
        transform: getPinnedTranslate(pos, orientation.current),
        boxShadow: "2px 2px 8px 0px rgba(0, 0, 0, 0.75)"
      } }>

      <div className={ `
          absolute w-6 h-6 ${ theme.sidebarBg } rounded-bl rounded-tr
          ${ orientation.current === "left" ? "right-0" : "left-0" }
        ` }
        style={ style }/>

        { children }

        <RemoveButton orientation={ orientation.current }>
          <Icon onClick={ e => remove(id) }>
            <span className="fa fa-times"/>
          </Icon>
        </RemoveButton>

    </div>
  )
}

export const HoverCompContainer = ({ show, children, lngLat, project, ...rest }) => {
  const theme = useTheme();

  const pos = project(lngLat);

  return (
    <div className={ `
        absolute top-0 left-0 z-20
        rounded whitespace-nowrap hover-comp
        pointer-events-none
        grid grid-cols-1 gap-1
      ` }
      style={ {
        display: show ? "grid" : "none",
        transform: getTranslate(pos, rest),
        boxShadow: "2px 2px 8px 0px rgba(0, 0, 0, 0.75)",
        // transition: "transform 0.15s ease-out"
      } }>

      { children }

    </div>
  )
}
