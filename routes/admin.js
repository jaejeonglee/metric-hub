import AppError from "../class/AppError.js";
import { sanitizeUserName } from "../utils/userName.js";

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
  fastify.delete("/user/:userName", {
    preHandler: [fastify.auth.verifyAdmin],
    handler: async (request, reply) => {
      const rawUserName = request.params.userName;
      const userName = sanitizeUserName(rawUserName);

      if (!userName) {
        throw new AppError(
          "userName URL parameter is required",
          400,
          "VALIDATION_ERROR"
        );
      }

      const adminUser = request.user;
      fastify.log.info(
        `Admin request (by ${adminUser.username}) received to delete user: ${userName}`
      );

      try {
        await fastify.grafana.deleteUserAndDashboard(userName);
        await fastify.prometheus.removeTarget(userName);

        return reply.success(
          {
            message: `User '${userName}' deleted.`,
          },
          200
        );
      } catch (error) {
        throw error;
      }
    },
  });
}
