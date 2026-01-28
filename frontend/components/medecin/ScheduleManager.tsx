"use client";

import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, Plus, Trash2, Save,
    AlertCircle, CheckCircle, Loader2, CalendarRange
} from 'lucide-react';
import { medecinApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Schedule {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    slotDurationMinutes: number;
    isActive: boolean;
}

interface Unavailability {
    id: string;
    startDateTime: string;
    endDateTime: string;
    reason: string;
}

interface ScheduleManagerProps {
    doctorId: string;
}

const DAYS_OF_WEEK = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

const DAY_LABELS: Record<string, string> = {
    MONDAY: 'Lundi',
    TUESDAY: 'Mardi',
    WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi',
    FRIDAY: 'Vendredi',
    SATURDAY: 'Samedi',
    SUNDAY: 'Dimanche'
};

export default function ScheduleManager({ doctorId }: ScheduleManagerProps) {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New unavailability form
    const [newUnavailability, setNewUnavailability] = useState({
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        reason: ''
    });

    useEffect(() => {
        if (doctorId) {
            fetchData();
        }
    }, [doctorId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [scheduleData, unavailabilityData] = await Promise.all([
                medecinApi.getSchedule(doctorId),
                medecinApi.getUnavailability(doctorId)
            ]);
            setSchedules(scheduleData);
            setUnavailabilities(unavailabilityData);
        } catch (error) {
            console.error('Error fetching schedule data:', error);
            toast.error('Erreur lors du chargement de l\'emploi du temps');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSchedule = async (day: string, updates: Partial<Schedule>) => {
        const existing = schedules.find(s => s.dayOfWeek === day);
        const data = {
            doctorId,
            dayOfWeek: day,
            startTime: updates.startTime || existing?.startTime || '09:00',
            endTime: updates.endTime || existing?.endTime || '17:00',
            slotDurationMinutes: updates.slotDurationMinutes || existing?.slotDurationMinutes || 30,
            isActive: updates.isActive !== undefined ? updates.isActive : (existing?.isActive !== undefined ? existing.isActive : true)
        };

        try {
            await medecinApi.updateSchedule(data);
            toast.success(`Planning du ${DAY_LABELS[day]} mis à jour`);
            fetchData();
        } catch (error) {
            console.error('Error updating schedule:', error);
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleCreateDefault = async () => {
        try {
            await medecinApi.createDefaultSchedule(doctorId);
            toast.success('Planning par défaut créé (Lun-Ven, 9h-17h)');
            fetchData();
        } catch (error) {
            console.error('Error creating default schedule:', error);
            toast.error('Erreur lors de la création du planning par défaut');
        }
    };

    const handleAddUnavailability = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUnavailability.startDate || !newUnavailability.startTime || !newUnavailability.endDate || !newUnavailability.endTime) {
            toast.error('Veuillez remplir toutes les dates et heures');
            return;
        }

        const startDateTime = `${newUnavailability.startDate}T${newUnavailability.startTime}:00`;
        const endDateTime = `${newUnavailability.endDate}T${newUnavailability.endTime}:00`;

        if (new Date(startDateTime) >= new Date(endDateTime)) {
            toast.error('La date de fin doit être après la date de début');
            return;
        }

        try {
            await medecinApi.addUnavailability({
                doctorId,
                startDateTime,
                endDateTime,
                reason: newUnavailability.reason
            });
            toast.success('Période d\'indisponibilité ajoutée');
            setNewUnavailability({ startDate: '', startTime: '', endDate: '', endTime: '', reason: '' });
            fetchData();
        } catch (error) {
            console.error('Error adding unavailability:', error);
            toast.error('Erreur lors de l\'ajout');
        }
    };

    const handleDeleteUnavailability = async (id: string) => {
        try {
            await medecinApi.deleteUnavailability(id);
            toast.success('Période supprimée');
            fetchData();
        } catch (error) {
            console.error('Error deleting unavailability:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-slate-600">Chargement de votre emploi du temps...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Weekly Schedule Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-bold text-slate-800">Heures de Travail Hebdomadaires</h2>
                    </div>
                    {schedules.length === 0 && (
                        <button
                            onClick={handleCreateDefault}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Initialiser Planning Standard
                        </button>
                    )}
                </div>

                <div className="p-6">
                    <div className="space-y-4">
                        {DAYS_OF_WEEK.map(day => {
                            const schedule = schedules.find(s => s.dayOfWeek === day);
                            return (
                                <div key={day} className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                                    <div className="w-32 font-bold text-slate-700">{DAY_LABELS[day]}</div>

                                    <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                                        <input
                                            type="time"
                                            value={schedule?.startTime || '09:00'}
                                            onChange={(e) => handleUpdateSchedule(day, { startTime: e.target.value })}
                                            className="p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                        <span className="text-slate-400">à</span>
                                        <input
                                            type="time"
                                            value={schedule?.endTime || '17:00'}
                                            onChange={(e) => handleUpdateSchedule(day, { endTime: e.target.value })}
                                            className="p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                        />

                                        <div className="flex items-center gap-2 ml-4">
                                            <span className="text-sm text-slate-500">Durée RDV:</span>
                                            <select
                                                value={schedule?.slotDurationMinutes || 30}
                                                onChange={(e) => handleUpdateSchedule(day, { slotDurationMinutes: parseInt(e.target.value) })}
                                                className="p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                            >
                                                <option value={15}>15 min</option>
                                                <option value={20}>20 min</option>
                                                <option value={30}>30 min</option>
                                                <option value={45}>45 min</option>
                                                <option value={60}>60 min</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={schedule?.isActive ?? false}
                                                onChange={(e) => handleUpdateSchedule(day, { isActive: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            <span className="ml-3 text-sm font-medium text-slate-600">{schedule?.isActive ? 'Actif' : 'Repos'}</span>
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Unavailability Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Unavailability Form */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <CalendarRange className="w-6 h-6 text-red-500" />
                        <h2 className="text-lg font-bold text-slate-800">Ajouter une Absence</h2>
                    </div>

                    <form onSubmit={handleAddUnavailability} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Début</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    value={newUnavailability.startDate}
                                    onChange={(e) => setNewUnavailability({ ...newUnavailability, startDate: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                    type="time"
                                    value={newUnavailability.startTime}
                                    onChange={(e) => setNewUnavailability({ ...newUnavailability, startTime: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Fin</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    value={newUnavailability.endDate}
                                    onChange={(e) => setNewUnavailability({ ...newUnavailability, endDate: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <input
                                    type="time"
                                    value={newUnavailability.endTime}
                                    onChange={(e) => setNewUnavailability({ ...newUnavailability, endTime: e.target.value })}
                                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Motif (Optionnel)</label>
                            <textarea
                                value={newUnavailability.reason}
                                onChange={(e) => setNewUnavailability({ ...newUnavailability, reason: e.target.value })}
                                placeholder="Ex: Vacances, Congrès..."
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Ajouter l'Indisponibilité
                        </button>
                    </form>
                </div>

                {/* Unavailability List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">Absences & Congés Programmés</h2>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full uppercase">
                            {unavailabilities.length} Périodes
                        </span>
                    </div>

                    <div className="p-6">
                        {unavailabilities.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Aucune absence programmée</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {unavailabilities.map((u) => (
                                    <div key={u.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-start justify-between group">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                                <Calendar className="w-4 h-4 text-primary" />
                                                {new Date(u.startDateTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                <span className="mx-1 text-slate-400">→</span>
                                                {new Date(u.endDateTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {new Date(u.startDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                -
                                                {new Date(u.endDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {u.reason && (
                                                <div className="text-xs italic text-slate-400 mt-2 line-clamp-1">
                                                    " {u.reason} "
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteUnavailability(u.id)}
                                            className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
