'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Video, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  X,
  Mail,
  Building,
  Plus
} from 'lucide-react';

interface CleanAppointment {
  id: string;
  visitorName: string;
  visitorEmail: string;
  company: string;
  dateTime: string;
  durationMinutes: number;
  assignedAgent: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-show';
  meetingLink: string;
}

const mockAppointmentsList: CleanAppointment[] = [
  {
    id: 'appt_1',
    visitorName: 'Priya Sharma',
    visitorEmail: 'priya.sharma@example.com',
    company: 'Apex Retailers',
    dateTime: 'Tomorrow at 10:30 AM',
    durationMinutes: 30,
    assignedAgent: 'Mohamed (Founder)',
    status: 'Scheduled',
    meetingLink: 'https://meet.google.com/xyz-chatly-demo'
  },
  {
    id: 'appt_2',
    visitorName: 'Arjun Kumar',
    visitorEmail: 'arjun.kumar@fintech.io',
    company: 'Nova Pay',
    dateTime: 'Sep 10, 2025 at 3:00 PM',
    durationMinutes: 45,
    assignedAgent: 'Mohamed (Founder)',
    status: 'Scheduled',
    meetingLink: 'https://meet.google.com/nov-chatly-call'
  },
  {
    id: 'appt_3',
    visitorName: 'Sneha Patel',
    visitorEmail: 'sneha@cloudscale.com',
    company: 'CloudScale Tech',
    dateTime: 'Sep 5, 2025 at 11:00 AM',
    durationMinutes: 30,
    assignedAgent: 'Sales Specialist',
    status: 'Completed',
    meetingLink: 'https://meet.google.com/cld-chatly-done'
  },
  {
    id: 'appt_4',
    visitorName: 'Rahul Mehta',
    visitorEmail: 'rahul.mehta@techcorp.in',
    company: 'TechCorp India',
    dateTime: 'Sep 3, 2025 at 4:00 PM',
    durationMinutes: 30,
    assignedAgent: 'Technical Lead',
    status: 'Cancelled',
    meetingLink: 'https://meet.google.com/tch-chatly-canc'
  },
  {
    id: 'appt_5',
    visitorName: 'Vikram Singh',
    visitorEmail: 'vikram.singh@retailhub.com',
    company: 'RetailHub',
    dateTime: 'Sep 1, 2025 at 2:30 PM',
    durationMinutes: 30,
    assignedAgent: 'Sales Specialist',
    status: 'No-show',
    meetingLink: 'https://meet.google.com/ret-chatly-miss'
  }
];

export default function AppointmentsPage() {
  const { addToast } = useApp();
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [appts, setAppts] = useState<CleanAppointment[]>(mockAppointmentsList);
  const [selectedAppt, setSelectedAppt] = useState<CleanAppointment | null>(null);

  const filteredAppts = appts.filter(a => {
    if (statusFilter === 'all') return true;
    return a.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusBadge = (status: CleanAppointment['status']) => {
    switch (status) {
      case 'Scheduled':
        return <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">Scheduled</span>;
      case 'Completed':
        return <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">Completed</span>;
      case 'Cancelled':
        return <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">Cancelled</span>;
      case 'No-show':
        return <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">No-show</span>;
    }
  };

  return (
    <div className="space-y-6 page-transition pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Appointments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated meetings and demos scheduled directly through your chatbot.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Calendar / List Toggle */}
          <div className="flex items-center p-1 bg-slate-100/90 border border-slate-200/80 rounded-xl">
            <button
              onClick={() => setViewType('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewType === 'calendar'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewType === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'Scheduled', 'Completed', 'Cancelled', 'No-show'] as const).map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors ${
              statusFilter.toLowerCase() === st.toLowerCase()
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            {st === 'all' ? 'All Appointments' : st}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAppts.map(appt => (
          <div
            key={appt.id}
            onClick={() => setSelectedAppt(appt)}
            className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{appt.visitorName}</h3>
                  <p className="text-xs text-slate-500">{appt.company}</p>
                </div>
                {getStatusBadge(appt.status)}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{appt.dateTime} ({appt.durationMinutes} mins)</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Host: {appt.assignedAgent}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Google Meet</span>
              <a
                href={appt.meetingLink}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Join Call</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}

        {filteredAppts.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No appointments matching the selected status.
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-fade-in space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Appointment Overview</h3>
              <button
                onClick={() => setSelectedAppt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-900 text-sm">{selectedAppt.visitorName}</p>
                <p className="text-slate-500">{selectedAppt.company} · {selectedAppt.visitorEmail}</p>
                <div className="pt-1">{getStatusBadge(selectedAppt.status)}</div>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Scheduled Time</span>
                <span className="font-semibold text-slate-900">{selectedAppt.dateTime}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Assigned Host</span>
                <span className="font-semibold text-slate-900">{selectedAppt.assignedAgent}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">Meeting URL</span>
                <a href={selectedAppt.meetingLink} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold hover:underline truncate max-w-[200px]">
                  {selectedAppt.meetingLink}
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedAppt(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Close
              </button>
              <a
                href={selectedAppt.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
              >
                Launch Meeting
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
