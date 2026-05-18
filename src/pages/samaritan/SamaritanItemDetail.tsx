// src/pages/samaritan/SamaritanItemDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { itemsApi } from '../../api/itemsApi';

export default function SamaritanItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    itemsApi.getById(id).then(({ data }) => {
      if (data) setItem({ ...data, profiles: (data as any).profiles?.[0] });
    });
  }, [id]);

  if (!item) return <div className="p-8 text-center">Loading...</div>;
  if (item.reporter_id !== user?.id) return <div className="p-8 text-center text-error">Access denied</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{item.title}</h1>
      <p className="text-sm text-outline mb-4">{item.reference_number}</p>
      <Link to="/user/claims" className="inline-block bg-primary text-on-primary px-6 py-2 rounded-xl font-bold">
        View Pending Claims
      </Link>
    </div>
  );
}