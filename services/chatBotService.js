const dotenv = require("dotenv");
dotenv.config();

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env["GEMINI-API-KEY"];
const genAI = new GoogleGenerativeAI(apiKey);
const systemInstruction = require('../data/geminiSystemInstruction.json').systemInstruction;
const exampleChatHistory = require('../data/geminiSystemInstruction.json').exampleChatHistory;

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-8b",
  systemInstruction: systemInstruction
});

const generationConfig = {
  temperature: 0.35,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function run(chatPrompt) {
  let result = null;
  try{
    const chatSession = model.startChat({
      generationConfig,
      history: exampleChatHistory
    });
  
    result = await chatSession.sendMessage(chatPrompt);
  }catch(e){
    console.error(`Error in chatBotService.js: ${e}`);
  }
  
  return result?.response?.candidates[0]?.content?.parts;
}


module.exports = run;