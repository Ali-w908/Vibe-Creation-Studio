import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    hue: number;
}

interface AnimatedBackgroundProps {
    particleCount?: number;
    className?: string;
    variant?: 'default' | 'subtle' | 'intense';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
    particleCount = 50,
    className = '',
    variant = 'default'
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const initParticles = () => {
            particlesRef.current = [];
            for (let i = 0; i < particleCount; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speedX: (Math.random() - 0.5) * 0.3,
                    speedY: (Math.random() - 0.5) * 0.3,
                    opacity: Math.random() * 0.5 + 0.1,
                    hue: Math.random() * 60 + 220 // Purple to blue range
                });
            }
        };

        const drawGradients = () => {
            // Main gradient orbs
            const orbs = [
                { x: 0.2, y: 0.3, radius: 0.4, color: 'rgba(99, 102, 241, 0.08)' },
                { x: 0.8, y: 0.7, radius: 0.35, color: 'rgba(139, 92, 246, 0.06)' },
                { x: 0.5, y: 0.5, radius: 0.5, color: 'rgba(168, 85, 247, 0.04)' },
                { x: 0.3, y: 0.8, radius: 0.3, color: 'rgba(59, 130, 246, 0.05)' },
                { x: 0.7, y: 0.2, radius: 0.25, color: 'rgba(236, 72, 153, 0.04)' }
            ];

            orbs.forEach(orb => {
                const gradient = ctx.createRadialGradient(
                    orb.x * canvas.width,
                    orb.y * canvas.height,
                    0,
                    orb.x * canvas.width,
                    orb.y * canvas.height,
                    orb.radius * Math.max(canvas.width, canvas.height)
                );
                gradient.addColorStop(0, orb.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });
        };

        const drawParticles = () => {
            particlesRef.current.forEach(particle => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
                ctx.fill();

                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Subtle opacity fluctuation
                particle.opacity += (Math.random() - 0.5) * 0.01;
                particle.opacity = Math.max(0.05, Math.min(0.6, particle.opacity));
            });
        };

        const drawConnections = () => {
            const maxDistance = 150;
            particlesRef.current.forEach((p1, i) => {
                particlesRef.current.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        const opacity = (1 - distance / maxDistance) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });
        };

        const animate = () => {
            ctx.fillStyle = '#050507';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawGradients();

            if (variant !== 'subtle') {
                drawParticles();
                if (variant === 'intense') {
                    drawConnections();
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        resizeCanvas();
        initParticles();
        animate();

        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [particleCount, variant]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 -z-10 ${className}`}
            style={{ pointerEvents: 'none' }}
        />
    );
};

export default AnimatedBackground;
