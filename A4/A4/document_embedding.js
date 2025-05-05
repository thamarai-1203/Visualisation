import {
  tfidf,
  inverseDocumentFrequency,
  documentToWords,
} from "./src/wordvector.js";

import * as d3 from "d3";




export function document_embedding({ svg, movie_corpus }) {
  // Log the corpus to inspect its structure
  console.log(movie_corpus);

  // Extract descriptions from the movie corpus
  const descriptions = movie_corpus.map(movie => movie.overview);

  // Tokenize, remove stopwords, and lemmatize each description
  const wordsPerDescription = descriptions.map(description => documentToWords(description));

  console.log(wordsPerDescription)
  // Function to normalize genres to a string
  const normalizeGenres = (genres) => {
    if (typeof genres === 'string') {
      return genres;
    } else if (Array.isArray(genres)) {
      return genres.join(',');
    } else if (typeof genres === 'object' && genres !== null) {
      return Object.values(genres).join(',');
    } else {
      return '';
    }
  };

  // Calculate genres from the movie corpus with error handling
  const genres = Array.from(new Set(movie_corpus.flatMap(movie => {
    const normalizedGenres = normalizeGenres(movie.genres);
    if (normalizedGenres) {
      return normalizedGenres.split(',');
    } else {
      console.warn(`Skipping movie with invalid genres: ${JSON.stringify(movie)}`);
      return [];
    }
  })));

  // Get all words for each genre
  const wordsPerGenre = genres.map(genre => {
    return movie_corpus
      .filter(movie => {
        const normalizedGenres = normalizeGenres(movie.genres);
        return normalizedGenres.split(',').includes(genre);
      })
      .flatMap(movie => documentToWords(movie.overview));
  });
  console.log(wordsPerGenre)

  // Create the dictionary for each genre
  const dictionary = createDictionary(wordsPerGenre);
  console.log(dictionary)

  // Calculate the word vector for each genre
  const idfValues = inverseDocumentFrequency(wordsPerGenre);
  const wordVectors = genres.map((genre, i) => {
    const genreWords = wordsPerGenre[i];
    const tfValues = dictionary.map(word => genreWords.filter(w => w === word).length / genreWords.length);
    console.log(tfValues)
    
    const tfidfValues = tfValues.map((tf, index) => tf * idfValues.get(dictionary[index]));
    return tfidfValues;
  });

  console.log(wordVectors)

  // Calculate the distance matrix
  const distanceMatrix = [];
  for (let i = 0; i < wordVectors.length; i++) {
    const row = [];
    for (let j = 0; j < wordVectors.length; j++) {
      row.push(euclidean_distance(wordVectors[i], wordVectors[j]));
    }
    distanceMatrix.push(row);
  }
  console.log(distanceMatrix)
  
  // Normalize the distance matrix
  const maxDistance = Math.max(...distanceMatrix.flat());
  const normalizedDistanceMatrix = distanceMatrix.map(row => row.map(value => value / maxDistance));

  // Perform MDS using ml-mds
console.log(distanceMatrix)
  const positions = mds.classic(distanceMatrix);
  console.log(positions);

  // Encode the x,y coordinates and visualize
  const margin = {top:10, right:10, bottom:20, left:30};
  const xScale = d3.scaleLinear()
    .domain([d3.min(positions, d => d[0]), d3.max(positions, d => d[0])])
    .range([margin.left, innerWidth - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(positions, d => d[1]), d3.max(positions, d => d[1])])
    .range([margin.top, innerHeight - margin.bottom]);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.selectAll("circle")
    .data(positions)
    .enter().append("circle")
    .attr("cx", d => xScale(d[0]))
    .attr("cy", d => yScale(d[1]))
    .attr("r", 5);

  g.selectAll("text")
    .data(positions)
    .enter().append("text")
    .attr("x", d => xScale(d[0]) + 10)
    .attr("y", d => yScale(d[1]))
    .text((d, i) => genres[i]);
}

function cosine_similarity(A, B) {
  var dotproduct = 0;
  var mA = 0;
  var mB = 0;

  for (var i = 0; i < A.length; i++) {
    dotproduct += A[i] * B[i];
    mA += A[i] * A[i];
    mB += B[i] * B[i];
  }

  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  var similarity = dotproduct / (mA * mB);

  return similarity;
}

// Given arrays of numbers A and B, calculate distance
function euclidean_distance(A, B) {
  var total = 0;
  for (var i = 0; i < A.length; i++) {
    total += (A[i] - B[i]) * (A[i] - B[i]);
  }
  return Math.sqrt(total);
}

// Given arrays of numbers A and B, calculate distance
function manhattan_distance(A, B) {
  var total = 0;
  for (var i = 0; i < A.length; i++) {
    total += (A[i] - B[i]);
  }
  return total / A.length;
}

// Given an array of arrays of words, calculate the dictionary
// The dictionary is shortened by filtering the 20 most distinctive 
// words for each given group
function createDictionary(wordsPerGroup) {
  const idfGenre = inverseDocumentFrequency(wordsPerGroup);

  const dictionary = Array.from(new Set(wordsPerGroup.map(document => {
    return tfidf(document, idfGenre)
      .sort((a, b) => d3.descending(a[1], b[1]))
      .map(entry => entry[0])
      .filter(word => word.length > 2)
      .slice(0, 20);
  }).flat()));
  return dictionary;
}
