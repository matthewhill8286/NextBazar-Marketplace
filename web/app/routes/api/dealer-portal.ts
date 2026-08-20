import { POST } from "@/app/api/dealer/portal/route";
import { resourceFromNext } from "~/compat/resource";

const resource = resourceFromNext({ POST });
export const loader = resource.loader;
export const action = resource.action;
