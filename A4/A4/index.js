import * as d3 from "d3"
import {getSpeciesHierarchy} from "./src/species-hierarchy"
import {indentedTree} from "./indented-tree"

await d3.csv("/data/species.csv", d3.autoType).then(res => {
  const data = getSpeciesHierarchy(res)
  console.log(data)

  indentedTree({
    svg: d3.select("#tree"),
    data
  })
})


import { loadMoviesDataset } from "./src/movies.js";
import { document_embedding } from "./document_embedding.js";


loadMoviesDataset().then((movies) => {
  document_embedding({
    svg: d3.select("svg#embedding"),
    movie_corpus: movies,
  })
});
