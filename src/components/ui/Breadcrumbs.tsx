// src/components/ui/Breadcrumbs.tsx
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbs: BreadcrumbItem[] = [];

//   // Home always first
//   breadcrumbs.push({ label: 'Home', path: '/' });

  // Add inventory if we are in report
  if (pathnames.includes('report')) {
    breadcrumbs.push({ label: 'Inventory', path: '/inventory' });
  }

  // Add current page (Report)
  if (pathnames.includes('report')) {
    breadcrumbs.push({ label: 'Report', path: undefined });
  }

  if (breadcrumbs.length === 1) return null;

  return (
    <nav className="flex items-center text-sm text-on-surface-variant mb-4">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span className="mx-2 text-outline-variant">/</span>}
          {crumb.path ? (
            <Link to={crumb.path} className="hover:text-primary transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-semibold text-primary">{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}