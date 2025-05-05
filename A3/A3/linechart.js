import * as d3 from "d3";
import { bigMoneyFormat, shortenText } from "./src/utils.js";

export function lineChart({
  svg,
  data,
  color,
  width = 1000,
  height = 800,
  show_labels = true,
  brush = true,
  margin = { top: 30, right: 120, bottom: 30, left: 40 },
}) {
  svg.attr("viewBox", [0, 0, width, height]).style("font", "10px sans-serif");
  svg.selectAll("*").remove();

  // TODO: define the attributes
  const attributeY = "Close";
  const attributeX = "Date";

  

  // scale for the date on the x-axis
  // TODO: calculate the correct domain
  const scaleX = d3
    .scaleTime()
    .domain(d3.extent(data,d => d[attributeX]))
    .range([margin.left, width - margin.right])
    .nice();

  // scale for the value on the y-axis
  // TODO: calculate the correct domain
  const scaleY = d3
    .scaleLinear()
    .domain(d3.extent(data,d => d[attributeY]))
    .range([height - margin.bottom, margin.top])
    .nice();

  // group the data by movie title
  const stocks = d3
    .groups(data, (d) => d.Stock)
    .map(([key, values]) => ({ key, values }));

  console.log(stocks);

  

  // draw the x-axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(scaleX)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );
  svg.append("text")
    .attr("y", height - margin.bottom + 20)
    .attr("x", width - margin.right )
    .attr("dy", "0.35em")
    .style("text-anchor", "end")
    .text(attributeX);

  // draw the y-axis with grid lines
  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(scaleY).tickFormat(bigMoneyFormat).ticks(height/30))
    .call((g) => g.selectAll(".tick line")
      .clone()
      .attr("stroke-opacity",  0.2)
      .attr("x2", width - margin.left - margin.right)
    );

  svg.append("text")
    .attr("y", margin.top-10)
    .attr("x", margin.left )
    .attr("dy", "0.35em")
    .style("text-anchor", "end")
    .text(attributeY);

    const line = d3.line()
    .x(d => scaleX(d[attributeX]))
    .y(d => scaleY(d[attributeY]));
  // TODO: draw a line for each time series as well as labels
  // setup a group node for each time series
  const series = svg
    .append("g")
    .style("font", "bold 10px sans-serif")
    .selectAll("g")
    .data(stocks)
    .join("g");

  // Draw the lines
  series.append("path")
    .attr("fill", "none")
    .attr("stroke", d => color(d.key))
    .attr("stroke-width", 1.5)
    .attr("d", d => line(d.values));

  
  //TODO: add labels for the stocks
  if(show_labels) {
    series.append("text")
      .datum(d => ({ key: d.key, value: d.values[d.values.length - 1] }))
      .attr("transform", d => `translate(${scaleX(d.value[attributeX])},${scaleY(d.value[attributeY])})`)
      .attr("x", 3)
      .attr("dy", "0.35em")
      .text(d => `${shortenText(d.key)}: ${bigMoneyFormat(d.value[attributeY])}`);

  }



  // Brushing starts here
  if(brush) {
    const linechartBrush = d3.brushX()
      .extent([[margin.left, margin.top],
      [width - margin.right, height - margin.bottom]])
      .on("brush", brushed)
      .on("start", reset);

    series
      .call(linechartBrush);

    function reset() {
      // TODO: add the reset function (set the chart to look as on page load)
      scaleX.domain(d3.extent(data, (d) => d[attributeX]));
    }
    

    function brushed(brushEvent) {
      // TODO: show the selection in the chart
      // Hint: the selection variable contains the pixel values of brush in x direction [pixel_start, pixel_end]
      // 2nd Hint: each scale has an invert function to map from range to domain
      const selection = brushEvent.selection;
      if (selection === null || selection === undefined) {
        return;
      }

      const [x0, x1] = selection.map(scaleX.invert);

      const filteredData = data.filter(d => d[attributeX] >= x0 && d[attributeX] <= x1);
      svg.select(".x-axis").call(d3.axisBottom(scaleX).ticks(width / 80).tickSizeOuter(0));
      series.select("path")
        .attr("d", (d) => line(d.values));

        if (show_labels) {
          series.select("text")
            .attr("transform", (d) => `translate(${scaleX(d.values[d.values.length - 1][attributeX])},${scaleY(d.values[d.values.length - 1][attributeY])})`)
            .text((d) => `${shortenText(d.key)}: ${bigMoneyFormat(d.values[d.values.length - 1][attributeY])}`);
        }

        d3.select("#linechart_two").selectAll("*").remove();
    

  


      lineChart({
        svg: d3.select("#linechart_two"),
        data: filteredData,
        color,
        width,
        height,
        show_labels,
        brush: false,
        margin
      });
    }
  }
}
    
