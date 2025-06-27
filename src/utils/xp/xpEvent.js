import supabase from '../../database/supabaseClient.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

let xpMultiplierActive = false;
let XpMultiplier = 1;
let cooldowns = new Map();

export function getMultiplier() {
  return XpMultiplier;
}

export function checkCooldown(userId) {
  const now = Date.now();
  const last = cooldowns.get(userId) || 0;
  if (now - last < 60000) return false; // 1-min cooldown
  cooldowns.set(userId, now);
  return true;
}

export async function maybeTriggerGlobalMultiplier(message) {
  if (!xpMultiplierActive && Math.random() < 0.002 && !message.author.bot) {
    xpMultiplierActive = true;
    XpMultiplier = 2;

    const embed = new EmbedBuilder()
      .setTitle('¡Evento de Multiplicador de XP!')
      .setDescription('¡Durante los próximos 5 minutos, todos ganan XP doble! 🎉')
      .setColor(0xFFD700);
    await message.channel.send({ embeds: [embed] });

    setTimeout(async () => {
      XpMultiplier = 1;
      xpMultiplierActive = false;
      const endEmbed = new EmbedBuilder()
        .setTitle('Fin del Evento de XP')
        .setDescription('¡El evento de XP doble ha terminado!')
        .setColor(0x7b9fff);
      await message.channel.send({ embeds: [endEmbed] });
    }, 5 * 60 * 1000);
  }
}

export async function maybeTriggerQuickXPEvent(message) {
  if (Math.random() < 0.001 && !message.author.bot) {
    const embed = new EmbedBuilder()
      .setTitle('¡Evento de XP Rápido!')
      .setDescription('¡El primero en presionar el botón gana XP extra! 🚀')
      .setColor(0x7b9fff);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('xp_event_button')
        .setLabel('¡Presióname!')
        .setStyle(ButtonStyle.Primary)
    );

    const sentMsg = await message.channel.send({ embeds: [embed], components: [row] });

    try {
      const filter = (i) => i.customId === 'xp_event_button' && !i.user.bot;
      const interaction = await sentMsg.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 15000 });

      // Give XP to the winner
      const winnerId = interaction.user.id;
      const xpBonus = Math.floor(Math.random() * 101) + 500;

      await supabase
        .from('users')
        .update({ global_xp: supabase.raw('global_xp + ?', [xpBonus]) })
        .eq('id', winnerId);

      await interaction.reply({ content: `¡Ganaste ${xpBonus} XP extra!`, ephemeral: true });
    } catch {
      await sentMsg.edit({ content: 'Nadie presionó el botón a tiempo.', components: [] });
    }
  }
}