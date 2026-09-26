'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import TimezoneSelector from '@/components/common/TimezoneSelector';
import { normalizeIanaTimezone } from '@/lib/timezones';
import { fetchUserOrganizations, updateOrganization } from '@/lib/api';
import { 
  Building2, 
  Users, 
  Bell, 
  ShieldCheck, 
  Trash2, 
  Mail, 
  UserPlus, 
  Save, 
  Download, 
  AlertTriangle, 
  Globe, 
  RefreshCw
} from 'lucide-react';
import Badge from '@/components/common/Badge';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Agent' | 'Viewer';
  avatar: string;
  status: 'Active' | 'Invited';
  lastActive: string;
}

export default function SettingsPage() {
  const { addToast, authToken } = useApp();

  const [activeTab, setActiveTab] = useState<'organization' | 'team' | 'notifications' | 'privacy' | 'danger'>('organization');

  // Organizations List & Active Selection
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; timezone: string; website?: string; industry?: string }>>([
    { id: 'org_northstar', name: 'Northstar Studio', timezone: 'America/Chicago', website: 'https://northstarstudio.agency', industry: 'Digital Marketing & Creative Agency' }
  ]);
  const [activeOrgId, setActiveOrgId] = useState<string>('org_northstar');
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Organization Form State
  const [orgName, setOrgName] = useState('Northstar Studio');
  const [orgWebsite, setOrgWebsite] = useState('https://northstarstudio.agency');
  const [orgTimezone, setOrgTimezone] = useState('America/Chicago');
  const [orgEmail, setOrgEmail] = useState('sarah@northstarstudio.agency');
  const [orgIndustry, setOrgIndustry] = useState('Digital Marketing & Creative Agency');

  // Load organizations from backend or local cache
  useEffect(() => {
    async function loadOrgs() {
      if (authToken) {
        try {
          const backendOrgs = await fetchUserOrganizations(authToken);
          if (Array.isArray(backendOrgs) && backendOrgs.length > 0) {
            const mapped = backendOrgs.map((o: any) => ({
              id: o.id,
              name: o.name,
              timezone: normalizeIanaTimezone(o.timezone),
              website: o.website || '',
              industry: o.industry || ''
            }));
            setOrganizations(mapped);
            const savedOrgId = typeof window !== 'undefined' ? localStorage.getItem('helio_active_org_id') : null;
            const toSelect = mapped.find(o => o.id === savedOrgId) || mapped[0];
            setActiveOrgId(toSelect.id);
            setOrgName(toSelect.name);
            setOrgWebsite(toSelect.website || '');
            setOrgIndustry(toSelect.industry || '');
            setOrgTimezone(normalizeIanaTimezone(toSelect.timezone));
            return;
          }
        } catch (e) {
          console.warn('Failed to fetch organizations from backend:', e);
        }
      }

      // Local fallback
      if (typeof window !== 'undefined') {
        const savedOrgId = localStorage.getItem('helio_active_org_id') || 'org_northstar';
        const stored = localStorage.getItem(`helio_org_profile_${savedOrgId}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.name) setOrgName(parsed.name);
            if (parsed.website) setOrgWebsite(parsed.website);
            if (parsed.industry) setOrgIndustry(parsed.industry);
            if (parsed.timezone) setOrgTimezone(normalizeIanaTimezone(parsed.timezone));
          } catch {}
        }
      }
    }
    loadOrgs();
  }, [authToken]);

  // Switch active organization
  const handleSelectOrganization = (orgId: string) => {
    setActiveOrgId(orgId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('helio_active_org_id', orgId);
    }
    const target = organizations.find(o => o.id === orgId);
    if (target) {
      setOrgName(target.name);
      setOrgWebsite(target.website || '');
      setOrgIndustry(target.industry || '');
      const tz = normalizeIanaTimezone(target.timezone);
      setOrgTimezone(tz);
      addToast({
        type: 'info',
        title: 'Switched Workspace',
        description: `Loaded ${target.name} (Operating Timezone: ${tz})`
      });
    }
  };

  // Team Members State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 'tm_1',
      name: 'Sarah Jenkins',
      email: 'sarah@northstarstudio.agency',
      role: 'Owner',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      status: 'Active',
      lastActive: 'Just now'
    },
    {
      id: 'tm_2',
      name: 'Marcus Vance',
      email: 'marcus@northstarstudio.agency',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      status: 'Active',
      lastActive: '18 mins ago'
    },
    {
      id: 'tm_3',
      name: 'Elena Rostova',
      email: 'elena@northstarstudio.agency',
      role: 'Agent',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      status: 'Active',
      lastActive: '2 hours ago'
    },
    {
      id: 'tm_4',
      name: 'David Chen',
      email: 'david@northstarstudio.agency',
      role: 'Agent',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      status: 'Active',
      lastActive: '1 day ago'
    }
  ]);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Agent' | 'Viewer'>('Agent');

  // Notification Toggles
  const [notifyNewLead, setNotifyNewLead] = useState(true);
  const [notifyHandoff, setNotifyHandoff] = useState(true);
  const [notifyBooking, setNotifyBooking] = useState(true);
  const [notifyDailyDigest, setNotifyDailyDigest] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(false);

  // Privacy & Retention
  const [retentionDays, setRetentionDays] = useState('90');
  const [anonymizeIp, setAnonymizeIp] = useState(true);
  const [cookieConsent, setCookieConsent] = useState(true);
  const [aiTrainingConsent, setAiTrainingConsent] = useState(false);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOrg(true);
    const canonicalTz = normalizeIanaTimezone(orgTimezone);

    if (authToken && activeOrgId && !activeOrgId.startsWith('org_')) {
      const res = await updateOrganization(authToken, activeOrgId, {
        name: orgName,
        website: orgWebsite,
        industry: orgIndustry,
        timezone: canonicalTz
      });
      if (res && res.error) {
        addToast({
          type: 'error',
          title: 'Update Failed',
          description: res.error
        });
        setIsSavingOrg(false);
        return;
      }
    }

    // Update state and local storage
    setOrganizations(prev => prev.map(o => o.id === activeOrgId ? {
      ...o,
      name: orgName,
      website: orgWebsite,
      industry: orgIndustry,
      timezone: canonicalTz
    } : o));

    if (typeof window !== 'undefined') {
      localStorage.setItem(`helio_org_profile_${activeOrgId}`, JSON.stringify({
        name: orgName,
        website: orgWebsite,
        industry: orgIndustry,
        timezone: canonicalTz
      }));
    }

    setOrgTimezone(canonicalTz);
    setIsSavingOrg(false);
    addToast({
      type: 'success',
      title: 'Organization Settings Saved',
      description: `${orgName} workspace profile updated. Operating timezone: ${canonicalTz}.`
    });
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember: TeamMember = {
      id: `tm_${Date.now()}`,
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 1000000)}?w=100&h=100&fit=crop&crop=face`,
      status: 'Invited',
      lastActive: 'Invitation Pending'
    };

    setTeamMembers(prev => [...prev, newMember]);
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteName('');
    addToast({
      type: 'success',
      title: 'Invitation Sent',
      description: `An invite was dispatched to ${inviteEmail} with ${inviteRole} permissions.`
    });
  };

  const handleRemoveMember = (id: string, name: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    addToast({
      type: 'info',
      title: 'Member Removed',
      description: `${name} has been removed from Northstar Studio workspace.`
    });
  };

  const handleExportData = () => {
    addToast({
      type: 'info',
      title: 'Export Generating',
      description: 'Preparing your data archive (leads, conversations, appointment records). Download will start shortly.'
    });
    setTimeout(() => {
      addToast({
        type: 'success',
        title: 'Export Complete',
        description: 'northstar_studio_backup_2026.zip has been generated.'
      });
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization & Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage workspace profile, team permissions, notification dispatch, and data retention policies.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {[
          { id: 'organization', label: 'Organization Profile', icon: Building2 },
          { id: 'team', label: 'Team Members', icon: Users, count: teamMembers.length },
          { id: 'notifications', label: 'Notification Rules', icon: Bell },
          { id: 'privacy', label: 'Privacy & Retention', icon: ShieldCheck },
          { id: 'danger', label: 'Data & Security', icon: AlertTriangle },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Organization Profile */}
      {activeTab === 'organization' && (
        <form onSubmit={handleSaveOrg} className="space-y-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Workspace Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These details represent your business across all AI chatbot interactions, email triggers, and appointment confirmations.
            </p>
          </div>

          {organizations.length > 1 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-700">
                Switch Workspace:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {organizations.map(org => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSelectOrganization(org.id)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                      org.id === activeOrgId
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {org.name} ({org.timezone})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Organization Legal Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Primary Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={orgWebsite}
                  onChange={e => setOrgWebsite(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Industry Category
              </label>
              <input
                type="text"
                value={orgIndustry}
                onChange={e => setOrgIndustry(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Primary Operator / Contact Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={orgEmail}
                  onChange={e => setOrgEmail(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="operating-timezone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Operating Timezone (For Calendar & Bot Scheduling)
              </label>
              <TimezoneSelector
                id="operating-timezone"
                value={orgTimezone}
                onChange={setOrgTimezone}
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                All AI appointment bookings, operator handoffs, and customer conversation timestamps align to this business timezone.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={isSavingOrg}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-xs transition-colors"
            >
              {isSavingOrg ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Team Members */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Workspace Members & Operators</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign teammates to take over live chats, handle incoming booked discovery calls, and manage bot configurations.
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Teammate</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Member</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Last Active</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {teamMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={member.role === 'Owner' ? 'purple' : member.role === 'Admin' ? 'blue' : 'gray'}>
                        {member.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        member.status === 'Active' ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          member.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {member.lastActive}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.role !== 'Owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Notification Rules */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Event Notification Dispatch</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control when Northstar Studio operators receive real-time email alerts and daily AI briefings.
            </p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Hot Lead Qualified Alert</p>
                <p className="text-xs text-slate-500">
                  Send instant email to assigned operator when visitor score reaches 75+
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyNewLead(!notifyNewLead)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyNewLead ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  notifyNewLead ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Human Operator Handoff Request</p>
                <p className="text-xs text-slate-500">
                  Alert Sarah Jenkins and on-duty operators immediately when a visitor clicks "Talk to a person"
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyHandoff(!notifyHandoff)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyHandoff ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  notifyHandoff ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">New Discovery Call Booked</p>
                <p className="text-xs text-slate-500">
                  Trigger calendar invite and email notification when an appointment is scheduled via widget
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyBooking(!notifyBooking)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyBooking ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  notifyBooking ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Daily Morning AI Briefing</p>
                <p className="text-xs text-slate-500">
                  Delivered at 8:00 AM CST: 24-hr resolution summary, hot leads, and top unanswered questions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyDailyDigest(!notifyDailyDigest)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyDailyDigest ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  notifyDailyDigest ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Weekly Executive Performance Digest</p>
                <p className="text-xs text-slate-500">
                  Weekly high-level report comparing conversion rates, AI costs, and lead velocity
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyWeeklyReport(!notifyWeeklyReport)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyWeeklyReport ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  notifyWeeklyReport ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => addToast({ type: 'success', title: 'Notification Rules Saved', description: 'Your alert dispatch preferences are active.' })}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Privacy & Retention */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Data Governance & Compliance</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ensure compliance with GDPR, CCPA, and customer privacy agreements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Conversation History Retention
              </label>
              <select
                value={retentionDays}
                onChange={e => setRetentionDays(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="30">30 Days (Strict Privacy)</option>
                <option value="90">90 Days (Recommended for SMBs)</option>
                <option value="180">180 Days (Half Year)</option>
                <option value="365">365 Days (1 Year)</option>
                <option value="forever">Indefinite Retention</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Inactive threads older than this window will be purged automatically.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                IP Address Masking
              </label>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="maskIp"
                  checked={anonymizeIp}
                  onChange={e => setAnonymizeIp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="maskIp" className="text-sm text-slate-700">
                  Anonymize visitor IP addresses (e.g. 192.0.2.xxx)
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="cookieBanner"
                checked={cookieConsent}
                onChange={e => setCookieConsent(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <label htmlFor="cookieBanner" className="text-sm font-semibold text-slate-800">
                  Require Cookie Banner Consent Before Widget Storage
                </label>
                <p className="text-xs text-slate-500">
                  When enabled, session localStorage for thread continuity will only be saved after user interaction.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="aiOptOut"
                checked={aiTrainingConsent}
                onChange={e => setAiTrainingConsent(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <label htmlFor="aiOptOut" className="text-sm font-semibold text-slate-800">
                  Zero Data Retention Agreement with Foundation Providers
                </label>
                <p className="text-xs text-slate-500">
                  Guarantee your Northstar Studio client queries are never used to train public LLM models (enforced via OpenRouter enterprise terms).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => addToast({ type: 'success', title: 'Privacy Settings Updated', description: 'Data retention and masking rules applied.' })}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Compliance Rules</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Data & Danger Zone */}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900">Workspace Data Backup</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Download complete structured archives of all captured leads, full conversation transcripts, and appointments.
            </p>
            <div className="mt-4">
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold px-4 py-2 rounded-lg border border-slate-300 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export All Records (.JSON / .CSV)</span>
              </button>
            </div>
          </div>

          <div className="bg-rose-50/60 rounded-xl border border-rose-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-base">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-rose-600">
              Irreversible destructive actions for the Northstar Studio workspace.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-rose-200/60">
              <div>
                <p className="text-sm font-semibold text-slate-900">Purge Bot Memory & Knowledge Cache</p>
                <p className="text-xs text-slate-500">
                  Clears all compiled vector embeddings and forces full re-indexing of all sources.
                </p>
              </div>
              <button
                onClick={() => addToast({ type: 'warning', title: 'Vector Cache Purged', description: 'Re-indexing scheduled in background.' })}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg border border-rose-300 transition-colors"
              >
                Purge Embeddings
              </button>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-rose-200/60">
              <div>
                <p className="text-sm font-semibold text-slate-900">Delete Workspace</p>
                <p className="text-xs text-slate-500">
                  Permanently deletes the Northstar Studio account, active chatbots, and all historical records.
                </p>
              </div>
              <button
                onClick={() => addToast({ type: 'error', title: 'Action Prohibited', description: 'Cannot delete primary demo organization account.' })}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Links */}
      <div className="pt-8 border-t border-slate-100 flex items-center justify-center gap-6 text-sm text-slate-500">
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">Terms of Service</a>
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
      </div>

      {/* Invite Member Modal */}

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Invite Team Member</h3>
            <p className="text-xs text-slate-500 mt-1">
              They will receive an email invitation to collaborate on Northstar Studio chatbots.
            </p>

            <form onSubmit={handleSendInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rachel Miller"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Work Email</label>
                <input
                  type="email"
                  placeholder="rachel@northstarstudio.agency"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Access Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Agent">Agent (Can chat with visitors, manage leads, view bookings)</option>
                  <option value="Admin">Admin (Can edit bot knowledge, appearance, and models)</option>
                  <option value="Viewer">Viewer (Read-only access to analytics and transcripts)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
