"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TimeSlot {
    startTime: string;
    endTime: string;
    durationMinutes: number;
    isAvailable: boolean;
    status: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';
}

interface AppointmentSlotPickerProps {
    doctorId: string;
    onSlotSelect: (slot: Date) => void;
    selectedSlot?: Date;
}

export default function AppointmentSlotPicker({
    doctorId,
    onSlotSelect,
    selectedSlot
}: AppointmentSlotPickerProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate next 14 days for calendar
    const getNext14Days = () => {
        const days = [];
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const days = getNext14Days();

    // Fetch available slots when date changes
    useEffect(() => {
        if (doctorId && selectedDate) {
            fetchAvailableSlots();
        }
    }, [doctorId, selectedDate]);

    const fetchAvailableSlots = async () => {
        setLoading(true);
        setError(null);

        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const token = localStorage.getItem('token');

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/appointments/slots/available?doctorId=${doctorId}&date=${dateStr}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch available slots');
            }

            const slots: TimeSlot[] = await response.json();
            setAvailableSlots(slots);
        } catch (err) {
            setError('Impossible de charger les créneaux disponibles');
            console.error('Error fetching slots:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        }).format(date);
    };

    const formatTime = (dateTimeStr: string) => {
        const date = new Date(dateTimeStr);
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSameDate = (date1: Date, date2: Date) => {
        return date1.toDateString() === date2.toDateString();
    };

    const handleSlotClick = (slot: TimeSlot) => {
        if (slot.isAvailable) {
            const slotDateTime = new Date(slot.startTime);
            onSlotSelect(slotDateTime);
        }
    };

    const getSlotStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700';
            case 'BOOKED':
                return 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed';
            case 'UNAVAILABLE':
                return 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const getSlotIcon = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <CheckCircle className="w-4 h-4" />;
            case 'BOOKED':
            case 'UNAVAILABLE':
                return <XCircle className="w-4 h-4" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Calendar - Date Selection */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Sélectionnez une date
                    </h3>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {days.map((day, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedDate(day)}
                            className={`
                p-3 rounded-lg border-2 transition-all text-center
                ${isSameDate(day, selectedDate)
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                }
                ${isToday(day) ? 'ring-2 ring-blue-200' : ''}
              `}
                        >
                            <div className="text-xs text-gray-500 font-medium">
                                {formatDate(day).split(' ')[0]}
                            </div>
                            <div className="text-lg font-bold text-gray-900 mt-1">
                                {day.getDate()}
                            </div>
                            <div className="text-xs text-gray-500">
                                {formatDate(day).split(' ')[1]}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Time Slots */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Créneaux disponibles - {formatDate(selectedDate)}
                    </h3>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-3 text-gray-600">Chargement des créneaux...</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {error}
                    </div>
                ) : availableSlots.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">
                            Aucun créneau disponible pour cette date
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Veuillez sélectionner une autre date
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {availableSlots.map((slot, index) => {
                            const isSelected = selectedSlot &&
                                new Date(slot.startTime).getTime() === selectedSlot.getTime();

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleSlotClick(slot)}
                                    disabled={!slot.isAvailable}
                                    className={`
                    relative p-3 rounded-lg border-2 transition-all
                    ${getSlotStatusColor(slot.status)}
                    ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                    ${slot.isAvailable ? 'hover:shadow-md' : ''}
                  `}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="font-semibold text-sm">
                                            {formatTime(slot.startTime)}
                                        </div>
                                        <div className="text-xs opacity-75">
                                            {slot.durationMinutes} min
                                        </div>
                                        <div className="mt-1">
                                            {getSlotIcon(slot.status)}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Legend */}
                {!loading && availableSlots.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 border-2 border-green-200 rounded"></div>
                            <span className="text-gray-600">Disponible</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
                            <span className="text-gray-600">Réservé</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded"></div>
                            <span className="text-gray-600">Indisponible</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
