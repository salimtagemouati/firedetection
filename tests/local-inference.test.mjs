import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { localInference } from "../server/local-inference.ts";

test("local gateway rejects foreign origins and uses the server credential", async t => {
  let handler;
  localInference().configureServer({ middlewares: { use(_, fn) { handler = fn; } } });
  const previous = process.env.ROBOFLOW_API_KEY;
  process.env.ROBOFLOW_API_KEY = "fixture";
  t.after(() => { if (previous === undefined) delete process.env.ROBOFLOW_API_KEY; else process.env.ROBOFLOW_API_KEY = previous; });
  const upstream = t.mock.method(globalThis, "fetch", async () => Response.json({ predictions: [] }));
  async function request(origin) {
    const req = Object.assign(Readable.from([Buffer.from("fixture")]), { method: "POST",
      headers: { host: "127.0.0.1:8080", origin }, socket: { remoteAddress: "127.0.0.1" } });
    const res = {setHeader() {}, end(body) { this.body = body; }};
    await handler(req, res);
    return res;
  }
  assert.equal((await request("https://other.invalid")).statusCode, 403);
  assert.equal(upstream.mock.callCount(), 0);
  assert.equal((await request("http://127.0.0.1:8080")).statusCode, 200);
  assert.equal(upstream.mock.callCount(), 1);
});
