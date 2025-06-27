import { SlashCommandBuilder } from "discord.js";
import { setUserXPLevel } from "../services/xpService.js";

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
  if (!interaction.deferred && !interaction.replied) {
    try {
      await interaction.deferReply({ ephemeral: true });
    } catch (err) {
      if (!interaction.replied) {
        await interaction.reply({
          content: "No se pudo establecer el XP. Inténtalo de nuevo.",
          ephemeral: true,
        });
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

    const success = await setUserXPLevel(user.id, xp || 0, level);
    if (!success) throw new Error("DB error");
    await interaction.editReply({
      content: `XP de ${user.tag} establecido a ${xp} y nivel a ${level || 1}.`,
    });
  } catch (error) {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: "Ocurrió un error al establecer el XP.",
      });
    } else {
      await interaction.reply({
        content: "Ocurrió un error al establecer el XP.",
        ephemeral: true,
      });
    }
  }
};

setXpCommand.data = data;
export default setXpCommand;