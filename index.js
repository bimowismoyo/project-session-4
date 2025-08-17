const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai')

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY})
const model = async (contents) => await genAI.models.generateContent({
    model: 'models/gemini-2.0-flash',
    contents
})

const upload = multer({ dest: 'uploads/'})

app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body

    try {
        const result = await model(prompt)
        res.json({output: result.text})
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

const imageToGenerativePart = (filePath) => ({
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType: 'image/png',
    },
})

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    const prompt = req.body.prompt || 'Describe this image'
    const image = imageToGenerativePart(req.file.path)

    try {
        const result = await model([prompt, image])
        res.json({ output: result.text })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

})

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    const audioBuffer = fs.readFileSync(req.file.path)
    const base64Audio = audioBuffer.toString('base64')
    const audioPart = {
        inlineData: {
            data: base64Audio,
            mimeType: req.file.mimetype
        }
    }

    try {
        const result = await model([
            'Transcribe or analyze the following audio:',
            audioPart
        ])
        res.json({ output: result.text })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Gemini app is running on port: ${PORT}`)
})
