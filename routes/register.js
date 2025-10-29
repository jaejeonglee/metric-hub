import { randomBytes } from "crypto";
import AppError from "../class/AppError.js";

export default async function registerRoute(fastify, options) {
  const generatePassword = () => randomBytes(8).toString("hex");

  fastify.post("/register-node", {
    preHandler: [fastify.auth.verifyApiKey],
    handler: async (request, reply) => {
      const { ip, port = 9100 } = request.body;

      const rawUserName = request.body.userName;

      if (!rawUserName || typeof rawUserName !== "string") {
        throw new AppError("userName is required", 400, "VALIDATION_ERROR");
      }

      const userName = rawUserName
        .replace(/\s+/g, "")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .toLowerCase();

      if (!userName) {
        throw new AppError("Invalid userName format", 400, "VALIDATION_ERROR");
      }

      if (await fastify.prometheus.doesTargetExist(userName)) {
        throw new AppError(
          `User ${userName} is already registered.`,
          409,
          "DUPLICATE_USER"
        );
      }

      try {
        const instanceIdentifier = `${userName}:${port}`;
        const newPassword = generatePassword();

        await fastify.prometheus.addTarget(userName, ip, port);

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
          },
          201
        );
      } catch (error) {
        throw error;
      }
    },
  });
}
