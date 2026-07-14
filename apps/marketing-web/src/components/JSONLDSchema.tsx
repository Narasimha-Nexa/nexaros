interface Props {
  type: 'Organization' | 'FAQPage' | 'WebSite' | 'SoftwareApplication';
  data: Record<string, unknown>;
}

export default function JSONLDSchema({ type, data }: Props) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
