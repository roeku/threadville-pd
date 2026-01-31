import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Edit, Trash, Eye, Globe, Archive } from 'lucide-react';
import { CaseFile } from '../../types';

interface CaseRecord {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
    created_at: string;
    updated_at: string;
    content: CaseFile;
}

export default function CaseList({ onEdit }: { onEdit: (id: string) => void }) {
    const [cases, setCases] = useState<CaseRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCases = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('cases')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cases:', error);
        } else {
            setCases(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCases();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this case?')) return;

        const { error } = await supabase
            .from('cases')
            .delete()
            .eq('id', id);

        if (error) console.error(error);
        else fetchCases();
    };

    const handleToggleStatus = async (item: CaseRecord) => {
        const newStatus = item.status === 'published' ? 'draft' : 'published';
        const { error } = await supabase
            .from('cases')
            .update({ status: newStatus })
            .eq('id', item.id);

        if (error) console.error(error);
        else fetchCases();
    }


    if (loading) return <div className="text-amber-500 animate-pulse">Scanning database...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold text-slate-100">Case Database</h2>
                <span className="text-slate-500 text-sm">{cases.length} records found</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {cases.map((c) => (
                    <div key={c.id} className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between hover:border-amber-500/50 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-slate-200">{c.title || c.content.title}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${c.status === 'published' ? 'border-green-500 text-green-500 bg-green-950/30' :
                                        c.status === 'archived' ? 'border-slate-600 text-slate-600' :
                                            'border-amber-500 text-amber-500 bg-amber-950/30'
                                    }`}>
                                    {c.status.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm mt-1 truncate max-w-2xl">{c.content.briefing}</p>
                            <div className="text-slate-600 text-xs mt-2 font-mono">ID: {c.id} • Created: {new Date(c.created_at).toLocaleDateString()}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleToggleStatus(c)}
                                className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                                title={c.status === 'published' ? "Unpublish" : "Publish"}
                            >
                                {c.status === 'published' ? <Archive className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => onEdit(c.id)}
                                className="p-2 hover:bg-slate-800 rounded text-amber-500 hover:text-amber-400"
                                title="Edit"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(c.id)}
                                className="p-2 hover:bg-slate-800 rounded text-red-500 hover:text-red-400"
                                title="Delete"
                            >
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {cases.length === 0 && (
                    <div className="text-center py-20 text-slate-600 border border-dashed border-slate-800 rounded">
                        No cases found in the database.
                    </div>
                )}
            </div>
        </div>
    );
}
