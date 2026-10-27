# Webhook Developer Portal: transport and security evidence

> Status: **research evidence, not approval.** This note does not authorize a Webhook Developer Portal task, ADR,
> implementation, dependency, migration, outbound request, or secret. It is evidence for a *future* approved ADR
> and task only. It chooses no architecture and no egress, signing, retry or retention policy.

- Task: [`docs/tasks/webhook-developer-portal-transport-research.md`](../tasks/webhook-developer-portal-transport-research.md)
- Candidate boundary: [`docs/roadmap/webhook-developer-portal-source.md`](../roadmap/webhook-developer-portal-source.md)
- Retrieved: 2026-10-27, from the pages listed under "Sources". No endpoint was contacted, nothing was tested,
  and no community material was used.

## Sources

Only first-party documentation was consulted. Pages were fetched with `curl` and their text extracted; wording
below is a close paraphrase or a short quotation of that text. The pages are living documents, so re-read them
when an ADR is written.

| Id | Source | Version or date seen | Used for |
| --- | --- | --- | --- |
| N-http | Node.js, [HTTP](https://nodejs.org/api/http.html) | Node.js v26.12.1 docs | client `timeout`/`signal` options, server timeouts, header size, proxy notes |
| N-glob | Node.js, [Globals](https://nodejs.org/api/globals.html) | v26.12.1 docs | `fetch`, `AbortSignal.timeout` |
| N-net | Node.js, [Net](https://nodejs.org/api/net.html) | v26.12.1 docs | `net.BlockList`, `net.isIP`, custom `lookup` |
| N-dns | Node.js, [DNS](https://nodejs.org/api/dns.html) | v26.12.1 docs | `dns.lookup` behavior |
| N-crypto | Node.js, [Crypto](https://nodejs.org/api/crypto.html) | v26.12.1 docs | HMAC, constant-time compare, UUIDs |
| X-route | Next.js, [Route Handlers (`route.js`)](https://nextjs.org/docs/app/api-reference/file-conventions/route) | Next.js v16.4.3 docs | handler model, request body reading |
| X-seg | Next.js, [Route segment config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) | v16.4.3 docs | `runtime`, `maxDuration` |
| X-self | Next.js, [Self-hosting](https://nextjs.org/docs/app/guides/self-hosting) | v16.4.3 docs | reverse-proxy guidance |
| X-body | Next.js, [`proxyClientMaxBodySize`](https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize) | v16.4.3 docs | body buffering limit |
| W-fetch | WHATWG, [Fetch Standard](https://fetch.spec.whatwg.org/) | Living Standard as retrieved | redirects, bad ports, abort, bodies |
| W-url | WHATWG, [URL Standard](https://url.spec.whatwg.org/) | Living Standard as retrieved | URL parsing, hosts, credentials |
| R-9110 | IETF, [RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.txt) | June 2022 | idempotency, redirects, `Retry-After`, 408 |
| R-9421 | IETF, [RFC 9421 HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.txt) | February 2024 | existence of a standard signature mechanism |
| I-v4 | IANA, [IPv4 Special-Purpose Address Registry](https://www.iana.org/assignments/iana-ipv4-special-registry/iana-ipv4-special-registry.xhtml) | as retrieved | reference list of non-global IPv4 blocks |

**Version skew to note.** The repository declares `"node": ">=22.12.0"` in the root `package.json`; the Node.js
pages above describe v26.12.1. Only long-standing APIs are cited (each shows an "Added in" version well below 22),
but an ADR must re-check each API against the supported Node.js range. The fetched Next.js docs describe v16.4.3,
the version pinned by the Import Center fixture.

## Facts

Each fact carries its source id. "Not stated" means the cited page does not say it, which is different from
saying the opposite is true.

### 1. URL parsing and validation boundaries

- **F1.1** A URL that fails the WHATWG parser is a failure: `URL.canParse()` returns `false` when the API URL
  parser fails (W-url). Node's HTTP client also parses a string `url` argument with `new URL()` (N-http).
- **F1.2** The URL Standard defines *special schemes* (`ftp`, `file`, `http`, `https`, `ws`, `wss`) with default
  ports, and defines a URL as *including credentials* when its username or password is non-empty (W-url). It
  lists an `invalid-credentials` parse error for inputs such as `https://user@example.org`, which is described as
  a validation error, not a parse failure (W-url).
- **F1.3** The URL Standard's IPv4 number parser accepts `0x` (hexadecimal) and leading-`0` (octal) parts and
  records a validation error for them, and it lists forms such as `https://127.0.0.1./`, `https://1.2.3/` and
  `https://127.0.0x0.1` among its examples (W-url). Comparing the *input string* to a blocklist is therefore not
  the same as checking the parsed host. Which forms normalize to which address is defined by the standard and
  was not tested here.
- **F1.4** `net.isIP()` returns `4` only for dotted-decimal IPv4 "with no leading zeroes"; `127.000.000.001`
  returns `0` (N-net). Its result for a string differs from how the URL parser would treat the same host
  (F1.3).
- **F1.5** The Fetch Standard blocks requests to a list of "bad ports" for HTTP(S) URLs (for example 22, 25, 53)
  and returns a blocked result (W-fetch). Whether Node's `fetch` or `http.request` applies this list is **not
  stated** in the Node.js pages read.

### 2. Timeouts and abort behavior

- **F2.1** `AbortSignal.timeout(delay)` returns a signal aborted after `delay` milliseconds (N-glob). Node's
  `fetch` is documented as "a browser-compatible implementation of the fetch() function", "based upon undici"
  (N-glob). The Fetch Standard aborts a `fetch()` call when its request signal is aborted (W-fetch).
- **F2.2** `http.request()` accepts `signal` ("An AbortSignal that may be used to abort an ongoing request") and
  `timeout` ("the socket timeout in milliseconds. This will set the timeout before the socket is connected")
  (N-http). `request.setTimeout()` calls `socket.setTimeout()` once a socket is assigned and connected (N-http).
  The pages describe a **socket** timeout; they do not describe a single deadline for DNS, connect, request,
  response headers and body together.
- **F2.3** The Fetch Standard itself defines abort but no timeout; a timeout comes from composing an abort
  signal (W-fetch, N-glob). What a signal timeout does to an in-flight response *body* read is **not stated** in
  the sources read.
- **F2.4** Node's HTTP **server** has `headersTimeout` and `requestTimeout`; the page says `headersTimeout` must
  be non-zero "to protect against potential Denial-of-Service attacks in case the server is deployed without a
  reverse proxy in front" (N-http). Next.js recommends a reverse proxy for
  "malformed requests, slow connection attacks, payload size limits, rate limiting" when self-hosting (X-self).
  These govern *inbound* requests, not outbound delivery.
- **F2.5** Next.js route segment config lists `maxDuration` as a number "set by deployment platform", and
  `runtime` as `'nodejs'` (default) or `'edge'` (deprecated) (X-seg). How a long-running delivery interacts with
  that limit on a given host is **not stated**.
- **F2.6** RFC 9110: a 408 means the server did not receive a complete request in time; "if the client has an
  outstanding request in transit, it MAY repeat that request" (R-9110). A receiver can also commit and then
  time out from the sender's view; the sources define no sender-side rule for that case.

### 3. Redirect handling

- **F3.1** The Fetch Standard's request `redirect` mode is `follow` (default), `error` or `manual`; `follow`
  follows all redirects, `error` returns a network error on a redirect, and `manual` yields an opaque-redirect
  response (W-fetch).
- **F3.2** Under `follow`, the standard returns a network error once the redirect count reaches 20 (W-fetch).
- **F3.3** On a 301/302 to a `POST`, or a 303 to a method other than `GET`/`HEAD`, the standard sets the method to
  `GET` and drops the body; on a cross-origin redirect the `Authorization` header is removed (W-fetch). RFC 9110
  records that 301 and 302 were originally method-preserving and that "prevailing practice" changed `POST` to
  `GET`, and says automatic redirection "needs to be done with care for methods not known to be safe" (R-9110).
- **F3.4** The Fetch Standard's redirect checks compare *URLs and origins*; the sections read contain no rule that
  re-validates a redirect target's resolved IP address (W-fetch). The Node `http` page mentions "redirects" only
  in an event-order note and describes no automatic following for `http.request()` (N-http).
- **F3.5** Those fetch rules are written for browser-style user agents. How `manual` behaves in Node's `fetch` is
  **not stated** in the Node.js pages and was not tested.

### 4. Response and body limits

- **F4.1** A Fetch `Response` body is a `ReadableStream`; the standard describes incremental reading of a body
  (W-fetch). The sections read define **no maximum response size** and no automatic truncation.
- **F4.2** Node's `http.maxHeaderSize` is a read-only property: "the maximum allowed size of HTTP headers in
  bytes. Defaults to 16 KiB", overridable per request with the `maxHeaderSize` option (N-http). Header limits do
  not bound body size.
- **F4.3** Next.js documents a **10MB default** for the in-memory copy of a request body that it clones "when
  proxy is used" so the proxy and the route handler can both read it, configurable with
  `experimental.proxyClientMaxBodySize`; the page marks the feature "currently experimental and subject to
  change" (X-body). That is an inbound setting. Route Handlers read the body through standard Web methods such as
  `request.json()` and `request.formData()` (X-route), and the route page documents no body-size limit.
- **F4.4** `http.request()` returns a stream of the response; the Node page documents no response-size cap for the
  client (N-http).

### 5. What the documentation does **not** protect automatically

These are absences in the sources read, not statements that a protection is impossible.

- **F5.1 Destination addresses.** `dns.lookup()` "does not necessarily have anything to do with the DNS
  protocol" and uses the operating system's facility; it can return all addresses (`all: true`) (N-dns). The
  Fetch and URL standards define no private-network, loopback, link-local or metadata-address block (a text search of
  W-fetch for "private network", "loopback address" and "local network" found none). The only built-in address-level mechanism found is `net.BlockList`, which
  "can be used with some network APIs to specify rules for disabling inbound or outbound access to specific IP
  addresses, IP ranges, or IP subnets" (N-net); the page read does not say that `fetch` consumes it.
- **F5.2 Connect-time versus check-time address.** `net.connect()` accepts a custom `lookup` function (default
  `dns.lookup()`) (N-net). No source read says that an address checked earlier is the address later connected
  to, nor that a resolver result is stable between two lookups.
- **F5.3 Redirect targets.** See F3.4: no automatic re-validation of a redirect's resolved address.
- **F5.4 Response size and time.** See F2.2, F2.3 and F4.1.
- **F5.5 Proxies.** Node's built-in proxy support routes outbound requests through an HTTP(S) proxy and "does not
  attempt to hide traffic from the proxy"; "Node.js does not support treating an untrusted proxy as a privacy
  boundary" (N-http). Whether a proxy changes address visibility for egress checks is not stated.
- **F5.6 Reserved address ranges.** IANA publishes a registry of special-purpose IPv4 blocks (for example
  `10.0.0.0/8`, `127.0.0.0/8`, `169.254.0.0/16`) with a "Globally Reachable" column (I-v4); it is a reference
  list, not an enforcement mechanism, and an IPv6 registry exists separately (not read in detail).
- **F5.7 Idempotency.** Of the methods RFC 9110 defines, "PUT, DELETE, and safe request methods are idempotent";
  `POST` is not in that list (R-9110). Nothing in the platform deduplicates a repeated `POST`.

### 6. Signing, identity and verification primitives

- **F6.1** Node provides `crypto.createHmac(algorithm, key)` (N-crypto) and `crypto.timingSafeEqual(a, b)`, a
  constant-time comparison "suitable for comparing HMAC digests"; it throws if the inputs differ in byte length
  (N-crypto).
- **F6.2** `crypto.randomUUID()` generates a random version 4 UUID using a cryptographically secure generator
  (N-crypto). A UUID is a possible *source* of an event identifier; uniqueness across retries is a design
  choice, not a platform guarantee.
- **F6.3** RFC 9421 defines a standard mechanism for signatures or message authentication codes over HTTP
  message components (R-9421). The existence of a standard is not a selection of an algorithm or format.
- **F6.4** RFC 9110 defines `Retry-After` for 503 and 3xx responses as an HTTP-date or a non-negative number of
  seconds (R-9110).

## Mapping to research-package concerns

The candidate boundary lists endpoint validation, forbidden-destination blocking, bounded retries, stable event
identity, payload redaction and delivery accounting. This table only connects facts to concerns; it picks no
policy.

| Concern | Relevant facts | What the sources leave open |
| --- | --- | --- |
| Endpoint validation | F1.1 to F1.5, F5.6 | Which schemes, ports, credentials and host forms are acceptable; whether to validate the parsed host or the input string; allowed ports versus the bad-port list. |
| Forbidden-destination blocking | F1.3, F5.1 to F5.6, F3.4 | Which address ranges are forbidden; where the check runs (before connect, at connect, per redirect); how DNS rebinding and multi-address answers are handled; whether `net.BlockList` can be applied to the chosen client. |
| Bounded retries | F2.1 to F2.6, F3.1 to F3.3, F4.1 to F4.4, F6.4 | Attempt count, backoff, per-attempt deadline, response-size cap, whether redirects are followed, handling of `Retry-After`. |
| Stable event identity | F5.7, F6.2, F2.6 | The identifier scheme, where it is generated (the candidate says transactional event intent), and the receiver-visible header name. |
| Payload redaction | None found in the platform sources | What is redacted, where (storage, logs, UI), and who may see it. The platform sources read contain no redaction facility. |
| Delivery accounting | F2.2, F2.6, F4.1 | What is recorded per attempt (status, timing, truncated body), retention period, and how a timed-out-but-committed attempt is shown. |

## Unresolved ADR decisions (all UNRESOLVED)

None of these is settled by this note or by the candidate research record. Each needs a decision in a future
approved ADR from current sources and the supported host's real bindings.

| # | Decision | Status |
| --- | --- | --- |
| U1 | SSRF and egress controls: forbidden ranges, enforcement point, DNS and redirect handling, proxy use, allowed ports and schemes | **UNRESOLVED** |
| U2 | Signing algorithm, signed components, header format, replay window, and secret rotation overlap | **UNRESOLVED** |
| U3 | Idempotency: event identifier scheme, delivery-attempt identifier, and what a receiver is told | **UNRESOLVED** |
| U4 | Retry and backoff schedule, per-attempt timeout, give-up rule, and treatment of `Retry-After` | **UNRESOLVED** |
| U5 | Ordering semantics for the "documented ordering guarantees" in the bounded first release | **UNRESOLVED** |
| U6 | Observability and redaction: what is stored, truncated, masked and shown; retention period | **UNRESOLVED** |
| U7 | Response handling: body-size cap, content-type handling, and redirect policy | **UNRESOLVED** |
| U8 | Runtime placement: where deliveries run relative to route-handler duration limits and the worker model | **UNRESOLVED** |

## Not verified

- Nothing was executed. No request was sent to any endpoint, and no Node.js or Next.js behavior was tested;
  every statement is what a document says.
- Runtime behavior of Node's `fetch` (undici) for redirects, bad ports, body streaming and abort is not described
  by the Node.js pages read. The undici project's own documentation was not consulted because the task limits
  sources to Next.js, Node.js and web-platform documentation. An ADR should settle that gap.
- The IPv6 special-purpose registry and the Fetch and URL standards' IPv6 handling were not read in detail.
- Documentation versions differ from the repository's supported Node.js range (see "Version skew").
- Quoted wording comes from text extracted from rendered pages and may differ from the page's exact markup.

## Source and licence provenance

- WHATWG Fetch and URL: the pages state "Copyright © WHATWG (Apple, Google, Mozilla, Microsoft)" and licence the
  work under Creative Commons Attribution 4.0, with code portions under BSD 3-Clause (read from the pages).
- IETF RFCs: the RFC 9110 text states "Copyright (c) 2022 IETF Trust and the persons identified as the document
  authors" under the IETF Trust Legal Provisions.
- Node.js, Next.js and IANA documentation: licence terms were **not checked** for this note. This record quotes
  only short phrases for attribution and links to the originals; an ADR that copies text should check each.
- This is evidence for a future approved ADR and task. It is not a product decision and not legal advice.
