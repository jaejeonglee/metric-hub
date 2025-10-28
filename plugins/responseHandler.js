import fp from "fastify-plugin";
import AppError from "../class/AppError.js";

/**
 * Response Handler Plugin
 */
async function responseHandlerPlugin(fastify, options) {
  /*
   *  success
   */
  fastify.decorateReply("success", function (data, statusCode = 200) {
    this.status(statusCode).send({
      success: true,
      data: data,
    });
  });

  /*
   * fail
   */
  fastify.decorateReply("fail", function (errorData, statusCode = 400) {
    this.status(statusCode).send({
      success: false,
      error: errorData,
    });
  });

  /*
   * 404 Not Found Handler
   */
  fastify.setNotFoundHandler(async (request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${request.method}:${request.url} not found`,
      },
    });
  });

  /*
   * Global Error Handler
   */
  fastify.setErrorHandler(async (error, request, reply) => {
    if (error instanceof AppError) {
      fastify.log.warn(
        error,
        `Operational Error (${error.statusCode}): ${error.message}`
      );

      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.errorCode,
          message: error.message,
        },
      });
    }

    console.error(error);

    reply.status(500).send({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred on the server.",
      },
    });
  });
}

export default fp(responseHandlerPlugin);
