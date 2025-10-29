import fp from "fastify-plugin";
import { readFile, writeFile } from "fs/promises";

async function prometheusPlugin(fastify, options) {
  const { config } = options;
  const targetsFilePath = config.prometheus.targetsFile;

  /*
   * Decorate "prometheus"
   */
  fastify.decorate("prometheus", {
    doesTargetExist,
    addTarget,
    removeTarget,
  });

  async function loadTargets() {
    try {
      const targetsFile = await readFile(targetsFilePath, "utf-8");
      return JSON.parse(targetsFile);
    } catch (error) {
      if (error.code !== "ENOENT") {
        fastify.log.warn(
          `Could not read ${targetsFilePath}, starting new list. (${error.message})`
        );
      }
      return [];
    }
  }

  async function persistTargets(targetsJson) {
    await writeFile(targetsFilePath, JSON.stringify(targetsJson, null, 2));
  }

  /*
   * Check if target already exists
   */
  async function doesTargetExist(userId) {
    const targetsJson = await loadTargets();
    return targetsJson.some((target) => target.labels?.userId === userId);
  }

  /*
   * Add or update target in Prometheus targets file
   */
  async function addTarget(userId, ip, port) {
    const targetsJson = await loadTargets();
    const targetAddress = `${ip}:${port}`;

    const existingIndex = targetsJson.findIndex(
      (target) => target.labels?.userId === userId
    );

    if (existingIndex === -1) {
      targetsJson.push({
        targets: [targetAddress],
        labels: { hostname: ip, userId },
      });
      await persistTargets(targetsJson);
      fastify.log.info(`Added ${userId} to Prometheus targets.`);
      return "created";
    }

    const existingTarget = targetsJson[existingIndex];
    const existingTargets = existingTarget.targets || [];
    const alreadySameTarget = existingTargets[0] === targetAddress;
    const alreadySameAlias = existingTarget.labels?.hostname === ip;

    if (alreadySameTarget && alreadySameAlias) {
      fastify.log.info(
        `${userId} already registered in Prometheus with same target.`
      );
      return "unchanged";
    }

    targetsJson[existingIndex] = {
      ...existingTarget,
      targets: [targetAddress],
      labels: { ...(existingTarget.labels || {}), hostname: ip, userId },
    };
    await persistTargets(targetsJson);
    fastify.log.info(
      `Updated Prometheus target for ${userId} to ${targetAddress}.`
    );
    return "updated";
  }

  /*
   * Remove target from Prometheus targets file
   */
  async function removeTarget(userId) {
    const targetsJson = await loadTargets();

    const newTargetsJson = targetsJson.filter(
      (target) => target.labels?.userId !== userId
    );

    if (newTargetsJson.length === targetsJson.length) {
      fastify.log.warn(`Target ${userId} not found in Prometheus. Skipping.`);
      return;
    }

    await persistTargets(newTargetsJson);
    fastify.log.info(`Removed ${userId} from Prometheus targets.`);
  }
}

export default fp(prometheusPlugin);
