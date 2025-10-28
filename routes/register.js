import { randomBytes } from "crypto";
import AppError from "../class/AppError.js";

export default async function registerRoute(fastify, options) {
  const generatePassword = () => randomBytes(8).toString("hex");

  fastify.post("/register-node", {
    preHandler: [fastify.auth.verifyApiKey],
    handler: async (request, reply) => {
      const { hostname, ip, port = 9100 } = request.body;

      if (!hostname || !ip) {
        throw new AppError(
          "hostname and ip are required",
          400,
          "VALIDATION_ERROR"
        );
      }

      try {
        const instanceIdentifier = `${hostname}:${port}`;
        const newPassword = generatePassword();

        await fastify.prometheus.addTarget(hostname, ip, port);

        const newUserId = await fastify.grafana.createUser(
          hostname,
          newPassword
        );
        const dash = await fastify.grafana.createDashboard(
          hostname,
          instanceIdentifier
        );
        await fastify.grafana.setDashboardPermissions(dash.uid, newUserId);

        reply.status(201).send({
          success: true,
          message: `${hostname} registered successfully.`,
          dashboardUrl: dash.url,
          username: `user-${hostname}`,
          password: newPassword,
        });
      } catch (error) {
        throw error;
      }
    },
  });
}
