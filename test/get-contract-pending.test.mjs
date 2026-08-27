/**
 * get_contract must select response columns by status, matching search_contracts.
 *
 * get_contract accepts status="pending", but the handler always sent the
 * registered column set (DEFAULT_COLUMNS.Contracts). The pending domain uses a
 * different, incompatible token scheme (contract_id, purpose, agency, ... vs
 * prime_contract_id, prime_contract_purpose, ...), and the API rejects an
 * invalid response column with error 1106 — so a pending lookup failed the
 * whole request. search_contracts already selects Contracts_pending for pending;
 * get_contract must do the same.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerTools } from "../dist/tools.js";

async function connect() {
  const server = new McpServer({ name: "nyc-checkbook-mcp", version: "0.0.0" });
  registerTools(server);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return {
    client,
    async close() {
      await client.close();
      await server.close();
    },
  };
}

function stubFetch(handler) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return handler(url, init);
  };
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

const OK = "<response><status><result>success</result></status>" +
  "<result_records><record_count>1</record_count><contracts><transaction>" +
  "<contract_id>DO185820252009241</contract_id></transaction></contracts>" +
  "</result_records></response>";

test("get_contract(status='pending') requests the pending column set, not the registered set", async () => {
  const fetchStub = stubFetch(async () => new Response(OK, { status: 200 }));
  const { client, close } = await connect();
  try {
    const res = await client.callTool({
      name: "get_contract",
      arguments: { contract_id: "DO185820252009241", status: "pending" },
    });
    assert.notEqual(res.isError, true, "a pending lookup should succeed");
    const body = String(fetchStub.calls[0].init.body);
    // Pending-domain tokens must be present...
    assert.match(body, /<column>received_date<\/column>/, "pending column set includes received_date");
    assert.match(body, /<column>contract_id<\/column>/, "pending column set includes contract_id");
    // ...and registered-only tokens must NOT be sent to the pending domain.
    assert.doesNotMatch(body, /<column>prime_contract_id<\/column>/, "must not send registered-only prime_contract_id");
    assert.doesNotMatch(body, /<column>prime_contract_purpose<\/column>/, "must not send registered-only prime_contract_purpose");
  } finally {
    await close();
    fetchStub.restore();
  }
});
