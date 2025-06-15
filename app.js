import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import supabase from './src/database/supabaseClient.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers // Required for fetching members!
  ]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Loop through every guild the bot is in
  for (const [guildId, guild] of client.guilds.cache) {
    await guild.members.fetch();

    for (const [memberId, member] of guild.members.cache) {
      const { user } = member;
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

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '/ping') {
    message.reply('Pong!');
  }

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

  if(message.content === 'xp'){
    const userId = message.author.id;
    const guildId = message.guild.id;

    const { data: userXP, error } = await supabase
        .from('users')
        .select('global_xp, global_level')
        .eq('id', userId)
        .single();

    if (error) {
      console.error('Error fetching user XP:', error);
      return message.reply('An error occurred while fetching your XP.');
    }

    if (userXP) {
      message.reply(`You have ${userXP.global_xp} XP and are at level ${userXP.global_level}.`);
    } else {
      message.reply('You have no XP yet. Start chatting to earn some!');
    }
  }

  if(message.content != null){
    const userId = message.author.id;
    const guildId = message.guild.id;
    const xpToAdd = Math.floor(Math.random() * 10) + 5; // Random XP between 5 and 14

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
        const xpNeeded = newLevel * 100;
        let xpToAddAfter = userXP.global_xp - xpNeeded;        

        console.log(`User ${userId} has ${userXP.global_xp} XP , adding ${xpToAdd} XP, new total is ${newXP}. Need xp to level up: ${xpNeeded}. XP after adding: ${xpToAddAfter}`);

        if (xpToAddAfter >= xpNeeded) {
            newLevel += 1;
            newXP = newXP - xpNeeded;
            message.reply(`Congrats ${message.author}, you leveled up to level ${newLevel}!`);
        }
        await supabase
            .from('users')
            .update({ global_xp: newXP, global_level: newLevel })
            .eq('id', userId)
    } else {
        await supabase
            .from('users')
            .insert([{ id: userId, global_xp: newXP, blobal_level: newLevel }]);
    }
  }

});

client.login(process.env.DISCORD_TOKEN);