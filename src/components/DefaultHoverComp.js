import React from "react"

const DefaultHoverComp = ({ data, layer }) => {
  return (
    <div className="px-1">
      { data.map((row, i) =>
          <div key={ i } className="flex">
            { row.map((d, ii) =>
                <div key={ ii }
                  className={ `
                    ${ ii === 0 ? "flex-1 font-bold" : "flex-0" }
                    ${ row.length > 1 && ii === 0 ? "mr-4" : "" }
                    ${ row.length === 1 && ii === 0 ? "border-b-2" : "" }
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
