import { useLocation } from 'react-router-dom';

export function Placeholder() {
  const location = useLocation();
  const title = location.pathname.split('/')[1] || 'Page';
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <h2 className="text-2xl font-bold capitalize">{title}</h2>
      <p>This feature is coming soon.</p>
    </div>
  );
}
