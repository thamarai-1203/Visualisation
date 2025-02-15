// Define some numerical constants we will use to calculate our scatterplot
export const svgWidth = 720
export const svgHeight = 720
export const padding = {
	top: 48,
	bottom: 60,
	left: 60,
	right: 48
}

function mapValueToXAxis(value, maxValue) {
	// Find the actual chart's width
	const chartWidth = svgWidth - padding.left - padding.right
	// Find x
	const x = value * chartWidth / maxValue
	// Return x plus the padding on the left
	return padding.left + x
}

function mapValueToYAxis(value, maxValue) {
	// Find the actual chart's height
	const chartHeight = svgHeight - padding.top - padding.bottom
	// Find y
	const y = value * chartHeight / maxValue
	// Return the value, taking into account the vertical axis in SVG is inverted in relation to our chart
	return padding.top + chartHeight - y
}


// Functions to build the axes
export function buildXAxis(max, steps, svg) {
	const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line")
	xAxis.setAttribute("x1", padding.left)
	xAxis.setAttribute("x2", svgWidth - padding.right)
	xAxis.setAttribute("y1", svgHeight - padding.bottom)
	xAxis.setAttribute("y2", svgHeight - padding.bottom)
	xAxis.setAttribute("stroke", "black")
	xAxis.setAttribute("stroke-width", "1px")
	svg.appendChild(xAxis)

	const tickHeight = 4
	for (let i = 0; i <= steps; i++) {
		const tickValue = i * max / steps
		const xValue = mapValueToXAxis(tickValue, max)
		const tick = document.createElementNS("http://www.w3.org/2000/svg", "line")
		tick.setAttribute("x1", xValue)
		tick.setAttribute("x2", xValue)
		tick.setAttribute("y1", svgHeight - padding.bottom)
		tick.setAttribute("y2", svgHeight - padding.bottom + tickHeight)
		tick.setAttribute("stroke", "black")
		tick.setAttribute("stroke-width", "1px")
		svg.appendChild(tick)

		const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
		text.setAttribute("x", xValue)
		text.setAttribute("y", svgHeight - padding.bottom + 20)
		text.setAttribute("text-anchor", "middle")
		text.innerHTML = tickValue
		svg.appendChild(text)
	}

}

export function buildYAxis(max, steps, svg) {
	const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line")
	yAxis.setAttribute("x1", padding.left)
	yAxis.setAttribute("x2", padding.left)
	yAxis.setAttribute("y1", padding.top)
	yAxis.setAttribute("y2", svgHeight - padding.bottom)
	yAxis.setAttribute("stroke", "black")
	yAxis.setAttribute("stroke-width", "1px")
	svg.appendChild(yAxis)

	const tickWidth = 4
	for (let i = 0; i <= steps; i++) {
		const tickValue = i * max / steps
		const yValue = mapValueToYAxis(tickValue, max)
		const tick = document.createElementNS("http://www.w3.org/2000/svg", "line")
		tick.setAttribute("x1", padding.left - tickWidth)
		tick.setAttribute("x2", padding.left)
		tick.setAttribute("y1", yValue)
		tick.setAttribute("y2", yValue)
		tick.setAttribute("stroke", "black")
		tick.setAttribute("stroke-width", "1px")
		svg.appendChild(tick)

		const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
		text.setAttribute("x", padding.left - tickWidth * 2)
		text.setAttribute("y", yValue + 4)
		text.setAttribute("text-anchor", "end")
		text.innerHTML = tickValue
		svg.appendChild(text)
	}
}