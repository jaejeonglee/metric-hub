import registerRoute from "./register.js";
import adminRoute from "./admin.js";

/**
 * Main router plugin
 */
export default async function routes(fastify, options) {
  // Inject config from app.js
  const { config } = options;

  fastify.register(registerRoute, { prefix: "/user" });
  fastify.register(adminRoute, {
    prefix: "/admin",
    config: config,
  });
}
