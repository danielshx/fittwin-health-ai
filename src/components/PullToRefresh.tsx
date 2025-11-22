import { ReactNode, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

type PullToRefreshProps = {
  children: ReactNode;
  onRefresh: () => Promise<void>;
};

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing || !scrollRef.current || scrollRef.current.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    if (distance > 0) {
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  const rotation = isRefreshing ? 360 : (pullDistance / threshold) * 180;

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="flex justify-center items-center py-4"
        style={{ height: pullDistance > 0 || isRefreshing ? pullDistance : 0 }}
        animate={{ opacity: pullDistance > 0 || isRefreshing ? 1 : 0 }}
      >
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: isRefreshing ? 1 : 0.3, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
        >
          <RefreshCw className="w-6 h-6 text-primary" />
        </motion.div>
      </motion.div>
      {children}
    </div>
  );
}
