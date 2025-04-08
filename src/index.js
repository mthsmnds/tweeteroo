import express, {json} from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
dotenv.config();

const app = express();
app.use(cors());
app.use(json());

//------------------------------------DB CONNECT---------------------------------------------------//

const mongoURL = process.env.BACKEND_URL;
const mongoClient = new MongoClient(mongoURL);
let db;

mongoClient.connect()
    .then(()=> {
        console.log("Conexão estabelecida");
        db = mongoClient.db()
    })
    .catch((err)=> console.log(err.message));

//------------------------------------POST REQUESTS----------------------------------------------//

app.post("/sign-up", async(req, res) =>{
    const {username, avatar} = req.body;
    const signSchema = joi.object({
        username:joi.string().required(),
        avatar:joi.string().required()
    });
    const validation = signSchema.validate({username, avatar}, {abortEarly: false});

    if(validation.error){
        const message = validation.error.details.map(detail => detail.message);
        return res.status(422).send(message);
    }

    try{
        await db.collection("users").insertOne({username, avatar});
        res.sendStatus(201);
    } catch(error){
        res.status(500).send(error.message);
    }
})


app.post("/tweets", async (req,res) =>{
    const {username, tweet} = req.body;
    const tweetSchema = joi.object({
        username:joi.string().required(),
        tweet:joi.string().max(144).required()
    });
    const validation = tweetSchema.validate({username, tweet}, {abortEarly: false});
 
     if(validation.error){
         const message = validation.error.details.map(detail => detail.message);
         return res.status(422).send(message);
     }
 
     try{
         const userExists = await db.collection("users").findOne({username});
         if(!userExists) return res.status(401).send("Usuário não cadastrado");
 
         await db.collection("tweets").insertOne({username, tweet});
         res.sendStatus(201);
     } catch(error){
         res.status(500).send(error.message);
     }
 
 })

//------------------------------------------GET REQUESTS-----------------------------------------//

app.get("/tweets", (req, res) =>{
    db.collection("tweets").find().toArray()
        .then(data => res.send(data))
        .catch(err => res.status(500).send(err.message));
});

app.get("/tweets/:id", (req, res) =>{
    const id = req.params.id;
    db.collection("tweets").findOne({
        _id: new ObjectId(id)
    })
        .then(tweet => {
            return res.send(tweet)
        })
        .catch(err => res.status(404).send(err.message));
});

//-----------------------------------------PUT REQUEST--------------------------------------------//

app.put("/tweets/:id", async (req,res)=>{
    const {id} = req.params;
    const {username, tweet} = req.body;

    const editSchema = joi.object({
        username:joi.string().required(),
        tweet:joi.string().max(144).required()
    });
    const validation = editSchema.validate({username, tweet}, {abortEarly: false});
        if(validation.error){
            const message = validation.error.details.map(detail => detail.message);
            return res.status(422).send(message);
        }
    
    try{
        const result = await db.collection("tweets").updateOne({
        _id: new ObjectId(id)
    },{
        $set:{
            username: username,
            tweet: tweet
        }
    });
        if(result.matchedCount === 0){
            return res.status(404).send("Tweet não encontrado ou não existe");
        }
    return res.send("Tweet editado");
    
    } catch(error){
        res.status(500).send(error.message);
    }
})

//-----------------------------------------DELETE REQUEST----------------------------------------//

app.delete("/tweets/:id", async (req, res)=>{
    const {id} = req.params;

    try{
        const result = await db.collection("tweets").deleteOne({
            _id: new ObjectId(id)
        });
            if(result.deletedCount === 0){
                return res.status(404).send("Tweet não encontrado ou não existe")
            }
            return res.status(204).send("Tweet deletado com sucesso")
    } catch(error){
        res.status(500).send(error.message);
    }
})

const porta = process.env.PORTA || 5000;
app.listen(porta, ()=>{
    console.log(`Server rodando na porta ${porta}`);
})