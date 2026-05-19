// src/pages/auth/MyItems.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { itemsApi } from '../../api/itemsApi'
import type { Item } from '../../types/database'
import ItemCard from '../../components/ui/ItemCard'
import { getSkeletonCards } from '../../components/ui/SkeletonLoader'
import AuthenticatedLayout from '../../components/layout/AuthenticatedLayout'

type TabKey = 'all' | 'found' | 'lost' | 'resolved'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Items' },
  { key: 'found', label: 'Found' },
  { key: 'lost', label: 'Lost' },
  { key: 'resolved', label: 'Completed' },
]

export default function MyItems() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      setLoading(true)
      const { data } = await itemsApi.getMyItems(user.id)
      const typedItems =
        (data as any[])?.map((item) => ({
          ...item,
          profiles: item.profiles?.[0],
        })) ?? []
      setItems(typedItems as Item[])
      setLoading(false)
    }
    fetch()
  }, [user])

  const filteredItems = items
    .filter((item) => {
      if (activeTab === 'all') return true
      if (activeTab === 'found') return item.type === 'found' && item.status !== 'resolved'
      if (activeTab === 'lost') return item.type === 'lost' && item.status !== 'resolved'
      if (activeTab === 'resolved') return item.status === 'resolved'
      return true
    })
    .filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 py-10 md:py-14 px-6 md:px-12 bg-surface shrink-0 z-10">
          <div className="flex-1">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-on-surface mb-6 font-headline">
              My Reported Items
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed opacity-80 max-w-3xl">
              Monitor the status of your campus reports. Track claims, update details, or finalize
              resolutions in one centralized dashboard.
            </p>
            <div className="mt-10 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search your reported items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-xl focus:ring-2 focus:ring-primary-container focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-outline"
                />
              </div>
              <div className="inline-flex p-1 bg-surface-container-high rounded-full w-full md:w-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 px-6 py-2 rounded-full text-sm font-headline transition-all ${
                      activeTab === tab.key
                        ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                        : 'text-on-surface-variant font-semibold hover:bg-surface-variant/40 hover:text-on-surface'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 md:px-10 pb-10 overflow-hidden">
          <div className="h-full bg-surface-container-low/50 rounded-[2.5rem] border border-outline-variant/10 shadow-soft overflow-y-auto">
            <div className="p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* "Add New Entry" card – always visible */}
                <Link
                  key="add-report-card"
                  to="/report"
                  className="bg-surface-container-low/30 group rounded-3xl overflow-hidden border-2 border-dashed border-outline-variant/40 hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-500 flex flex-col items-center justify-center p-8 text-center cursor-pointer min-h-[460px]"
                >
                  <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center text-primary/60 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 mb-8 shadow-sm">
                    <span className="material-symbols-outlined text-4xl font-light">
                      add_circle
                    </span>
                  </div>
                  <div className="space-y-3 mb-10">
                    <h3 className="text-xl font-extrabold text-on-surface group-hover:text-primary transition-colors">
                      Report New Item
                    </h3>
                    <p className="text-sm text-on-surface-variant/80 font-medium leading-relaxed max-w-[220px] mx-auto">
                      Found or lost something else? Create a new entry to notify the campus
                      community.
                    </p>
                  </div>
                  <button className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-300">
                    Start an Entry
                  </button>
                </Link>

                {loading ? (
                  <>{getSkeletonCards(6)} </>
                ) : filteredItems.length === 0 ? (
                  <div key="no-items" className="col-span-full text-center py-12">
                    <p className="text-on-surface-variant">No items match your current filter.</p>
                  </div>
                ) : (
                  filteredItems.map((item) => <ItemCard key={item.id} item={item} />)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
