import { init as beCoreInit } from "@/becore_api";
import "./custom_components";
import "./persistent_machine_entities";
import "./register_machines";
import "./tutorial_book";

beCoreInit({ namespace: "fluffyalien_energistics" });
