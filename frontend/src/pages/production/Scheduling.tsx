import { useState, useEffect } from 'react';
import Header from '../../components/Layout/Header';
import api from '../../services/api';

// Interface for backend data
interface Worksheet {
    id: number;
    worksheet_date: string;
    shift: string;
    machine_hours: number;
    machine?: {
        id: number;
        name: string;
    };
    product_type?: {
        name: string;
    };
    beras_output: number;
}

interface Machine {
    id: number;
    name: string;
    code: string;
    status: string;
}

const Scheduling = () => {
    // State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [zoomLevel, setZoomLevel] = useState(100); // Width of one hour in px
    const [machines, setMachines] = useState<Machine[]>([]);
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedDate]); // Refetch when date changes (in real app)

    const fetchData = async () => {
        setLoading(true);
        try {
            const [machinesRes, worksheetsRes] = await Promise.all([
                api.get('/machines'),
                api.get('/worksheets') // In a real app, pass ?date=...
            ]);

            // Handle array vs paginated format
            const machinesData = machinesRes.data?.data || machinesRes.data || [];
            const worksheetsData = worksheetsRes.data?.data || worksheetsRes.data || [];

            setMachines(Array.isArray(machinesData) ? machinesData : []);
            setWorksheets(Array.isArray(worksheetsData) ? worksheetsData : []);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to format date
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Navigation
    const nextDate = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d);
    };

    const prevDate = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d);
    };

    // Generate timeline hours (00:00 - 23:00)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Filter worksheets for the selected date (Mock filtering for now as API returns all)
    // Also mock start times since API doesn't have them
    const getTasksForMachine = (machineId: number) => {
        const filtered = worksheets.filter(w => {
            // Check if same machine
            if (w.machine?.id !== machineId) return false;

            // Check if same date
            const wDate = new Date(w.worksheet_date);
            // Ignore time component for date comparison
            return wDate.toDateString() === selectedDate.toDateString();
        });

        // Add mock start time for visualization
        return filtered.map((task, index) => {
            // Assign shifts purely for visual demo based on index or shift string
            // Default to 08:00 if unknown
            let startHour = 8;
            if (task.shift === 'SHIFT_2') startHour = 16;
            if (task.shift === 'SHIFT_3') startHour = 0;

            // Add slight stagger if multiple tasks per shift (not handling overlap complexly yet)
            startHour += (index % 3);

            return {
                ...task,
                startHour: startHour,
                duration: task.machine_hours || 4 // Default 4 hours if missing
            };
        });
    };

    // Style for timeline grid background
    const gridBackground = `linear-gradient(90deg, transparent ${zoomLevel - 1}px, var(--border-subtle) ${zoomLevel - 1}px)`;

    return (
        <>
            <Header title="Jadwal Produksi" subtitle="Timeline dan alokasi mesin" />

            <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', paddingBottom: 0 }}>
                {/* Toolbar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    background: 'var(--bg-surface)',
                    padding: '12px 20px',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 8, padding: 4 }}>
                            <button className="btn btn-ghost btn-sm" onClick={prevDate}>
                                <span className="material-symbols-outlined icon-sm">chevron_left</span>
                            </button>
                            <div style={{ padding: '0 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--primary)' }}>calendar_today</span>
                                {formatDate(selectedDate)}
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={nextDate}>
                                <span className="material-symbols-outlined icon-sm">chevron_right</span>
                            </button>
                        </div>

                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDate(new Date())}>
                            Hari Ini
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zoom:</span>
                            <input
                                type="range"
                                min="40"
                                max="200"
                                value={zoomLevel}
                                onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                                style={{ width: 100 }}
                            />
                        </div>
                        <button className="btn btn-primary btn-sm">
                            <span className="material-symbols-outlined icon-sm">add</span>
                            Buat Jadwal
                        </button>
                    </div>
                </div>

                {/* Gantt Chart Container */}
                <div style={{
                    display: 'flex',
                    flex: 1,
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden'
                }}>
                    {/* Sidebar (Resources) */}
                    <div style={{
                        width: 240,
                        borderRight: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--bg-elevated)',
                        zIndex: 20
                    }}>
                        {/* Corner Header */}
                        <div style={{
                            height: 48,
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 16px',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Mesin / Resources
                        </div>

                        {/* Machine List */}
                        <div style={{ overflow: 'hidden' }}>
                            {machines.map(machine => (
                                <div key={machine.id} style={{
                                    height: 80,
                                    borderBottom: '1px solid var(--border-subtle)',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                        {machine.name}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {machine.code}
                                        </span>
                                        <span className={`badge ${machine.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                            {machine.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {machines.length === 0 && !loading && (
                                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    Tidak ada data mesin
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline Area */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflowX: 'auto',
                        position: 'relative'
                    }}>
                        {/* Time Header */}
                        <div style={{
                            height: 48,
                            display: 'flex',
                            borderBottom: '1px solid var(--border-subtle)',
                            minWidth: hours.length * zoomLevel
                        }}>
                            {hours.map(h => (
                                <div key={h} style={{
                                    width: zoomLevel,
                                    flexShrink: 0,
                                    borderRight: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 4
                                }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {h.toString().padStart(2, '0')}:00
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Grid & Tasks */}
                        <div style={{
                            flex: 1,
                            position: 'relative',
                            minWidth: hours.length * zoomLevel,
                            backgroundImage: gridBackground,
                            backgroundSize: `${zoomLevel}px 100%`,
                            backgroundColor: 'var(--bg-body)' // Slightly darker than surface for contrast
                        }}>
                            {/* Current Time Indicator (Static for demo) */}
                            <div style={{
                                position: 'absolute',
                                left: 10 * zoomLevel + 20, // Mock 10:20
                                top: 0,
                                bottom: 0,
                                width: 2,
                                background: 'var(--error)',
                                zIndex: 10,
                                pointerEvents: 'none'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: -4,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--error)',
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    padding: '2px 4px',
                                    borderRadius: 4,
                                    fontWeight: 'bold'
                                }}>
                                    10:20
                                </div>
                            </div>

                            {/* Rows */}
                            {machines.map(machine => {
                                const tasks = getTasksForMachine(machine.id);
                                return (
                                    <div key={machine.id} style={{
                                        height: 80,
                                        borderBottom: '1px solid var(--border-subtle)',
                                        position: 'relative'
                                    }}>
                                        {/* Render Tasks */}
                                        {tasks.map(task => (
                                            <div
                                                key={task.id}
                                                style={{
                                                    position: 'absolute',
                                                    left: task.startHour * zoomLevel,
                                                    width: task.duration * zoomLevel,
                                                    top: 12,
                                                    height: 56,
                                                    background: 'rgba(19, 127, 236, 0.15)',
                                                    border: '1px solid var(--primary)',
                                                    borderRadius: 6,
                                                    padding: '4px 8px',
                                                    cursor: 'pointer',
                                                    overflow: 'hidden',
                                                    boxShadow: 'var(--shadow-sm)'
                                                }}
                                                title={`Worksheet #${task.id}`}
                                            >
                                                <div style={{ borderLeft: '3px solid var(--primary)', height: '100%', paddingLeft: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {task.product_type?.name || 'Produksi'}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                        {task.beras_output} kg
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Scheduling;
