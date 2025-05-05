import * as d3 from "d3"

export async function loadHairEyeData() {
  return await d3.csv("/data/HairEyeColor.csv", (item) => ({
    hair: item.Hair,
    eye: item.Eye,
    sex: item.Sex,
    freq: +item.Freq,
  }))
}

/**
 *
 * @param data Raw data in table format
 * @param slices Array of attribute names defining each level
 * @returns {{}} A hierarchy splitted by each attribute in the slices array
 */
export function hairEyeHierarchy(data, slices) {
  const buildNode = (dataArray, depth, name) => {
    let groups = d3.group(dataArray, d => d[slices[depth]])
    let children = []
    if (depth < slices.length) {
      groups.forEach((childrenArray, key) => {
        children.push(buildNode(childrenArray, depth + 1, key))
      })
    }
    return depth >= slices.length
        ? {name, freq: dataArray.reduce((result, value) => result += value.freq, 0)}
        : {name, children}
  }

  return buildNode(data, 0, "root")
}