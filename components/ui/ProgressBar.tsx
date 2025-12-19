import React from 'react';

interface ProgressBarProps {
    progress: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    label?: string;
    variant?: 'default' | 'success' | 'warning';
    className?: string;
    animated?: boolean;
}

const sizeMap = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
};

const variantMap = {
    default: 'from-indigo-500 via-purple-500 to-pink-500',
    success: 'from-emerald-500 via-green-500 to-teal-500',
    warning: 'from-amber-500 via-orange-500 to-red-500'
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    size = 'md',
    showLabel = false,
    label,
    variant = 'default',
    className = '',
    animated = true
}) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
        <div className={`w-full ${className}`}>
            {(showLabel || label) && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400 font-medium">
                        {label || 'Progress'}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                        {Math.round(clampedProgress)}%
                    </span>
                </div>
            )}

            <div className={`w-full ${sizeMap[size]} bg-white/[0.05] rounded-full overflow-hidden backdrop-blur-sm`}>
                <div
                    className={`
            ${sizeMap[size]} 
            bg-gradient-to-r ${variantMap[variant]}
            rounded-full 
            transition-all duration-500 ease-out
            relative
          `}
                    style={{ width: `${clampedProgress}%` }}
                >
                    {/* Shimmer effect */}
                    {animated && clampedProgress < 100 && (
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            style={{
                                animation: 'shimmer 1.5s infinite',
                                backgroundSize: '200% 100%'
                            }}
                        />
                    )}

                    {/* Glow effect */}
                    <div
                        className="absolute inset-0 rounded-full opacity-50 blur-sm"
                        style={{
                            background: `linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)`
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProgressBar;
