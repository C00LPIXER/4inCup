import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';

export function DatasetSwitcher() {
    const [currentDataset, setCurrentDataset] = useState('production');

    useEffect(() => {
        // Get dataset from environment variable
        const dataset = import.meta.env.VITE_DATASET || 'production';
        setCurrentDataset(dataset);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-neutral-900 border border-white/10 rounded-lg p-3 shadow-xl">
                <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-lime-400" />
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400">Dataset:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                            currentDataset === 'production'
                                ? 'bg-lime-500 text-black'
                                : 'bg-orange-500 text-black'
                        }`}>
                            {currentDataset}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
