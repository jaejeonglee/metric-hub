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
  });

  /*
   * Check if target already exists
   */
  async function doesTargetExist(userName) {
    let targetsJson = [];
    try {
      const targetsFile = await readFile(targetsFilePath, "utf-8");
      targetsJson = JSON.parse(targetsFile);
    } catch (readErr) {
      return false;
    }

    return targetsJson.some((target) => target.labels?.hostname === userName);
  }

  /*
   * Add target to Prometheus targets file
   */
  async function addTarget(userName, ip, port) {
    let targetsJson = [];
    try {
      const targetsFile = await readFile(targetsFilePath, "utf-8");
      targetsJson = JSON.parse(targetsFile);
    } catch (readErr) {
      fastify.log.warn(`Could not read ${targetsFilePath}, starting new list.`);
      targetsJson = [];
    }

    const alreadyExists = targetsJson.some(
      (target) => target.labels?.hostname === hostname
    );

    if (!alreadyExists) {
      targetsJson.push({
        targets: [`${ip}:${port}`],
        labels: { hostname: userName },
      });
      await writeFile(targetsFilePath, JSON.stringify(targetsJson, null, 2));
      fastify.log.info(`Added ${hostname} to Prometheus targets.`);
    } else {
      fastify.log.info(`${hostname} already exists in Prometheus. Skipping.`);
    }
  }
}

export default fp(prometheusPlugin);
