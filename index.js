const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())


const verifyToken = (req, res, next) => {
  // console.log('Incoming token:', req.cookies.token);
  const token = req?.cookies?.token

  if (!token) {
    return res.status(401).send({ message: 'Unauthorized Access' })
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized Access' })
    }
    req.user = decoded
    // req.decoded = decoded   use user/decoded
    next()
  })
}


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


    // app.post('/jwt', async(req, res)=>{
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '1h'})

    //   res
    //   .cookie('token', token, {
    //     httpOnly: true,
    //     secure: false,

    //   })
    //   .send({success: true})
    // })



    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' })
      res.
        cookie('token', token, {
          httpOnly: true,
          secure: false    //false for localhost otherwise use true
        })
        .send({ success: true })
    })


    // app.get('/jobs', async (req, res) => {
    //   const cursor = jobsCollection.find()
    //   const result = await cursor.toArray()
    //   res.send(result)
    // })

    app.get('/jobs', async (req, res) => {

      const email = req.query.email
      let query = {}
      if (email) {
        query = { hr_email: email }
      }

      const cursor = jobsCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })


    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await jobsCollection.findOne(query)
      res.send(result)
    })

    app.post('/jobs', async (req, res) => {
      const job = req.body;
      const result = await jobsCollection.insertOne(job)
      res.send(result)
    })


    app.post('/job-applications', async (req, res) => {
      const application = req.body
      const result = await jobsApplicationCollection.insertOne(application)

      // for application count
      const id = application.job_id;
      const query = { _id: new ObjectId(id) }
      const job = await jobsCollection.findOne(query)
      let newCount = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1
      }
      else {
        newCount = 1;
      }

      // update
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          applicationCount: newCount
        }
      }

      const updateResult = await jobsCollection.updateOne(filter, updateDoc)


      res.send(result)
    })


    app.get('/job-applications/jobs/:job_id', async (req, res) => {
      const jobId = req.params.job_id
      const query = { job_id: jobId }
      const result = await jobsApplicationCollection.find(query).toArray()
      res.send(result)
    })



    app.get('/job-applications', verifyToken, async (req, res) => {
      const email = req.query.email
      const query = { applicant_email: email }


      // for cookie
      // console.log('cuk cuk cookie', req.cookies);

      // if(req.decoded.email !== req.query.email){
      if (req?.user?.email !== req?.query?.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }


      const result = await jobsApplicationCollection.find(query).toArray()

      for (const application of result) {
        // console.log(application.job_id);
        const query1 = { _id: new ObjectId(application.job_id) }
        const result1 = await jobsCollection.findOne(query1)
        if (result1) {
          application.title = result1.title
          application.company = result1.company
          application.company_logo = result1.company_logo
          application.location = result1.location
        }
      }

      res.send(result)
    })



    app.patch('/job-applications/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: data.status
        }
      }
      const result = await jobsApplicationCollection.updateOne(filter, updateDoc)
      res.send(result)
    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('job portal server is running')
})

app.listen(port, () => {
  console.log(`job portal server is running on port ${port}`);
})