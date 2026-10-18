const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { painel, isOwner } = require('../handlers/formEditor');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('formulario')
    .setDescription('Abre o painel para adicionar, editar ou remover perguntas do formulário')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!isOwner(interaction)) {
      return interaction.reply({
        content: '❌ Apenas o dono pode editar o formulário.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({ ...painel(), flags: MessageFlags.Ephemeral });
  },
};