import React from "react"

import { useTheme, Draggable } from "@availabs/avl-components"

const DraggableModal = ({ Header,
                          Component,
                          layer,
                          MapActions,
                          modalData,
                          activeLayers,
                          layersLoading,
                          loadingLayers,
                          inactiveLayers,
                          ...props }) => {

  const theme = useTheme();

  const { layerId, modalKey, zIndex } = modalData;

  return (
    <Draggable { ...props } className="pointer-events-auto"
      onClick={ e => MapActions.bringModalToFront(layerId, modalKey) }
      onDragStart={ e => MapActions.bringModalToFront(layerId, modalKey) }
      style={ { zIndex } }
      toolbar={ [
        { icon: "fa-times",
          onClick: e => MapActions.closeModal(layerId, modalKey)
        }
      ] }>
      <div className="m-1">
        { !Header ? null :
          <div className="font-bold text-xl ml-2">
            { typeof Header === "function" ?
              <Header layer={ layer } MapActions={ MapActions }/> :
              Header
            }
          </div>
        }
        <div className={ `p-1 rounded ${ theme.menuBg }` }>
          <div className={ `p-1 rounded ${ theme.bg }` }>
            { <Component layer={ layer }
                MapActions={ MapActions }
                activeLayers={ activeLayers }
                layersLoading={ layersLoading }
                loadingLayers={ loadingLayers }
                inactiveLayers={ inactiveLayers }/>
            }
          </div>
        </div>
      </div>
    </Draggable>
  )
}
export default DraggableModal;
