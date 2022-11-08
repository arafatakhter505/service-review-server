const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.grcofim.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unatuhorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unatuhorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const servicesCollection = client.db("ToothFixers").collection("Services");
    const reviewsCollection = client.db("ToothFixers").collection("Reviews");

    // create data
    app.post("/service", async (req, res) => {
      const service = req.body;
      const result = await servicesCollection.insertOne(service);
      res.send(result);
    });

    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10h",
      });
      res.send({ token });
    });

    // read data
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = servicesCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/homeservices", async (req, res) => {
      const query = {};
      const cursor = servicesCollection.find(query);
      const result = await cursor.limit(3).toArray();
      res.send(result);
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await servicesCollection.findOne(filter);
      res.send(result);
    });

    app.get("/reviews/:id", async (req, res) => {
      const serviceId = req.params.id;
      const query = { serviceId: serviceId };
      const cursor = reviewsCollection.find(query).sort({ time: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/reviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      const email = req.query.email;
      if (decoded.email !== email) {
        res.status(401).send({ message: "unauthorized access" });
      }
      const query = { email: email };
      const cursor = reviewsCollection.find(query).sort({ time: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await reviewsCollection.findOne(filter);
      res.send(result);
    });

    // update data
    app.put("/reviews/:id", async (req, res) => {
      const review = req.body;
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateReview = {
        $set: {
          review: review.newReview,
        },
      };
      const result = await reviewsCollection.updateOne(
        filter,
        updateReview,
        option
      );
      res.send(result);
    });

    // delete data
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(filter);
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
