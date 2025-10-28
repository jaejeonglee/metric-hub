import registerRoute from "./register.js";

/**
 * Main router plugin
 */
export default async function routes(fastify, options) {
  fastify.register(registerRoute, { prefix: "/user" });
}
