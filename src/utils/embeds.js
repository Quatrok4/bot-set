const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

// Painel público com o botão de pedir set
function painelEmbed() {
  const embed = new EmbedBuilder()
    .setColor(config.cores.principal)
    .setTitle(`🎖️ ${config.familia.nome} — Pedido de Set`)
    .setDescription(
      [
        `Seja bem-vindo à **${config.familia.nome}**! Seu recrutamento foi concluído, agora falta só **registrar seus dados** para receber o seu set.`,
        '',
        '📌 **Como pedir o seu set**',
        '> 1️⃣ Clique no botão **Pedir Set**',
        '> 2️⃣ Preencha seus dados corretamente',
        '> 3️⃣ Aguarde a conferência da nossa liderança',
        '> 4️⃣ Quando aprovado, seu cargo é liberado automaticamente',
        '',
        '⚠️ **Atenção**',
        '> • Informe os dados **exatamente** como estão no jogo',
        '> • Pedidos com informações falsas ou incompletas serão recusados',
        '> • Mantenha sua **DM aberta** para receber a resposta',
      ].join('\n')
    )
    .setFooter({ text: `${config.familia.nome} • Sistema de Set` })
    .setTimestamp();

  if (config.familia.logo) embed.setThumbnail(config.familia.logo);
  if (config.familia.banner) embed.setImage(config.familia.banner);
  return embed;
}

function painelBotoes() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('register_open') // não mude: o roteador usa este ID
      .setLabel('Pedir Set')
      .setEmoji('🎖️')
      .setStyle(ButtonStyle.Primary)
  );
}

// Embed enviado ao canal da liderança com as respostas
function registroEmbed(user, answers) {
  return new EmbedBuilder()
    .setColor(config.cores.pendente)
    .setTitle('🎖️ Novo pedido de set')
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setDescription(`**Membro:** ${user} (\`${user.username}\`)\n**ID Discord:** \`${user.id}\``)
    .addFields(
      answers.map((a) => ({
        name: a.label.slice(0, 256),
        value: a.value.slice(0, 1024),
      }))
    )
    .setFooter({ text: '⏳ Aguardando conferência' })
    .setTimestamp();
}

// Botões Aprovar / Recusar
function botoesAnalise() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('review_accept').setLabel('Liberar Set').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('review_reject').setLabel('Recusar').setEmoji('❌').setStyle(ButtonStyle.Danger)
  );
}

module.exports = { painelEmbed, painelBotoes, registroEmbed, botoesAnalise };