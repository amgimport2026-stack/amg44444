const sheetId = "1t3iEuHJabAXqDnyYL0ppdlEJcd0q5JsZZJQInDvnnyY";
const endpoint = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

fetch(endpoint)
  .then(async (response) => {
    console.log(`HTTP ${response.status}`);
    console.log((await response.text()).slice(0, 20000));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
