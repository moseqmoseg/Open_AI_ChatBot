import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai-api';
import { connect } from "./libs/database.js"
import { User } from "./models/userSchema.js"

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();
await connect()


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openAI = new OpenAI(OPENAI_API_KEY)
const startingPrompt = "The following is a conversation with an AI assistant. The assistant is rude and doesn't like the human.\n\n"
let historyArray = [{ question: "Hello, who are you?", answer: "I am an AI created by OpenAI. What do you whant?" }]


app.post('/register', async(req, res) => {
    const user = await User.register(req.body);
    console.log(req.body)

    if (!user) {
        return res.status(400).json({ success: false });
    }
    res.status(201).json({
        success: true,
        user: user,
        token: "this is a token"
    });
})

app.post('/login', async(req, res) => {
    console.log(req.body)

    const user = await User.login(req.body)
    console.log(user)
    res.send({
        succes: true,
        user: user,
        token: "this is a token"
    })
})

app.post('/', async(req, res) => {
    console.log(req.body)
    let currentPrompt = ""
    console.log(historyArray.length)
    if (historyArray.length < 4) {
        console.log(historyArray)
        currentPrompt = startingPrompt
        historyArray.map((data) => {
            currentPrompt = currentPrompt + "You: " + data.question + "\n" + "AI: " + data.answer + "\n"
        })
    } else {
        for (let i = historyArray.length - 3; i < historyArray.length; i++) {
            data = historyArray[i]
            currentPrompt = currentPrompt + "You: " + data.question + "\n" + "AI: " + data.answer + "\n"
        }
    }
    currentPrompt = currentPrompt + "You: " + req.body.question + "\n"
    console.log(currentPrompt)


    const gptResponse = await openAI.complete({
        engine: 'davinci',
        prompt: currentPrompt,
        maxTokens: 100,
        temperature: 0.9,
        topP: 1,
        presencePenalty: 0.6,
        frequencyPenalty: 0,
        stop: ["\n", " Human:"]
    });
    console.log("_______")
    console.log(gptResponse.data.choices[0].text)

    historyArray.push({ question: req.body.question, answer: gptResponse.data.choices[0].text })

    res.send(gptResponse.data.choices[0].text);

})


app.listen(4000, () =>
    console.log('Example app listening on port 4000!'),
);