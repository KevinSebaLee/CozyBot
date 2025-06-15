import { SlashCommandBuilder } from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("level")
        .setDescription("Check your level and experience points."),
    async execute(interaction) {
        await interaction.deferReply()
            let EmbedBuilder = {
                color: 0x0099ff,
                title: `${message.author.username}'s XP`,
                description: `You have ${userXP.global_xp} XP and are at level ${userXP.global_level}.`,
                timestamp: new Date(),
                footer: {
                text: 'Keep chatting to earn more XP!'
            },
        }
    }
}