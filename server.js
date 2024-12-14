// Import necessary modules
const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Constants for the salt key and index (update with actual values)
const SALT_KEY = process.env.SALT_KEY;
const merchantId = process.env.MERCHANT_ID;

// Endpoint to handle payment requests
app.post("/payu", async (req, res) => {
  try {
    const data = {
      merchantId: merchantId,
      merchantTransactionId: req.body.transactionId,
      name: req.body.name,
      amount: 100,
      redirectUrl:
        "https://www.mastersgurukulam.com/registration_success?id=" +
        req.body.transactionId +
        "&name=" +
        req.body.name +
        "&mobileNumber=" +
        req.body.mobileNumber +
        "&center=" +
        req.body.center +
        "&medium=" +
        req.body.medium + "&firebaseId=" + req.body.firebaseId,
      callbackUrl: "https://www.mastersgurukulam.com/mts/register",
      redirectMode: "POST",
      mobileNumber: req.body.mobileNumber,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string = payloadMain + "/pg/v1/pay" + SALT_KEY;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checkSum = sha256 + "###" + keyIndex;
    const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";

    const options = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checkSum,
      },
      data: {
        request: payloadMain,
      },
    };

    await axios(options)
      .then((response) => {
        res.send(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.log(error);
  }
});

app.post("/payu/status", async (req, res) => {
  const merchantTransactionId = req.query.id;
  const merchantId = "M22KR7WW7DEPJ";

  const keyIndex = 1;
  const string =
    `/pg/v1/status/${merchantId}/${merchantTransactionId}` + SALT_KEY;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  const checkSum = sha256 + "###" + keyIndex;
  console.log(checkSum)
  const options = {
    method: "GET",
    url: `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${merchantTransactionId}`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": checkSum,
      "X-MERCHANT-ID": `${merchantId}`,
    },
  };

  axios
    .request(options)
    .then((response) => {
      if (response.data.success) {
        res.send(response.data);
      } else {
        res.status(400).send(response.data);
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({ error: "Internal Server Error" });
    });
});

//run app
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
