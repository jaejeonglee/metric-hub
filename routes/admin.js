import AppError from "../class/AppError.js";

export default async function adminRoute(fastify, options) {
  const { config } = options;

  /*
   * Admin Login
   */
  fastify.post("/login", {}, async (request, reply) => {
    const { username, password } = request.body;

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
      const { userName } = request.params;

      const adminUser = request.user;
      fastify.log.info(
        `Admin request (by ${adminUser.username}) received to delete user: ${userName}`
      );

      if (!userName) {
        throw new AppError(
          "userName URL parameter is required",
          400,
          "VALIDATION_ERROR"
        );
      }

      try {
        await fastify.grafana.deleteUserAndDashboard(userName);
        await fastify.prometheus.removeTarget(userName);

        return reply.success({
          message: `User '${userName}' deleted.`,
        });
      } catch (error) {
        throw error;
      }
    },
  });
}
