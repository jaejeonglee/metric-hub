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
  async function doesTargetExist(userName) {
    const targetsJson = await loadTargets();
    return targetsJson.some((target) => target.labels?.hostname === userName);
  }

  /*
   * Add or update target in Prometheus targets file
   */
  async function addTarget(userName, ip, port) {
    const targetsJson = await loadTargets();
    const targetAddress = `${ip}:${port}`;

    const existingIndex = targetsJson.findIndex(
      (target) => target.labels?.hostname === userName
    );

    if (existingIndex === -1) {
      targetsJson.push({
        targets: [targetAddress],
        labels: { hostname: userName },
      });
      await persistTargets(targetsJson);
      fastify.log.info(`Added ${userName} to Prometheus targets.`);
      return "created";
    }

    const existingTargets = targetsJson[existingIndex].targets || [];
    if (existingTargets[0] === targetAddress) {
      fastify.log.info(
        `${userName} already registered in Prometheus with same target.`
      );
      return "unchanged";
    }

    targetsJson[existingIndex].targets = [targetAddress];
    await persistTargets(targetsJson);
    fastify.log.info(
      `Updated Prometheus target for ${userName} to ${targetAddress}.`
    );
    return "updated";
  }

  /*
   * Remove target from Prometheus targets file
   */
  async function removeTarget(userName) {
    const targetsJson = await loadTargets();

    const newTargetsJson = targetsJson.filter(
      (target) => target.labels?.hostname !== userName
    );

    if (newTargetsJson.length === targetsJson.length) {
      fastify.log.warn(`Target ${userName} not found in Prometheus. Skipping.`);
      return;
    }

    await persistTargets(newTargetsJson);
    fastify.log.info(`Removed ${userName} from Prometheus targets.`);
  }
}

export default fp(prometheusPlugin);
