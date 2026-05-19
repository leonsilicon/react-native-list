import React, { useState } from "react";
import { ExamplePicker } from "./ExamplePicker";
import { DynamicTextHeightsExample } from "./examples/DynamicTextHeightsExample";
import { ListUpdateLabExample } from "./examples/ListUpdateLabExample";
import type { ExampleId } from "./types";

export function ExamplesApp() {
  const [selectedExampleId, setSelectedExampleId] = useState<ExampleId | null>(
    null,
  );

  function clearSelectedExample() {
    setSelectedExampleId(null);
  }

  if (selectedExampleId === "update-lab") {
    return <ListUpdateLabExample onBack={clearSelectedExample} />;
  }

  if (selectedExampleId === "dynamic-text") {
    return <DynamicTextHeightsExample onBack={clearSelectedExample} />;
  }

  return <ExamplePicker onSelectExample={setSelectedExampleId} />;
}
