export const LOT_COORDINATES: Record<string, [number, number]> = {
  "LOT 30": [5.089398, 119.076423],
  "LOT 31": [5.088495, 119.07534],
  "LOT 32": [5.090995, 119.076006],
  "LOT 33": [5.090023, 119.075548],
  "LOT 38": [5.092246, 119.075798],
  "LOT 39": [5.091065, 119.075423],
  "LOT 40": [5.089884, 119.075215],
  "LOT 41": [5.083564, 119.076589],
  "LOT 42": [5.086689, 119.076381],
  "LOT 43": [5.089815, 119.07788],
  "LOT 44": [5.090162, 119.078879],
  "LOT 45": [5.084953, 119.075923],
  "LOT 46": [5.084258, 119.07688],
  "LOT 47": [5.092246, 119.078879],
  "LOT 51": [5.093357, 119.079711],
  "LOT 52": [5.093079, 119.080669],
  "LOT 53": [5.091759, 119.08121],
  "LOT 54": [5.090579, 119.081418],
  "LOT 55": [5.091551, 119.083125],
  "LOT 56": [5.092246, 119.084582],
  "LOT 57": [5.093496, 119.084041],
  "LOT 58": [5.094468, 119.08504],
  "LOT 59": [5.092871, 119.082625],
  "LOT 60": [5.093913, 119.081751],
  "LOT 61": [5.094746, 119.082542],
  "LOT 62": [5.093218, 119.083458],
  "LOT 63": [5.092246, 119.082584],
  "LOT 64": [5.091273, 119.082875],
  "LOT 65": [5.092662, 119.083874],
  "LOT 66": [5.093843, 119.083624],
  "LOT 67": [5.094538, 119.083041],
  "LOT 68": [5.095232, 119.083708],
  "LOT 69": [5.096066, 119.08454],
  "LOT 70": [5.091898, 119.085955],
  "LOT 71": [5.09301, 119.086372],
  "LOT 72": [5.092037, 119.086871],
  "LOT 73": [5.090857, 119.087038],
  "LOT 74": [5.091551, 119.087662],
  "LOT 75": [5.092732, 119.087954],
  "LOT 76": [5.093843, 119.088287],
  "LOT 77": [5.094885, 119.088703],
  "LOT 78": [5.095996, 119.089202],
}

export function getLotCoordinates(lotLabel: string | null | undefined): [number, number] | null {
  if (!lotLabel) return null

  console.log("Looking up lot:", lotLabel)

  const input = lotLabel.toString().trim().toUpperCase()

  // Try all formats
  const attempts = [
    input,                                            // as-is: "LOT 62" or "62"
    `LOT ${input}`,                                   // add prefix: "LOT 62"
    `LOT ${input.replace(/^LOT\s*/i, "").trim()}`,    // normalize
  ]

  for (const attempt of attempts) {
    if (LOT_COORDINATES[attempt]) {
      console.log("Result:", LOT_COORDINATES[attempt], "(matched:", attempt, ")")
      return LOT_COORDINATES[attempt]
    }
  }

  // Handle compound lots like "53/54" — use first lot number
  if (input.includes("/")) {
    const firstLot = input.split("/")[0].trim()
    const coords = LOT_COORDINATES[`LOT ${firstLot}`]
    if (coords) {
      console.log("Result:", coords, "(matched compound:", firstLot, ")")
      return coords
    }
  }

  // Extract number only and try
  const numOnly = input.replace(/[^0-9]/g, "")
  if (numOnly && LOT_COORDINATES[`LOT ${numOnly}`]) {
    console.log("Result:", LOT_COORDINATES[`LOT ${numOnly}`], "(matched numOnly:", numOnly, ")")
    return LOT_COORDINATES[`LOT ${numOnly}`]
  }

  console.log("Result: null (no match)")
  return null
}
