export default function ProxyPanel({ proxyReport, egressMode, proxyConfigured }) {
  if (egressMode !== "proxy" && !proxyReport?.totalRotations) {
    return null;
  }

  const report = proxyReport ?? {
    mode: egressMode,
    totalRotations: 0,
    rotations: [],
    summary: null,
  };

  const summary = report.summary;
  const rotations = report.rotations ?? [];

  return (
    <section className="card proxy-card">
      <div className="proxy-card-head">
        <h2>Proxy · NodeMaven</h2>
        <span
          className={`pill ${proxyConfigured ? "live" : "warn"}`}
        >
          {egressMode === "proxy"
            ? proxyConfigured
              ? "● Proxy active"
              : "Credentials missing"
            : "Local (no proxy)"}
        </span>
      </div>

      {!proxyConfigured && egressMode === "proxy" && (
        <p className="proxy-hint">
          Add <code className="mono">NODEMAVEN_API_KEY</code> to{" "}
          <code className="mono">job-scraper-test/.env</code> (Profile → API key).
          Restart the API server.
        </p>
      )}

      {summary?.credentialSource && (
        <p className="proxy-hint muted">
          Credentials via{" "}
          <strong>{summary.credentialSource === "api" ? "API key → /users/me" : "env (Proxy Setup)"}</strong>
          {report.accountEmail && ` · ${report.accountEmail}`}
        </p>
      )}

      {summary && (
        <div className="proxy-summary-grid">
          <div className="proxy-stat">
            <span>Rotations</span>
            <strong>{summary.rotationsUsed ?? report.totalRotations ?? 0}</strong>
          </div>
          <div className="proxy-stat">
            <span>Unique egress IPs</span>
            <strong>{summary.uniqueEgressIps ?? 0}</strong>
          </div>
          <div className="proxy-stat">
            <span>Geo target</span>
            <strong className="mono">
              {summary.locationLabel ?? summary.countriesTargeted?.join(", ") ?? "—"}
            </strong>
          </div>
          <div className="proxy-stat">
            <span>IP checks</span>
            <strong>
              {summary.allIpChecksOk ? "All OK" : "Some failed"}
            </strong>
          </div>
          {summary.avgIpCheckMs != null && (
            <div className="proxy-stat">
              <span>Avg IP check</span>
              <strong>{summary.avgIpCheckMs} ms</strong>
            </div>
          )}
          {report.host && (
            <div className="proxy-stat">
              <span>Gateway</span>
              <strong className="mono">
                {report.host}:{report.port}
              </strong>
            </div>
          )}
        </div>
      )}

      {rotations.length > 0 && (
        <>
          <h3 className="proxy-subhead">Rotations ({rotations.length})</h3>
          <div className="proxy-rotations">
            {rotations.map((r) => (
              <details key={`${r.index}-${r.site}`} className="proxy-rotation" open={rotations.length <= 2}>
                <summary>
                  <span className="mono">#{r.index}</span>{" "}
                  <span className={`badge ${r.site}`}>{r.site}</span>{" "}
                  {r.egressIp ? (
                    <span className="mono">{r.egressIp}</span>
                  ) : (
                    <span className="muted">IP pending</span>
                  )}{" "}
                  <span className={`proxy-status ${r.status}`}>{r.status}</span>
                </summary>
                <dl className="proxy-dl">
                  <dt>Session ID</dt>
                  <dd className="mono">{r.sessionId ?? "—"}</dd>
                  <dt>Username (masked)</dt>
                  <dd className="mono">{r.usernameMasked ?? "—"}</dd>
                  <dt>Country target</dt>
                  <dd>
                    {r.countryLabel} ({r.country})
                  </dd>
                  <dt>Gateway</dt>
                  <dd className="mono">
                    {r.protocol ?? report.protocol}://{r.proxyServer ?? `${report.host}:${report.port}`}
                  </dd>
                  <dt>Filter</dt>
                  <dd>{r.filter ?? report.filter ?? "—"}</dd>
                  <dt>Egress</dt>
                  <dd>
                    {r.egressIp ? (
                      <>
                        {r.egressIp}
                        {r.egressCity && ` · ${r.egressCity}`}
                        {r.egressRegion && `, ${r.egressRegion}`}
                        {r.egressCountry && ` (${r.egressCountry})`}
                        {r.egressOrg && (
                          <span className="muted block">{r.egressOrg}</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </dd>
                  <dt>IP check</dt>
                  <dd>
                    {r.ipCheckOk ? "OK" : r.ipCheckError ?? "Failed"}{" "}
                    {r.ipCheckMs != null && (
                      <span className="muted">({r.ipCheckMs} ms)</span>
                    )}
                  </dd>
                  <dt>Jobs scraped</dt>
                  <dd>{r.scrapeJobs ?? 0}</dd>
                  <dt>Started</dt>
                  <dd className="mono">{r.startedAt ?? "—"}</dd>
                  <dt>Ended</dt>
                  <dd className="mono">{r.endedAt ?? "—"}</dd>
                </dl>
              </details>
            ))}
          </div>
        </>
      )}

      {summary && (
        <div className="proxy-docs">
          <span>Docs:</span>{" "}
          <a href={summary.integrationGuide} target="_blank" rel="noreferrer">
            Puppeteer setup
          </a>
          {" · "}
          <a href={summary.documentation} target="_blank" rel="noreferrer">
            API (Swagger)
          </a>
          {" · "}
          <a href={summary.helpArticle} target="_blank" rel="noreferrer">
            Proxy string guide
          </a>
        </div>
      )}
    </section>
  );
}
