import { useQuery } from '@tanstack/react-query';
import { TemplatePreview } from '../components/TemplatePreview';
import { Card, CardBody } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { apiRequest } from '../lib/api';
import type { CertificateTemplateSummary } from '../lib/types';

export function TemplatesGalleryPage(): JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: () => apiRequest<{ templates: CertificateTemplateSummary[] }>('/certificate-templates'),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Certificate templates</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse the designs available when creating a certificate type for an event.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.templates.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <TemplatePreview template={template} />
            <CardBody>
              <p className="text-sm font-semibold text-gray-900">{template.name}</p>
              {template.category && <p className="text-xs text-gray-500">{template.category}</p>}
              {template.description && <p className="mt-2 text-xs text-gray-600">{template.description}</p>}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
