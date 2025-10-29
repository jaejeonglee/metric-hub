import fp from "fastify-plugin";
import AppError from "../class/AppError.js";

async function authPlugin(fastify, options) {
  const { config } = options;

  // 1. API Key
  const verifyApiKey = async (request, reply) => {
    const authHeader = request.headers.authorization;
    const expectedKey = `Bearer ${config.hubApiSecretKey}`;

    if (!authHeader || authHeader !== expectedKey) {
      throw new AppError(
        "Unauthorized Hub API access (Invalid API Key)",
        401,
        "UNAUTHORIZED"
      );
    }
  };

  // 2. Admin JWT
  const verifyAdmin = async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw new AppError(
        "Unauthorized access (Invalid JWT Token)",
        401,
        "UNAUTHORIZED"
      );
    }

    if (!request.user || request.user.role !== "admin") {
      throw new AppError(
        "Forbidden access (Admin role required)",
        403,
        "FORBIDDEN"
      );
    }
  };

  fastify.decorate("auth", {
    verifyApiKey,
    verifyAdmin,
  });
}

export default fp(authPlugin);
