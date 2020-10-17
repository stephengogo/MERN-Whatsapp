// importing 
import express from 'express';
import mongoose from 'mongoose';
import Pusher from 'pusher';
import Messages from './dbMessages.js';
import cors from 'cors';

// app config 
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1091980',
    key: '65a2f2cf650eaad2bc0c',
    secret: '6bac70c6018159419e39',
    cluster: 'us3',
    encrypted: true
  });

// middleware 
app.use(express.json());
app.use(cors());
//using cors instead 
// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Orgin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();    
// });

// DB config 
const connection_url = 'mongodb+srv://admin:PsIs5GcL5sT7whA5@cluster0.7x7w3.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true, 
    useUnifiedTopology: true
    // helps mongoose to work smoothly
});

const db = mongoose.connection;

db.once('open', ()=>{
    console.log('DB connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', 
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received
                }
            );
        } else {
            console.log("error triggering pusher");
        }

    })
});

// ????

// api routes
app.get('/',(req, res)=>res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

// listen
app.listen(port, ()=>console.log(`Listening on localhost:${port}`));