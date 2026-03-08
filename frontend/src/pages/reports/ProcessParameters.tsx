import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Thermometer, Droplets, Zap } from 'lucide-react';
import { processParamsApi } from '../../services/api';
import api from '../../services/api';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

// Avoid loop detection flags
interface MachineType {
    id: number;
    name: string;
    code: string;
}

interface TrendReport {
    stats: {
        _avg: any;
        _min: any;
        _max: any;
    };
    logs: any[];
}

export default function ProcessParameters() {
    const [machines, setMachines] = useState<MachineType[]>([]);
    const [selectedMachine, setSelectedMachine] = useState<number | ''>('');
    const [rangeStart, setRangeStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [rangeEnd, setRangeEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [trendData, setTrendData] = useState<TrendReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadMachines();
    }, []);

    useEffect(() => {
        if (selectedMachine && rangeStart && rangeEnd) {
            loadTrends();
        }
    }, [selectedMachine, rangeStart, rangeEnd]);

    const loadMachines = async () => {
        try {
            const res = await api.get('/machines');
            const machineList = res.data?.data || res.data || [];
            if (Array.isArray(machineList)) {
                setMachines(machineList);
                if (machineList.length > 0) {
                    setSelectedMachine(machineList[0].id);
                }
            }
        } catch (err: any) {
            console.error(err);
            toast.error('Gagal mengambil daftar mesin');
        }
    };

    const loadTrends = async () => {
        if (!selectedMachine) return;
        setIsLoading(true);
        try {
            const result = await processParamsApi.getMachineTrend(Number(selectedMachine), {
                startDate: new Date(rangeStart).toISOString(),
                endDate: new Date(rangeEnd + 'T23:59:59').toISOString()
            });
            setTrendData(result.data.data);
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || 'Gagal memuat tren parameter');
        } finally {
            setIsLoading(false);
        }
    };

    const formattedChartData = trendData?.logs.map(log => ({
        ...log,
        timeLabel: format(new Date(log.recorded_at), 'd MMM HH:mm')
    })) || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Process Parameters</h1>
                    <p className="text-muted-foreground">Monitor parameter kritis operasional mesin</p>
                </div>

                <div className="flex gap-4 items-end">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Mesin</label>
                        <select
                            className="px-3 py-2 border rounded-md"
                            value={selectedMachine}
                            onChange={(e) => setSelectedMachine(Number(e.target.value))}
                        >
                            <option value="">Pilih Mesin...</option>
                            {machines.map(m => (
                                <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Dari Tanggal</label>
                        <input
                            type="date"
                            className="px-3 py-2 border rounded-md"
                            value={rangeStart}
                            onChange={(e) => setRangeStart(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">Sampai Tanggal</label>
                        <input
                            type="date"
                            className="px-3 py-2 border rounded-md"
                            value={rangeEnd}
                            onChange={(e) => setRangeEnd(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center border rounded-lg bg-card">
                    <Activity className="animate-spin text-muted-foreground h-8 w-8" />
                </div>
            ) : !trendData || formattedChartData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border rounded-lg bg-card text-muted-foreground">
                    <Activity className="h-12 w-12 mb-2 opacity-50" />
                    <p>Belum ada data pencatatan parameter untuk periode ini</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Summary Cards */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-4 rounded-lg border bg-card/50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Rata-rata Suhu</p>
                                    <h3 className="text-2xl font-bold">
                                        {Number(trendData.stats._avg.temperature || 0).toFixed(1)}°C
                                    </h3>
                                </div>
                                <Thermometer className="text-orange-500 h-5 w-5" />
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between">
                                <span>Min: {Number(trendData.stats._min.temperature || 0)}°C</span>
                                <span>Max: {Number(trendData.stats._max.temperature || 0)}°C</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border bg-card/50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Kelembapan</p>
                                    <h3 className="text-2xl font-bold">
                                        {Number(trendData.stats._avg.humidity || 0).toFixed(1)}%
                                    </h3>
                                </div>
                                <Droplets className="text-blue-500 h-5 w-5" />
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between">
                                <span>Min: {Number(trendData.stats._min.humidity || 0)}%</span>
                                <span>Max: {Number(trendData.stats._max.humidity || 0)}%</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border bg-card/50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Motor Speed / RPM</p>
                                    <h3 className="text-2xl font-bold">
                                        {Number(trendData.stats._avg.motor_speed || 0).toFixed(0)} rpm
                                    </h3>
                                </div>
                                <Zap className="text-yellow-500 h-5 w-5" />
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border bg-card/50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Pencatatan</p>
                                    <h3 className="text-2xl font-bold">
                                        {trendData.logs.length}
                                    </h3>
                                </div>
                                <Activity className="text-green-500 h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="p-4 border rounded-lg bg-card shadow-sm h-80">
                            <h3 className="text-sm font-medium text-muted-foreground mb-4">Trend Temperatur & Kelembapan</h3>
                            <ResponsiveContainer width="100%" height="85%">
                                <LineChart data={formattedChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="timeLabel" tick={{ fontSize: 12 }} />
                                    <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="temperature" name="Suhu (°C)" stroke="#f97316" activeDot={{ r: 6 }} strokeWidth={2} />
                                    <Line yAxisId="right" type="monotone" dataKey="humidity" name="Kelembapan (%)" stroke="#3b82f6" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="p-4 border rounded-lg bg-card shadow-sm h-80">
                            <h3 className="text-sm font-medium text-muted-foreground mb-4">Trend RPM & Tekanan</h3>
                            <ResponsiveContainer width="100%" height="85%">
                                <LineChart data={formattedChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="timeLabel" tick={{ fontSize: 12 }} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="motor_speed" name="RPM" stroke="#eab308" activeDot={{ r: 6 }} strokeWidth={2} />
                                    <Line yAxisId="right" type="monotone" dataKey="pressure" name="Pressure (psi)" stroke="#10b981" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
