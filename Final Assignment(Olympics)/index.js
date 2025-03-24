import * as d3 from "d3"; // Import D3.js library

// Main function to create visualizations
async function createVisualizations()
{
    // Load datasets from CSV files
    const dataset = await d3.csv("data/medals.csv", d3.autoType);
    const mosaicDataset = await d3.csv("data/medals_total.csv", d3.autoType);

    // Define dimensions for each visualization
    const legendWidth = 1800;
    const legendHeight = 30;

    const scatterPlotWidth = 1800 * 2;  // Increased size for better visualization
    const scatterPlotHeight = 1800 * 2;

    const parallelCoordinatesWidth = 1800;
    const parallelCoordinatesHeight = 900;

    const mosaicPlotWidth = 1800;
    const mosaicPlotHeight = 800;

    // Define categories for axes in scatter plot matrix and parallel coordinates
    const categories = ["gender", "discipline", "country"];
    const categorical = "medal_type"; // Categorical variable for coloring

    // Create a color scale for different medal types
    const color_scale = d3.scaleOrdinal()
        .domain(["Gold", "Silver", "Bronze"])
        .range(["#FFD700", "#C0C0C0", "#CD7F32"]);

    // Function to create the legend
    function createLegend()
    {
        const margin = { top: 5, left: 20, bottom: 5, right: 10 };
        const labels = color_scale.domain(); // Get labels from the color scale
        const svg = d3.select("div#legend").append("svg")
            .attr("viewBox", [0, 0, legendWidth, legendHeight]);

        // Scale for positioning legend items
        const labelPositions = d3.scaleBand().domain(labels).range([margin.left, legendWidth - margin.right]);
        const radius = (legendHeight - margin.top - margin.bottom) / 2;  // Circle radius for legend items
        const y_circle = margin.top + radius;  // Y position for circles
        const y_label = legendHeight - margin.bottom * 1.3;  // Y position for text labels

        // Append circles to legend
        svg.selectAll("circle")
            .data(labels)
            .join("circle")
            .attr("cx", d => labelPositions(d))
            .attr("cy", y_circle)
            .attr("r", radius)
            .attr("fill", d => color_scale(d));

        // Append text labels to legend
        svg.selectAll("text")
            .data(labels)
            .join("text")
            .attr("x", d => labelPositions(d) + 2 * radius)
            .attr("y", y_label)
            .text(d => d)
            .style("font-size", 2 * radius)
            .attr("fill","white");
    }

    // Function to create a scatter plot matrix
    function createScatterPlotMatrix() 
    {
        const margin = { top: 50, left: 50, bottom: 50, right: 50 };
        const grid_height = scatterPlotHeight / categories.length;  // Calculate height for each grid cell
        const grid_width = scatterPlotWidth / categories.length;  // Calculate width for each grid cell
        const fontSize = 30;  // Font size for diagonal labels

        const svg = d3.select("div#scatter-plot-matrix").append("svg")
            .attr("viewBox", `0 50 ${scatterPlotWidth} ${scatterPlotHeight}`);

        // Create grid for scatter plot matrix
        const scatterplot_matrix = svg.selectAll("g.scatterplot")
            .data(d3.cross(categories, categories))  // Cartesian product of categories for pairwise plots
            .join("g")
            .attr("transform", (d, i) => `translate(${(i % categories.length) * grid_width},${Math.floor(i / categories.length) * grid_height})`)
            .html("<br>");
        
        // For each grid cell, create scatter plot or label (diagonal cells)
        scatterplot_matrix.each(function (d) 
        {
            const g = d3.select(this);
            if (d[0] == d[1]) 
            {   // If on diagonal, display category label
                const labelXPosition = grid_width / 2;
                const labelYPosition = grid_height / 2;

                g.append("text")
                    .text(d[0])
                    .attr("transform", `translate(${labelXPosition}, ${labelYPosition})`)
                    .style("text-anchor", "middle")
                    .style("fill", "white")
                    .style("font-size", fontSize);
            } 
            else 
            {   
                // Create scatter plot for non-diagonal cells
                scatterPlot(d[0], d[1], g, grid_width, grid_height, margin);
            }
        });
    }

    // Function to create a scatter plot for each grid cell
    function scatterPlot(attributeX, attributeY, scatterplotCell, width, height, margin) 
    {
        // Scales for the scatter plot axes
        const x_scale = d3.scaleBand().domain(dataset.map(d => d[attributeX])).range([margin.left, width - margin.right]).padding(1.3);
        const y_scale = d3.scaleBand().domain(dataset.map(d => d[attributeY])).range([height - margin.bottom, margin.top]).padding(1.3);

        // X-axis for scatter plot
        const axisX = d3.axisBottom(x_scale).ticks(10);
        scatterplotCell
            .append('g')
            .attr('transform', `translate(0, ${height - margin.bottom})`)
            .call(axisX)
            .attr("dy", "5em")
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", 15);

        // Y-axis for scatter plot
        const axisY = d3.axisLeft(y_scale).ticks(10);
        scatterplotCell
            .append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(axisY)
            .attr("dx", "5em")
            .selectAll("text")
            .style("font-size", 15);

        // Plot data points (circles) in scatter plot
        scatterplotCell.selectAll('circle')
            .data(dataset)
            .enter()
            .append('circle')
            .attr('cx', d => {
                console.log("X:", d[attributeX], "Medal Type:", d[categorical]);
                return x_scale(d[attributeX]) + x_scale.bandwidth() / 2;  // Center circles in bands
            })
            .attr('cy', d => y_scale(d[attributeY]) + y_scale.bandwidth() / 2)
            .attr('r', 3)  // Radius of circles
            .attr('fill', d => color_scale(d[categorical]));  // Color based on medal type
    }

    // Function to create horizontal parallel coordinates plot
    function createHorizontalParallelCoordinates() 
    {
        const margin = { top: 50, left: 50, bottom: 50, right: 50 };

        // Create scales for each category (y-axis for each axis)
        const y_scales = categories.reduce((acc, attr) => {
            acc[attr] = d3.scaleBand().domain(dataset.map(d => d[attr])).range([parallelCoordinatesHeight - margin.bottom, margin.top]);
            return acc;
        },{});

        // Scale for positioning each category along the x-axis
        const x_scale = d3.scalePoint()
            .domain(categories)
            .range([margin.left, parallelCoordinatesWidth - margin.right]);

        // Line generator for plotting lines between axes
        const line = d3.line()
            .defined(([, value]) => value != null)
            .x(([attr]) => x_scale(attr))
            .y(([attr, value]) => y_scales[attr](value));

        const svg = d3.select("div#parallel-coordinates").append("svg")
            .attr("viewBox", [0, 0, parallelCoordinatesWidth, parallelCoordinatesHeight]);

        // Plot each data entry as a path through all axes
        svg.append("g")
            .selectAll("path")
            .data(dataset)
            .join("path")
            .attr("d", d => line(Object.entries(d).filter(([k]) => categories.includes(k))))
            .attr("fill", "none")
            .attr("stroke", d => color_scale(d[categorical]))
            .attr("opacity", 0.7);

        // Append axes for each category
        svg.append("g")
            .selectAll("g")
            .data(categories)
            .join("g")
            .attr("transform", d => `translate(${x_scale(d)}, 0)`)
            .each(function (d) { d3.select(this).call(d3.axisLeft(y_scales[d])); })
            .append("text")
            .attr("y", margin.top - 10)
            .attr("text-anchor", "end")
            .attr("fill", "white")
            .text(d => d);
    }

    // Function to create mosaic plot
    function createMosaicPlot() {
        const margin = { top: 50, left: 100, bottom: 50, right: 100 };
        const medalTypes = ["Gold Medal", "Silver Medal", "Bronze Medal"];  // Medal types for y-axis
        const countries = mosaicDataset.map(d => d.Country);  // Country names for x-axis

        const totalMedals = d3.sum(mosaicDataset, d => d["Gold Medal"] + d["Silver Medal"] + d["Bronze Medal"]);  // Total number of medals for scaling

        // Scales for mosaic plot axes
        const xScale = d3.scaleBand()
            .domain(countries)
            .range([margin.left, mosaicPlotWidth - margin.right])
            .padding(0.1);

        const yScale = d3.scaleBand()
            .domain(medalTypes)
            .range([margin.top, mosaicPlotHeight - margin.bottom])
            .padding(0.1);

        const svg = d3.select("div#mosaic-plot").append("svg")
            .attr("viewBox", `0 0 ${mosaicPlotWidth} ${mosaicPlotHeight}`);

        // Append rectangles for each country-medal combination
        svg.selectAll("g")
            .data(mosaicDataset)
            .enter()
            .append("g")
            .selectAll("rect")
            .data(d => medalTypes.map(medalType => ({ country: d.Country, medalType, value: d[medalType] })))
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.country))
            .attr("y", d => yScale(d.medalType))
            .attr("width", xScale.bandwidth())
            .attr("height", d => (d.value / totalMedals) * (mosaicPlotHeight - margin.top - margin.bottom))
            .attr("fill", d => color_scale(d.medalType.replace(" Medal", "")))
            .attr("stroke", "black");

        // Add x and y axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        svg.append("g")
            .attr("transform", `translate(0, ${mosaicPlotHeight - margin.bottom})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yAxis);
    }

    // Call all functions to create visualizations
    createLegend();
    createScatterPlotMatrix();
    createHorizontalParallelCoordinates();
    createMosaicPlot();
}

// Execute the visualization creation function
createVisualizations();
