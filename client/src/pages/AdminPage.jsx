import { useEffect, useState } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function AdminPage({ api, authHeader }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('stats');
  const [deleteTarget, setDeleteTarget] = useState({ isOpen: false, item: null, isDeleting: false });

  const loadData = async () => {
    const [statsRes, usersRes, listingsRes, reportsRes] = await Promise.all([
      api.get('/admin/stats', { headers: authHeader() }),
      api.get('/admin/users', { headers: authHeader() }),
      api.get('/admin/listings', { headers: authHeader() }),
      api.get('/admin/reports', { headers: authHeader() })
    ]);
    setStats(statsRes.data.stats);
    setUsers(usersRes.data.users || []);
    setListings(listingsRes.data.listings || []);
    setReports(reportsRes.data.reports || []);
  };

  useEffect(() => { loadData(); }, []);

  const toggleBan = async (userId) => {
    await api.patch(`/admin/users/${userId}/ban`, {}, { headers: authHeader() });
    loadData();
  };

  const requestDeleteListing = (listing) => {
    setDeleteTarget({ isOpen: true, item: listing, isDeleting: false });
  };

  const confirmDeleteListing = async () => {
    if (!deleteTarget.item) return;
    setDeleteTarget((prev) => ({ ...prev, isDeleting: true }));
    try {
      await api.delete(`/admin/listings/${deleteTarget.item._id}`, { headers: authHeader() });
      await loadData();
      setDeleteTarget({ isOpen: false, item: null, isDeleting: false });
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to remove listing');
      setDeleteTarget((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex gap-3">
        {['stats','users','listings','reports'].map((item) => (
          <button
            key={item}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${tab === item ? 'bg-terra-cotta text-white shadow-md' : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'}`}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm"><p className="text-sm text-stone-500">Total listings</p><p className="text-2xl font-semibold">{stats.totalListings}</p></div>
          <div className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm"><p className="text-sm text-stone-500">Total transactions</p><p className="text-2xl font-semibold">{stats.totalTransactions}</p></div>
          <div className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm"><p className="text-sm text-stone-500">Active users</p><p className="text-2xl font-semibold">{stats.activeUsers}</p></div>
          <div className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm"><p className="text-sm text-stone-500">Conversion rate</p><p className="text-2xl font-semibold">{stats.conversionRate}%</p></div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user._id} className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-stone-600">{user.email}</p>
              </div>
              <button className="rounded-full bg-charcoal px-4 py-1.5 text-xs font-bold text-white hover:bg-stone-800 transition" onClick={() => toggleBan(user._id)}>
                {user.isBanned ? 'Unban' : 'Ban User'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'listings' && (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing._id} className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-semibold">{listing.title}</p>
                <p className="text-sm text-stone-600">Seller: {listing.seller?.name || 'Unknown'}</p>
              </div>
              <button className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition" onClick={() => requestDeleteListing(listing)}>
                🗑️ Remove Listing
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report._id} className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm">
              <p className="font-semibold">{report.reason}</p>
              <p className="text-sm text-stone-600">{report.status}</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteTarget.isOpen}
        title="Admin: Delete Listing?"
        message={`Are you sure you want to permanently remove listing "${deleteTarget.item?.title || 'this listing'}" from the platform?`}
        confirmText="Yes, Remove Listing"
        isDeleting={deleteTarget.isDeleting}
        onConfirm={confirmDeleteListing}
        onCancel={() => setDeleteTarget({ isOpen: false, item: null, isDeleting: false })}
      />
    </div>
  );
}
