import { init as beCoreInit } from "@/becore_api";
import "./custom_components";
import "./persistent_machine_entities";
import "./register_machines";

beCoreInit({ namespace: "fluffyalien_energistics" });
