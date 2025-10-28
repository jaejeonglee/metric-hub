import fp from "fastify-plugin";
import axios from "axios";
import { readFile } from "fs/promises";

async function grafanaPlugin(fastify, options) {
  const { config } = options;

  /*
   * Decorate "grafana"
   */
  fastify.decorate("grafana", {
    createUser,
    createDashboard,
    setDashboardPermissions,
  });

  const grafanaApi = axios.create({
    baseURL: config.grafana.baseUrl,
    headers: {
      Authorization: `Bearer ${config.grafana.apiKey}`,
      "Content-Type": "application/json",
    },
  });

  /*
   * Create grafana user
   */
  async function createUser(hostname, password) {
    try {
      const userResponse = await grafanaApi.post("/api/admin/users", {
        name: `user-${hostname}`,
        email: `user-${hostname}@host.local`,
        login: `user-${hostname}`,
        password: password,
        OrgId: 1,
      });
      return userResponse.data.id;
    } catch (err) {
      if (err.response && err.response.status === 412) {
        fastify.log.warn(`User user-${hostname} already exists. Finding ID...`);
        const usersResponse = await grafanaApi.get(
          `/api/users/lookup?loginOrEmail=user-${hostname}`
        );
        return usersResponse.data.id;
      }
      throw err;
    }
  }

  /*
   * Create grafana dashboard from template
   */
  async function createDashboard(hostname, instanceIdentifier) {
    let templateString = await readFile(config.grafana.templatePath, "utf-8");

    templateString = templateString
      .replace(/"\$instance"/g, `"${instanceIdentifier}"`)
      .replace(/"\$job"/g, `"node_exporter_targets"`);

    const dashboardJson = JSON.parse(templateString);
    const dashboardUid = `host-overview-${hostname.replace(
      /[^a-zA-Z0-9-]/g,
      "-"
    )}`;

    dashboardJson.title = `${hostname} Node Overview`;
    dashboardJson.uid = dashboardUid;

    const dashResponse = await grafanaApi.post("/api/dashboards/db", {
      dashboard: dashboardJson,
      folderId: 0,
      overwrite: true,
    });

    return {
      uid: dashResponse.data.uid,
      url: `${config.publicUrls.dashboard}${dashResponse.data.url}`,
    };
  }

  /*
   * Set dashboard permissions for user
   */
  async function setDashboardPermissions(dashboardUid, userId) {
    return grafanaApi.post(`/api/dashboards/uid/${dashboardUid}/permissions`, {
      items: [{ userId: userId, permission: 1 }], // 1 = View
    });
  }
}

export default fp(grafanaPlugin);
