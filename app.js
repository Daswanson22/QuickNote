const express = require('express');
const bodyParser = require('body-parser');
const speech = require('@google-cloud/speech');
var path = require('path');
const { OpenAI } = require('openai');
const { YoutubeTranscript } = require('youtube-transcript');
const fs = require('fs');

var indexRouter = require('./routes/index');

const app = express();
const port = 3000;

const openai = new OpenAI({ apiKey: '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' });
const speechClient = new speech.SpeechClient();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/", indexRouter);

app.post('/generate-notes', async (req, res) => {
    try {
        const { videoUrl } = req.body;
        const transcriptText = await getVideoTranscript(videoUrl);
        //const speechText = await convertSpeechToText(transcriptText);
        const gptPrompt = "Summarize the video transcript: " + transcriptText;
        const generatedNotes = await generateNotesWithGPT(gptPrompt);
        // console.log(generatedNotes.message.content[1]);
        // For simplicity, saving notes to a file is omitted in this example.
        res.status(200).send(generatedNotes.message.content);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function getVideoTranscript(videoUrl) {
    try {
        // Get the paragraph object
        const transcript = await YoutubeTranscript.fetchTranscript(videoUrl, {lang: "en"});

        // Extract text from each entry and concatenate into a long paragraph
        const paragraph = transcript.map(entry => entry.text).join(' ');

        return paragraph;
    } catch (error) {
        console.error('Error fetching video transcript:', error);
        throw error; // You may want to handle or log the error appropriately
    }
}

async function convertSpeechToText(audioData) {
    const audioBytes = fs.readFileSync(audioData);
    const audio = {
        content: audioBytes.toString('base64'),
    };
    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
    };

    const [response] = await speechClient.recognize({ audio, config });
    return response.results.map(result => result.alternatives[0].transcript).join('\n');
}

async function generateNotesWithGPT(prompt) {
    const response = await openai.chat.completions.create({
        messages: [{"role": "assistant", "content": "You are a an educated professor writing notes for a student. First, create a summary for this content. Then create bullet points about the prompt using this symbol *",
                   "role": "user", "content": prompt,}
                  ],
        temperature: 0.2,
        max_tokens: 300,
        model: "gpt-3.5-turbo",
    });

    return response.choices[0];
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;