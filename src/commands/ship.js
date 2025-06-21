import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { createUsersCanva } from "../utils/shipUtils.js";

const data = new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Ship dos usuario")
    .addUserOption(option =>
        option.setName("member_1")
            .setDescription("El usuario para agregar al ship")
            .setRequired(true)
    )
    .addUserOption(option =>
        option.setName("member_2")
            .setDescription("El usuario para agregar al ship")
            .setRequired(false)
    );

export const shipCommand = async (interaction) => {
    const user1 = interaction.options.getUser("member_1");
    const user2 = interaction.options.getUser("member_2") || interaction.user;

    // Prevent shipping the same user with themselves
    if (user1.id === user2.id) {
        await interaction.reply({
            content: "No puedes hacer ship contigo mismo.",
            ephemeral: true
        });
        return;
    }

    console.log(`shipCommand called by user: ${user2.tag} (${user2.id}) to ship to ${user1.tag} (${user1.id})`);

    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply();
        }

        const percentage = Math.floor(Math.random() * 101);

        // Select a message based on the percentage
        let compatibilityMessage;
        if (percentage < 20) {
            compatibilityMessage = "😬 ¡No parece que sean compatibles! Pero nunca digas nunca.";
        } else if (percentage < 40) {
            compatibilityMessage = "🙂 Hay algo de chispa, pero necesitan trabajar en la relación.";
        } else if (percentage < 60) {
            compatibilityMessage = "😊 ¡Podría funcionar! Hay potencial aquí.";
        } else if (percentage < 80) {
            compatibilityMessage = "😍 ¡Gran compatibilidad! Se ven muy bien juntos.";
        } else {
            compatibilityMessage = "💖 ¡Almas gemelas! ¡Están hechos el uno para el otro!";
        }

        // Create ship name from both usernames
        const shipName =
            user2.username.slice(0, Math.ceil(user2.username.length / 2)) +
            user1.username.slice(Math.floor(user1.username.length / 2));

        const avatar1 = user1.displayAvatarURL({ extension: "png", size: 256 });
        const avatar2 = user2.displayAvatarURL({ extension: "png", size: 256 });

        const shipImageBuffer = await createUsersCanva(avatar1, avatar2, percentage);

        const compatibilityText = `Nombre del ship: **${shipName}**\n**La compatibilidad es de un **${percentage}%**.`;

        const embed = new EmbedBuilder()
            .setColor("#ff69b4")
            .setTitle(compatibilityMessage)
            .setImage("attachment://ship.png")
            
        await interaction.editReply({
            content: compatibilityText,
            embeds: [embed],
            files: [{
            attachment: shipImageBuffer,
            name: "ship.png"
            }]
        });
    } catch (err) {
        console.error("Error sending ship:", err);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
                content: "No se pudo enviar el barco. Inténtalo de nuevo más tarde."
            });
        } else {
            await interaction.reply({
                content: "No se pudo enviar el barco. Inténtalo de nuevo más tarde.",
                ephemeral: true
            });
        }
    }
};

shipCommand.data = data;
export default shipCommand;