import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const ITEMS = [
    { id: 1, name: 'Portrait', src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop' },
    { id: 2, name: 'Landscape', src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop' },
    { id: 3, name: 'Architecture', src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=400&fit=crop' },
    { id: 4, name: 'Nature', src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop' },
    { id: 5, name: 'Street', src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=400&fit=crop' },
    { id: 6, name: 'Product', src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop' },
    { id: 7, name: 'Wedding', src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop' },
    { id: 8, name: 'Food', src: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=400&fit=crop' },
    { id: 9, name: 'Fashion', src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=400&fit=crop' },
];

const SpiralOrbit = ({ ready = false, reversing = false }) => {
    const ringRef = useRef(null);
    const itemRefs = useRef([]);
    const hasAnimated = useRef(false);
    const spinTweens = useRef([]);
    const [radius, setRadius] = useState(0);
    const [selectedItem, setSelectedItem] = useState(null);

    // Responsive radius
    useEffect(() => {
        const updateRadius = () => {
            const vw = window.innerWidth;
            if (vw < 640) setRadius(80);
            else if (vw < 1024) setRadius(120);
            else setRadius(160);
        };

        updateRadius();
        window.addEventListener('resize', updateRadius);
        return () => window.removeEventListener('resize', updateRadius);
    }, []);

    // Trigger spiral immediately when ready — component is fixed, always visible
    useEffect(() => {
        if (!ready || hasAnimated.current || radius === 0) return;

        hasAnimated.current = true;
        runSpiralAnimation();
    }, [ready, radius]);

    // Reverse animation when reversing prop becomes true
    useEffect(() => {
        if (!reversing || !hasAnimated.current) return;

        runReverseAnimation();
    }, [reversing]);

    const runSpiralAnimation = () => {
        const count = ITEMS.length;
        const step = (2 * Math.PI) / count;

        const tl = gsap.timeline();

        itemRefs.current.forEach((el, i) => {
            if (!el) return;

            const finalAngle = i * step;
            const finalX = Math.cos(finalAngle) * radius;
            const finalY = Math.sin(finalAngle) * radius;

            tl.fromTo(
                el,
                {
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 0,
                    rotation: 0,
                },
                {
                    x: finalX,
                    y: finalY,
                    scale: 1,
                    opacity: 1,
                    rotation: (finalAngle * 180) / Math.PI + 360,
                    duration: 0.8,
                    ease: 'back.out(1.2)',
                },
                i * 0.12
            );
        });

        // Reset rotation for upright images
        tl.to(
            itemRefs.current.filter(Boolean),
            {
                rotation: 0,
                duration: 0.4,
                ease: 'power2.out',
                stagger: 0.05,
            }
        );

        // Start continuous ring spin
        tl.call(() => {
            const ringTween = gsap.to(ringRef.current, {
                rotation: 360,
                duration: 40,
                ease: 'none',
                repeat: -1,
            });
            spinTweens.current.push(ringTween);

            itemRefs.current.forEach((el) => {
                if (!el) return;
                const imgTween = gsap.to(el.querySelector('img'), {
                    rotation: -360,
                    duration: 40,
                    ease: 'none',
                    repeat: -1,
                });
                spinTweens.current.push(imgTween);
            });
        });
    };

    const runReverseAnimation = () => {
        // Kill all continuous spin tweens
        spinTweens.current.forEach((t) => t.kill());
        spinTweens.current = [];

        // Kill any existing tweens on ring and items
        gsap.killTweensOf(ringRef.current);
        itemRefs.current.forEach((el) => {
            if (!el) return;
            gsap.killTweensOf(el);
            const img = el.querySelector('img');
            if (img) gsap.killTweensOf(img);
        });

        // Reset ring rotation
        gsap.set(ringRef.current, { rotation: 0 });
        itemRefs.current.forEach((el) => {
            if (!el) return;
            const img = el.querySelector('img');
            if (img) gsap.set(img, { rotation: 0 });
        });

        // Reverse timeline: collapse all items to center (1.5s to match frame reverse)
        const tl = gsap.timeline({
            onComplete: () => {
                hasAnimated.current = false;
            },
        });

        const items = itemRefs.current.filter(Boolean);
        const reversed = [...items].reverse();

        reversed.forEach((el, i) => {
            tl.to(
                el,
                {
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 0,
                    rotation: -360,
                    duration: 0.6,
                    ease: 'back.in(1.2)',
                },
                i * 0.08
            );
        });
    };

    const handlePause = () => {
        spinTweens.current.forEach((t) => t.pause());
    };

    const handleResume = () => {
        if (!selectedItem) {
            spinTweens.current.forEach((t) => t.resume());
        }
    };

    const handleItemClick = (item) => {
        setSelectedItem(item);
        spinTweens.current.forEach((t) => t.pause());
    };

    const handleCloseModal = () => {
        setSelectedItem(null);
        spinTweens.current.forEach((t) => t.resume());
    };

    const imageSize = radius < 150 ? 50 : radius < 220 ? 60 : 70;

    // Only show when orbit is active (done phase or reversing)
    const isVisible = ready || reversing || hasAnimated.current;

    if (!isVisible) return null;

    return (
        <>
            <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div
                    ref={ringRef}
                    className="relative pointer-events-auto"
                    style={{ width: radius * 2 + imageSize, height: radius * 2 + imageSize }}
                    onMouseEnter={handlePause}
                    onMouseLeave={handleResume}
                >
                    {ITEMS.map((item, i) => (
                        <div
                            key={item.id}
                            ref={(el) => (itemRefs.current[i] = el)}
                            className="absolute cursor-pointer"
                            style={{
                                left: '50%',
                                top: '50%',
                                marginLeft: -imageSize / 2,
                                marginTop: -imageSize / 2,
                                width: imageSize,
                                height: imageSize,
                                opacity: 0,
                            }}
                            onClick={() => handleItemClick(item)}
                        >
                            <img
                                src={item.src}
                                alt={item.name}
                                className="w-full h-full rounded-full object-cover shadow-[0_4px_30px_rgba(0,0,0,0.6)] ring-1 ring-white/5 transition-transform duration-200 hover:scale-110"
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Popup Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-30 flex items-center justify-center"
                    onClick={handleCloseModal}
                >
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div
                        className="relative z-10 max-w-md w-[90%] rounded-2xl overflow-hidden bg-neutral-900/90 shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedItem.src.replace('w=400&h=400', 'w=800&h=600')}
                            alt={selectedItem.name}
                            className="w-full aspect-[4/3] object-cover"
                        />
                        <div className="p-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-white text-lg font-semibold tracking-wide">
                                    {selectedItem.name}
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">Photography</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-white transition-colors text-2xl leading-none px-2"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SpiralOrbit;
