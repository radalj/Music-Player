'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sidebar } from '@/components/common/Sidebar';
import Player from '@/components/common/Player';
import { api } from '@/services/api';
import {
  TicketIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

// ---------- Types ----------
interface VerificationRequest {
  id: string;
  artistName: string;
  email: string;
  portfolio: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reason?: string;
}

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'responded' | 'closed';
  createdAt: string;
  responses: { from: string; message: string; timestamp: string }[];
}

interface FinancialRecord {
  artistId: string;
  artistName: string;
  uniqueListeners: number;
  totalStreams: number;
  calculatedPayout: number;
  status: 'pending' | 'settled';
  month: string;
}

interface SubscriptionPrices {
  silver: number;
  gold: number;
  silverId?: number;
  goldId?: number;
}

const defaultPrices: SubscriptionPrices = { silver: 9.99, gold: 19.99 };

// ---------- Main Component ----------
export default function AdminDashboardPage() {
  const { user, isReady } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'tickets' | 'accounting' | 'settings'>('tickets');

  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [prices, setPrices] = useState<SubscriptionPrices>(defaultPrices);
  const [userDist, setUserDist] = useState<{ name: string; value: number }[]>([
    { name: 'Free', value: 10 },
    { name: 'Silver', value: 5 },
    { name: 'Gold', value: 2 },
  ]);

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showVerificationDetail, setShowVerificationDetail] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ---------- Load API Data ----------
  const loadData = async () => {
    try {
      // 1. Pending artists
      const pendingRes = await api.get('/users/pending-artists/').catch(() => null);
      if (pendingRes?.data && Array.isArray(pendingRes.data)) {
        setVerifications(
          pendingRes.data.map((item: any) => ({
            id: item.id.toString(),
            artistName: item.display_name || item.username,
            email: item.email,
            portfolio: item.portfolio || 'N/A',
            status: item.verified ? 'approved' : item.awaiting_approval ? 'pending' : 'rejected',
            submittedAt: new Date().toISOString(),
          }))
        );
      }

      // 2. Support Tickets
      const ticketsRes = await api.get('/tickets/tickets/').catch(() => null);
      if (ticketsRes?.data) {
        const rawTickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : ticketsRes.data.results || [];
        setTickets(
          rawTickets.map((tItem: any) => ({
            id: tItem.id.toString(),
            userId: tItem.user ? tItem.user.toString() : '',
            userName: tItem.user_name || tItem.user_email || 'User',
            subject: tItem.subject,
            message: tItem.subject,
            status: tItem.status === 'replied' ? 'responded' : tItem.status,
            createdAt: tItem.created_at,
            responses: (tItem.replies || []).map((r: any) => ({
              from: r.sender_name || r.sender_role,
              message: r.message,
              timestamp: r.created_at,
            })),
          }))
        );
      }

      // 3. Financial audit
      const finRes = await api.get('/reports/financial/monthly/').catch(() => null);
      if (finRes?.data && finRes.data.artists) {
        setFinancials(
          finRes.data.artists.map((a: any) => ({
            artistId: a.artist_id.toString(),
            artistName: a.artist_name,
            uniqueListeners: a.unique_listeners,
            totalStreams: a.total_streams,
            calculatedPayout: a.calculated_payout,
            status: a.status,
            month: finRes.data.month,
          }))
        );
      }

      // 4. Plans & Prices
      const plansRes = await api.get('/subscriptions/plans/').catch(() => null);
      if (plansRes?.data) {
        const plans = Array.isArray(plansRes.data) ? plansRes.data : plansRes.data.results || [];
        const silverP = plans.find((p: any) => p.name === 'silver');
        const goldP = plans.find((p: any) => p.name === 'gold');
        setPrices({
          silver: silverP ? parseFloat(silverP.price) : 9.99,
          gold: goldP ? parseFloat(goldP.price) : 19.99,
          silverId: silverP?.id,
          goldId: goldP?.id,
        });
      }

      // 5. User Distribution Chart
      const distRes = await api.get('/reports/revenue/subscription/').catch(() => null);
      if (distRes?.data && distRes.data.subscription_distribution) {
        setUserDist(
          distRes.data.subscription_distribution.map((d: any) => ({
            name: d.plan__name ? d.plan__name.toUpperCase() : 'FREE',
            value: d.count,
          }))
        );
      }
    } catch (e) {
      console.error('Error fetching admin dashboard data:', e);
    }
  };

  useEffect(() => {
    if (!isReady || !user) return;
    if (user.role === 'admin' || user.role === 'supporter') {
      loadData();
    }
  }, [isReady, user]);

  // ---------- Handlers ----------
  const handleVerify = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await api.post(`/users/artists/${id}/approve/`);
      } else {
        await api.post(`/users/artists/${id}/reject/`, { reason: rejectionReason });
      }
      toast.success(`Artist ${action === 'approve' ? 'approved' : 'rejected'}`);
      loadData();
    } catch (e) {
      toast.error(`Action failed`);
    }
    setShowVerificationDetail(null);
    setRejectionReason('');
  };

  const handleReplyTicket = async (ticketId: string) => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty.');
      return;
    }
    try {
      await api.post(`/tickets/tickets/${ticketId}/reply/`, { message: replyText.trim() });
      toast.success('Reply sent successfully.');
      setReplyText('');
      setSelectedTicket(null);
      loadData();
    } catch (e) {
      toast.error('Failed to send reply');
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      await api.patch(`/tickets/tickets/${ticketId}/close/`);
      toast.success('Ticket closed.');
      loadData();
    } catch (e) {
      toast.error('Failed to close ticket');
    }
  };

  const handleSettlePayment = async (artistId: string) => {
    try {
      await api.post(`/reports/financial/settle/${artistId}/`);
      toast.success('Payment marked as settled.');
      loadData();
    } catch (e) {
      toast.error('Settlement failed');
    }
  };

  const handlePriceUpdate = async () => {
    try {
      const res = await api.patch('/subscriptions/plans/prices/', {
        silver: prices.silver,
        gold: prices.gold,
      });
      const plans = Array.isArray(res.data?.plans) ? res.data.plans : [];
      const silverP = plans.find((p: any) => p.name === 'silver');
      const goldP = plans.find((p: any) => p.name === 'gold');
      setPrices({
        silver: silverP ? parseFloat(silverP.price) : prices.silver,
        gold: goldP ? parseFloat(goldP.price) : prices.gold,
        silverId: silverP?.id ?? prices.silverId,
        goldId: goldP?.id ?? prices.goldId,
      });
      toast.success('Prices updated for all users.');
    } catch (e) {
      toast.error('Failed to update prices');
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">Please login to access admin panel.</p>
      </div>
    );
  }

  if (user.role !== 'admin' && user.role !== 'supporter') {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white">Access denied. You are not authorized.</p>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];
  const totalRevenue = financials.reduce((acc, f) => acc + f.calculatedPayout, 0);
  const totalStreams = financials.reduce((acc, f) => acc + f.totalStreams, 0);

  // ---------- Render tabs ----------
  const renderTicketsTab = () => (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">🎫 Support Tickets</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
          <thead className="text-xs uppercase bg-[#2a2a2a]">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-800 hover:bg-[#1a1a1a]">
                <td className="px-4 py-2 font-mono text-xs">{ticket.id.slice(0, 6)}</td>
                <td className="px-4 py-2">{ticket.userName}</td>
                <td className="px-4 py-2">{ticket.subject}</td>
                <td className="px-4 py-2">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    ticket.status === 'open' ? 'bg-green-600/20 text-green-400' :
                    ticket.status === 'responded' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-gray-600/20 text-gray-400'
                  }`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="text-primary hover:underline text-xs"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ticket detail modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl max-w-2xl w-full border border-gray-800 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Ticket #{selectedTicket.id.slice(0, 6)}</h3>
              <button onClick={() => { setSelectedTicket(null); setReplyText(''); }} className="text-text-secondary hover:text-white">✕</button>
            </div>
            <p className="text-text-secondary"><strong>User:</strong> {selectedTicket.userName}</p>
            <p className="text-text-secondary"><strong>Subject:</strong> {selectedTicket.subject}</p>
            {selectedTicket.responses.length > 0 && (
              <div className="mt-4">
                <p className="text-text-secondary"><strong>Responses:</strong></p>
                {selectedTicket.responses.map((r, idx) => (
                  <div key={idx} className="bg-[#2a2a2a] p-3 rounded mt-2">
                    <p className="text-xs text-text-secondary">{r.from} - {new Date(r.timestamp).toLocaleString()}</p>
                    <p className="text-white">{r.message}</p>
                  </div>
                ))}
              </div>
            )}
            {selectedTicket.status !== 'closed' ? (
              <div className="mt-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleReplyTicket(selectedTicket.id)}
                    className="px-4 py-2 bg-primary text-white font-medium rounded hover:bg-green-400 transition"
                  >
                    Send Reply
                  </button>
                  <button
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                    className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded hover:bg-red-600/30 transition"
                  >
                    Close Ticket
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-text-secondary">This ticket is closed.</div>
            )}
          </div>
        </div>
      )}

      {/* Verification Requests */}
      <h2 className="text-xl font-bold text-white mt-8 mb-4">🆕 Artist Verification Requests</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
          <thead className="text-xs uppercase bg-[#2a2a2a]">
            <tr>
              <th className="px-4 py-2">Artist ID</th>
              <th className="px-4 py-2">Artist Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Submitted</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {verifications.map((v) => (
              <tr key={v.id} className="border-b border-gray-800 hover:bg-[#1a1a1a]">
                <td className="px-4 py-2">{v.id}</td>
                <td className="px-4 py-2">{v.artistName}</td>
                <td className="px-4 py-2">{v.email}</td>
                <td className="px-4 py-2">{new Date(v.submittedAt).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    v.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                    v.status === 'approved' ? 'bg-green-600/20 text-green-400' :
                    'bg-red-600/20 text-red-400'
                  }`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {v.status === 'pending' && (
                    <button
                      onClick={() => setShowVerificationDetail(v)}
                      className="text-primary hover:underline text-xs"
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verification detail modal */}
      {showVerificationDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full border border-gray-800 p-6">
            <h3 className="text-xl font-bold text-white mb-2">Verify Artist</h3>
            <p><strong>Artist:</strong> {showVerificationDetail.artistName}</p>
            <p><strong>Email:</strong> {showVerificationDetail.email}</p>
            <p><strong>Portfolio:</strong> {showVerificationDetail.portfolio}</p>
            <div className="mt-4">
              <textarea
                placeholder="Rejection reason (if rejecting)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
                rows={2}
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleVerify(showVerificationDetail.id, 'approve')}
                className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                <CheckIcon className="w-5 h-5 inline mr-1" /> Approve
              </button>
              <button
                onClick={() => handleVerify(showVerificationDetail.id, 'reject')}
                className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                <XMarkIcon className="w-5 h-5 inline mr-1" /> Reject
              </button>
              <button
                onClick={() => { setShowVerificationDetail(null); setRejectionReason(''); }}
                className="flex-1 py-2 bg-[#2a2a2a] text-white border border-gray-600 rounded hover:bg-[#333] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccountingTab = () => (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">📊 Accounting & Financial Reports</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
          <thead className="text-xs uppercase bg-[#2a2a2a]">
            <tr>
              <th className="px-4 py-2">Artist</th>
              <th className="px-4 py-2">Listeners</th>
              <th className="px-4 py-2">Streams</th>
              <th className="px-4 py-2">Payout</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {financials.map((f) => (
              <tr key={f.artistId} className="border-b border-gray-800 hover:bg-[#1a1a1a]">
                <td className="px-4 py-2">{f.artistName}</td>
                <td className="px-4 py-2">{f.uniqueListeners.toLocaleString()}</td>
                <td className="px-4 py-2">{f.totalStreams.toLocaleString()}</td>
                <td className="px-4 py-2">${f.calculatedPayout.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    f.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-green-600/20 text-green-400'
                  }`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {f.status === 'pending' && isAdmin && (
                    <button
                      onClick={() => handleSettlePayment(f.artistId)}
                      className="text-primary hover:underline text-xs"
                    >
                      Settle
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-text-secondary text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-green-400">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-text-secondary text-sm">Total Streams</p>
          <p className="text-2xl font-bold text-white">{totalStreams.toLocaleString()}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-text-secondary text-sm">Artists</p>
          <p className="text-2xl font-bold text-white">{financials.length}</p>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">⚙️ Subscription Prices & Advanced Settings</h2>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1">Silver Plan Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={prices.silver}
              onChange={(e) => setPrices({ ...prices, silver: parseFloat(e.target.value) || 0 })}
              className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1">Gold Plan Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={prices.gold}
              onChange={(e) => setPrices({ ...prices, gold: parseFloat(e.target.value) || 0 })}
              className="w-full p-3 bg-[#2a2a2a] rounded text-white border border-gray-700 focus:border-primary outline-none transition"
            />
          </div>
        </div>
        <p className="text-text-secondary text-sm mt-3">
          New prices apply immediately to every user on the subscriptions and checkout pages.
        </p>
        <button
          onClick={handlePriceUpdate}
          disabled={!isAdmin}
          data-testid="update-plan-prices"
          className="mt-4 px-6 py-2 bg-primary text-black font-medium rounded-full hover:bg-green-400 transition disabled:opacity-50"
        >
          Update Prices for All Users
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">📈 User Distribution</h3>
        <div className="flex flex-wrap gap-8">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDist}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
            <h4 className="text-white mb-2">Revenue Breakdown</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={financials}>
                <XAxis dataKey="artistName" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Bar dataKey="calculatedPayout" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">🔧 Support & Admin Dashboard</h1>
            <span className="text-text-secondary text-sm">
              {user.role === 'admin' ? 'Admin' : 'Supporter'} access
            </span>
          </div>

          <div className="flex space-x-2 mb-6 border-b border-gray-800 pb-2">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'tickets' ? 'bg-gray-600 text-white' : 'text-text-secondary hover:bg-[#1a1a1a]'
              }`}
            >
              <TicketIcon className="w-4 h-4 inline mr-1" /> Tickets & Verification
            </button>
            <button
              onClick={() => setActiveTab('accounting')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'accounting' ? 'bg-gray-600 text-white' : 'text-text-secondary hover:bg-[#1a1a1a]'
              }`}
            >
              <CurrencyDollarIcon className="w-4 h-4 inline mr-1" /> Accounting
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'settings' ? 'bg-gray-600 text-white' : 'text-text-secondary hover:bg-[#1a1a1a]'
                }`}
              >
                <Cog6ToothIcon className="w-4 h-4 inline mr-1" /> Settings
              </button>
            )}
          </div>

          <div className="bg-[#0f0f0f] rounded-xl border border-gray-800 p-6">
            {activeTab === 'tickets' && renderTicketsTab()}
            {activeTab === 'accounting' && renderAccountingTab()}
            {activeTab === 'settings' && isAdmin && renderSettingsTab()}
          </div>
        </div>
      </main>
      <Player />
    </div>
  );
}