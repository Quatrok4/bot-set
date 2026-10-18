const { MessageFlags } = require('discord.js');
const config = require('../../config');
const db = require('../utils/database');
const { registroEmbed, botoesAnalise } = require('../utils/embeds');

module.exports = async function handleRegisterSubmit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const perguntas = db.getQuestions();

  // Percorre os campos que vieram do modal e associa cada um à sua pergunta
  const respostas = [...interaction.fields.fields.values()].map((campo) => {
    const pergunta = perguntas.find((q) => q.id === campo.customId);
    return {
      label: pergunta ? pergunta.label : 'Pergunta',
      value: campo.value?.trim() || '*Não respondeu*',
    };
  });

  const canal = await interaction.client.channels.fetch(config.canais.analise).catch(() => null);
  if (!canal) {
    return interaction.editReply('❌ Canal de conferência não encontrado. Avise a administração.');
  }

  const mensagem = await canal.send({
    embeds: [registroEmbed(interaction.user, respostas)],
    components: [botoesAnalise()],
  });

  // Salva o registro usando o ID da mensagem como chave
  db.saveRegistration(mensagem.id, {
    userId: interaction.user.id,
    answers: respostas,
    status: 'pending',
    createdAt: Date.now(),
  });

  await interaction.editReply('✅ Pedido de set enviado! Aguarde a conferência da liderança. Você será avisado por DM.');
};