import { useParams } from 'react-router-dom';

export default function Claim() {
  const { id } = useParams();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Claim Item</h1>
      <p>Claiming item {id}. Claim flow will be built in Phase 3.</p>
    </div>
  );
}