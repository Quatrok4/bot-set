const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');
const config = require('../../config');
const db = require('../utils/database');

module.exports = async function openRegisterModal(interaction) {
  // Já é membro?
  if (interaction.member.roles.cache.has(config.cargos.aprovado)) {
    return interaction.reply({ content: '✅ Você já possui o set da família!', flags: MessageFlags.Ephemeral });
  }

  // Já tem pedido em análise?
  if (db.hasPendingRegistration(interaction.user.id)) {
    return interaction.reply({
      content: '⏳ Você já tem um pedido de set em análise. Aguarde a resposta da liderança.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const perguntas = db.getQuestions();
  if (!perguntas.length) {
    return interaction.reply({ content: '❌ O formulário ainda não foi configurado.', flags: MessageFlags.Ephemeral });
  }

  const modal = new ModalBuilder()
    .setCustomId('register_modal')
        .setTitle(`Pedido de Set • ${config.familia.nome}`.slice(0, 45));

  // Cada pergunta vira um campo de texto. O customId do campo é o id da pergunta.
  for (const q of perguntas.slice(0, config.maxPerguntas)) {
    const paragrafo = q.style === 'paragraph';

    const input = new TextInputBuilder()
      .setCustomId(q.id)
      .setLabel(q.label)
      .setStyle(paragrafo ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(q.required)
      .setMaxLength(paragrafo ? 1000 : 200);

    if (q.placeholder) input.setPlaceholder(q.placeholder);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }

  await interaction.showModal(modal);
};