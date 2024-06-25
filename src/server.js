const express = require("express");
const app = express();
const PORT = 8080;

app.get("/", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.listen(PORT, () => console.log(`escuchando en el puerto ${PORT}`));
