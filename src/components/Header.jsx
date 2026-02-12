import React, { useState, useEffect, useRef } from 'react';

const Header = ({ show = false }) => {
    const [scrollVisible, setScrollVisible] = useState(true);
    const scrollTimeoutRef = useRef(null);

    // Only attach scroll listener after auto-play is done
    useEffect(() => {
        if (!show) return;

        const handleScroll = () => {
            setScrollVisible(false);

            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                setScrollVisible(true);
            }, 150);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [show]);

    const isVisible = show && scrollVisible;

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${
                isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }}
        >
            <div className="px-8 pt-5 pb-10 flex items-center justify-between">
                <span className="text-white text-xl font-bold tracking-widest">
                    HEADSHOT
                </span>

                <div className="flex items-center gap-3">
                    <button className="px-5 py-2 rounded-full text-sm font-medium text-white/90 border border-white/40 hover:bg-white/10 hover:text-white transition-all duration-200">
                        Join as Photographer
                    </button>
                    <button className="px-5 py-2 rounded-full text-sm font-medium text-black bg-white hover:bg-gray-200 transition-all duration-200">
                        Get a Quote
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
