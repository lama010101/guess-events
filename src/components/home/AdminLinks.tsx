
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Database } from 'lucide-react';

interface AdminLinksProps {
  isAdmin: boolean;
}

const AdminLinks: React.FC<AdminLinksProps> = ({ isAdmin }) => {
  if (!isAdmin) return null;
  
  return (
    <div className="flex w-full justify-center gap-4">
      <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center">
        <Shield className="mr-1 h-3 w-3" /> Admin Panel
      </Link>
      <Link to="/admin/scraper" className="text-sm text-muted-foreground hover:text-primary flex items-center">
        <Database className="mr-1 h-3 w-3" /> Scraper Dashboard
      </Link>
    </div>
  );
};

export default AdminLinks;
