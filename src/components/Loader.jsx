
import React from 'react';

const Loader = ({ progress, errors, logs, debug }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Loading Experience</h2>
                <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="mt-2 text-sm text-gray-400">{progress}%</p>
                {debug && (
                    <div className="mt-4 text-xs text-left text-red-400 max-h-32 overflow-auto">
                        {errors && errors.length > 0 && <p>{errors.length} Errors</p>}
                        {logs && logs.map((l, i) => <div key={i} className="text-gray-600">{l}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Loader;
