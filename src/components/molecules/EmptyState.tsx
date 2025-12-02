import { motion } from "framer-motion";
import { SearchX, ArrowLeft } from "lucide-react";
import Button from "../atoms/Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onBack?: () => void;
  backLabel?: string;
}

export default function EmptyState({
  title = "Data tidak ditemukan",
  description = "Maaf, data yang kamu cari tidak tersedia",
  onBack,
  backLabel = "Kembali ke Beranda",
}: EmptyStateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Icon Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="relative mx-auto mb-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
          >
            <SearchX className="w-12 h-12 text-primary" />
          </motion.div>

          {/* Floating dots */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                y: [-10, -30],
                x: [0, (i - 1) * 20],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-primary/40"
            />
          ))}
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-foreground mb-3"
        >
          {title}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-8"
        >
          {description}
        </motion.p>

        {/* Back Button */}
        {onBack && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onBack}
                variant="primary"
                size="lg"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
