import * as d3 from "d3"

export function indentedTree({
								 svg,
								 data, // hierarchy
								 width = 1000,
								 height = 1000,
							 }) {

	// Prepare all your data to build the indented tree

	const nodeHeight = 20;
	const nodeWidth = 200;
	let i=0;

	svg.attr("height", nodeHeight * 2);

	//TODO: create the hierarchy out of the data.
	const root = d3.hierarchy(data);

	// TODO: go through each node and add any information that may help you building the interactive indented tree
	root.descendants().forEach((d, i) => {
		if (d.depth && d.children) {
			d._children = d.children;
			d.children = null;
		  }
		});
		

	// You can use this function to color your nodes, depending on its state
	const nodeColor = (data) => (data.children ? "#73b6ff" : (data._children ? "#5886b0" : "#EEE"));

	// Use this g element to draw your nodes
	const nodesGroup = svg.append("g")
		.attr("class", "nodes-group");

	// Use this g element to draw the links
	const linksGroup = svg.append("g")
		.attr("class", "links-group");


	function updateTree() {
		// TODO: Traverse the nodes in the current tree in a meaningful order, and add their index data (in which order are they shown vertically)


		// TODO: Draw the nodes as circles on the SVG
		// Use the index you calculated to get y, and its depth information to get x

		const nodes = root.descendants().reverse();

		// TODO: Add a title element in your nodes, so that on hover you can see a tooltip showing the node's path (e.g.: "Mammalia/Theria/Marsupialia/DASYUROMORPHIA")


		// TODO: Draw the links
		// Remember, every link is a source - target (or parent to child) pair

		const links = root.links();

		nodes.forEach((d, index) => {
			d.x = index * nodeHeight;
			d.y = d.depth * nodeWidth;
		  });
	  
		  // Update the nodes
		  const nodeSelection = nodesGroup.selectAll("g.node")
			.data(nodes, (d) => d.id || (d.id = ++i));
	  
		  // Enter any new nodes at the parent's previous position
		  const nodeEnter = nodeSelection.enter().append("g")
			.attr("class", "node")
			.attr("transform", (d) => `translate(${d.y},${d.x})`)
			.on("click", (event, d) => {
			  // Toggle children on click
			  if (d.children) {
				d._children = d.children;
				d.children = null;
			  } else {
				d.children = d._children;
				d._children = null;
			  }
			  updateTree();
			});
	  
		  // Add circles for the nodes
		  nodeEnter.append("circle")
			.attr("r", 5)
			.style("fill", (d) => nodeColor(d));
	  
		  // Add labels for the nodes
		  nodeEnter.append("text")
			.attr("dy", ".35em")
			.attr("x", (d) => (d.children || d._children ? -10 : 10))
			.attr("text-anchor", (d) => (d.children || d._children ? "end" : "start"))
			.text((d) => d.data.name);
	  
		  // Add title for tooltip
		  nodeEnter.append("title")
			.text((d) => d.ancestors().map((d) => d.data.name).reverse().join("/"));
	  
		  // Update the node positions with transitions
		  const nodeUpdate = nodeSelection.merge(nodeEnter).transition()
			.duration(250)
			.attr("transform", (d) => `translate(${d.y},${d.x})`);
	  
		  // Remove any exiting nodes
		  const nodeExit = nodeSelection.exit().transition()
			.duration(250)
			.attr("transform", (d) => `translate(${d.y},${d.x})`)
			.remove();
	  
		  nodeExit.select("circle").attr("r", 1e-6);
		  nodeExit.select("text").style("fill-opacity", 1e-6);
	  
		  // Update the links
		  const linkSelection = linksGroup.selectAll("path.link")
			.data(links, (d) => `${d.source.data.name}-${d.target.data.name}`);
	  
		  // Enter any new links at the parent's previous position
		  const linkEnter = linkSelection.enter().append("path")
			.attr("class", "link")
			.attr("d", (d) => {
			  const o = { x: d.source.x, y: d.source.y };
			  return diagonal({ source: o, target: o });
			});
	  
		  // Update links position with transitions
		  const linkUpdate = linkSelection.merge(linkEnter).transition()
			.duration(250)
			.attr("d", diagonal);
	  
		  // Remove any exiting links
		  linkSelection.exit().transition()
			.duration(250)
			.attr("d", (d) => {
			  const o = { x: d.source.x, y: d.source.y };
			  return diagonal({ source: o, target: o });
			})
			.remove();



		// TODO: Make it interactive
		// Add a click event to each node, that causes the children of that node to be hidden/shown


		// TODO: Add transitions
		// You can use d3.transition to achieve this
		// You can also use the complete .join(enter, update, exit) pattern. This may require for you to re-arrange your code a bit.


		// Here we make the svg change its height together with the nodes shown
		const transitionSVG = d3.transition().duration(250)
		svg.transition(transitionSVG).attr("height", () => (root.descendants().length + 2) * nodeHeight)

	}

	function diagonal(d) {
		return `M${d.source.y},${d.source.x}
				C${d.source.y + nodeWidth / 2},${d.source.x}
				 ${d.target.y - nodeWidth / 2},${d.target.x}
				 ${d.target.y},${d.target.x}`;
	  }

	updateTree()

}
