import * as d3 from "d3";
import { lineChart } from "./linechart.js";
import {mosaicPlot} from "./mosaic-plot.js";
import {hairEyeHierarchy, loadHairEyeData} from "./src/hair-eye-color";
import {buildColorLegend} from "./src/utils";

const width = 1000;

const stock_data = ["/data/ABBV.csv", "/data/AZN.csv", "/data/BNTX.csv", "/data/JNJ.csv", "/data/MRK.csv", "/data/MRNA.csv", "/data/PFE.csv", "/data/SNY.csv"];
const clear_names = {
  "ABBV": "AbbVie Inc. Common Stock",
  "AZN": "Astrazeneca PLC Common Stock",
  "BNTX": "BioNTech SE - American Depositary Shares",
  "JNJ": "Johnson & Johnson Common Stock",
  "MRK": "Merck & Company, Inc. Common Stock (new)",
  "MRNA": "Moderna, Inc. - Common Stock",
  "NVS": "Novartis AG Common Stock",
  "PFE": "Pfizer, Inc. Common Stock",
  "SNY": "Sanofi - American Depositary Shares"
}
Promise.all(stock_data.map(name => d3.csv(name, d3.autoType))).then(data => {
  const total_stock_data = [];

  data.forEach((values, index) => {
    const stock_key = stock_data[index].split('/').pop().split('.')[0];
    const stock_name = clear_names[stock_key];
    
    values
    .filter(day_data => day_data.Date.getFullYear() >= 2017)
    .forEach(day_data => {
      total_stock_data.push(Object.assign({Stock:stock_name}, day_data))
    });
  });

  // color scale by movie title
  const color = d3.scaleOrdinal()
    .domain(Object.values(clear_names))
    .range(d3.schemeCategory10);

  lineChart({
    svg: d3.select("svg#linechart_one"),
    width: width,
    height: width/8,
    show_labels: false,
    data: total_stock_data,
    color: color,
  });

  lineChart({
    svg: d3.select("svg#linechart_two"),
    width: width,
    height: width/2,
    show_labels: true,
    data: total_stock_data,
    color: color,
  });

});


loadHairEyeData().then((hairEyeData) => {
  // We are splitting our data for the "slice and dice" algorithm using this three attributes:
  const splits = ["hair", "eye", "sex"];

  const dataHierarchy = hairEyeHierarchy(hairEyeData, splits);

  // Side note: we are using color to encode the frequency of each independent group,
  // and not the probabilities calculated from a joint independence model used by M. Friendly (as seen in the lecture).
  const color = d3
      .scaleQuantile(d3.extent(hairEyeData.map(d => d.freq)), d3.schemeRdBu[6]);

  buildColorLegend(color);

  mosaicPlot({
    svg: d3.select("svg#mosaicPlot"),
    data: dataHierarchy,
    color: color,
    splits: splits,
  });
});
