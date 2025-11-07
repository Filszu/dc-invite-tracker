// npx ts-node src/index.ts
import { Client, GatewayIntentBits, Events } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.toLowerCase();

  // !verify
  if (content === "!verify") {
    const roleName = process.env.VERIFIED_ROLE_NAME;
    const role = message.guild.roles.cache.find((r) => r.name === roleName);

    if (!role) {
      return message.reply("Verified role not found.");
    }

    const member = await message.guild.members.fetch(message.author.id);
    await member.roles.add(role);
    return message.reply("You have been verified!");
  }

  // !free
  if (content === "!free") {
    const invites = await message.guild.invites.fetch();
    const userInvites = invites.filter(
      (inv) => inv.inviter?.id === message.author.id
    );
    let totalInvites = 0;
    userInvites.forEach((inv) => (totalInvites += inv.uses ?? 0));

    const member = await message.guild.members.fetch(message.author.id);
    const hasLvl1 = member.roles.cache.some(
      (role) => role.name === "free_access_LVL1"
    );
    const hasLvl2 = member.roles.cache.some(
      (role) => role.name === "free_access_LVL2"
    );

    totalInvites += 3; // TEMP
    if (totalInvites >= 7 && !hasLvl2) {
      const lvl2Role = message.guild.roles.cache.find(
        (r) => r.name === "free_access_LVL2"
      );
      if (lvl2Role) {
        await member.roles.add(lvl2Role);
      }

      try {
        const response = await fetch(
          `${process.env.WEB_URL}/api/code?level=2&unused=true&apiKey=${process.env.API_AUTHCODE}`
        );

        const data = await response.json();
        return message.reply(
          `🎉 Otrzymujesz dostęp LVL2! Kod: ${data.access_code}`
        );
      } catch (error) {
        return message.reply("Błąd przy pobieraniu kodu LVL2.");
      }
    }

    if (totalInvites >= 2 && !hasLvl1) {
      const lvl1Role = message.guild.roles.cache.find(
        (r) => r.name === "free_access_LVL1"
      );
      if (lvl1Role) {
        await member.roles.add(lvl1Role);
      }

      try {
        const response = await fetch(
          `${process.env.WEB_URL}/api/code?level=1&unused=true&apiKey=${process.env.API_AUTHCODE}`
        );

        const data = await response.json();
        return message.reply(`✅ Masz dostęp LVL1! Kod: ${data.access_code}`);
      } catch (error) {
        return message.reply("Błąd przy pobieraniu kodu LVL1.");
      }
    }

    if (hasLvl1 && !hasLvl2 && totalInvites < 7) {
      const remaining = 7 - totalInvites;
      return message.reply(
        `🕒 Odebrałeś już dostęp LVL1.\nBrakuje Ci jeszcze ${remaining} zaproszeń do LVL2.`
      );
    }

    if (hasLvl2) {
      return message.reply("✅ Odebrałeś już pełny dostęp (LVL2).");
    }

    return message.reply(
      `❌ Masz za mało zaproszeń. Zaprosiłeś ${totalInvites}, potrzeba minimum 3.`
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
