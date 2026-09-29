import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const toast = useToast();
  const [data, setData] = useState({ items: [], total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ role: "", q: "" });
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    const sp = new URLSearchParams();
    sp.set("limit", String(PAGE_SIZE));
    sp.set("page", String(page));
    if (filter.role) sp.set("role", filter.role);
    if (filter.q) sp.set("q", filter.q);
    api.get(`/admin/users?${sp.toString()}`)
      .then((r) => setData(r.data))
      .catch((err) => toast.error(getErrorMessage(err, "Could not load users")));
  };

  useEffect(load, [page, filter]);

  const toggleVerify = async (u) => {
    setBusyId(u._id);
    try {
      const res = await api.post(`/admin/users/${u._id}/verify`);
      setData((d) => ({ ...d, items: d.items.map((x) => (x._id === u._id ? res.data.user : x)) }));
      toast.success(`${u.name} ${res.data.user.verified ? "verified" : "unverified"}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update user"));
    } finally {
      setBusyId(null);
    }
  };

  const toggleSuspend = async (u) => {
    setBusyId(u._id);
    try {
      const res = await api.post(`/admin/users/${u._id}/suspend`);
      setData((d) => ({ ...d, items: d.items.map((x) => (x._id === u._id ? res.data.user : x)) }));
      toast.success(`${u.name} ${res.data.user.suspended ? "suspended" : "restored"}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update user"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-900">Users</h1>
      <p className="text-sm text-brand-600">Verify farmers and manage suspensions.</p>

      <div className="card mt-4 grid grid-cols-1 gap-3 p-3 md:grid-cols-3">
        <input
          className="input md:col-span-2"
          placeholder="Search by name or email…"
          value={filter.q}
          onChange={(e) => { setFilter({ ...filter, q: e.target.value }); setPage(1); }}
        />
        <select className="input" value={filter.role}
          onChange={(e) => { setFilter({ ...filter, role: e.target.value }); setPage(1); }}>
          <option value="">All roles</option>
          <option value="farmer">Farmers</option>
          <option value="buyer">Buyers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase text-brand-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Region</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {data.items.map((u) => (
              <tr key={u._id} className={u.suspended ? "bg-red-50/50" : ""}>
                <td className="px-3 py-2 font-medium text-brand-900">{u.name}{u.verified && <span className="ml-1 text-blue-600">✓</span>}</td>
                <td className="px-3 py-2 text-brand-700">{u.email}</td>
                <td className="px-3 py-2 capitalize text-brand-700">{u.role}</td>
                <td className="px-3 py-2 text-brand-700">{u.plan?.id || "free"}</td>
                <td className="px-3 py-2 text-brand-700">{u.region || "—"}</td>
                <td className="px-3 py-2">
                  {u.suspended ? <span className="badge bg-red-100 text-red-700">Suspended</span> : <span className="badge bg-emerald-100 text-emerald-700">Active</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button
                      className="rounded-md border border-brand-200 px-2 py-1 text-xs text-brand-700 hover:bg-brand-50"
                      disabled={busyId === u._id}
                      onClick={() => toggleVerify(u)}
                    >
                      {u.verified ? "Unverify" : "Verify"}
                    </button>
                    {u.role !== "admin" && (
                      <button
                        className={`rounded-md border px-2 py-1 text-xs hover:bg-brand-50 ${
                          u.suspended ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-700"
                        }`}
                        disabled={busyId === u._id}
                        onClick={() => toggleSuspend(u)}
                      >
                        {u.suspended ? "Restore" : "Suspend"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="text-sm text-brand-700">Page {page} of {data.totalPages}</span>
          <button className="btn-outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
