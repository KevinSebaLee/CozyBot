import { SlashCommandBuilder } from "discord.js";
import supabase from "../database/supabaseClient.js";

const data = new SlashCommandBuilder()
  .setName("setxp")
  .setDescription("Establece el XP de un usuario")
  .addUserOption(option =>
    option.setName("user")
      .setDescription("El usuario al que se le establecerá el XP")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName("level")
      .setDescription("El nivel a establecer")
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option.setName("xp")
        .setDescription("El XP a establecer")
        .setRequired(false)
    );

const setXpCommand = async (interaction) => {
    console.log(`setXpCommand called by user: ${interaction.options.getUser("user")} (${interaction.user.id})`);

    // Always try to defer reply first
    if (!interaction.deferred && !interaction.replied) {
        try {
            await interaction.deferReply({ ephemeral: true });
        } catch (err) {
            console.error("Error deferring reply:", err);
            // If defer fails and not replied, try to reply
            if (!interaction.replied) {
                try {
                    await interaction.reply({
                        content: "No se pudo establecer el XP. Inténtalo de nuevo.",
                        ephemeral: true,
                    });
                } catch (replyErr) {
                    console.error("Error sending reply after defer failed:", replyErr);
                }
            }
            return;
        }
    }

    try {
        const user = interaction.options.getUser("user");
        const xp = interaction.options.getInteger("xp");
        const level = interaction.options.getInteger("level");

        if (!user || level === null) {
            await interaction.editReply({
                content: "Debes proporcionar un usuario y un XP válido.",
            });
            return;
        }

        const { error } = await supabase
            .from("users")
            .update({
                global_xp: xp || 0,
                global_level: level,
            })
            .eq("id", user.id);

        if (error) {
            throw error;
        }

        await interaction.editReply({
            content: `XP de ${user.tag} establecido a ${xp} y nivel a ${level || 1}.`,
        });
    } catch (error) {
        console.error("Error setting XP:", error);
        // Always try to respond, even on error
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
                content: "Ocurrió un error al establecer el XP.",
            });
        } else {
            try {
                await interaction.reply({
                    content: "Ocurrió un error al establecer el XP.",
                    ephemeral: true,
                });
            } catch (replyErr) {
                console.error("Error sending reply after error:", replyErr);
            }
        }
    }
};

setXpCommand.data = data;
export default setXpCommand;