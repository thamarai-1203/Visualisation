import * as d3 from "d3";

export function mosaicPlot({
   svg,
   data,
   width = 1000,
   height = 1000,
   color,
   splits
}) {
	console.log(data);

	const margin = {
		top: 0,
		bottom: 48,
		left: 48,
		right: 0,
	};

	// Create the hierarchy out of the data.
	const root = d3.hierarchy(data)
	  .sum(d => d.freq)
	  .sort((a, b) => d3.ascending(a.data.name, b.data.name));

	// Create a layout function using d3.treemap
	const treemap = d3.treemap()
	  .size([width, height])
	  .tile(d3.treemapSliceDice);

	// Setup SVG
	svg.attr("viewBox", [0, 0, width, height]).style("font", "11px sans-serif");

	// Draw the rectangles calculated by the treemap
	const tree = treemap(root);
	const cell = svg.selectAll("g")
	  .data(tree.leaves())
	  .join("g")
	    .attr("transform", d => `translate(${d.x0},${d.y0})`);

	// Create rectangles for each of the leaves in the hierarchy
	cell.append("rect")
	  .attr("fill", d => color(d.data.freq))
	  .attr("fill-opacity", 0.8)
	  .attr("width", d => d.x1 - d.x0)
	  .attr("height", d => d.y1 - d.y0);

	// Label the rectangles
	const fontSize = 14;
	cell.append("text")
	  .attr("x", 3)
	  .attr("y", fontSize)
	  .attr("fill", "green")
	  .attr("font-size", fontSize)
	  .text(d => d.data.freq);

	// Add title elements to the cells to view its ancestors, the name and frequency on hover
	cell.append("title")
	  .text(d => {
	    const ancestors = d.ancestors().reverse().slice(1);
	    return ancestors.map(d => d.data.name).join(" > ") + ": " + d.data.freq;
	  });

	// Add the axes
	addAxis(root);

	function addAxis(node) {
	  if (!node.children) return;

	  const axisFontSize = 18;

	  const isEvenLevel = node.depth % 2 === 0;
	  const orientation = isEvenLevel ? "horizontal" : "vertical";

	  const axisScale = d3.scaleBand()
	    .domain(node.children.map(d => d.data.name))
	    .range([node.x0, node.x1]);

	  const axis = svg.append("g")
	    .style("font-size", axisFontSize)
	    .attr("transform", isEvenLevel ? `translate(0,${node.y1})` : `translate(${node.x1},0)`);

	  if (orientation === "horizontal") {
	    axis.call(d3.axisBottom(axisScale))
	      .selectAll("text")
	      .attr("y", 5)
	      .attr("x", 0)
	      .attr("dy", ".35em")
	      .attr("transform", "rotate(40)")
	      .style("text-anchor", "start");
	  } else {
	    axis.call(d3.axisLeft(axisScale))
	      .selectAll("text")
	      .attr("y", -5)
	      .attr("x", 0)
	      .attr("dy", ".35em")
	      .attr("transform", "rotate(-45)")
	      .style("text-anchor", "end");
	  }

	  node.children.forEach(addAxis);
	}
}