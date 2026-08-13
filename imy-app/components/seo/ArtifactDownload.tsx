// The artifact-download card — every template and tool page ends in one.
// Program rule: artifact output (a file in hand) is the point. This card is
// the shared way to offer it, followed by the quiet path to a memorial page.

interface FileOption {
  label: string; // "PDF" | "Word" | "Open the free program maker" ...
  href: string;
  note?: string; // "US Letter · bifold · 2 pages"
  /** Set false for links to the maker (navigation, not a file download). */
  download?: boolean;
}

export default function ArtifactDownload({
  title,
  files,
  memorialCta = true,
}: {
  title: string;
  files: FileOption[];
  /** The terminal action — a quiet invitation, never a gate on the download. */
  memorialCta?: boolean;
}) {
  return (
    <section className="kd-card">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.kd-card{border:1px solid rgba(44,37,32,.18);background:#F3ECDD;padding:26px 28px;margin:36px 0;}
.kd-title{font-family:'Sometype Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#A87C5F;margin:0 0 14px;}
.kd-files{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 6px;}
.kd-file{display:inline-block;padding:11px 18px;background:#3f2c1a;color:#FAF5EC;text-decoration:none;font-size:15px;border-radius:2px;}
.kd-file:hover{background:#241711;}
.kd-note{font-size:13px;color:rgba(44,37,32,.6);margin:8px 0 0;}
.kd-cta{margin:18px 0 0;padding-top:16px;border-top:1px solid rgba(44,37,32,.14);font-size:15px;color:rgba(44,37,32,.8);}
.kd-cta a{color:#A87C5F;text-decoration:none;border-bottom:1px solid rgba(168,124,95,.4);}
`,
        }}
      />
      <p className="kd-title">{title}</p>
      <div className="kd-files">
        {files.map((f) => (
          <a className="kd-file" key={f.href} href={f.href} {...(f.download === false ? {} : { download: true })}>
            {f.download === false ? f.label : `Download ${f.label}`}
          </a>
        ))}
      </div>
      {files.some((f) => f.note) && (
        <p className="kd-note">{files.filter((f) => f.note).map((f) => f.note).join(" · ")}</p>
      )}
      {memorialCta && (
        <p className="kd-cta">
          When the service is planned, their memory deserves a place that stays.{" "}
          <a href="/onboarding">Create their memorial page</a> · free, forever.
        </p>
      )}
    </section>
  );
}
