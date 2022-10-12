import React from "react"

import { useTheme } from "components/avl-components/src"

const MapAction = ({ icon, tooltip, actionFunc,
                      MapActions, layer,
                      ...rest }) => {
  const theme = useTheme();
  return (
    <div className={ `${ theme.sidebarBg } p-1 rounded-2xl mb-2` }>
      <div className={ `${ theme.menuBg } p-1 rounded-2xl` }>
        <div className={ `
            ${ theme.bg } hover:${ theme.accent1 }
            ${ theme.menuText } ${ theme.menuTextHover }
            w-10 h-10 rounded-2xl cursor-pointer text-lg
            flex items-center justify-center
          ` }
          onClick={ e => actionFunc(MapActions, layer, rest) }>
          <span className={ `fa ${ icon }` }/>
        </div>
      </div>
    </div>
  )
}
export default MapAction;
