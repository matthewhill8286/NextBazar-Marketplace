import { GET } from "@/app/api/pricing/route";
import { resourceFromNext } from "~/compat/resource";

const resource = resourceFromNext({ GET });
export const loader = resource.loader;
export const action = resource.action;
