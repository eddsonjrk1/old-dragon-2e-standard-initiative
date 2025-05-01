const INITIATIVE_SUCCESS = 99;
const INITIATIVE_FAILURE = 33;
const INITIATIVE_NPC = 66;
const INITIATIVE_INVALID = 21;

function calculateInitiative(actor, rolled) {
  const dex = Number(actor.system.destreza) || 0;
  const wis = Number(actor.system.sabedoria) || 0;
  const bestAttribute = Math.max(dex, wis);

  if (dex === 0 || wis === 0) {
    ui.notifications.warn(`Atributos inválidos para o personagem "${actor.name}". Verifique Destreza e Sabedoria.`);
    return { initiative: INITIATIVE_INVALID, success: false, bestAttribute };
  }

  const success = rolled <= bestAttribute;
  const initiative = success ? INITIATIVE_SUCCESS : INITIATIVE_FAILURE;

  return { initiative, success, bestAttribute };
}

function buildInitiativeReport(successes, failures, npcs, combatantsWithoutInitiative) {
  let report = `<h2>Teste de Iniciativa</h2>`;
  if (combatantsWithoutInitiative.length > 0) {
    report += `<p><i>Rolado automaticamente para combatentes sem iniciativa.</i></p>`;
  }

  report += `
    <table style="width:100%; border-collapse: collapse;">
      <tr>
        <th style="text-align:left; padding: 3px;">Combatente</th>
        <th style="text-align:center; padding: 3px;">Rolagem</th>
        <th style="text-align:center; padding: 3px;">Alvo</th>
        <th style="text-align:center; padding: 3px;">Resultado</th>
      </tr>`;

  for (const s of successes) {
    report += `
      <tr>
        <td style="padding: 3px;">${s.name}</td>
        <td style="text-align:center; padding: 3px;">${s.rolled}</td>
        <td style="text-align:center; padding: 3px;">${s.bestAttribute}</td>
        <td style="text-align:center; padding: 3px;">✅ Success</td>
      </tr>`;
  }

  for (const n of npcs) {
    report += `
      <tr>
        <td style="padding: 3px;">${n.name}</td>
        <td style="text-align:center; padding: 3px;">—</td>
        <td style="text-align:center; padding: 3px;">—</td>
        <td style="text-align:center; padding: 3px;">👾 NPC</td>
      </tr>`;
  }

  for (const f of failures) {
    report += `
      <tr>
        <td style="padding: 3px;">${f.name}</td>
        <td style="text-align:center; padding: 3px;">${f.rolled}</td>
        <td style="text-align:center; padding: 3px;">${f.bestAttribute}</td>
        <td style="text-align:center; padding: 3px;">❌ Failure</td>
      </tr>`;
  }

  report += `</table>`;
  return report;
}

Hooks.on("ready", () => {
  if (game.system.id !== "olddragon2e") return;

  console.log("Initiative Override | Sistema Old Dragon 2e detectado.");

  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 0,
  };

  Hooks.on("preUpdateCombat", async (combat, update, options, userId) => {
    const currentRound = combat.round;
    const newRound = foundry.utils.getProperty(update, "round");
    if (newRound !== 1 || currentRound >= 1) return;

    const combatantsWithoutInitiative = combat.combatants.contents.filter(c => c.initiative === null);

    if (combat.getFlag("world", "initiativeProcessed") && combatantsWithoutInitiative.length === 0) {
      return;
    }

    if (combatantsWithoutInitiative.length > 0) {
      ui.notifications.info("Combatentes sem iniciativa detectados. Rolando automaticamente.");

      for (const c of combatantsWithoutInitiative) {
        const roll = await new Roll("1d20").roll();
        await combat.setInitiative(c.id, roll.total);
      }
    }

    const successes = [];
    const failures = [];
    const npcs = [];

    const promises = combat.combatants.contents.map(async (combatant) => {
      const actor = combatant.actor;
      if (!actor) return;

      if (actor.type !== "character") {
        await combat.setInitiative(combatant.id, INITIATIVE_NPC);

        npcs.push({
          name: actor.name
        });

        return;
      }

      const rolled = combatant.initiative ?? 0;
      const { initiative, success, bestAttribute } = calculateInitiative(actor, rolled);

      await combat.setInitiative(combatant.id, initiative);
      await combatant.setFlag("world", "old-dragon-2e-standard-initiative", {
        success,
        value: rolled,
        attribute: bestAttribute
      });

      const entry = {
        name: actor.name,
        rolled,
        bestAttribute,
        success
      };

      if (success) {
        successes.push(entry);
      } else {
        failures.push(entry);
      }
    });

    await Promise.all(promises);
    await combat.setupTurns();

    await combat.setFlag("world", "initiativeProcessed", true);

    const initiativeReport = buildInitiativeReport(successes, failures, npcs, combatantsWithoutInitiative);

    await ChatMessage.create({
      user: game.user.id,
      speaker: { alias: "System" },
      content: initiativeReport,
      type: CONST.CHAT_MESSAGE_STYLES.OTHER
    });
  });

  Hooks.on("createCombatant", async (combatant, options, userId) => {
    const combat = combatant.combat;
    if (!combat || combat.round < 1) return;

    const actor = combatant.actor;
    if (!actor || combatant.initiative !== null) return;

    const roll = await new Roll("1d20").roll();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }) });

    if (actor.type !== "character") {
      await combat.setInitiative(combatant.id, INITIATIVE_NPC);
      return;
    }

    const { initiative } = calculateInitiative(actor, roll.total);
    await combat.setInitiative(combatant.id, initiative);
    await combat.setupTurns();
  });

  Hooks.on("updateCombat", async (combat, update, options, userId) => {
    if (update?.combatants) {
      const initiativeReset = update.combatants.some(c => c.hasOwnProperty("initiative") && c.initiative === null);
      if (initiativeReset) {
        await combat.unsetFlag("world", "initiativeProcessed");
        console.log("Initiative Override | Flag 'initiativeProcessed' removida devido ao reset de iniciativas.");
      }
    }
  });
});
