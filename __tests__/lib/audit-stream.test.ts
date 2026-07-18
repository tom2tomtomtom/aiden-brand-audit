import { describe, expect, it } from "vitest";
import {
  AUDIT_CANCELLATION_MESSAGE,
  AuditStreamProtocolError,
  consumeAuditStreamChunk,
  createAuditStreamState,
  finishAuditStream,
  getAuditActivityLabel,
  getAuditStatusMessage,
  readAuditEventStream,
} from "@/lib/audit-stream";

describe("Brand Audit SSE protocol", () => {
  it("buffers a progress event split across network chunks", () => {
    const state = createAuditStreamState();

    expect(consumeAuditStreamChunk(state, 'data: {"type":"progr')).toEqual([]);
    expect(consumeAuditStreamChunk(
      state,
      'ess","step":"Collecting","progress":25}\n\n',
    )).toEqual([
      { type: "progress", step: "Collecting", progress: 25 },
    ]);
  });

  it("parses a CRLF frame delimiter split across network chunks", () => {
    const state = createAuditStreamState();

    expect(consumeAuditStreamChunk(
      state,
      'data: {"type":"progress","step":"Collecting","progress":25}\r',
    )).toEqual([]);
    expect(consumeAuditStreamChunk(state, "\n\r")).toEqual([]);
    expect(consumeAuditStreamChunk(state, "\n")).toEqual([
      { type: "progress", step: "Collecting", progress: 25 },
    ]);
  });

  it("rejects malformed JSON instead of silently dropping the event", () => {
    const state = createAuditStreamState();

    expect(() => consumeAuditStreamChunk(
      state,
      'data: {"type":"progress","step":"Broken"\n\n',
    )).toThrowError(new AuditStreamProtocolError("Audit sent malformed progress data."));
  });

  it("rejects a truncated final event", () => {
    const state = createAuditStreamState();
    consumeAuditStreamChunk(state, 'data: {"type":"complete"');

    expect(() => finishAuditStream(state)).toThrowError(
      new AuditStreamProtocolError("Audit connection closed during an incomplete update."),
    );
  });

  it("rejects a stream that closes without a complete or error event", () => {
    const state = createAuditStreamState();
    consumeAuditStreamChunk(
      state,
      'data: {"type":"progress","step":"Analyzing","progress":80,"indeterminate":true}\n\n',
    );

    expect(() => finishAuditStream(state)).toThrowError(
      new AuditStreamProtocolError("Audit connection closed before completion."),
    );
  });

  it("parses the server's non-cancellable finalization boundary", () => {
    const state = createAuditStreamState();

    expect(consumeAuditStreamChunk(
      state,
      'data: {"type":"progress","step":"Finalizing report and billing","progress":95,"cancellable":false}\n\n',
    )).toEqual([{
      type: "progress",
      step: "Finalizing report and billing",
      progress: 95,
      cancellable: false,
    }]);
  });

  it("does not promise zero charge for a cancellation request that races finalization", () => {
    expect(AUDIT_CANCELLATION_MESSAGE).toContain("before finalization");
    expect(AUDIT_CANCELLATION_MESSAGE).toContain("check Past Reports and your token balance");
    expect(AUDIT_CANCELLATION_MESSAGE).not.toContain("Tokens not charged");
  });

  it("describes save and billing truthfully after the finalization cutoff", () => {
    expect(getAuditActivityLabel(80, false)).toBe("Generating strategic analysis...");
    expect(getAuditActivityLabel(95, true)).toBe("Saving report and completing billing...");
  });

  it("keeps a local cancellation request distinct from server finalization", () => {
    expect(getAuditActivityLabel(50, false)).toBe("Collecting intelligence...");
    expect(getAuditStatusMessage(false, true)).toBe(
      "Cancellation requested. Waiting for the audit to stop.",
    );
    expect(getAuditStatusMessage(false, true)).not.toContain("billing");
    expect(getAuditStatusMessage(true, false)).toBe(
      "Finalization has started. Closing this page will not cancel saving or billing.",
    );
  });

  it("ignores keepalives and accepts a terminal complete event", () => {
    const state = createAuditStreamState();
    const events = consumeAuditStreamChunk(
      state,
      ': keepalive\n\ndata: {"type":"complete","results":{"brands":[],"strategicAnalysis":{},"duration":1,"createdAt":"now"}}\n\n',
    );

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("complete");
    expect(finishAuditStream(state)).toEqual([]);
  });

  it("cancels the live response body when a malformed event is received", async () => {
    let cancelReason: unknown;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(
          'data: {"type":"progress","step":"Broken"\n\n',
        ));
      },
      cancel(reason) {
        cancelReason = reason;
      },
    });

    await expect(readAuditEventStream(stream, () => undefined)).rejects.toThrow(
      "Audit sent malformed progress data.",
    );
    expect(cancelReason).toBeInstanceOf(AuditStreamProtocolError);
  });
});
