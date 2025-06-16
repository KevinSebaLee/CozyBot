import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("8ball")
  .setDescription("Ask the magic 8-ball a question.")
  .addStringOption((option) =>
    option
      .setName("question")
      .setDescription("The question to ask the magic 8-ball")
      .setRequired(true)
  );

const ball8Command = async (interaction) => {
  const question = interaction.options.getString("question");

  const responses = [
    "Yes",
    "No",
    "Maybe",
    "Ask again later",
    "Definitely",
    "Absolutely not",
    "It is certain",
    "Very doubtful",
    "Without a doubt",
    "My sources say no"
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

await interaction.reply({
    embeds: [
        new EmbedBuilder()
            .setTitle("🎱 Magic 8-Ball")
            .setDescription(`**Question:** ${question}\n**Answer:** ${randomResponse}`)
            .setColor(0x1abc9c)
    ]
});
}  

ball8Command.data = data;

export default ball8Command;