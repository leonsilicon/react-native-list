export type ExampleId =
  | "update-lab"
  | "dynamic-text"
  | "dynamic-text-push-stress"
  | "chat-benchmark"
  | "legend-list-chat-benchmark";

export type ExampleCase = {
  id: ExampleId;
  title: string;
  description: string;
};
