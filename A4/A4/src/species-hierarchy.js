import * as d3 from "d3"
export function getSpeciesHierarchy(data) {
 /*
 	We want to structure our data in the following hierarchy:

Class (All mammals) > Subclass > Infraclass > Order > Family > Genus > Species (with attr isExtinct)
  */


	const levels = ["class", "subclass", "infraclass", "order", "family", "genus"]

	const getChildren = (dataArray, level) => {
		if (level >= levels.length) {
			return dataArray.map(child => ({
				...child,
				name: `${child.sciName} (${child.mainCommonName})`
			}))
		} else {
			const grouped = d3.group(dataArray.sort((a, b) => d3.ascending(a[levels[level]], b[levels[level]])), d => d[levels[level]])
			const children = []
			grouped.forEach((value, key) => {
					children.push({
						name: key,
						children: getChildren(value, level + 1)
					})
			})
			return children
		}
	}


	return {
		name: "Mammalia",
		children: getChildren(data, 1)
	}

}