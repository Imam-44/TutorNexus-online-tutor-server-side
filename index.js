const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Client Setup
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const database = client.db('assignment-11-tutors');
    const tutorialsCollection = database.collection('tutorials');

    // Existing APIs
    app.get('/stats', async (req, res) => {
      const tutorials = await tutorialsCollection.find().toArray();

      const totalTutorials = tutorials.length;
      const totalReviews = tutorials.reduce((sum, tutorial) => sum + (parseInt(tutorial.review) || 0), 0);
      const languages = [...new Set(tutorials.map(t => t.language.toLowerCase()))];
      const totalLanguages = languages.length;
      const users = [...new Set(tutorials.map(t => t.email))];
      const totalUsers = users.length;

      res.send({
        totalTutorials,
        totalReviews,
        totalLanguages,
        totalUsers
      });
    });

    app.get('/tutorials-by-language/:lang', async (req, res) => {
      const lang = req.params.lang.toLowerCase();
      const filtered = await tutorialsCollection.find({
        language: { $regex: new RegExp(lang, 'i') }
      }).toArray();
      res.send(filtered);
    });

    app.get('/tutorials', async (req, res) => {
      const allTutorials = await tutorialsCollection.find().toArray();
      res.send(allTutorials);
    });

    app.post('/add-tutorials', async (req, res) => {
      const tutorialsData = req.body;
      const result = await tutorialsCollection.insertOne(tutorialsData);
      res.status(201).send({ ...result, message: 'Tutorial added successfully' });
    });

    app.get('/tutorial/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const tutorial = await tutorialsCollection.findOne(filter);
      if (!tutorial) return res.status(404).send({ error: 'Tutorial not found' });
      res.send(tutorial);
    });

    app.get('/my-tutorials/:email', async (req, res) => {
      const email = req.params.email;
      const tutorials = await tutorialsCollection.find({ email }).toArray();
      res.send(tutorials);
    });

    // Booking APIs

   
    app.post('/book-tutorial', async (req, res) => {
      const { tutorialId, userEmail } = req.body;
      if (!tutorialId || !userEmail) {
        return res.status(400).send({ error: 'Missing tutorialId or userEmail' });
      }

      try {
        const filter = { _id: new ObjectId(tutorialId) };

        const tutorial = await tutorialsCollection.findOne(filter);
        if (!tutorial) {
          return res.status(404).send({ error: 'Tutorial not found' });
        }

        if (tutorial.book && tutorial.book.includes(userEmail)) {
          return res.status(400).send({ error: 'Already booked by this user' });
        }

        await tutorialsCollection.updateOne(
          filter,
          { $push: { book: userEmail } }
        );

        res.send({ success: true, message: 'Tutorial booked successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
      }
    });

   
    app.get('/my-booked-tutorials/:email', async (req, res) => {
      const email = req.params.email;

      try {
        const bookedTutorials = await tutorialsCollection.find({
          book: email
        }).toArray();

        res.send(bookedTutorials);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
      }
    });

    //  Review Increment API 
    app.patch('/tutorial/:id/review', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await tutorialsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $inc: { review: 1 } }
        );

        if (result.modifiedCount === 1) {
          res.send({ success: true, message: 'Review count updated' });
        } else {
          res.status(404).send({ error: 'Tutorial not found or not updated' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to update review' });
      }
    });

    app.get('/', (req, res) => {
      res.send('assignment-11-server-running');
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Do not close client so server keeps running
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
