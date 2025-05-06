const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/generate", async (req, res) => {
  const { description } = req.body;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `Crée un jeu de société à imprimer basé sur : ${description}. Donne des règles complètes, un objectif, un déroulement et des instructions simples.`,
        },
      ],
    });

    const gameContent = completion.data.choices[0].message.content;
    const fileName = `game_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, fileName);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(12).text(gameContent);
    doc.end();

    doc.on("end", () => {
      res.download(filePath, () => {
        fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).send("Erreur lors de la génération.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en ligne sur le port ${PORT}`);
});
