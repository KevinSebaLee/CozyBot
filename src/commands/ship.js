import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { createUsersCanva } from "../utils/shipUtils.js";

const data = new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Envía un barco a un usuario")
    .addUserOption(option =>
        option.setName("member_1")
            .setDescription("El usuario al que enviar el barco")
            .setRequired(true)
    )
    .addUserOption(option =>
        option.setName("member_2")
            .setDescription("El usuario al que enviar el barco")
            .setRequired(false)
    );

const shipCommand = async (interaction) => {
    const userMentioned = interaction.options.getUser("member_1");
    const user = interaction.options.getUser("member_2") || interaction.user;

    console.log(`shipCommand called by user: ${user.tag} (${user.id}) to ship to ${userMentioned.tag} (${userMentioned.id})`);

    if (!interaction.deferred && !interaction.replied) {
        try {
            await interaction.deferReply();
        } catch (err) {
            console.error("Error deferring reply:", err);
            return;
        }
    }

    try {
        const percentage = Math.floor(Math.random() * 101);

        const shipName =
            user.username.slice(0, Math.ceil(user.username.length / 2)) +
            userMentioned.username.slice(Math.floor(userMentioned.username.length / 2));

        let heart;
        if (percentage > 80) heart = "💖";
        else if (percentage > 60) heart = "❤️";
        else if (percentage > 40) heart = "💛";
        else if (percentage > 20) heart = "💚";
        else heart = "💔";

        // Use createUsersCanva to generate an image buffer
        const avatar1 = userMentioned.displayAvatarURL({ extension: "png", size: 256 });
        const avatar2 = user.displayAvatarURL({ extension: "png", size: 256 });
        const canvaBuffer = await createUsersCanva(avatar1, avatar2, percentage);

        const embed = new EmbedBuilder()
            .setTitle("💞 Ship Result")
            .setDescription(
                `**${user.username}** 💞 **${userMentioned.username}**\n` +
                `Compatibilidad: **${percentage}%** ${heart}\n` +
                `Nombre de ship: **${shipName}**`
            )
            .setColor(0xFF69B4)
            .setThumbnail(userMentioned.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Solicitado por ${user.username}`, iconURL: user.displayAvatarURL({ dynamic: true }) });

        await interaction.editReply({
            embeds: [embed],
            files: [{
                attachment: canvaBuffer,
                name: "ship.png"
            }]
        });
    } catch (err) {
        console.error("Error sending ship:", err);
        await interaction.editReply({
            content: "No se pudo enviar el barco. Inténtalo de nuevo más tarde."
        });
    }
};

shipCommand.data = data;
export default shipCommand;