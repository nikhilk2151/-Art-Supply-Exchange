import { useEffect, useState } from 'react';

export default function AdminPage({ api, authHeader }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('stats');

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

  const deleteListing = async (listingId) => {
    await api.delete(`/admin/listings/${listingId}`, { headers: authHeader() });
    loadData();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex gap-3">
        {['stats','users','listings','reports'].map((item) => <button key={item} className={`rounded-full px-4 py-2 ${tab === item ? 'bg-terra-cotta text-white' : 'bg-white border border-stone-300'}`} onClick={() => setTab(item)}>{item}</button>)}
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
          {users.map((user) => <div key={user._id} className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm flex items-center justify-between"><div><p className="font-semibold">{user.name}</p><p className="text-sm text-stone-600">{user.email}</p></div><button className="rounded-full bg-charcoal px-3 py-1 text-sm text-white" onClick={() => toggleBan(user._id)}>{user.isBanned ? 'Unban' : 'Ban'}</button></div>)}
        </div>
      )}

      {tab === 'listings' && (
        <div className="space-y-3">
          {listings.map((listing) => <div key={listing._id} className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm flex items-center justify-between"><div><p className="font-semibold">{listing.title}</p><p className="text-sm text-stone-600">{listing.seller?.name}</p></div><button className="rounded-full bg-terra-cotta px-3 py-1 text-sm text-white" onClick={() => deleteListing(listing._id)}>Remove</button></div>)}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.map((report) => <div key={report._id} className="rounded-3xl border border-stone-300 bg-white p-4 shadow-sm"><p className="font-semibold">{report.reason}</p><p className="text-sm text-stone-600">{report.status}</p></div>)}
        </div>
      )}
    </div>
  );
}
