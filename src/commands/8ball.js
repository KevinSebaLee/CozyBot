import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("8ball")
  .setDescription("Pregunta a la bola 8 mágica")
  .addStringOption((option) =>
    option
      .setName("question")
      .setDescription("La pregunta que quieres hacer a la bola 8 mágica")
      .setRequired(true)
  );

const ball8Command = async (interaction) => {
  const question = interaction.options.getString("question");

const responses = [
    "Sí",
    "No",
    "Quizás",
    "Pregunta de nuevo más tarde",
    "Definitivamente",
    "Absolutamente no",
    "Es seguro",
    "Muy dudoso",
    "Sin duda",
    "Mis fuentes dicen que no"
];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

await interaction.reply({
    embeds: [
        new EmbedBuilder()
            .setTitle("🎱 Magic 8-Ball")
            .setDescription(`**Pregunta:** ${question}\n**Respuesta:** ${randomResponse}`)
            .setColor(0x1abc9c)
    ]
});
}  

ball8Command.data = data;

export default ball8Command;