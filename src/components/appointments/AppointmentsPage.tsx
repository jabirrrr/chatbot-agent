'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
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
  Plus,
  LayoutGrid
} from 'lucide-react';

interface CleanAppointment {
  id: string;
  visitorName: string;
  visitorEmail: string;
  company: string;
  dateTime: string;
  rawDate: Date;
  durationMinutes: number;
  assignedAgent: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No-show';
  meetingLink: string;
}

export default function AppointmentsPage() {
  const { addToast, authToken } = useApp();
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [appts, setAppts] = useState<CleanAppointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<CleanAppointment | null>(null);
  

  
  // Edit Attendees
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);


  const fetchAppointments = async () => {
    try {
      const data = await apiFetch('/api/v1/appointments/', { token: authToken });
      const mapped = data.items.map((item: any) => ({
        id: item.id,
        visitorName: item.attendee_name,
        visitorEmail: item.attendee_email,
        company: 'Unknown', // Not tracked in basic schema
        dateTime: new Date(item.scheduled_at).toLocaleString(),
        rawDate: new Date(item.scheduled_at),
        durationMinutes: item.duration_minutes,
        assignedAgent: 'AI Assistant',
        status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        meetingLink: item.meeting_link || ''
      }));
      setAppts(mapped);
    } catch (e) {
      console.error(e);
      addToast({ title: 'Failed to fetch appointments', type: 'error' });
    }
  };



  useEffect(() => {
    if (authToken) {
      fetchAppointments();
    }
  }, [authToken]);

  const handleCancelAppointment = async (id: string) => {
    try {
      await apiFetch(`/api/v1/appointments/${id}/cancel`, {
        method: 'PATCH',
        token: authToken
      });
      addToast({ title: 'Appointment cancelled', type: 'success' });
      setSelectedAppt(null);
      fetchAppointments();
    } catch (e) {
      addToast({ title: 'Failed to cancel appointment', type: 'error' });
    }
  };

  const handleUpdateAttendees = async () => {
    if (!selectedAppt) return;
    try {
      await apiFetch(`/api/v1/appointments/${selectedAppt.id}/attendees`, {
        method: 'PATCH',
        token: authToken,
        body: JSON.stringify({
          attendee_name: editName,
          attendee_email: editEmail
        })
      });
      addToast({ title: 'Attendees updated', type: 'success' });
      setIsEditOpen(false);
      setSelectedAppt(null);
      fetchAppointments();
    } catch (e) {
      addToast({ title: 'Failed to update attendees', type: 'error' });
    }
  };


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
      default:
        return <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <>
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
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewType('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewType === 'calendar' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewType === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'Scheduled', 'Completed', 'Cancelled'] as const).map(st => (
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

      {/* Main Content */}
      {viewType === 'calendar' ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="px-2 py-3 text-center text-xs font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 auto-rows-[120px]">
            {blanks.map(blank => (
              <div key={`blank-${blank}`} className="border-b border-r border-slate-100/50 bg-slate-50/30 p-2"></div>
            ))}
            
            {days.map(day => {
              const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
              const dayAppts = filteredAppts.filter(a => a.rawDate.toDateString() === dateStr);
              const isToday = dateStr === new Date().toDateString();
              
              return (
                <div key={day} className="border-b border-r border-slate-100/50 p-2 hover:bg-slate-50 transition-colors group flex flex-col">
                  <span className={`text-xs font-medium mb-1 inline-block w-6 h-6 leading-6 text-center rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 ${isToday ? 'bg-indigo-600 text-white group-hover:bg-indigo-600 group-hover:text-white' : 'text-slate-700'}`}>
                    {day}
                  </span>
                  <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden flex-1 scrollbar-hide">
                    {dayAppts.map(appt => (
                      <div 
                        key={appt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppt(appt);
                        }}
                        className={`text-[10px] truncate px-1.5 py-1 rounded cursor-pointer transition-colors ${
                          appt.status === 'Scheduled' ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100' :
                          appt.status === 'Completed' ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100' :
                          'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                        title={`${appt.visitorName} - ${appt.dateTime}`}
                      >
                        {appt.rawDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {appt.visitorName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
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
                  <p className="text-xs text-slate-500">{appt.visitorEmail}</p>
                </div>
                {getStatusBadge(appt.status)}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{appt.dateTime} ({appt.durationMinutes} mins)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Google Meet</span>
              {appt.meetingLink && (
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
              )}
            </div>
          </div>
        ))}

        {filteredAppts.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No appointments matching the selected status.
          </div>
        )}
        </div>
      )}
    </div>

      {/* Appointment Detail Modal */}
      {selectedAppt && !isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
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
                <p className="text-slate-500">{selectedAppt.visitorEmail}</p>
                <div className="pt-1">{getStatusBadge(selectedAppt.status)}</div>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Scheduled Time</span>
                <span className="font-semibold text-slate-900">{selectedAppt.dateTime}</span>
              </div>

              {selectedAppt.meetingLink && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Meeting URL</span>
                  <a href={selectedAppt.meetingLink} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold hover:underline truncate max-w-[200px]">
                    {selectedAppt.meetingLink}
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t border-slate-100">
              {selectedAppt.status !== 'Cancelled' ? (
                <button
                  onClick={() => handleCancelAppointment(selectedAppt.id)}
                  className="px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl"
                >
                  Cancel Meeting
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditName(selectedAppt.visitorName);
                    setEditEmail(selectedAppt.visitorEmail);
                    setIsEditOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Edit Attendees
                </button>
                {selectedAppt.meetingLink && (
                  <a
                    href={selectedAppt.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                  >
                    Launch Meeting
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendees Modal */}
      {isEditOpen && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Edit Attendees</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAttendees}
                className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
