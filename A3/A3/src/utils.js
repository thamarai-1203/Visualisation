import { format } from "d3-format";

// function to get the emoji-flag from a two-letter ISO country code
// Arguemnts:
//  countryCode: the two-letter ISO country code, e.g. 'DE' or 'de' for Germany
// source: https://medium.com/binary-passion/lets-turn-an-iso-country-code-into-a-unicode-emoji-shall-we-870c16e05aad
export function getCountryFlag(countryCode) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

// function to format a money value
// formats the number with a prepended dollar sign, two significant digits, and
// the respective SI-prefix; replaces Giga (G) with B (for billion)
// Arguments:
//  value: the money value as a number
// source: https://reactviz.com/scatterplots/basic
export function bigMoneyFormat(value) {
  if (value == null) return value;
  const formatted = format("$.2s")(value);
  return formatted.replace(/G$/, "B");
}

// function to shorten a string to a specified maximum length
// if shortened, a postfix will be added to indicate it
// Arguments:
//  text: the input string
//  maxLength: the total maximum length of the string
//  postfix: a string to append to the shortened string, defaults to three dots
export function shortenText(text, maxLength = 30, postfix = "…") {
  if (!text) {
    return "";
  }
  if (text.length <= maxLength + postfix.length) {
    return text;
  }
  return text.slice(0, maxLength).trim() + postfix;
}


export function buildColorLegend(color) {

  // We create a legend for the color scheme
  const plotWrapper = document.querySelector("svg#mosaicPlot").parentNode
  const divLegend = document.createElement("div")
  divLegend.classList.add("legend")
  divLegend.innerHTML = "Frequency: "

  for (let i = 0; i < color.range().length; i++) {
    const sample = document.createElement("span")
    sample.classList.add("sample")
    sample.style.backgroundColor = color.range()[i]
    divLegend.append(sample)
    const sampleName = document.createElement("span")
    sampleName.classList.add("sample-name")
    const extent = color.invertExtent(color.range()[i])

    switch (i) {
      case 0:
        sampleName.innerHTML = `< ${extent[1].toFixed(2)}`
        break
      case color.range().length - 1:
        sampleName.innerHTML = `> ${extent[0].toFixed(2)}`
        break
      default:
        sampleName.innerHTML = `${extent[0].toFixed(2)} - ${extent[1].toFixed(2)}`
        break
    }
    divLegend.append(sampleName)
  }
  plotWrapper.prepend(divLegend)

}