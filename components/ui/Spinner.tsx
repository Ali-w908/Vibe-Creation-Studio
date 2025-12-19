import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    label?: string;
}

const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
};

export const Spinner: React.FC<SpinnerProps> = ({
    size = 'md',
    className = '',
    label
}) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`${sizeMap[size]} relative`}>
                {/* Outer gradient ring */}
                <div
                    className="absolute inset-0 rounded-full animate-spin"
                    style={{
                        background: 'conic-gradient(from 0deg, transparent, rgba(99, 102, 241, 0.8), transparent)',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))'
                    }}
                />
                {/* Inner glow */}
                <div
                    className="absolute inset-1 rounded-full opacity-50"
                    style={{
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)'
                    }}
                />
            </div>
            {label && (
                <span className="text-sm text-gray-400 animate-pulse">{label}</span>
            )}
        </div>
    );
};

export default Spinner;
