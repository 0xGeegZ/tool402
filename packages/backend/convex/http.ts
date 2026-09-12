import { httpActionGeneric, httpRouter } from "convex/server";
import {
  handleActiveDirectory,
  handleCommandIngress,
  handleOfferingProjection,
} from "./command_dispatch.ts";
import { handleProviderSessionIngress } from "./provider_session_ingress.ts";

const http = httpRouter();

http.route({
  path: "/internal/commands",
  method: "POST",
  handler: httpActionGeneric(handleCommandIngress),
});
http.route({
  path: "/internal/provider-tools",
  method: "POST",
  handler: httpActionGeneric(handleProviderSessionIngress),
});
http.route({
  pathPrefix: "/public/directory/",
  method: "GET",
  handler: httpActionGeneric(handleActiveDirectory),
});
http.route({
  pathPrefix: "/public/offerings/",
  method: "GET",
  handler: httpActionGeneric(handleOfferingProjection),
});

export default http;
