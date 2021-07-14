import React from "react"

import { useTheme } from "@availabs/avl-components"

const DefaultHoverComp = ({ data, layer }) => {
  const theme = useTheme();
  return (
    <div className={ `rounded relative px-1` }>
      { data.map((row, i) =>
          <div key={ i } className="flex">
            { row.map((d, ii) =>
                <div key={ ii }
                  className={ `
                    ${ ii === 0 ? "flex-1 font-bold" : "flex-0" }
                    ${ row.length > 1 && ii === 0 ? "mr-4" : "" }
                    ${ row.length === 1 && ii === 0 ? `border-b-2 text-lg ${ i > 0 ? "mt-1" : "" }` : "" }
                  ` }>
                  { d }
                </div>
              )
            }
          </div>
        )
      }
    </div>
  )
}
export default DefaultHoverComp;
