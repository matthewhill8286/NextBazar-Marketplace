import { POST } from "@/app/api/embeddings/sync/route";
import { resourceFromNext } from "~/compat/resource";

const resource = resourceFromNext({ POST });
export const loader = resource.loader;
export const action = resource.action;
