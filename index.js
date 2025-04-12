const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.laemifb.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();




    const jobsCollection = client.db('jobPortal').collection('jobs')
    const jobsApplicationCollection = client.db('jobPortal').collection('job-applications')


    app.get('/jobs', async(req, res)=>{
        const cursor = jobsCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })


    app.get('/jobs/:id', async(req, res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await jobsCollection.findOne(query)
      res.send(result)
    })


    app.post('/job-applications', async(req, res)=>{
      const application = req.body
      const result = await jobsApplicationCollection.insertOne(application)
      res.send(result)
    })



    app.get('/job-applications', async(req, res)=>{
      const email = req.query.email
      const query = { applicant_email : email}
      const result = await jobsApplicationCollection.find(query).toArray()
      res.send(result)
    })


    // app.get('/job-applications', async(req, res)=>{
    //   const email = req.query.email
    //   const query = { applicant_email : email}
    //   const result = await jobsApplicationCollection.find(query).toArray()
    //   res.send(result)
    // })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
    res.send('job portal server is running')
})

app.listen(port, () =>{
    console.log(`job portal server is running on port ${port}`);
})