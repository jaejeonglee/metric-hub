import { randomBytes } from "crypto";
import { isIP } from "net";
import AppError from "../class/AppError.js";
import { sanitizeUserName } from "../utils/userName.js";

export default async function registerRoute(fastify, options) {
  const generatePassword = () => randomBytes(8).toString("hex");

  fastify.post("/register-node", {
    preHandler: [fastify.auth.verifyApiKey],
    handler: async (request, reply) => {
      const { ip, port = 9100, userName: rawUserName } = request.body;

      const userName = sanitizeUserName(rawUserName);

      if (!userName) {
        throw new AppError("Invalid userName format", 400, "VALIDATION_ERROR");
      }

      if (!ip || !isIP(ip)) {
        throw new AppError("Invalid IP address", 400, "VALIDATION_ERROR");
      }

      const portNumber = Number(port);
      if (
        !Number.isInteger(portNumber) ||
        portNumber <= 0 ||
        portNumber > 65535
      ) {
        throw new AppError("Invalid port", 400, "VALIDATION_ERROR");
      }

      try {
        const instanceIdentifier = `${userName}:${portNumber}`;
        const newPassword = generatePassword();

        const targetStatus = await fastify.prometheus.addTarget(
          userName,
          ip,
          portNumber
        );

        const newUserId = await fastify.grafana.createUser(
          userName,
          ip,
          newPassword
        );
        const dash = await fastify.grafana.createDashboard(
          userName,
          instanceIdentifier
        );
        await fastify.grafana.setDashboardPermissions(dash.uid, newUserId);

        reply.success(
          {
            message: `${userName} registered successfully.`,
            dashboardUrl: dash.url,
            username: userName,
            password: newPassword,
            targetStatus: targetStatus,
          },
          201
        );
      } catch (error) {
        throw error;
      }
    },
  });
}
