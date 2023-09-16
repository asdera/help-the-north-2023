const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

const OUR_BANK_ID = "8dead91f-8c05-4f91-a4d8-7b60446a21a7";

app.post("/requestMoney", async (req, res) => {
  try {
    const { amount, requesteeId, message, invoiceNumber } = req.body;
    const clientId = OUR_BANK_ID;

    const apiResponse = await axios.post(
      "http://money-request-app.canadacentral.cloudapp.azure.com:8080/api/v1/money-request",
      {
        amount,
        requesteeId,
        message,
        invoiceNumber,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-signed-on-client": clientId,
        },
      }
    );

    res.status(200).json(apiResponse.data);
  } catch (error) {
    console.error("Error requesting money:", error);
    // if message message: 'a record already exist
    if (error.message.startsWith("a record already exist")) {
      return res.status(200).json({ error: "existing" });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/createBankClient", async (req, res) => {
  try {
    const { name, email } = req.body;
    let clientId = "<Your-Client-ID>"; // Replace with your actual client ID if needed

    // Check if client already exists
    let existingClientResponse;
    try {
      existingClientResponse = await axios.get(
        `http://money-request-app.canadacentral.cloudapp.azure.com:8080/api/v1/client?email=${email}`,
        {
          headers: {
            "client-header": clientId,
          },
        }
      );
    } catch (error) {
      console.error("Error fetching existing client:", error);
    }

    if (existingClientResponse && existingClientResponse.data) {
      // If client already exists, return existing data
      return res.status(200).json(existingClientResponse.data);
    }

    // Create a new client if it doesn't exist
    const apiResponse = await axios.post(
      "http://money-request-app.canadacentral.cloudapp.azure.com:8080/api/v1/client",
      { Name: name, EmailAddress: email },
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
