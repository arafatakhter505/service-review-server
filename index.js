const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.grcofim.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function run() {
  try {
    const servicesCollection = client.db("ToothFixers").collection("Services");

    // create data
    app.post("/service", async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result);
    });
  } catch (error) {
    console.log(error.message);
  }
}

run().catch((e) => console.log(e));

// app listen
app.listen(port, () =>
  console.log(`Tooth Fixers server is running on ${port}`)
);
