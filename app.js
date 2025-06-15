import { Client, Embed, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import supabase from './src/database/supabaseClient.js';
import { EmbedBuilder } from 'discord.js';
// Load environment variables from .env file

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers // Required for fetching members!
  ]
});

const BASE_EXP = 50;
const GROWTH_RATE = 1.2;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Loop through every guild the bot is in
  for (const [guildId, guild] of client.guilds.cache) {
    await guild.members.fetch();

    // Upsert guild
    const { data, error } = await supabase
      .from('guilds')
      .upsert([
        {
          id: guildId,
          name: guild.name,
          icon: guild.icon
        }
      ])
      .select();

    if (error) {
      console.error(`Error upserting guild ${guildId}:`, error);
    }

    for (const [memberId, member] of guild.members.cache) {
      const { user } = member;

      // Upsert user
      await supabase
        .from('users')
        .upsert([
          {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar,
          }
        ]);
    }
  }
});

// Register slash command
client.on('ready', async () => {
  const data = [
    {
      name: 'xp',
      description: "Show your XP and level"
    }
  ];
  for (const guild of client.guilds.cache.values()) {
    await guild.commands.set(data);
  }
});

// Handle slash command interaction
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'xp') {
    const userId = interaction.user.id;

    const { data: userXP, error } = await supabase
      .from('users')
      .select('global_xp, global_level')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user XP:', error);
      return interaction.reply({ content: 'An error occurred while fetching your XP.', ephemeral: false });
    }

    if (userXP) {
      // Generate a "widget" image with profile picture and XP bar using Canvas
      try {
        const { createCanvas, loadImage } = await import('canvas');
        const canvasWidth = 500;
        const canvasHeight = 150;
        const avatarSize = 120;
        const padding = 15;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#23272A';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw profile avatar (circle)
        const avatarURL = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatarImg = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(padding + avatarSize / 2, canvasHeight / 2, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg, padding, (canvasHeight - avatarSize) / 2, avatarSize, avatarSize);
        ctx.restore();

        // Username and Level
        ctx.font = 'bold 28px Sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(interaction.user.username, avatarSize + padding * 2, 50);

        ctx.font = '20px Sans-serif';
        ctx.fillStyle = '#b9bbbe';
        ctx.fillText(`Level: ${userXP.global_level}`, avatarSize + padding * 2, 80);

        // XP Bar
        const barX = avatarSize + padding * 2;
        const barY = 100;
        const barWidth = 340;
        const barHeight = 28;

        // Calculate XP progress
        const xpNeeded = BASE_EXP * ((Math.pow(GROWTH_RATE, userXP.global_level) - 1) / (GROWTH_RATE - 1));
        const percent = Math.min(userXP.global_xp / xpNeeded, 1);

        // Draw empty bar
        ctx.fillStyle = '#40444b';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Draw filled bar
        ctx.fillStyle = '#00b0f4';
        ctx.fillRect(barX, barY, barWidth * percent, barHeight);

        // XP Text
        ctx.font = '18px Sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`${userXP.global_xp} / ${Math.floor(xpNeeded)} XP`, barX + barWidth / 2, barY + barHeight - 7);

        // Send as attachment
        const { AttachmentBuilder } = await import('discord.js');
        const buffer = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buffer, { name: 'xp-widget.png' });

        interaction.reply({
          files: [attachment],
          ephemeral: false
        });
      } catch (err) {
        console.error('Canvas error:', err);
        interaction.reply({ content: 'Could not generate XP widget image.', ephemeral: false });
      }
    } else {
      interaction.reply({ content: 'You have no XP yet. Start chatting to earn some!', ephemeral: false });
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if( message.content === 'reset'){
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Reset user's XP and level
    const { error } = await supabase
        .from('users')
        .update({ global_xp: 0, global_level: 1 })
        .eq('id', userId);

    if (error) {
      console.error('Error resetting user XP:', error);
      return message.reply('An error occurred while resetting your XP.');
    }

    message.reply('Your XP has been reset to 0 and your level to 1.');
  }

  if (!global.xpCooldowns) global.xpCooldowns = new Map();

  if (message.content != null) {
    const userId = message.author.id;
    const now = Date.now();
    const lastXP = global.xpCooldowns.get(userId) || 0;

    if (now - lastXP < 60000) {
      return;
    }

    global.xpCooldowns.set(userId, now);

    const guildId = message.guild.id;
    const xpToAdd = Math.floor(Math.random() * 10) + 5;

    // Fetch user XP from database
    const { data: userXP, error } = await supabase
        .from('users')
        .select('global_xp, global_level')
        .eq('id', userId)
        .single();

    let newXP = xpToAdd;
    let newLevel = 1;

    if (!error && userXP) {
        newXP = userXP.global_xp + xpToAdd;
        newLevel = userXP.global_level;

        const xpNeeded = BASE_EXP * ((Math.pow(GROWTH_RATE, newLevel) - 1) / (GROWTH_RATE - 1));

        console.log(`User ${userId} has ${userXP.global_xp} XP , adding ${xpToAdd} XP, new total is ${newXP}. Need xp to level up: ${xpNeeded}.`);

        if (newXP >= xpNeeded) {
            newLevel += 1;
            message.reply(`Congrats ${message.author}, you leveled up to level ${newLevel}!`);
        }
        await supabase
            .from('users')
            .update({ global_xp: newXP, global_level: newLevel })
            .eq('id', userId)
    } else {
        await supabase
            .from('users')
            .insert([{ id: userId, global_xp: newXP, global_level: newLevel }]);
    }
  }


});

client.login(process.env.DISCORD_TOKEN);