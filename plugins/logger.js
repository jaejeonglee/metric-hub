import fp from "fastify-plugin";

/*
 * Logging Plugin
 */
async function loggingPlugin(fastify, options) {
  fastify.addHook("onResponse", async (request, reply) => {
    const responseTime = Math.round(reply.elapsedTime);

    console.log(
      `${request.method} ${request.url} [${request.ip}] - ${reply.statusCode} (${responseTime}ms)`
    );
  });
}

export default fp(loggingPlugin);
