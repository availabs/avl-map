import React from "react"

import { ScalableLoading, useTheme } from "@availabs/avl-components"

const LoadingLayer = ({ layer, progress }) => {

  const theme = useTheme();

  return (
    <div className={ `
        ${ theme.sidebarBg } w-72 p-1 mt-2
        rounded-tl rounded-bl rounded-tr-full rounded-br-full
      ` }
      style={ {
      } }>
      <div className={ `${ theme.menuBg } p-1 rounded rounded-tr-full rounded-br-full` }>
        <div className={ `${ theme.bg } p-1 rounded rounded-tr-full rounded-br-full flex` }>
          <div className="flex-1 text-xl font-bold flex items-center">
            { layer.name }
          </div>
          <div className={ `${ theme.menuTextActive }` }>
            <ScalableLoading scale={ 0.35 } color="currentColor"/>
          </div>
        </div>
      </div>
    </div>
  )
}
export default LoadingLayer;
