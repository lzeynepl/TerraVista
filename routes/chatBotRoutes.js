const express = require('express');
const router = express.Router();
const chat = require('../services/chatBotService');

router.post('/send-prompt-to-chatbot', async (req, res) => {
  const {prompt} = req.body;
  console.log("[INFO] POST /send-prompt-to-chatbot --- PROMPT:::", prompt);
  try {
    const response = await chat(prompt);
    console.log("[INFO] POST /send-prompt-to-chatbot --- RESPONSE::: ", response);
    res.status(200).json({"chatResponse" : response});
  } catch (error) {
    console.log("[ERROR] POST /send-prompt-to-chatbot", error);
    res.status(404).json({ message: error.message });
  }
});

module.exports = router;