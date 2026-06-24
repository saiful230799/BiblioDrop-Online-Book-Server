const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    
    const database = client.db("BiblioDrop_DB");
    const booksCollection = database.collection("books-collection");

    app.post('/books', async (req, res) => {
      const book = req.body;
      const result = await booksCollection.insertOne(book);
      res.send(result);
    });


    app.get('/books', async (req, res) => {
      const page = parseInt(req.query.page) || 1; 
      const limit = parseInt(req.query.limit) || 6; 
      const skip = (page - 1) * limit; 

      const cursor = booksCollection.find().skip(skip).limit(limit);
      const books = await cursor.toArray();
      const totalBooks = await booksCollection.countDocuments(); 

      res.send({
        books,
        totalBooks,
        totalPages: Math.ceil(totalBooks / limit)
      });
    });

    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Connection error:", error);
  }
}
run().catch(console.dir);

// Basic Route
app.get('/', (req, res) => {
  res.send('BiblioDrop Server is running!');
});

// Start Server
app.listen(port, () => {
  console.log(`BiblioDrop server is running on port ${port}`);
});