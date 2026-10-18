const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { painelEmbed, painelBotoes } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Envia o painel de registro neste canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.channel.send({
      embeds: [painelEmbed()],
      components: [painelBotoes()],
    });
    await interaction.reply({ content: '✅ Painel enviado!', flags: MessageFlags.Ephemeral });
  },
};