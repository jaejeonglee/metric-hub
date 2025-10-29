import AppError from "../class/AppError.js";
import { sanitizeUserId } from "../utils/userId.js";

export default async function adminRoute(fastify, options) {
  const { config } = options;

  /*
   * Admin Login
   */
  fastify.post("/login", {}, async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      throw new AppError(
        "username and password are required",
        400,
        "VALIDATION_ERROR"
      );
    }

    if (
      username !== config.admin.username ||
      password !== config.admin.password
    ) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    // payload
    const payload = {
      sub: 1,
      role: "admin",
      username: config.admin.username,
    };

    // generate token
    const token = fastify.jwt.sign(payload, { expiresIn: "1h" });

    reply.success({ token: token });
  });

  /*
   * Delete User and Dashboard
   */
  fastify.delete("/user/:userId", {
    preHandler: [fastify.auth.verifyAdmin],
    handler: async (request, reply) => {
      const rawUserId = request.params.userId ?? request.params.userName;
      const userId = sanitizeUserId(rawUserId);

      if (!userId) {
        throw new AppError("Invalid userId format", 400, "VALIDATION_ERROR");
      }

      const adminUser = request.user;
      fastify.log.info(
        `Admin request (by ${adminUser.username}) received to delete user: ${userId}`
      );

      try {
        await fastify.grafana.deleteUserAndDashboard(userId);
        await fastify.prometheus.removeTarget(userId);

        return reply.success(
          {
            message: `User '${userId}' deleted.`,
          },
          200
        );
      } catch (error) {
        throw error;
      }
    },
  });
}
