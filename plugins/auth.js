import fp from "fastify-plugin";

async function authPlugin(fastify, options) {
  const { config } = options;

  // 1. API Key
  const verifyApiKey = async (request, reply) => {
    const authHeader = request.headers.authorization;
    const expectedKey = `Bearer ${config.hubApiSecretKey}`;

    if (!authHeader || authHeader !== expectedKey) {
      fastify.log.warn("Unauthorized API Key attempt");
      reply.status(401).send({ error: "Unauthorized Hub API access" });
    }
  };

  // 2. Admin Key
  const verifyAdmin = async (request, reply) => {};

  fastify.decorate("auth", {
    verifyApiKey,
    verifyAdmin,
  });
}

export default fp(authPlugin);
