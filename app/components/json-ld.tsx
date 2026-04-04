/**
 * Server component that renders a JSON-LD <script> tag.
 * Usage: <JsonLd data={organizationJsonLd()} />
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
