const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const config = require('../../config');
const db = require('../utils/database');

const ephemeral = MessageFlags.Ephemeral;

// Staff = quem tem o cargo de staff OU é administrador
function isStaff(member) {
  return member.roles.cache.has(config.cargos.staff) || member.permissions.has(PermissionFlagsBits.Administrator);
}

// ================= APROVAR =================
async function accept(interaction) {
  if (!isStaff(interaction.member)) {
    return interaction.reply({ content: '❌ Você não tem permissão para conferir pedidos de set.', flags: ephemeral });
  }

  const registro = db.getRegistration(interaction.message.id);
  if (!registro || registro.status !== 'pending') {
    return interaction.reply({ content: '⚠️ Este pedido já foi conferido.', flags: ephemeral });
  }

  await interaction.deferUpdate();

  // Entrega o cargo
  let cargoEntregue = true;
  try {
    const membro = await interaction.guild.members.fetch(registro.userId);
    await membro.roles.add(config.cargos.aprovado);
  } catch {
    cargoEntregue = false; // membro saiu do servidor ou o bot está sem permissão
  }

  registro.status = 'approved';
  registro.reviewedBy = interaction.user.id;
  db.saveRegistration(interaction.message.id, registro);

  // Atualiza a mensagem: cor verde, sem botões
 const embed = EmbedBuilder.from(interaction.message.embeds[0])
    .setColor(config.cores.aprovado)
    .setFooter({ text: '✅ Set liberado' })
    .addFields({ name: 'Liberado por', value: `${interaction.user}` });

  await interaction.editReply({ embeds: [embed], components: [] });

  // Avisa o candidato por DM
  const usuario = await interaction.client.users.fetch(registro.userId).catch(() => null);
    await usuario
    ?.send(`🎖️ Seu set na **${config.familia.nome}** foi **liberado**! Seu cargo já está disponível no servidor. Bem-vindo à família!`)
    .catch(() => {});

  if (!cargoEntregue) {
    await interaction.followUp({
      content: '⚠️ Aprovado, mas não consegui dar o cargo. Verifique se o cargo do bot está acima do cargo de membro e se a pessoa ainda está no servidor.',
      flags: ephemeral,
    });
  }
}

// ================= RECUSAR (abre modal pedindo o motivo) =================
async function openRejectModal(interaction) {
  if (!isStaff(interaction.member)) {
   return interaction.reply({ content: '❌ Você não tem permissão para conferir pedidos de set.', flags: ephemeral });
  }

  const registro = db.getRegistration(interaction.message.id);
  if (!registro || registro.status !== 'pending') {
   return interaction.reply({ content: '⚠️ Este pedido já foi conferido.', flags: ephemeral });
  }

  // O ID da mensagem vai no customId para recuperarmos depois
  const modal = new ModalBuilder()
    .setCustomId(`review_reject_modal:${interaction.message.id}`)
    .setTitle('Recusar pedido de set')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('motivo')
          .setLabel('Motivo da recusa')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Explique o motivo para o candidato')
          .setRequired(true)
          .setMaxLength(500)
      )
    );

  await interaction.showModal(modal);
}

// ================= RECUSAR (modal enviado) =================
async function submitReject(interaction) {
  await interaction.deferReply({ flags: ephemeral });

  const messageId = interaction.customId.split(':')[1];
  const motivo = interaction.fields.getTextInputValue('motivo');

  const registro = db.getRegistration(messageId);
  if (!registro || registro.status !== 'pending') {
    return interaction.reply({ content: '⚠️ Este pedido já foi conferido.', flags: ephemeral });
  }

  registro.status = 'rejected';
  registro.reviewedBy = interaction.user.id;
  registro.reason = motivo;
  db.saveRegistration(messageId, registro);

  // Atualiza a mensagem original da staff
  const mensagem = await interaction.channel.messages.fetch(messageId).catch(() => null);
  if (mensagem) {
 const embed = EmbedBuilder.from(mensagem.embeds[0])
      .setColor(config.cores.recusado)
      .setFooter({ text: '❌ Pedido recusado' })
      .addFields(
        { name: 'Recusado por', value: `${interaction.user}` },
        { name: 'Motivo', value: motivo }
      );
    await mensagem.edit({ embeds: [embed], components: [] });
  }

  // Avisa o candidato por DM
  const usuario = await interaction.client.users.fetch(registro.userId).catch(() => null);
   await usuario
    ?.send(`❌ Seu pedido de set na **${config.familia.nome}** foi **recusado**.\n**Motivo:** ${motivo}\n\nCorrija as informações e faça um novo pedido quando quiser.`)
    .catch(() => {});
  await interaction.editReply('✅ Registro recusado e candidato notificado.');
}

module.exports = { accept, openRejectModal, submitReject };