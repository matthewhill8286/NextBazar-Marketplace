import { DELETE } from "@/app/api/notifications/delete/route";
import { resourceFromNext } from "~/compat/resource";

const resource = resourceFromNext({ DELETE });
export const loader = resource.loader;
export const action = resource.action;
