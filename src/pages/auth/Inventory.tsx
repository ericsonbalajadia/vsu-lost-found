// src/pages/auth/Inventory.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { itemsApi } from '../../api/itemsApi';
import type{ ItemFilters } from '../../api/itemsApi';
import type { Item, ItemCategory, ItemType } from '../../types/database';
import ItemCard from '../../components/ui/ItemCard';
import { ItemGridSkeleton } from '../../components/ui/SkeletonLoader';
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout';


export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const typeParam = searchParams.get('type') as ItemType | null;
  const catParam = searchParams.get('category') as ItemCategory | null;
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const filters: ItemFilters = {};
      if (typeParam) filters.type = typeParam;
      if (catParam) filters.category = catParam;
      if (searchQuery) filters.search = searchQuery;
      const { data } = await itemsApi.getAll(filters);
      const typedItems = (data as any[])?.map(item => ({
        ...item,
        profiles: item.profiles?.[0]
      })) ?? [];
      setItems(typedItems as Item[]);
      setLoading(false);
    };
    fetch();
  }, [typeParam, catParam, searchQuery]);

  const setFilter = (key: string, value: string | null) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value);
      else prev.delete(key);
      return prev;
    });
  };

  return (
    <AuthenticatedLayout>
      <div className="px-8 md:px-12 py-10 shrink-0">
        <h1 className="text-4xl lg:text-5xl font-black text-on-surface tracking-tight mb-4 font-headline">Dashboard Overview</h1>
        <p className="text-on-surface-variant text-lg font-medium opacity-80 max-w-2xl">
          Get a bird's‑eye view of all campus recovery activities. Track active reports, monitor claims, and manage resolutions from a single interface.
        </p>
        <div className="mt-10 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Search by item name, location, or description..."
              value={searchQuery}
              onChange={e => setFilter('q', e.target.value || null)}
              className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-outline"
            />
          </div>
          <div className="inline-flex p-1 bg-surface-container-high rounded-full w-full md:w-auto self-stretch md:self-auto">
            {(['all', 'found', 'lost'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilter('type', t === 'all' ? null : t)}
                className={`flex-1 md:min-w-[120px] px-6 py-2 rounded-full text-sm font-headline transition-all ${
                  (typeParam ?? 'all') === t
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant font-semibold hover:bg-surface-variant/40 hover:text-on-surface'
                }`}
              >
                {t === 'all' ? 'All Items' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 md:px-10 pb-10">
        <div className="bg-surface-container-low/50 rounded-[2.5rem] border border-outline-variant/10 shadow-soft">
          <div className="p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* "Add New Entry" card */}
<Link
  to="/report"
  className="bg-surface-container-lowest group rounded-[2rem] overflow-hidden border-2 border-dashed border-outline-variant/40 hover:border-primary/50 hover:shadow-card transition-all duration-500 flex flex-col items-center justify-center p-8 text-center cursor-pointer min-h-[440px]"
>
  <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center text-primary/60 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 mb-8 shadow-sm">
    <span className="material-symbols-outlined text-4xl font-light">add_circle</span>
  </div>
  <div className="space-y-3 mb-10">
    <h3 className="text-xl font-extrabold text-on-surface group-hover:text-primary transition-colors">Found something else?</h3>
    <p className="text-sm text-on-surface-variant/80 font-medium leading-relaxed max-w-[220px] mx-auto">Help your fellow students by listing a new recovery entry.</p>
  </div>
  <button className="px-8 py-3.5 bg-primary text-on-primary font-bold rounded-xl text-sm shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-300">
    Start an Entry
  </button>
</Link>

              {loading ? (
                <ItemGridSkeleton count={6} />
              ) : items.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-on-surface-variant">No items found. Try adjusting your filters.</p>
                </div>
              ) : (
                items.map(item => <ItemCard key={item.id} item={item} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}