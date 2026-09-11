'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Badge from '@/components/common/Badge';
import { Appointment } from '@/types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Video, 
  Settings, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  X,
  MessageSquare
} from 'lucide-react';

export default function AppointmentsPage() {
  const { appointments, cancelAppointment, setCurrentScreen, addToast } = useApp();

  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Mock week days
  const weekDays = [
    { name: 'Mon, Sep 14', slots: [] },
    { 
      name: 'Tue, Sep 15 (Tomorrow)', 
      slots: appointments.filter(a => a.dateTime.includes('Tomorrow')) 
    },
    { name: 'Wed, Sep 16', slots: [] },
    { 
      name: 'Thu, Sep 17', 
      slots: appointments.filter(a => a.dateTime.includes('Thursday')) 
    },
    { name: 'Fri, Sep 18', slots: [] },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Appointments & Calendar Sync</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Meetings booked autonomously by Helio via Google Calendar OAuth 2.0 FreeBusy API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Availability Settings</span>
          </button>

          {/* Toggle */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
            <button
              onClick={() => setViewType('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewType === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Weekly Grid
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewType === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Main View: Weekly Grid vs List */}
      {viewType === 'calendar' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900">Week of September 14 – September 18, 2026</h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Google Calendar Connected (Sarah Jenkins)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weekDays.map((day, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl border border-slate-200 p-3 min-h-[320px] flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 pb-2 border-b border-slate-200 mb-3">{day.name}</h4>
                  
                  <div className="space-y-2">
                    {day.slots.map(appt => (
                      <div
                        key={appt.id}
                        onClick={() => setSelectedAppt(appt)}
                        className="p-3 bg-white rounded-xl border border-blue-200 shadow-xs hover:border-blue-500 cursor-pointer transition-all space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-blue-700">
                          <span>{appt.dateTime.split(', ')[1] || '2:00 PM'}</span>
                          <span className="text-[9px] bg-blue-50 px-1 py-0.5 rounded">30m</span>
                        </div>
                        <p className="font-bold text-slate-900 truncate">{appt.visitorName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{appt.company}</p>
                      </div>
                    ))}

                    {day.slots.length === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-8">No bookings</p>
                    )}
                  </div>
                </div>

                <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-slate-200/60">
                  {day.slots.length} scheduled
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {appointments.map(appt => (
              <div
                key={appt.id}
                onClick={() => setSelectedAppt(appt)}
                className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 cursor-pointer transition-colors text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{appt.visitorName}</h4>
                    <p className="text-slate-500">{appt.company} · {appt.visitorEmail}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{appt.dateTime} ({appt.durationMinutes} mins)</span>
                      <span>·</span>
                      <span>Source: {appt.bookingSource}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={appt.status === 'scheduled' ? 'emerald' : appt.status === 'completed' ? 'blue' : 'rose'}>
                    {appt.status.toUpperCase()}
                  </Badge>
                  {appt.meetingLink && (
                    <a
                      href={appt.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Join Meeting"
                    >
                      <Video className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-Chat Booking Preview Card */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-emerald-50/40 rounded-2xl border border-blue-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">How Website Visitors Book Appointments</h4>
            <p className="text-slate-600 text-[11px] mt-0.5">
              When a prospect requests a call, Helio checks your Google Calendar in real time and renders interactive slot chips directly in the chat window.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setCurrentScreen('appearance');
            addToast({
              type: 'info',
              title: 'Widget Preview',
              description: 'Open appearance studio to test in-chat booking chips.'
            });
          }}
          className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          Preview Booking in Widget
        </button>
      </div>

      {/* Appointment Detail Drawer */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 animate-slide-up text-xs">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Appointment Details</h3>
                <button onClick={() => setSelectedAppt(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-slate-800">
                <p><strong>Visitor:</strong> {selectedAppt.visitorName} ({selectedAppt.company})</p>
                <p><strong>Email:</strong> {selectedAppt.visitorEmail}</p>
                <p><strong>Time Slot:</strong> {selectedAppt.dateTime}</p>
                <p><strong>Host:</strong> {selectedAppt.assignedAgent}</p>
                <p><strong>Notes:</strong> {selectedAppt.notes}</p>
              </div>

              {selectedAppt.meetingLink && (
                <a
                  href={selectedAppt.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center flex items-center justify-center gap-2 transition-colors"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Google Meet Video Call</span>
                </a>
              )}

              {selectedAppt.status !== 'cancelled' && (
                <button
                  onClick={() => {
                    cancelAppointment(selectedAppt.id);
                    setSelectedAppt(null);
                  }}
                  className="w-full py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-xl text-center transition-colors"
                >
                  Cancel / Reschedule Meeting
                </button>
              )}
            </div>

            <button
              onClick={() => setSelectedAppt(null)}
              className="w-full py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* Modal: Availability Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Calendar Availability Rules</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Working Days</label>
                <p className="text-slate-800 font-bold bg-slate-50 p-2 rounded-lg border border-slate-200">Monday – Friday</p>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Available Hours</label>
                <p className="text-slate-800 font-bold bg-slate-50 p-2 rounded-lg border border-slate-200">9:00 AM – 5:00 PM CST</p>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Meeting Duration</label>
                <p className="text-slate-800 font-bold bg-slate-50 p-2 rounded-lg border border-slate-200">30 Minutes Discovery</p>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Buffer Between Calls</label>
                <p className="text-slate-800 font-bold bg-slate-50 p-2 rounded-lg border border-slate-200">15 Minutes</p>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
            >
              Save Availability Rules
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
