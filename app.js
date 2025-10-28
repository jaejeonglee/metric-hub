import Fastify from "fastify";
import config from "./config/index.js";
import authPlugin from "./plugins/auth.js";
import grafanaPlugin from "./plugins/grafana.js";
import prometheusPlugin from "./plugins/prometheus.js";
import responseHandlerPlugin from "./plugins/responseHandler.js";
import loggerPlugin from "./plugins/logger.js";
import mainRouter from "./routes/index.js";

// Setup instance (Fastify)
const app = Fastify({
  logger: false,
  trustProxy: true,
});

// Plugin injection
app.register(responseHandlerPlugin);
app.register(loggerPlugin);
app.register(authPlugin, { config });
app.register(grafanaPlugin, { config });
app.register(prometheusPlugin, { config });
app.register(mainRouter, { prefix: "/api" });

const start = async () => {
  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
