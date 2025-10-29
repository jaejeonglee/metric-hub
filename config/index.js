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

if (
  !config.hubApiSecretKey ||
  !config.grafana.adminUser ||
  !config.grafana.adminPass
) {
  console.error(
    "CRITICAL ERROR: Missing required config values (KEY, GRAFANA_ADMIN_USER or PASS)."
  );
  process.exit(1);
}

export default Object.freeze(config);
