const { Events, MessageFlags } = require('discord.js');
const openRegisterModal = require('../handlers/registerButton');
const handleRegisterSubmit = require('../handlers/registerModal');
const review = require('../handlers/reviewButtons');
const formEditor = require('../handlers/formEditor');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      // Slash commands
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
        return;
      }

      // Tudo do editor de formulário (botões, menus e modais) começa com "form_"
      if (
        (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) &&
        interaction.customId.startsWith('form_')
      ) {
        return await formEditor.handle(interaction);
      }

      // Botões
      if (interaction.isButton()) {
        if (interaction.customId === 'register_open') return await openRegisterModal(interaction);
        if (interaction.customId === 'review_accept') return await review.accept(interaction);
        if (interaction.customId === 'review_reject') return await review.openRejectModal(interaction);
        return;
      }

      // Modais enviados
      if (interaction.isModalSubmit()) {
        if (interaction.customId === 'register_modal') return await handleRegisterSubmit(interaction);
        if (interaction.customId.startsWith('review_reject_modal:')) return await review.submitReject(interaction);
      }
    } catch (error) {
      console.error('❌ Erro na interação:', error);
      const payload = { content: '❌ Ocorreu um erro inesperado. Tente novamente.', flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
      else await interaction.reply(payload).catch(() => {});
    }
  },
};