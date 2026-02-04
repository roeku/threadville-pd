import React from 'react';
import { CaseCompletionData } from '../../services/document-rendering/types';

// Case Completion Template
// Style: Official bureaucratic form, typewriter font, stamps

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

    // Generate mock detective comparison data (in production, this would come from DB)
    const generateDetectiveComparisons = () => {
        const detectives = [
            { name: 'Det. Martinez', time: 420 }, // 7m
            { name: 'Det. Chen', time: 580 }, // 9m 40s
            { name: 'YOU', time: currentTimeSeconds },
            { name: 'Det. Rodriguez', time: 780 }, // 13m
            { name: 'Det. Thompson', time: 920 }, // 15m 20s
            { name: 'Det. Patel', time: 1200 }, // 20m
            { name: 'Det. Sullivan', time: 1450 }, // 24m 10s
        ];
        return detectives.sort((a, b) => a.time - b.time);
    };

    const detectives = generateDetectiveComparisons();
    const maxTime = Math.max(...detectives.map(d => d.time));
    const minTime = Math.min(...detectives.map(d => d.time));

    // Group detectives into 5-min buckets
    const bucketSize = 5 * 60; // 5 minutes in seconds
    const buckets = new Map<number, typeof detectives>();
    detectives.forEach(det => {
        const bucketKey = Math.floor(det.time / bucketSize) * bucketSize;
        if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
        buckets.get(bucketKey)!.push(det);
    });

    const sortedBuckets = Array.from(buckets.entries())
        .sort((a, b) => a[0] - b[0]);

    const formatSeconds = (s: number) => {
        const hours = Math.floor(s / 3600);
        const minutes = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m ${secs}s`;
    };

    return (
        <div className="document-page w-[816px] h-[1056px] bg-[#f4f1ea] text-black font-mono relative overflow-hidden p-12 flex flex-col box-border">
            {/* Texture Overlay (Simulated) */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-repeat bg-[length:200px_200px] mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(circle, #000000 1px, transparent 1px)' }}></div>

            {/* Header */}
            <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-start">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">CASE CLOSURE REPORT</h1>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-600">Department of Cold Case Investigation</div>
                </div>
                <div className="border-2 border-black p-2">
                    <div className="text-xs uppercase font-bold text-center mb-1">Form ID</div>
                    <div className="text-lg font-bold">CC-99</div>
                </div>
            </div>

            {/* Case Identity */}
            <div className="mb-4 border-b-2 border-black pb-3">
                <div className="grid grid-cols-1 gap-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Case Title</label>
                        <div className="text-xl font-bold font-serif italic border-b border-dotted border-gray-400 pb-1">{data.caseTitle}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Date Filed</label>
                            <div className="text-sm font-typewriter">{data.dateFiled}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Investigator</label>
                            <div className="text-sm font-typewriter">{data.investigatorId}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Table - More Compact */}
            <div className="mb-3">
                <h2 className="text-xs font-bold uppercase border-b-2 border-black mb-2 pb-1 inline-block tracking-widest">Investigation Metrics</h2>

                <table className="w-full text-left border-collapse text-xs">
                    <tbody>
                        <tr className="border-b border-gray-300">
                            <td className="py-1 pl-2 font-bold uppercase w-1/2">Investigation Duration</td>
                            <td className="py-1 pr-2 font-typewriter text-sm">{data.timeToComplete}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                            <td className="py-1 pl-2 font-bold uppercase">Valid Connections</td>
                            <td className="py-1 pr-2 font-typewriter text-sm">{data.confirmedLinks}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                            <td className="py-1 pl-2 font-bold uppercase">Critical Evidence</td>
                            <td className="py-1 pr-2 font-typewriter text-sm">{data.criticalLinks}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                            <td className="py-1 pl-2 font-bold uppercase">Incorrect Links</td>
                            <td className="py-1 pr-2 font-typewriter text-sm text-red-800">{data.disputedLinks}</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                            <td className="py-1 pl-2 font-bold uppercase">Documents Processed</td>
                            <td className="py-1 pr-2 font-typewriter text-sm">{data.documentsFiled}</td>
                        </tr>
                        <tr className="border-b border-black">
                            <td className="py-1 pl-2 font-bold uppercase">Forensic Puzzles</td>
                            <td className="py-1 pr-2 font-typewriter text-sm">{data.forensicTasksCompleted}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Comparative Performance Chart */}
            <div className="mb-3 border-2 border-gray-400 p-2 bg-white/20">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">Comparative Analysis: Detective Performance</h3>
                
                {/* Chart Legend */}
                <div className="text-xs mb-1 px-2">
                    <span className="inline-block mr-4"><span className="inline-block w-2 h-2 bg-blue-900 mr-1"></span>You</span>
                    <span className="inline-block"><span className="inline-block w-2 h-2 bg-gray-500 mr-1"></span>Other Detectives</span>
                </div>

                {/* Bar Chart */}
                <div className="space-y-1">
                    {sortedBuckets.map(([bucketStart, buckDetectives]) => {
                        const bucketEnd = bucketStart + bucketSize;
                        const label = `${Math.floor(bucketStart / 60)}-${Math.floor(bucketEnd / 60)}m`;
                        
                        return (
                            <div key={bucketStart} className="flex items-center gap-2">
                                <div className="w-16 text-right text-xs font-mono">{label}</div>
                                <div className="flex gap-0.5 h-4">
                                    {buckDetectives.map((det, idx) => {
                                        const isYou = det.name === 'YOU';
                                        const width = (det.time / maxTime) * 100;
                                        return (
                                            <div
                                                key={idx}
                                                className={`${isYou ? 'bg-blue-900' : 'bg-gray-500'} border border-black/30`}
                                                style={{ width: `${Math.max(width, 8)}px` }}
                                                title={`${det.name}: ${formatSeconds(det.time)}`}
                                            />
                                        );
                                    })}
                                </div>
                                <span className="text-xs text-gray-700">({buckDetectives.length})</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Solution Reasoning Section */}
            {data.solutionReasoning && (
                <div className="mb-2 border-2 border-gray-400 p-2 bg-white/30 text-xs">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-1">Detective Notes — Case Resolution</h3>
                    <p className="font-mono leading-tight text-gray-800 whitespace-pre-wrap line-clamp-4">
                        {data.solutionReasoning}
                    </p>
                </div>
            )}

            {/* Realistic CLOSED Stamp */}
            <div className="absolute bottom-20 right-12 transform -rotate-12">
                {/* Outer grunge effect */}
                <div className="relative">
                    {/* Base stamp shape with texture */}
                    <div 
                        className="
                            border-4 border-green-900 p-4 text-center
                            bg-gradient-to-br from-green-100 to-green-50
                            opacity-90 mix-blend-multiply
                        "
                        style={{
                            boxShadow: `
                                inset -2px -2px 4px rgba(0,0,0,0.1),
                                inset 2px 2px 4px rgba(255,255,255,0.5),
                                2px 2px 8px rgba(0,0,0,0.2)
                            `,
                            borderRadius: '3px'
                        }}
                    >
                        {/* Dotted circle border effect */}
                        <div className="absolute inset-1 border-2 border-dashed border-green-900 opacity-50" style={{ borderRadius: '2px' }}></div>
                        
                        <div className="relative">
                            <div className="text-5xl font-black text-green-900 tracking-widest leading-tight mb-0.5">CLOSED</div>
                            <div className="h-0.5 bg-green-900 mx-2 my-0.5"></div>
                            <div className="text-xs font-bold text-green-800 tracking-widest">OFFICIAL RECORD</div>
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
                            borderRadius: '3px'
                        }}
                    ></div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-2 left-0 right-0 px-12 pt-2 border-t border-black flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                <div>Official Record</div>
                <div>Threadville PD Detectives Unit</div>
                <div>Page 1 of 1</div>
            </div>
        </div>
    );
};
