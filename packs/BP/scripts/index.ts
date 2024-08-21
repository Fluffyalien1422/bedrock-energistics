import { init as beCoreInit } from "bedrock-energistics-core-api";
import "./custom_components";
import "./persistent_machine_entities";
import "./register_machines";
import "./tutorial_book";

beCoreInit({ namespace: "fluffyalien_energistics" });
