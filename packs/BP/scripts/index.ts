import { init as becInit } from "bedrock-energistics-core-api";
import "./custom_components";
import "./persistent_machine_entities";
import "./register_machines";
import "./tutorial_book";

becInit("fluffyalien_energistics");

//TODO: make fluid tanks and gas canisters use new I/O system

//TODO: fix storage type container storage bar flashing
//TODO: machine balancing (oil generator is way too OP)
