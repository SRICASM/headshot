
import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useImagePreloader } from '../hooks/useImagePreloader';
import Loader from './Loader';
import SpiralOrbit from './SpiralOrbit';

// Phases: at-start | autoplay | hero-visible | scrolling | done | reversing-to-hero | reversing-to-start

const CinematicHero = ({ onAutoPlayComplete }) => {
    const canvasRef = useRef(null);
    const frameIndexRef = useRef({ frame: 0 });
    const lastScrollY = useRef(0);
    const [phase, setPhase] = useState('autoplay');

    // Load all 90 frames (0-89)
    const { images, loaded, progress, errors, logs } = useImagePreloader('/frames/frame_{index}.jpg', 90);

    const drawFrame = useCallback((frameIndex) => {
        if (!canvasRef.current || !images.length) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const index = Math.max(0, Math.min(Math.floor(frameIndex), images.length - 1));
        const img = images[index];

        if (!img || !img.complete) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgRatio;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgRatio;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        }

        context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }, [images]);

    // Initialize canvas size (account for HiDPI/Retina displays)
    useEffect(() => {
        if (!loaded || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';

        drawFrame(0);

        const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            drawFrame(frameIndexRef.current.frame);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [loaded, images, drawFrame]);

    // ── FORWARD: Auto-play frames 0 → 55 (3s) ──
    useEffect(() => {
        if (!loaded || !images.length || phase !== 'autoplay') return;

        const tween = gsap.to(frameIndexRef.current, {
            frame: 55,
            duration: 3,
            ease: 'none',
            onUpdate: () => drawFrame(frameIndexRef.current.frame),
            onComplete: () => {
                setPhase('hero-visible');
                onAutoPlayComplete?.();
            }
        });

        return () => tween.kill();
    }, [loaded, images, phase, drawFrame, onAutoPlayComplete]);

    // ── HERO VISIBLE: detect scroll direction ──
    useEffect(() => {
        if (phase !== 'hero-visible') return;

        lastScrollY.current = window.scrollY;

        const handleScroll = () => {
            const currentY = window.scrollY;
            const scrollingDown = currentY > lastScrollY.current;
            lastScrollY.current = currentY;

            if (scrollingDown) {
                setPhase('scrolling');
            } else if (currentY <= 10) {
                setPhase('reversing-to-start');
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [phase]);

    // ── FORWARD: Auto-play frames 55 → 89 (1.5s) on scroll down ──
    useEffect(() => {
        if (phase !== 'scrolling' || !images.length) return;

        const tween = gsap.to(frameIndexRef.current, {
            frame: 89,
            duration: 1.5,
            ease: 'none',
            onUpdate: () => drawFrame(frameIndexRef.current.frame),
            onComplete: () => setPhase('done')
        });

        return () => tween.kill();
    }, [phase, images, drawFrame]);

    // ── DONE: detect scroll up back into hero area ──
    useEffect(() => {
        if (phase !== 'done') return;

        lastScrollY.current = window.scrollY;

        const handleScroll = () => {
            const currentY = window.scrollY;
            const scrollingUp = currentY < lastScrollY.current;
            lastScrollY.current = currentY;

            // Trigger reverse on any scroll up — orbit is fixed so always visible
            if (scrollingUp) {
                setPhase('reversing-to-hero');
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [phase]);

    // ── REVERSE: Auto-play frames 89 → 55 (1.5s) + scroll to top ──
    useEffect(() => {
        if (phase !== 'reversing-to-hero' || !images.length) return;

        // Scroll back to top in sync with reverse animation
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const tween = gsap.to(frameIndexRef.current, {
            frame: 55,
            duration: 1.5,
            ease: 'none',
            onUpdate: () => drawFrame(frameIndexRef.current.frame),
            onComplete: () => {
                setPhase('hero-visible');
            }
        });

        return () => tween.kill();
    }, [phase, images, drawFrame]);

    // ── REVERSE: Auto-play frames 55 → 0 (2s) ──
    useEffect(() => {
        if (phase !== 'reversing-to-start' || !images.length) return;

        const tween = gsap.to(frameIndexRef.current, {
            frame: 0,
            duration: 2,
            ease: 'none',
            onUpdate: () => drawFrame(frameIndexRef.current.frame),
            onComplete: () => setPhase('at-start')
        });

        return () => tween.kill();
    }, [phase, images, drawFrame]);

    // ── AT START: scroll down replays forward ──
    useEffect(() => {
        if (phase !== 'at-start') return;

        const handleScroll = () => {
            if (window.scrollY > 10) {
                setPhase('autoplay');
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [phase]);

    if (!loaded) {
        return <Loader progress={progress} errors={errors} logs={logs} debug={false} />;
    }

    const showHeroText = phase === 'hero-visible';

    return (
        <>
            {/* Fixed background canvas */}
            <div className="fixed top-0 left-0 w-full h-screen z-0">
                <canvas ref={canvasRef} className="block w-full h-full" />

                {/* Hero text overlay */}
                <div
                    className={`absolute inset-0 flex flex-col items-center justify-center text-center text-white pointer-events-none transition-opacity duration-700 ease-in-out ${showHeroText ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <h1 className="text-6xl md:text-9xl font-bold font-serif tracking-widest mb-6 text-metallic uppercase drop-shadow-2xl">
                        Headshot Studio
                    </h1>
                    <p className="text-lg md:text-3xl text-gray-200 font-sans font-light tracking-[0.5em] uppercase opacity-90">
                        Premium portraits for professionals
                    </p>
                </div>
            </div>

            {/* Fixed orbit overlay — same layer as canvas, never moves with scroll */}
            <SpiralOrbit
                ready={phase === 'done'}
                reversing={phase === 'reversing-to-hero'}
            />

            {/* Spacer: first viewport (hero visible phase) */}
            <div className="relative w-full h-screen" />

            {/* Second spacer: provides scroll space for done/orbit phase */}
            <div className="relative w-full h-screen" />
        </>
    );
};

export default CinematicHero;
