const express = require('express')
const cors = require('cors')
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//middleware
app.use(cors());
app.use(express.json());


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
   const database = client.db('assignment-11-tutors')
   const tutorialsCollection = database.collection('tutorials')

 //state 
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

//category language
app.get('/tutorials-by-language/:lang', async (req, res) => {
  const lang = req.params.lang.toLowerCase();
  const filtered = await tutorialsCollection.find({
    language: { $regex: new RegExp(lang, 'i') }
  }).toArray();
  res.send(filtered);
});



//all tutorials
   app.get('/tutorials', async(req, res)=> {
    const allTutorials = await tutorialsCollection.find().toArray()
    res.send(allTutorials)
    console.log(allTutorials);
   })
  //save a tutorials data in database through post req
  app.post('/add-tutorials', async(req, res)=> {
    const tutorialsData = req.body
    const result = await tutorialsCollection.insertOne(tutorialsData)
    console.log(result);
    res.status(201).send({...result, message:'data paisi vai thanks'})
  })

  //get a sinngle tutors by id
  app.get('/tutorial/:id', async(req, res)=> {
    const id = req.params.id
      console.log(id);
     const filter = {_id: new ObjectId(id)}
    const tutorial = await tutorialsCollection.findOne(filter)
    res.send(tutorial)
    console.log(tutorial);
   })
  //get my tutorials by email
  app.get('/my-tutorials/:email', async(req, res)=> {
    const email = req.params.email
      console.log(email);
     const filter = {email}
    const tutorials = await tutorialsCollection.find(filter).toArray()
    res.send(tutorials)
    console.log(tutorials);
   })
   
   //handle booking 

   
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',  (req, res) => {
  res.send('assignment-11-server-running')
})


app.listen(port, ()=> {
  console.log(`Server running at port ${port}`);
})