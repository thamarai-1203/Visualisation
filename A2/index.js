import * as d3 from "d3";


// Task 1 your solution here
// TODO: load the dataset

const dataset = await d3.csv("data/penguins.csv", d3.autoType);


// TODO: store the names of your 3 numerical attributes and one categorical attribute
const numerics = ["bill_length_mm","bill_depth_mm","flipper_length_mm"];
const categorical = "species";

// TODO: define the color mapping for the categorical attribute
const color_scale = d3.scaleOrdinal(d3.schemeCategory10).domain([...new Set(dataset.map(d => d[categorical]))]);

    


// Parent HTML element that contains the labels and the plots
const parent = d3.select("div#visualization");

// Sizes of the plots
const width = 800;
const height = 800;
const labelHeight = 25;


createLegend();
createScatterPlotMatrix(width, height);
createHorizontalParallelCoordinates(width, height / 2);


/**
 * Task 2
 */
function createLegend() {
    const margin = { top: 5, left: 20, bottom: 5, right: 10 };

    // TODO: fill with correct data
    const labels = color_scale.domain()

    const svg = parent.append("svg")
        .attr("viewBox", [0, 0, width, labelHeight]);

    const labelPositions = d3.scaleBand().domain(labels).range([margin.left, width - margin.right]);
    
    const radius = (labelHeight - margin.top - margin.bottom)/2;
    
    const y_circle = margin.top + radius;
    const y_label = labelHeight - margin.bottom*1.3;

    // add all circles for the legend
    // TODO: add color to the legend.
    svg.selectAll("circle")
    .data(labels)
    .join("circle")
    .attr("cx", d => labelPositions(d))
    .attr("cy", y_circle)
    .attr("r", radius)
    .attr("fill", d => color_scale(d));

    // add all text to the legend
    svg.selectAll("text")
    .data(labels)
    .join("text")
    .attr("x", d => labelPositions(d) + 2*radius)
    .attr("y", y_label)
    .text(d => d)
    .style("font-size", 2*radius);
    
}


/**
 * Create Scatter Plot Matrix with the given width and height. The contents of each cell
 * in this matrix is defined by the scatterPlot() function.
 *
 * @param {integer} width
 * @param {integer} height
 */
function createScatterPlotMatrix(width, height) {

    const margin = { top: 10, left: 30, bottom: 30, right: 10 };

    const grid_height = height / numerics.length;
    const grid_width = width / numerics.length;
    const fontSize = 25;

    const svg = parent.append("svg")
        .attr("viewBox", [0, 0, width, height]);

    const scatterplot_matrix = svg.selectAll("g.scatterplot")
        .data(d3.cross(numerics, numerics))
        .join("g")
        .attr("transform", (d, i) => "translate(" + (i % numerics.length) * grid_width + "," + Math.floor(i / numerics.length) * grid_height + ")");

    scatterplot_matrix.each(function (d) { // each pair from cross combination
        const g = d3.select(this);

        // label the same attribute axis
        if (d[0] == d[1]) {
            const labelXPosition = grid_width/ 2;
            const labelYPosition = grid_height/2;

            g.append("text")
                .text(d[0])
                .attr("transform", "translate(" + labelXPosition + "," + labelYPosition + ")")
                .style("text-anchor", "middle")
                .style("fill", "black")
                .style("font-size", fontSize);

        } else {
            scatterPlot(d[0], d[1], g, grid_width, grid_height, margin);
        }
    })
}


/**
 * Task 3
 * @param {string} attributeX
 * @param {string} attributeY
 * @param {nodeElement} scatterplotCell
 * @param {integer} width
 * @param {integer} height
 * @param {Object} margin
 */
function scatterPlot(attributeX, attributeY, scatterplotCell, width, height, margin) {
    // TODO: correct the input domain of both scales
    const xExtent = d3.extent(dataset, d => d[attributeX]);
    const yExtent = d3.extent(dataset, d => d[attributeY]);


    const x_scale = d3.scaleLinear().domain(xExtent).range([margin.left, width - margin.right]);
    const y_scale = d3.scaleLinear().domain(yExtent).range([height - margin.bottom,  margin.top]);
    
   

    // now we create axes from the scales
    const axisX = d3.axisBottom(x_scale).ticks(4);
    scatterplotCell
        .append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(axisX);

    const axisY = d3.axisLeft(y_scale).ticks(4);
    scatterplotCell
        .append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(axisY);

    // TODO: draw the points of the scatterplot
    // Note: you need to render into the node element in "scatterplotCell"
    scatterplotCell.selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('cx', d => x_scale(d[attributeX]))
    .attr('cy', d => y_scale(d[attributeY]))
    .attr('r', 3) 
    .attr('fill', d => color_scale(d[categorical]));


}


/**
 * Task4
 * @param {integer} width
 * @param {integer} height
 */

function createHorizontalParallelCoordinates(width, height) {
    const margin = { top: 10, left: 30, bottom: 30, right: 10 };

    const svg = parent.append("svg")
        .attr("viewBox", [0, 0, width, height]);
   
    // TODO: Implement the Paralell Coordinates 
    const y_scales = numerics.reduce((acc, attr) => {
        acc[attr] = d3.scaleLinear()
            .domain(d3.extent(dataset, d => d[attr]))
            .range([height - margin.bottom, margin.top]);
        return acc;
    }, {});

    const x_scale = d3.scalePoint()
        .domain(numerics)
        .range([margin.left, width - margin.right]);

    const line = d3.line()
        .defined(([, value]) => value != null)
        .x(([attr]) => x_scale(attr))
        .y(([attr, value]) => y_scales[attr](value));

    svg.append("g")
        .selectAll("path")
        .data(dataset)
        .join("path")
        .attr("d", d => line(Object.entries(d).filter(([k]) => numerics.includes(k))))
        .attr("fill", "none")
        .attr("stroke", d => color_scale(d[categorical]));
        svg.append("g")
        .selectAll("g")
        .data(numerics)
        .join("g")
        .attr("transform", d => `translate(${x_scale(d)}, 0)`)
        .each(function (d) { d3.select(this).call(d3.axisLeft(y_scales[d])); })
        .append("text")
        .attr("y", margin.top - 10)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(d => d);

}


