import type { ProgressEvent } from "./types";

export const AUDIT_CANCELLATION_MESSAGE =
  "Cancellation requested. Audits cancelled before finalization are not charged. If finalization had already started, check Past Reports and your token balance.";

export function getAuditActivityLabel(progress: number, finalizationStarted: boolean): string {
  if (finalizationStarted) return "Saving report and completing billing...";
  return progress < 75
    ? "Collecting intelligence..."
    : "Generating strategic analysis...";
}

export function getAuditStatusMessage(
  finalizationStarted: boolean,
  cancelRequested: boolean,
): string | null {
  if (finalizationStarted) {
    return "Finalization has started. Closing this page will not cancel saving or billing.";
  }
  if (cancelRequested) return "Cancellation requested. Waiting for the audit to stop.";
  return null;
}

export class AuditStreamProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuditStreamProtocolError";
  }
}

export interface AuditStreamState {
  buffer: string;
  receivedTerminalEvent: boolean;
}

export function createAuditStreamState(): AuditStreamState {
  return { buffer: "", receivedTerminalEvent: false };
}

export function consumeAuditStreamChunk(
  state: AuditStreamState,
  chunk: string,
): ProgressEvent[] {
  state.buffer += chunk;
  const events: ProgressEvent[] = [];

  while (true) {
    const delimiter = /\r?\n\r?\n/.exec(state.buffer);
    if (!delimiter || delimiter.index === undefined) break;

    const frame = state.buffer.slice(0, delimiter.index);
    state.buffer = state.buffer.slice(delimiter.index + delimiter[0].length);

    const data = frame
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;

    let event: unknown;
    try {
      event = JSON.parse(data);
    } catch {
      throw new AuditStreamProtocolError("Audit sent malformed progress data.");
    }
    if (!isProgressEvent(event)) {
      throw new AuditStreamProtocolError("Audit sent malformed progress data.");
    }

    if (event.type === "complete" || event.type === "error") {
      state.receivedTerminalEvent = true;
    }
    events.push(event);
  }

  return events;
}

export function finishAuditStream(state: AuditStreamState): ProgressEvent[] {
  const remainder = state.buffer.trim();
  const isOnlyComment = remainder
    .split(/\r?\n/)
    .filter(Boolean)
    .every((line) => line.startsWith(":"));
  if (remainder && !isOnlyComment) {
    throw new AuditStreamProtocolError("Audit connection closed during an incomplete update.");
  }
  state.buffer = "";

  if (!state.receivedTerminalEvent) {
    throw new AuditStreamProtocolError("Audit connection closed before completion.");
  }
  return [];
}

export async function readAuditEventStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ProgressEvent) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const state = createAuditStreamState();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        const finalChunk = decoder.decode();
        if (finalChunk) {
          consumeAuditStreamChunk(state, finalChunk).forEach(onEvent);
        }
        finishAuditStream(state).forEach(onEvent);
        return;
      }
      consumeAuditStreamChunk(
        state,
        decoder.decode(value, { stream: true }),
      ).forEach(onEvent);
    }
  } catch (error) {
    try {
      await reader.cancel(error);
    } catch {
      // Preserve the protocol/network error that triggered cancellation.
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProgressEvent(value: unknown): value is ProgressEvent {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  if (value.type === "progress") {
    return typeof value.step === "string"
      && typeof value.progress === "number"
      && Number.isFinite(value.progress)
      && value.progress >= 0
      && value.progress <= 100
      && (value.detail === undefined || typeof value.detail === "string")
      && (value.indeterminate === undefined || typeof value.indeterminate === "boolean")
      && (value.cancellable === undefined || typeof value.cancellable === "boolean");
  }
  if (value.type === "complete") return isRecord(value.results);
  if (value.type === "error") return typeof value.message === "string";
  return false;
}
