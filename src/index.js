import express, {json} from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(json());

//conexão com o banco de dados
const mongoURL = process.env.MONGO_URL;
const mongoClient = new MongoClient(mongoURL);
let db;

mongoClient.connect()
    .then(()=> {
        console.log("Conexão estabelecida");
        db = mongoClient.db()
    })
    .catch((err)=> console.log(err.message));


app.get("/home", (req, res) =>{
    db.collection("posts").find().toArray()
        .then(data = res.send(data))
        .catch(err => res.status(500).send(err.message));
});

app.post("/home", (req,res) =>{
    const newPost = req.body;
    db.collection("posts").insertOne(newPost)
        .then(()=>res.sendStatus(201))
        .catch(err => res.status(500).send(err.message));
})

const porta = process.env.PORTA;
app.listen(porta, ()=>{
    console.log(`Server rodando na porta ${porta}`);
})