const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

app.post("/createBankClient", async (req, res) => {
  try {
    const { name, email } = req.body;
    const apiResponse = await axios.post(
      "http://money-request-app.canadacentral.cloudapp.azure.com:8080/api/v1/client",
      { name, emailAddress: email },
      { headers: { "Content-Type": "application/json" } }
    );
    res.status(200).json(apiResponse.data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
