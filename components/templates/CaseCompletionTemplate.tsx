import React from 'react';
import { CaseCompletionData } from '../../services/document-rendering/types';

export const CaseCompletionTemplate: React.FC<{ data: CaseCompletionData }> = ({ data }) => {
    // Parse time string to seconds for comparison
    const parseTimeString = (timeStr: string): number => {
        const match = timeStr.match(/(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?/);
        if (!match) return 0;
        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        const seconds = parseInt(match[3] || '0');
        return hours * 3600 + minutes * 60 + seconds;
    };

    const currentTimeSeconds = parseTimeString(data.timeToComplete);

    // Generate mock detective comparison data
    const generateDetectiveComparisons = () => {
        const detectives = [
            { name: 'Det. Martinez', time: 420 },
            { name: 'Det. Chen', time: 580 },
            { name: 'YOU', time: currentTimeSeconds },
            { name: 'Det. Rodriguez', time: 780 },
            { name: 'Det. Thompson', time: 920 },
            { name: 'Det. Patel', time: 1200 },
            { name: 'Det. Sullivan', time: 1450 },
        ];
        return detectives.sort((a, b) => a.time - b.time);
    };

    const detectives = generateDetectiveComparisons();
    const maxTime = Math.max(...detectives.map(d => d.time));
    const bucketSize = 5 * 60;

    const buckets = new Map<number, typeof detectives>();
    detectives.forEach(det => {
        const bucketKey = Math.floor(det.time / bucketSize) * bucketSize;
        if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
        buckets.get(bucketKey)!.push(det);
    });

    const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);

    const formatSeconds = (s: number) => {
        const hours = Math.floor(s / 3600);
        const minutes = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m ${secs}s`;
    };

    return (
        <div className="document-page w-[816px] h-[1056px] bg-[#f5f3f0] text-black font-mono relative overflow-hidden flex flex-col box-border">
            {/* Subtle Paper Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-15 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' fill=\'%23000\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat' }}></div>

            {/* Header Section */}
            <div className="bg-gradient-to-b from-blue-900/5 to-transparent border-b-2 border-blue-900 px-10 pt-8 pb-6 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ letterSpacing: '-0.5px' }}>CASE CLOSURE REPORT</h1>
                        <div className="text-xs font-bold uppercase tracking-widest text-gray-600 border-t border-gray-300 pt-2 inline-block">Department of Investigations</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs uppercase font-bold text-gray-500 mb-2">Form ID</div>
                        <div className="text-2xl font-black border-2 border-gray-400 p-3 bg-white">CC-99</div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col px-10 py-6">
                {/* Case Identity Section */}
                <div className="mb-6">
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <div className="text-2xl font-bold font-serif italic text-blue-900 border-b-2 border-blue-900 pb-2">{data.caseTitle}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Date Filed</label>
                                <div className="text-sm font-mono text-gray-800">{data.dateFiled}</div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block">Investigator ID</label>
                                <div className="text-sm font-mono font-bold text-gray-800">{data.investigatorId}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 pb-2 border-b-2 border-gray-300">Investigation Metrics</h2>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-lg shadow-sm">
                            <div className="text-xs uppercase font-bold text-blue-700 tracking-wide mb-2">Time to Complete</div>
                            <div className="text-2xl font-black text-blue-900">{data.timeToComplete}</div>
                        </div>
                        <div className="bg-green-50/60 border border-green-200 p-4 rounded-lg shadow-sm">
                            <div className="text-xs uppercase font-bold text-green-700 tracking-wide mb-2">Valid Connections</div>
                            <div className="text-2xl font-black text-green-900">{data.confirmedLinks}</div>
                        </div>
                        <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-lg shadow-sm">
                            <div className="text-xs uppercase font-bold text-amber-700 tracking-wide mb-2">Critical Evidence</div>
                            <div className="text-2xl font-black text-amber-900">{data.criticalLinks}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50/60 border border-gray-200 p-4 rounded-lg shadow-sm">
                            <div className="text-xs uppercase font-bold text-gray-700 tracking-wide mb-2">Documents Filed</div>
                            <div className="text-2xl font-black text-gray-900">{data.documentsFiled}</div>
                        </div>
                        <div className="bg-red-50/60 border border-red-200 p-4 rounded-lg shadow-sm">
                            <div className="text-xs uppercase font-bold text-red-700 tracking-wide mb-2">Incorrect Connections</div>
                            <div className="text-2xl font-black text-red-900">{data.disputedLinks}</div>
                        </div>
                        <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-lg shadow-sm">
                            <div className="text-xs uppercase font-bold text-purple-700 tracking-wide mb-2">Forensics Completed</div>
                            <div className="text-xl font-black text-purple-900">{data.forensicTasksCompleted}</div>
                        </div>
                    </div>
                </div>

                {/* Comparative Performance Chart */}
                <div className="bg-white/50 border-2 border-gray-300 p-4 rounded-lg flex-1 flex flex-col shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3 pb-3 border-b-2 border-gray-300">Detective Performance Comparison</h3>

                    {/* Chart Legend */}
                    <div className="text-xs mb-4 flex gap-8">
                        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-900 rounded-sm shadow-sm"></span><span className="font-semibold text-gray-700">Your Time</span></span>
                        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-400 rounded-sm shadow-sm"></span><span className="font-semibold text-gray-700">Other Detectives</span></span>
                    </div>

                    {/* Bar Chart */}
                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                        {sortedBuckets.map(([bucketStart, buckDetectives]) => {
                            const bucketEnd = bucketStart + bucketSize;
                            const label = `${Math.floor(bucketStart / 60)}-${Math.floor(bucketEnd / 60)}m`;

                            return (
                                <div key={bucketStart} className="flex items-center gap-3">
                                    <div className="w-14 text-right text-xs font-mono font-bold text-gray-700 whitespace-nowrap">{label}</div>
                                    <div className="flex gap-1.5 h-6 items-center flex-1 bg-gray-100/80 px-2 rounded-md border border-gray-200">
                                        {buckDetectives.map((det, idx) => {
                                            const isYou = det.name === 'YOU';
                                            const width = (det.time / maxTime) * 100;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`${isYou ? 'bg-blue-900 shadow-md' : 'bg-gray-400 opacity-80'} rounded-sm transition-all`}
                                                    style={{ width: `${Math.max(width, 5)}px`, height: '100%' }}
                                                    title={`${det.name}: ${formatSeconds(det.time)}`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <span className="text-xs text-gray-600 font-bold ml-1 whitespace-nowrap">({buckDetectives.length})</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Solution Reasoning Section */}
                {data.solutionReasoning && (
                    <div className="bg-white/70 border-2 border-blue-300 p-4 rounded-lg mt-4 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-3 pb-2 border-b border-blue-200">Detective Notes — Case Resolution</h3>
                        <p className="font-mono text-xs leading-relaxed text-gray-800 whitespace-pre-wrap line-clamp-3">
                            {data.solutionReasoning}
                        </p>
                    </div>
                )}
            </div>

            {/* Realistic CLOSED Stamp */}
            <div className="absolute bottom-28 right-16 transform -rotate-12 z-20">
                <div className="relative">
                    <div
                        className="
                            border-4 border-green-900 p-6 text-center
                            bg-gradient-to-br from-green-100 to-green-50
                            opacity-90 mix-blend-multiply shadow-xl
                        "
                        style={{
                            boxShadow: `
                                inset -3px -3px 6px rgba(0,0,0,0.15),
                                inset 3px 3px 6px rgba(255,255,255,0.7),
                                5px 5px 15px rgba(0,0,0,0.35)
                            `,
                            borderRadius: '4px'
                        }}
                    >
                        {/* Dotted circle border effect */}
                        <div className="absolute inset-2 border-2 border-dashed border-green-900 opacity-50" style={{ borderRadius: '2px' }}></div>

                        <div className="relative">
                            <div className="text-6xl font-black text-green-900 tracking-wider leading-tight mb-2" style={{ letterSpacing: '3px' }}>CLOSED</div>
                            <div className="h-1 bg-gradient-to-r from-transparent via-green-900 to-transparent mx-4 my-2"></div>
                            <div className="text-xs font-bold text-green-800 tracking-wider">OFFICIAL RECORD</div>
                        </div>
                    </div>

                    {/* Grunge noise texture overlay */}
                    <div
                        className="absolute inset-0 opacity-40 pointer-events-none"
                        style={{
                            backgroundImage: `
                                repeating-linear-gradient(
                                    45deg,
                                    transparent,
                                    transparent 2px,
                                    rgba(0,0,0,0.1) 2px,
                                    rgba(0,0,0,0.1) 4px
                                )
                            `,
                            borderRadius: '4px'
                        }}
                    ></div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-400 bg-gradient-to-t from-gray-100/40 to-transparent px-10 py-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-600">
                <div>Official Record</div>
                <div>Threadville PD — Detectives Unit</div>
                <div>Page 1 of 1</div>
            </div>
        </div>
    );
};
