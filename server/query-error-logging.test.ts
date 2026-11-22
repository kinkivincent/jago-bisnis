import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { logQueryError } from "../client/src/lib/query-error-logging";

describe("query error logging", () => {
  it("does not log an Analytics query error marked as handled", async () => {
    const client = new QueryClient();
    const logger = vi.fn();
    client.getQueryCache().subscribe(event => {
      if (event.type === "updated" && event.action.type === "error") {
        logQueryError(event.query.meta, event.query.state.error, logger);
      }
    });

    await expect(client.fetchQuery({
      queryKey: ["analytics", "overview"],
      queryFn: async () => { throw new Error("empty analytics is handled by its empty state"); },
      retry: false,
      meta: { suppressConsoleError: true },
    })).rejects.toThrow("empty analytics is handled by its empty state");
    expect(logger).not.toHaveBeenCalled();
    client.clear();
  });

  it("continues logging unhandled query errors", () => {
    const logger = vi.fn();
    const error = new Error("unhandled query");
    logQueryError(undefined, error, logger);
    expect(logger).toHaveBeenCalledWith("[API Query Error]", error);
  });
});
