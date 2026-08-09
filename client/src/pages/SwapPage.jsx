import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SwapPage({ api, user, authHeader }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('swaps'); // 'swaps' or 'buys'
  const [sentSwaps, setSentSwaps] = useState([]);
  const [receivedSwaps, setReceivedSwaps] = useState([]);
  const [sentBuys, setSentBuys] = useState([]);
  const [receivedBuys, setReceivedBuys] = useState([]);

  const loadData = async () => {
    try {
      const [sentSwapsRes, receivedSwapsRes, sentBuysRes, receivedBuysRes] = await Promise.all([
        api.get('/swaps/sent', { headers: authHeader() }),
        api.get('/swaps/received', { headers: authHeader() }),
        api.get('/transactions/sent', { headers: authHeader() }),
        api.get('/transactions/received', { headers: authHeader() })
      ]);
      setSentSwaps(sentSwapsRes.data.swaps || []);
      setReceivedSwaps(receivedSwapsRes.data.swaps || []);
      setSentBuys(sentBuysRes.data.transactions || []);
      setReceivedBuys(receivedBuysRes.data.transactions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateSwapStatus = async (id, action) => {
    try {
      await api.patch(`/swaps/${id}/${action}`, {}, { headers: authHeader() });
      await loadData();
    } catch (err) {
      console.error('Failed to update swap status:', err);
      alert(err?.response?.data?.message || 'Failed to update swap status');
    }
  };

  const updateBuyStatus = async (id, action) => {
    try {
      await api.patch(`/transactions/${id}/${action}`, {}, { headers: authHeader() });
      await loadData();
    } catch (err) {
      console.error('Failed to update purchase request status:', err);
      alert(err?.response?.data?.message || 'Failed to update request status');
    }
  };

  const handleOpenChat = async (listingId, otherUserId) => {
    try {
      const { data } = await api.post('/chats', { listingId, otherUserId }, { headers: authHeader() });
      navigate('/chat', { state: { conversationId: data.conversation._id } });
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 border-amber-300',
      accepted: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      rejected: 'bg-rose-100 text-rose-800 border-rose-300',
      declined: 'bg-rose-100 text-rose-800 border-rose-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return (
      <span className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${styles[status] || 'bg-stone-100 text-stone-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header Glass Card */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
            <span>🤝</span> Request Activity Center
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-stone-900">Swaps & Purchase Requests</h1>
          <p className="text-sm text-stone-600 mt-1">Track incoming and outgoing swap offers and buy requests.</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-stone-200/60 p-1.5 rounded-2xl gap-1 border border-stone-300/50">
          <button
            onClick={() => setActiveTab('swaps')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'swaps' ? 'bg-white text-terra-cotta shadow-md' : 'text-stone-700 hover:text-stone-900'}`}
          >
            🔄 Swaps ({sentSwaps.length + receivedSwaps.length})
          </button>
          <button
            onClick={() => setActiveTab('buys')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${activeTab === 'buys' ? 'bg-white text-terra-cotta shadow-md' : 'text-stone-700 hover:text-stone-900'}`}
          >
            🛒 Purchase Requests ({sentBuys.length + receivedBuys.length})
          </button>
        </div>
      </div>

      {activeTab === 'swaps' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sent Swaps */}
          <div className="glass-card p-6 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center justify-between border-b border-stone-200/60 pb-3">
              <span>Sent Swap Offers</span>
              <span className="text-xs font-bold text-terra-cotta bg-terra-cotta/10 px-2.5 py-1 rounded-full">{sentSwaps.length} total</span>
            </h2>
            {sentSwaps.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No outgoing swap requests yet.</p>
            ) : (
              sentSwaps.map((swap) => (
                <div key={swap._id} className="rounded-2xl border border-stone-200 bg-white/80 p-4 space-y-3 shadow-xs">
                  <div className="flex gap-4 items-start">
                    {swap.listing?.images?.[0] && (
                      <img src={swap.listing.images[0]} alt={swap.listing.title} className="h-16 w-16 rounded-xl object-cover border border-stone-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-stone-900 truncate">{swap.listing?.title || 'Target Item'}</h3>
                        {getStatusBadge(swap.status)}
                      </div>
                      <p className="mt-1 text-xs text-stone-500">Seller: <span className="font-semibold text-stone-800">{swap.listing?.seller?.name || 'Seller'}</span></p>
                      {swap.message && <p className="mt-2 text-xs text-stone-700 bg-stone-50 p-2 rounded-xl italic">"{swap.message}"</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Received Swaps */}
          <div className="glass-card p-6 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center justify-between border-b border-stone-200/60 pb-3">
              <span>Received Swap Offers</span>
              <span className="text-xs font-bold text-terra-cotta bg-terra-cotta/10 px-2.5 py-1 rounded-full">{receivedSwaps.length} total</span>
            </h2>
            {receivedSwaps.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No incoming swap requests yet.</p>
            ) : (
              receivedSwaps.map((swap) => (
                <div key={swap._id} className="rounded-2xl border border-stone-200 bg-white/80 p-4 space-y-3 shadow-xs">
                  <div className="flex gap-4 items-start">
                    {swap.listing?.images?.[0] && (
                      <img src={swap.listing.images[0]} alt={swap.listing.title} className="h-16 w-16 rounded-xl object-cover border border-stone-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-stone-900 truncate">{swap.listing?.title || 'Your Listing'}</h3>
                        {getStatusBadge(swap.status)}
                      </div>
                      <p className="mt-1 text-xs text-stone-500">From: <span className="font-semibold text-stone-800">{swap.requester?.name}</span> ({swap.requester?.city})</p>
                      {swap.message && <p className="mt-2 text-xs text-stone-700 bg-stone-50 p-2 rounded-xl italic">"{swap.message}"</p>}

                      <div className="mt-3 flex items-center gap-2">
                        {swap.status === 'pending' && (
                          <>
                            <button className="glow-btn rounded-xl px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider" onClick={() => updateSwapStatus(swap._id, 'accept')}>
                              Accept Swap
                            </button>
                            <button className="rounded-xl border border-stone-300 px-3.5 py-1.5 text-xs font-semibold hover:bg-stone-100 transition" onClick={() => updateSwapStatus(swap._id, 'reject')}>
                              Decline
                            </button>
                          </>
                        )}
                        {swap.status === 'accepted' && (
                          <button className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition" onClick={() => updateSwapStatus(swap._id, 'complete')}>
                            Mark Completed
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenChat(swap.listing?._id, swap.requester?._id)}
                          className="rounded-xl border border-terra-cotta/30 bg-terra-cotta/10 px-3.5 py-1.5 text-xs font-semibold text-terra-cotta hover:bg-terra-cotta hover:text-white transition ml-auto"
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Purchase Requests Tab */
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sent Buy Requests */}
          <div className="glass-card p-6 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center justify-between border-b border-stone-200/60 pb-3">
              <span>My Sent Buy Requests</span>
              <span className="text-xs font-bold text-terra-cotta bg-terra-cotta/10 px-2.5 py-1 rounded-full">{sentBuys.length} total</span>
            </h2>
            {sentBuys.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No purchase requests sent yet.</p>
            ) : (
              sentBuys.map((buy) => (
                <div key={buy._id} className="rounded-2xl border border-stone-200 bg-white/80 p-4 space-y-3 shadow-xs">
                  <div className="flex gap-4 items-start">
                    {buy.listing?.images?.[0] && (
                      <img src={buy.listing.images[0]} alt={buy.listing.title} className="h-16 w-16 rounded-xl object-cover border border-stone-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-stone-900 truncate">{buy.listing?.title || 'Target Item'}</h3>
                        {getStatusBadge(buy.status)}
                      </div>
                      <p className="mt-1 text-xs text-stone-500">Seller: <span className="font-semibold text-stone-800">{buy.seller?.name || 'Seller'}</span> ({buy.seller?.city})</p>
                      <p className="mt-1 text-xs font-bold text-terra-cotta">Item Price: ₹{buy.listing?.price}</p>

                      <div className="mt-3 flex items-center justify-end">
                        <button
                          onClick={() => handleOpenChat(buy.listing?._id, buy.seller?._id)}
                          className="rounded-xl border border-terra-cotta/30 bg-terra-cotta/10 px-3.5 py-1.5 text-xs font-semibold text-terra-cotta hover:bg-terra-cotta hover:text-white transition"
                        >
                          💬 Chat with Seller
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Received Buy Requests */}
          <div className="glass-card p-6 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center justify-between border-b border-stone-200/60 pb-3">
              <span>Incoming Buy Requests</span>
              <span className="text-xs font-bold text-terra-cotta bg-terra-cotta/10 px-2.5 py-1 rounded-full">{receivedBuys.length} total</span>
            </h2>
            {receivedBuys.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">No incoming purchase requests yet.</p>
            ) : (
              receivedBuys.map((buy) => (
                <div key={buy._id} className="rounded-2xl border border-stone-200 bg-white/80 p-4 space-y-3 shadow-xs">
                  <div className="flex gap-4 items-start">
                    {buy.listing?.images?.[0] && (
                      <img src={buy.listing.images[0]} alt={buy.listing.title} className="h-16 w-16 rounded-xl object-cover border border-stone-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-stone-900 truncate">{buy.listing?.title || 'Your Item'}</h3>
                        {getStatusBadge(buy.status)}
                      </div>
                      <p className="mt-1 text-xs text-stone-500">Buyer: <span className="font-semibold text-stone-800">{buy.buyer?.name}</span> ({buy.buyer?.city})</p>
                      <p className="mt-1 text-xs font-bold text-terra-cotta">Offer Price: ₹{buy.listing?.price}</p>

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {buy.status === 'pending' && (
                          <>
                            <button className="glow-btn rounded-xl px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider" onClick={() => updateBuyStatus(buy._id, 'accept')}>
                              Accept Request
                            </button>
                            <button className="rounded-xl border border-stone-300 px-3.5 py-1.5 text-xs font-semibold hover:bg-stone-100 transition" onClick={() => updateBuyStatus(buy._id, 'reject')}>
                              Decline
                            </button>
                          </>
                        )}
                        {(buy.status === 'accepted') && (
                          <button className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition" onClick={() => updateBuyStatus(buy._id, 'complete')}>
                            Mark Completed & Sold
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenChat(buy.listing?._id, buy.buyer?._id)}
                          className="rounded-xl border border-terra-cotta/30 bg-terra-cotta/10 px-3.5 py-1.5 text-xs font-semibold text-terra-cotta hover:bg-terra-cotta hover:text-white transition ml-auto"
                        >
                          Chat Buyer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
