import { randomBytes } from "crypto";
import { isIP } from "net";
import AppError from "../class/AppError.js";
import { sanitizeUserId } from "../utils/userId.js";

export default async function registerRoute(fastify, options) {
  const generatePassword = () => randomBytes(8).toString("hex");

  fastify.post("/register-node", {
    preHandler: [fastify.auth.verifyApiKey],
    handler: async (request, reply) => {
      const { ip, port = 9100, userId: requestUserId } = request.body;

      const rawUserId = requestUserId;
      const userId = sanitizeUserId(rawUserId);

      if (!userId) {
        throw new AppError("Invalid userId format", 400, "VALIDATION_ERROR");
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
        const isExist = await fastify.prometheus.doesTargetExist(userId);
        if (isExist) {
          throw new AppError(
            `User ID ${userId} is already registered`,
            409,
            "CONFLICT"
          );
        }

        const instanceIdentifier = `${ip}:${portNumber}`;
        const newPassword = generatePassword();

        const targetStatus = await fastify.prometheus.addTarget(
          userId,
          ip,
          portNumber
        );

        const newUserId = await fastify.grafana.createUser(
          userId,
          ip,
          newPassword
        );

        const dash = await fastify.grafana.createDashboard(
          userId,
          ip,
          instanceIdentifier
        );
        await fastify.grafana.setDashboardPermissions(dash.uid, newUserId);

        reply.success(
          {
            message: `${userId} registered successfully.`,
            dashboardUrl: dash.url,
            userId: userId,
            grafanaAlias: ip,
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
