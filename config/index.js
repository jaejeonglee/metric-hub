import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// __dirname on ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  // Server Port
  port: process.env.PORT || 3002,

  // API Key
  hubApiSecretKey: process.env.HUB_API_SECRET_KEY,

  // JWT Settings
  jwt: {
    secret: process.env.JWT_SECRET,
  },

  // Admin Credentials
  admin: {
    username: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASSWORD,
  },

  // Grafana
  grafana: {
    baseUrl: process.env.GRAFANA_BASE_URL,
    templatePath:
      process.env.GRAFANA_TEMPLATE_PATH ||
      path.join(__dirname, "../template.json"),
    adminUser: process.env.GRAFANA_ADMIN_USER,
    adminPass: process.env.GRAFANA_ADMIN_PASS,
  },

  // Prometheus
  prometheus: {
    targetsFile: process.env.PROMETHEUS_TARGETS_FILE,
  },

  // Exposed Public URLs
  publicUrls: {
    dashboard:
      process.env.PUBLIC_DASHBOARD_URL || "https://dashboard.officials.ltd",
  },
};

const requiredConfig = [
  ["HUB_API_SECRET_KEY", config.hubApiSecretKey],
  ["GRAFANA_BASE_URL", config.grafana.baseUrl],
  ["GRAFANA_ADMIN_USER", config.grafana.adminUser],
  ["GRAFANA_ADMIN_PASS", config.grafana.adminPass],
  ["PROMETHEUS_TARGETS_FILE", config.prometheus.targetsFile],
  ["JWT_SECRET", config.jwt.secret],
];

const missingKeys = requiredConfig
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error(
    `CRITICAL ERROR: Missing required config values (${missingKeys.join(", ")}).`
  );
  process.exit(1);
}

export default Object.freeze(config);
