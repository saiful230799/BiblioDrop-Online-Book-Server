const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
    
    const database = client.db("BiblioDrop-DB");
    const booksCollection = database.collection("books-collection");


    // --- Admin Collection Definition
    const usersCollection = database.collection("users-collection");
    const transactionsCollection = database.collection("transactions-collection");

    // --- Admin Routes
    app.get('/admin/pending-books', async (req, res) => {
      const result = await booksCollection.find({ status: "Pending Approval" }).toArray();
      res.send(result);
    });


    app.patch('/admin/approve-book/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { status: "Published" } };
      const result = await booksCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get('/admin/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.patch('/admin/update-user-role/:id', async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: role } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });


    app.get('/admin/transactions', async (req, res) => {
      const result = await transactionsCollection.find().toArray();
      res.send(result);
    });

    app.get('/admin/stats', async (req, res) => {
      const totalUsers = await usersCollection.countDocuments();
      const totalBooks = await booksCollection.countDocuments();
      res.send({ totalUsers, totalBooks });
    });

 
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

    app.get('/books/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    app.delete('/books/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    });

    app.patch('/books/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { status: updatedData.status },
      };
      const result = await booksCollection.updateOne(filter, updateDoc);
      res.send(result);
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