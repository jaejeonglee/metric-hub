import { randomBytes } from "crypto";
import AppError from "../class/AppError.js";

export default async function registerRoute(fastify, options) {
  const generatePassword = () => randomBytes(8).toString("hex");

  fastify.post("/register-node", {
    preHandler: [fastify.auth.verifyApiKey],
    handler: async (request, reply) => {
      const { userName, ip, port = 9100 } = request.body;

      if (!userName || !ip) {
        throw new AppError(
          "userName and ip are required",
          400,
          "VALIDATION_ERROR"
        );
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
          newPassword
        );
        const dash = await fastify.grafana.createDashboard(
          userName,
          instanceIdentifier
        );
        await fastify.grafana.setDashboardPermissions(dash.uid, newUserId);

        reply.status(201).send({
          success: true,
          message: `${userName} registered successfully.`,
          dashboardUrl: dash.url,
          username: `${userName}`,
          password: newPassword,
        });
      } catch (error) {
        throw error;
      }
    },
  });
}
