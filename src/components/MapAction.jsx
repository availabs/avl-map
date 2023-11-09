import React from "react"

import { useTheme } from "~/modules/avl-components/src"

const MapAction = ({ icon, tooltip, actionFunc,
                      MapActions, layer,
                      ...rest }) => {
  const theme = useTheme();
  return (
    <div className={ `${ theme.sidebarBg } p-1 rounded-2xl mb-2` }>
      <div className={ `${ theme.menuBg } p-1 rounded-2xl` }>
        <div className={ `
            bg-white hover:bg-blue-100
            text-blue-500 hover:text-blue-700
            w-10 h-10 rounded-2xl cursor-pointer text-lg
            flex items-center justify-center text-black
          ` }
          onClick={ e => actionFunc(MapActions, layer, rest) }>
          <span className={ `fa ${ icon }` }/>
        </div>
      </div>
    </div>
  )
}
export default MapAction;
