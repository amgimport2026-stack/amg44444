const endpoint = `https://grep.app/api/search?q=${encodeURIComponent('"Some[static]"')}`;

fetch(endpoint, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36",
    Accept: "application/json",
  },
})
  .then(async (response) => {
    console.log(`HTTP ${response.status}`);
    const text = await response.text();
    console.log(text.slice(0, 30000));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
