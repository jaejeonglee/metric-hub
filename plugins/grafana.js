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
    deleteUserAndDashboard,
  });

  const grafanaApi = axios.create({
    baseURL: config.grafana.baseUrl,
    auth: {
      username: config.grafana.adminUser,
      password: config.grafana.adminPass,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });

  /*
   * Create grafana user
   */
  async function createUser(userId, ip, password) {
    try {
      const userResponse = await grafanaApi.post("/api/admin/users", {
        name: ip,
        email: `${userId}@host.local`,
        login: `${userId}`,
        password: password,
        OrgId: 1,
      });
      return userResponse.data.id;
    } catch (err) {
      if (err.response && err.response.status === 412) {
        fastify.log.warn(`User ${userId} already exists. Updating profile...`);
        const usersResponse = await grafanaApi.get(
          `/api/users/lookup?loginOrEmail=${userId}`
        );
        const existingUserId = usersResponse.data.id;

        await grafanaApi.put(`/api/users/${existingUserId}`, {
          name: ip,
          email: `${userId}@host.local`,
        });

        return existingUserId;
      }
      throw err;
    }
  }

  /*
   * Create grafana dashboard from template
   */
  async function createDashboard(userId, ip, instanceIdentifier) {
    let templateString = await readFile(config.grafana.templatePath, "utf-8");

    templateString = templateString
      .replace(/"\$instance"/g, `"${instanceIdentifier}"`)
      .replace(/"\$job"/g, `"node_exporter_targets"`);

    const dashboardJson = JSON.parse(templateString);
    const dashboardUid = `host-overview-${userId.replace(
      /[^a-zA-Z0-9-]/g,
      "-"
    )}`;

    dashboardJson.title = `${ip} Dashboard`;
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

  /*
   * Delete user and dashboard
   */
  async function deleteUserAndDashboard(userId) {
    const grafanaLogin = userId;
    const dashboardUid = `host-overview-${userId.replace(
      /[^a-zA-Z0-9-]/g,
      "-"
    )}`;

    try {
      fastify.log.info(`Finding user ID for ${grafanaLogin}...`);
      const userLookup = await grafanaApi.get(
        `/api/users/lookup?loginOrEmail=${grafanaLogin}`
      );
      const grafanaUserId = userLookup.data.id;

      fastify.log.info(`Deleting Grafana user ID: ${grafanaUserId}`);
      await grafanaApi.delete(`/api/admin/users/${grafanaUserId}`);

      fastify.log.info(`Deleting Grafana dashboard UID: ${dashboardUid}`);
      await grafanaApi.delete(`/api/dashboards/uid/${dashboardUid}`);

      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        fastify.log.warn(
          `User or Dashboard for ${userId} not found in Grafana. Already deleted?`
        );
        return true;
      }
      throw error;
    }
  }
}

export default fp(grafanaPlugin);
