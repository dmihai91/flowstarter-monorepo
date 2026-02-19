import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EditorMessageWrapperProps {
  children: ReactNode;
  id: string;
}

export const EditorMessageWrapper = memo(({ children, id }: EditorMessageWrapperProps) => (
  <motion.div
    key={id}
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-start"
  >
    {children}
  </motion.div>
));

EditorMessageWrapper.displayName = 'EditorMessageWrapper';
