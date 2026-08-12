import { UiProgressIndicatorDescription } from "bedrock-energistics-core-api";

const createIconDescription = (
  id: string,
  ...states: string[]
): UiProgressIndicatorDescription => ({
  frames: states.map((state) => `${id}_${state}`),
});

export enum WorkingIconState {
  Off,
  On,
}
export const WORKING_ICON_DESCRIPTION = createIconDescription(
  "fluffyalien_energistics:ui_working_icon",
  "off",
  "on",
);
