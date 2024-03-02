const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const TICKET_OPTIONS = [
  { label: 'General Inquiry', value: 'general' },
  { label: 'Technical Support', value: 'technical' },
  // Add more ticket types as needed
];

const TICKET_CHANNEL_ID = 'YOUR_TICKET_CHANNEL_ID';

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!ticket') {
    const selectMenu = {
      customId: 'ticket_type',
      placeholder: 'Select a ticket type',
      options: TICKET_OPTIONS,
    };

    const row = { type: 'SELECT_MENU', components: [{ type: 'ACTION_ROW', components: [selectMenu] }] };

    await message.channel.send({ content: 'Please select a ticket type:', components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isSelectMenu()) return;

  const ticketType = interaction.values[0];
  const userEmail = await askForEmail(interaction.user);

  const ticketEmbed = {
    color: 0x7289da,
    title: `New Support Ticket - ${ticketType}`,
    description: `User Email: ${userEmail}`,
    fields: [
      { name: 'Ticket Type', value: ticketType },
      // Add more fields as needed
    ],
    timestamp: new Date(),
  };

  const ticketChannel = client.channels.cache.get(TICKET_CHANNEL_ID);

  if (ticketChannel && ticketChannel.isText()) {
    await ticketChannel.send({ embeds: [ticketEmbed] });
    await interaction.reply('Your support ticket has been created. A support representative will assist you shortly.');
  } else {
    await interaction.reply('An error occurred while creating the support ticket. Please try again later.');
  }
});

async function askForEmail(user) {
  const filter = (response) => response.author.id === user.id && response.content.includes('@');
  const collector = client.channels.cache.get(user.dmChannelId).createMessageCollector({ filter, time: 60000 });

  await user.send('Please provide your email address:');
  return new Promise((resolve) => {
    collector.on('collect', (response) => {
      resolve(response.content);
      collector.stop();
    });

    collector.on('end', () => {
      if (!collector.collected.size) user.send('Time is up. Please run the command again.');
    });
  });
}

const token = 'YOUR_BOT_TOKEN';
client.login(token);
