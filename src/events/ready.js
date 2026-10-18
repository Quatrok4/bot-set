const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Bot online como ${client.user.tag}`);
    client.user.setActivity('Melhor DEV FOURKODE 🔥', { type: ActivityType.Watching });
  },
};