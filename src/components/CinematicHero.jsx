
import React, { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useImagePreloader } from '../hooks/useImagePreloader';
import Loader from './Loader';

gsap.registerPlugin(ScrollTrigger);

const CinematicHero = ({ debug, scrollDistance = 2500 }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const frameIndexRef = useRef({ frame: 0 });

    // Load images (frames 0-89 = 90 frames total for animation)
    const { images, loaded, progress, errors, logs } = useImagePreloader('/frames/frame_{index}.jpg', 90);

    // Function to draw a frame on the canvas
    const drawFrame = (frameIndex) => {
        if (!canvasRef.current || !images.length) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const index = Math.min(Math.floor(frameIndex), images.length - 1);
        const img = images[index];

        if (!img || !img.complete) return;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling to cover the canvas while maintaining aspect ratio
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
            // Canvas is wider than image
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgRatio;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            // Canvas is taller than image
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgRatio;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        }

        context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    // Initialize canvas size
    useEffect(() => {
        if (!loaded || !canvasRef.current) return;

        const canvas = canvasRef.current;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Draw initial frame
        drawFrame(0);

        // Handle window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawFrame(frameIndexRef.current.frame);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [loaded, images]);

    // Set up GSAP ScrollTrigger animation
    useGSAP(() => {
        if (!loaded || !containerRef.current || !images.length) return;

        ScrollTrigger.create({
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            markers: debug,
            onUpdate: (self) => {
                // Map scroll progress to frame index
                // 0-70% scroll → animate frames 0-89 (90 frames)
                // 70-100% scroll → hold frame 89
                const scrollProgress = self.progress;

                if (scrollProgress <= 0.7) {
                    // Animate through frames 0-89
                    const animationProgress = scrollProgress / 0.7;
                    const targetFrame = animationProgress * (images.length - 1);
                    frameIndexRef.current.frame = targetFrame;
                    drawFrame(targetFrame);
                } else {
                    // Hold at frame 89 (last frame)
                    const lastFrame = images.length - 1;
                    frameIndexRef.current.frame = lastFrame;
                    drawFrame(lastFrame);
                }
            }
        });

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, { dependencies: [loaded, images], scope: containerRef });

    if (!loaded) {
        return <Loader progress={progress} errors={errors} logs={logs} debug={debug} />;
    }

    return (
        <>
            {/* Fixed background canvas */}
            <div className="fixed top-0 left-0 w-full h-screen z-0">
                <canvas ref={canvasRef} className="block w-full h-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white pointer-events-none z-10">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter opacity-80">CINEMATIC HERO</h1>
                </div>
            </div>

            {/* Scroll trigger container */}
            <div ref={containerRef} className="relative w-full" style={{ height: '250vh' }}>
                {/* This space drives the scroll animation */}
            </div>

            {/* Content sections that slide over the fixed frame */}
            <div className="relative z-10">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="max-w-4xl mx-auto px-8 py-16 backdrop-blur-sm bg-black/60 rounded-2xl m-8">
                        <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
                            Welcome
                        </h2>
                        <p className="text-xl md:text-2xl text-gray-300">
                            This content slides smoothly over the final frame without breaking continuity.
                        </p>
                    </div>
                </div>

                <div className="min-h-screen flex items-center justify-center">
                    <div className="max-w-4xl mx-auto px-8 py-16 backdrop-blur-sm bg-black/70 rounded-2xl m-8">
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Seamless Transition
                        </h2>
                        <p className="text-lg md:text-xl text-gray-300">
                            The 90-frame animation completes naturally, and content flows over it.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CinematicHero;
