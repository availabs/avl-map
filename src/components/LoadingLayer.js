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
      <div className={ `${ theme.menuBg } p-1 rounded-tr-full rounded-br-full` }>
        <div className={ `${ theme.bg } p-1 rounded-tr-full rounded-br-full flex` }>
          <div className="flex-1 text-lg font-medium flex items-center">
            <div className='flex-1'>{ layer.name }</div>
            <div className={`font-light px-2`}>
              {layer.state.progress ? `${layer.state.progress}%` : '' }
            </div>
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
