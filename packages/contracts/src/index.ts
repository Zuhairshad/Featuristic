import { Ajv2020 } from "ajv/dist/2020.js";

import featureManifestSchema from "./feature-manifest.schema.json" with { type: "json" };

export interface FeatureManifest {
  schemaVersion: "0.1";
  id: string;
  version: string;
  displayName: string;
  maturity: "experimental" | "supported";
  requires: string[];
  effects: string[];
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateManifest = ajv.compile(featureManifestSchema);

export function validateFeatureManifest(value: unknown): ManifestValidationResult {
  const valid = validateManifest(value);

  return {
    valid,
    errors: valid
      ? []
      : (validateManifest.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`),
  };
}
